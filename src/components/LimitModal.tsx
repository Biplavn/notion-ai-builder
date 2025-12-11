"use client";

import { useState } from "react";
import { X, Lock, Sparkles, Loader2 } from "lucide-react";
import { useUser } from "@/lib/useUser";

interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: "trial_expired" | "limit_reached";
}

export function LimitModal({ isOpen, onClose, reason }: LimitModalProps) {
    const { user, supabase } = useUser();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await loadRazorpay();
            if (!res) {
                alert("Razorpay SDK failed to load. Are you online?");
                return;
            }

            // 1. Create Order
            const orderRes = await fetch("/api/razorpay/order", { method: "POST" });
            const orderData = await orderRes.json();

            if (!orderRes.ok) throw new Error(orderData.error);

            // 2. Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // This needs to be public
                amount: orderData.amount,
                currency: orderData.currency,
                name: "NotionStruct",
                description: "Pro Subscription",
                order_id: orderData.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    const verifyRes = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user?.id
                        }),
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        alert("Payment Successful! You are now a Pro member.");
                        // Refresh user data
                        window.location.reload();
                        onClose();
                    } else {
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: user?.full_name || "",
                    email: user?.email || "",
                },
                theme: {
                    color: "#000000",
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error: any) {
            console.error("Payment Error:", error);
            alert("Payment failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-md rounded-xl shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200 text-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                    {reason === "trial_expired" ? "Trial Expired" : "Limit Reached"}
                </h2>

                <p className="text-muted-foreground mb-8">
                    {reason === "trial_expired"
                        ? "Your 3-day free trial has ended. Upgrade to Pro to continue building unlimited templates."
                        : "You've used all 3 free AI generations. Upgrade to Pro to unlock unlimited access."}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Upgrade to Pro ($2/mo)
                    </button>

                    <button
                        onClick={onClose}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
