import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const ADMIN_EMAIL = "biplavsoccer007@gmail.com";

// Verify admin access
async function verifyAdmin() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
        return null;
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET - List all reviews
export async function GET() {
    const adminClient = await verifyAdmin();

    if (!adminClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await adminClient
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: data });
}

// DELETE - Delete a review
export async function DELETE(req: Request) {
    const adminClient = await verifyAdmin();

    if (!adminClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { reviewId } = await req.json();

    if (!reviewId) {
        return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
    }

    // Get review before deleting for audit log
    const { data: review } = await adminClient
        .from("reviews")
        .select("*")
        .eq("id", reviewId)
        .single();

    const { error } = await adminClient
        .from("reviews")
        .delete()
        .eq("id", reviewId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log action
    await adminClient.from("admin_audit_log").insert({
        admin_email: ADMIN_EMAIL,
        action: "delete_review",
        target_type: "review",
        target_id: reviewId,
        details: review
    });

    return NextResponse.json({ success: true });
}
