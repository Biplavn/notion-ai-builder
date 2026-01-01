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

    // Return admin client with service role for full access
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET - List all users
export async function GET() {
    const adminClient = await verifyAdmin();

    if (!adminClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await adminClient
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
}

// PATCH - Update user
export async function PATCH(req: Request) {
    const adminClient = await verifyAdmin();

    if (!adminClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, updates } = await req.json();

    if (!userId || !updates) {
        return NextResponse.json({ error: "Missing userId or updates" }, { status: 400 });
    }

    // Prevent modifying admin's own suspension
    if (updates.is_suspended !== undefined) {
        const { data: targetUser } = await adminClient
            .from("users")
            .select("email")
            .eq("id", userId)
            .single();

        if (targetUser?.email === ADMIN_EMAIL) {
            return NextResponse.json({ error: "Cannot suspend admin" }, { status: 400 });
        }
    }

    const { error } = await adminClient
        .from("users")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log admin action
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { },
            },
        }
    );
    const { data: { session } } = await supabase.auth.getSession();

    await adminClient.from("admin_audit_log").insert({
        admin_email: session?.user?.email || ADMIN_EMAIL,
        action: "update_user",
        target_type: "user",
        target_id: userId,
        details: updates
    });

    return NextResponse.json({ success: true });
}
