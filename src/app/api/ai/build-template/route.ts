import { NextRequest, NextResponse } from "next/server";
import { NotionBuilder } from "@/lib/notion/builder";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { TemplateBlueprint } from "@/lib/types/blueprint";
import { updateCacheStats, storeBuiltTemplate } from "@/lib/cache/blueprintCache";

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
    let requestCacheId: string | undefined;

    try {
        const { blueprint, cacheId }: { blueprint: TemplateBlueprint; cacheId?: string } = await req.json();
        requestCacheId = cacheId;

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

        // Get the actual page URL from Notion API
        const { Client } = await import('@notionhq/client');
        const notion = new Client({ auth: adminToken });

        let notionPageUrl: string;
        let duplicateLink: string;

        try {
            const page = await notion.pages.retrieve({ page_id: rootPageId }) as any;
            // Notion returns the URL in the 'url' field
            notionPageUrl = page.url;
            console.log(`📄 Page URL from Notion: ${notionPageUrl}`);
        } catch (e) {
            // Fallback: construct URL manually if API doesn't return it
            const cleanId = rootPageId.replace(/-/g, "");
            const templateSlug = blueprint.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            notionPageUrl = `https://www.notion.so/${templateSlug}-${cleanId}`;
            console.log(`📄 Constructed URL (fallback): ${notionPageUrl}`);
        }

        // Generate duplicate link
        duplicateLink = `${notionPageUrl}?duplicate=true`;
        console.log(`🔗 Duplicate link: ${duplicateLink}`);

        // Template built successfully - now update user's generation count
        // First, fetch current count from database to avoid race conditions
        const { data: currentUser } = await supabase
            .from('users')
            .select('ai_generations_lifetime')
            .eq('id', session.user.id)
            .single();

        const currentCount = currentUser?.ai_generations_lifetime || 0;

        await supabase
            .from('users')
            .update({
                ai_generations_lifetime: currentCount + 1
            })
            .eq('id', session.user.id);

        console.log(`💳 Updated generation count: ${currentCount} → ${currentCount + 1}`);

        // Update cache stats if this was a cached blueprint
        if (cacheId) {
            await updateCacheStats(cacheId, true);
            console.log(`📊 Updated cache stats for blueprint: ${cacheId}`);
        }

        // Store the built template for future reference
        await storeBuiltTemplate(
            cacheId || null,
            blueprint.title,
            blueprint.description || "",
            rootPageId,
            notionPageUrl,
            duplicateLink,
            session.user.id
        );
        console.log(`💾 Stored built template in database`);

        return NextResponse.json({
            success: true,
            pageId: rootPageId,
            notionUrl: notionPageUrl,
            duplicateLink: duplicateLink,
            creditsUsed: 1,
            message: "Your custom template is ready! Click the button to duplicate it to your Notion workspace."
        });

    } catch (error: any) {
        console.error("❌ AI Template Build error:", error);

        // Update cache stats for failed build
        if (requestCacheId) {
            await updateCacheStats(requestCacheId, false);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
