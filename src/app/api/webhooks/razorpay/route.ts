import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Razorpay Webhook Handler
 *
 * Handles payment events from Razorpay and updates user subscriptions automatically
 *
 * Events handled:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * - subscription.activated: Subscription started
 * - subscription.charged: Subscription renewed
 * - subscription.cancelled: Subscription canceled
 * - subscription.paused: Subscription paused
 * - subscription.resumed: Subscription resumed
 */
export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        // Verify webhook signature
        if (!verifyWebhookSignature(body, signature)) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        const eventType = event.event;
        const payload = event.payload;

        console.log(`[Razorpay Webhook] Received event: ${eventType}`);

        switch (eventType) {
            case "payment.captured":
                await handlePaymentCaptured(payload.payment.entity);
                break;

            case "payment.failed":
                await handlePaymentFailed(payload.payment.entity);
                break;

            case "subscription.activated":
                await handleSubscriptionActivated(payload.subscription.entity);
                break;

            case "subscription.charged":
                await handleSubscriptionCharged(payload.subscription.entity, payload.payment.entity);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(payload.subscription.entity);
                break;

            case "subscription.paused":
                await handleSubscriptionPaused(payload.subscription.entity);
                break;

            case "subscription.resumed":
                await handleSubscriptionResumed(payload.subscription.entity);
                break;

            default:
                console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("[Razorpay Webhook] Error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
    if (!signature) return false;

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured");
        return true; // Allow in development
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

    return signature === expectedSignature;
}

/**
 * Find user by Razorpay customer ID or email from payment notes
 */
async function findUserFromPayment(payment: any): Promise<string | null> {
    // Try to find by customer ID
    if (payment.customer_id) {
        const { data } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("razorpay_customer_id", payment.customer_id)
            .single();

        if (data) return data.id;
    }

    // Try to find by email in notes
    if (payment.notes?.email) {
        const { data } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", payment.notes.email)
            .single();

        if (data) return data.id;
    }

    console.error("[Razorpay Webhook] Could not find user for payment:", payment.id);
    return null;
}

/**
 * Handle successful payment
 */
async function handlePaymentCaptured(payment: any) {
    const userId = await findUserFromPayment(payment);
    if (!userId) return;

    const amount = payment.amount / 100; // Convert paise to rupees

    // Record transaction
    await supabaseAdmin.from("payment_transactions").insert({
        user_id: userId,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: amount,
        currency: payment.currency || "INR",
        status: "captured",
        payment_method: payment.method,
        metadata: payment
    });

    // Update user
    await supabaseAdmin
        .from("users")
        .update({
            subscription_plan: "pro",
            subscription_status: "active",
            last_payment_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    // Log subscription history
    await supabaseAdmin.from("subscription_history").insert({
        user_id: userId,
        action: "upgraded",
        from_plan: "free",
        to_plan: "pro",
        amount: amount,
        razorpay_payment_id: payment.id,
        notes: "Payment captured successfully"
    });

    console.log(`[Razorpay Webhook] Payment captured for user ${userId}: ₹${amount}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment: any) {
    const userId = await findUserFromPayment(payment);
    if (!userId) return;

    // Record failed transaction
    await supabaseAdmin.from("payment_transactions").insert({
        user_id: userId,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency || "INR",
        status: "failed",
        payment_method: payment.method,
        metadata: payment
    });

    // Update subscription status
    await supabaseAdmin
        .from("users")
        .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    // Create admin notification
    await supabaseAdmin.from("admin_notifications").insert({
        type: "payment_failed",
        title: "Payment Failed",
        message: `Payment failed for user. Subscription marked as past due.`,
        user_id: userId,
        priority: "high"
    });

    console.log(`[Razorpay Webhook] Payment failed for user ${userId}`);
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(subscription: any) {
    const userId = await findUserFromPayment({ customer_id: subscription.customer_id });
    if (!userId) return;

    await supabaseAdmin
        .from("users")
        .update({
            subscription_plan: "pro",
            subscription_status: "active",
            subscription_id: subscription.id,
            subscription_started_at: new Date(subscription.start_at * 1000).toISOString(),
            subscription_expires_at: subscription.end_at
                ? new Date(subscription.end_at * 1000).toISOString()
                : null,
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    await supabaseAdmin.from("subscription_history").insert({
        user_id: userId,
        action: "activated",
        to_plan: "pro",
        notes: "Subscription activated"
    });

    console.log(`[Razorpay Webhook] Subscription activated for user ${userId}`);
}

/**
 * Handle subscription renewal/charge
 */
async function handleSubscriptionCharged(subscription: any, payment: any) {
    const userId = await findUserFromPayment({ customer_id: subscription.customer_id });
    if (!userId) return;

    const amount = payment.amount / 100;

    // Record transaction
    await supabaseAdmin.from("payment_transactions").insert({
        user_id: userId,
        razorpay_payment_id: payment.id,
        amount: amount,
        currency: payment.currency || "INR",
        status: "captured",
        payment_method: payment.method,
        metadata: payment
    });

    // Update subscription
    await supabaseAdmin
        .from("users")
        .update({
            subscription_status: "active",
            last_payment_at: new Date().toISOString(),
            subscription_expires_at: subscription.current_end
                ? new Date(subscription.current_end * 1000).toISOString()
                : null,
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    await supabaseAdmin.from("subscription_history").insert({
        user_id: userId,
        action: "renewed",
        to_plan: "pro",
        amount: amount,
        razorpay_payment_id: payment.id,
        notes: "Subscription renewed"
    });

    console.log(`[Razorpay Webhook] Subscription renewed for user ${userId}: ₹${amount}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: any) {
    const userId = await findUserFromPayment({ customer_id: subscription.customer_id });
    if (!userId) return;

    await supabaseAdmin
        .from("users")
        .update({
            subscription_status: "canceled",
            subscription_cancel_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    await supabaseAdmin.from("subscription_history").insert({
        user_id: userId,
        action: "canceled",
        from_plan: "pro",
        to_plan: "free",
        notes: "Subscription cancelled"
    });

    // Create admin notification
    await supabaseAdmin.from("admin_notifications").insert({
        type: "subscription_canceled",
        title: "Subscription Cancelled",
        message: `User cancelled their Pro subscription.`,
        user_id: userId,
        priority: "normal"
    });

    console.log(`[Razorpay Webhook] Subscription cancelled for user ${userId}`);
}

/**
 * Handle subscription pause
 */
async function handleSubscriptionPaused(subscription: any) {
    const userId = await findUserFromPayment({ customer_id: subscription.customer_id });
    if (!userId) return;

    await supabaseAdmin
        .from("users")
        .update({
            subscription_status: "paused",
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    console.log(`[Razorpay Webhook] Subscription paused for user ${userId}`);
}

/**
 * Handle subscription resume
 */
async function handleSubscriptionResumed(subscription: any) {
    const userId = await findUserFromPayment({ customer_id: subscription.customer_id });
    if (!userId) return;

    await supabaseAdmin
        .from("users")
        .update({
            subscription_status: "active",
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    await supabaseAdmin.from("subscription_history").insert({
        user_id: userId,
        action: "resumed",
        to_plan: "pro",
        notes: "Subscription resumed"
    });

    console.log(`[Razorpay Webhook] Subscription resumed for user ${userId}`);
}
