import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";

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

// GET - List all templates with overrides
export async function GET() {
    const adminClient = await verifyAdmin();

    if (!adminClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get template overrides from database
    const { data: overridesData } = await adminClient
        .from("template_overrides")
        .select("*");

    // Convert to lookup object
    const overrides: Record<string, any> = {};
    (overridesData || []).forEach(override => {
        overrides[override.template_id] = override;
    });

    // Return templates from metadata with overrides
    return NextResponse.json({
        templates: CURATED_TEMPLATES.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            icon: t.icon,
            isPro: t.isPro,
            price: t.price
        })),
        overrides
    });
}

// PATCH - Update template override
export async function PATCH(req: Request) {
    const adminClient = await verifyAdmin();

    if (!adminClient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { templateId, updates } = await req.json();

    if (!templateId) {
        return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    // Upsert override
    const { error } = await adminClient
        .from("template_overrides")
        .upsert({
            template_id: templateId,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: ADMIN_EMAIL
        }, {
            onConflict: "template_id"
        });

    if (error) {
        console.error("Template override error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log action
    await adminClient.from("admin_audit_log").insert({
        admin_email: ADMIN_EMAIL,
        action: "update_template",
        target_type: "template",
        target_id: templateId,
        details: updates
    });

    return NextResponse.json({ success: true });
}
