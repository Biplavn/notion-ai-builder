import { NextRequest, NextResponse } from "next/server";
import { NotionBuilder } from "@/lib/notion/builder";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { TemplateBlueprint } from "@/lib/types/blueprint";

/**
 * AI Template Builder - Admin Workspace Edition
 * 
 * This route builds AI-generated templates directly in the admin's Notion workspace.
 * Users receive a duplicate link to copy the template to their own workspace.
 * 
 * Flow:
 * 1. User generates AI blueprint (via /api/ai/blueprint)
 * 2. User confirms the blueprint
 * 3. This route builds it in admin's Notion → returns duplicate link
 * 4. User clicks duplicate link → copies to their Notion
 */
export async function POST(req: NextRequest) {
    try {
        const { blueprint }: { blueprint: TemplateBlueprint } = await req.json();

        // Validate user is authenticated
        const cookieStore = await cookies();
        const supabase = createServerClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        // Check for admin Notion configuration
        const adminToken = env.NOTION_ADMIN_TOKEN;
        const galleryPageId = env.NOTION_GALLERY_PAGE_ID;

        if (!adminToken || !galleryPageId) {
            return NextResponse.json({
                error: "AI template building is not configured. Please contact support.",
                needsConfig: true
            }, { status: 503 });
        }

        if (!blueprint) {
            return NextResponse.json({ error: "Missing blueprint" }, { status: 400 });
        }

        console.log(`\n🚀 Building AI template in admin workspace: ${blueprint.title}`);
        console.log(`📍 Parent page: ${galleryPageId}`);

        // Build the template in admin's workspace
        const builder = new NotionBuilder(adminToken);
        const rootPageId = await builder.build(blueprint, galleryPageId);

        console.log(`✅ Template created with ID: ${rootPageId}`);

        // Generate the duplicate link
        // Format: https://www.notion.so/PAGE_TITLE-PAGE_ID?duplicate=true
        const cleanId = rootPageId.replace(/-/g, "");
        const templateSlug = blueprint.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const notionPageUrl = `https://www.notion.so/${templateSlug}-${cleanId}`;
        const duplicateLink = `${notionPageUrl}?duplicate=true`;

        console.log(`🔗 Duplicate link: ${duplicateLink}`);

        // Update user's generation count
        await supabase
            .from('users')
            .update({
                ai_generations_lifetime: (session.user.user_metadata?.ai_generations_lifetime || 0) + 1
            })
            .eq('id', session.user.id);

        return NextResponse.json({
            success: true,
            pageId: rootPageId,
            notionUrl: notionPageUrl,
            duplicateLink: duplicateLink,
            message: "Your custom template is ready! Click the button to duplicate it to your Notion workspace."
        });

    } catch (error: any) {
        console.error("❌ AI Template Build error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
