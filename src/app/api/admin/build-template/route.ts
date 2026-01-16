import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NotionBuilder } from "@/lib/notion/builder";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";
import { getPreviewBlueprint } from "@/lib/templates/mockBlueprints";
import { env } from "@/config/env";

const ADMIN_EMAIL = "biplavsoccer007@gmail.com";

// Verify admin access
async function verifyAdmin() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() { },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.email === ADMIN_EMAIL;
}

// Build a single template in Notion
export async function POST(req: Request) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!env.NOTION_ADMIN_TOKEN || !env.NOTION_GALLERY_PAGE_ID) {
        return NextResponse.json({
            error: "Notion admin token or gallery page ID not configured"
        }, { status: 500 });
    }

    try {
        const { templateId } = await req.json();

        if (!templateId) {
            return NextResponse.json({ error: "templateId required" }, { status: 400 });
        }

        // Find template metadata
        const template = CURATED_TEMPLATES.find(t => t.id === templateId);
        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Generate blueprint
        const blueprint = getPreviewBlueprint(template);

        // Build in Notion
        const builder = new NotionBuilder(env.NOTION_ADMIN_TOKEN);
        const pageId = await builder.build(blueprint, env.NOTION_GALLERY_PAGE_ID);

        // Get the duplicate link
        // Notion public URL format: https://www.notion.so/{workspace}/{page-id}
        // For duplication: Add ?duplicate=true
        const duplicateLink = `https://www.notion.so/${pageId.replace(/-/g, '')}?duplicate=true`;

        return NextResponse.json({
            success: true,
            templateId,
            templateName: template.name,
            notionPageId: pageId,
            duplicateLink
        });
    } catch (error: any) {
        console.error("Build template error:", error);
        return NextResponse.json({
            error: error.message || "Failed to build template"
        }, { status: 500 });
    }
}

// Build multiple templates (batch)
export async function PUT(req: Request) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!env.NOTION_ADMIN_TOKEN || !env.NOTION_GALLERY_PAGE_ID) {
        return NextResponse.json({
            error: "Notion admin token or gallery page ID not configured"
        }, { status: 500 });
    }

    try {
        const { templateIds } = await req.json();

        if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
            return NextResponse.json({ error: "templateIds array required" }, { status: 400 });
        }

        const results: Array<{
            templateId: string;
            success: boolean;
            notionPageId?: string;
            duplicateLink?: string;
            error?: string;
        }> = [];

        const builder = new NotionBuilder(env.NOTION_ADMIN_TOKEN);

        for (const templateId of templateIds) {
            try {
                const template = CURATED_TEMPLATES.find(t => t.id === templateId);
                if (!template) {
                    results.push({ templateId, success: false, error: "Not found" });
                    continue;
                }

                const blueprint = getPreviewBlueprint(template);
                const pageId = await builder.build(blueprint, env.NOTION_GALLERY_PAGE_ID!);
                const duplicateLink = `https://www.notion.so/${pageId.replace(/-/g, '')}?duplicate=true`;

                results.push({
                    templateId,
                    success: true,
                    notionPageId: pageId,
                    duplicateLink
                });

                // Small delay between builds to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error: any) {
                results.push({
                    templateId,
                    success: false,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            total: templateIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });
    } catch (error: any) {
        console.error("Batch build error:", error);
        return NextResponse.json({
            error: error.message || "Failed to batch build"
        }, { status: 500 });
    }
}

// Get list of top templates to build
export async function GET() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Top 25 templates to pre-build (hybrid approach)
    const topTemplates = [
        // Productivity (8)
        "habit-tracker",
        "project-tracker",
        "goal-tracker",
        "daily-planner",
        "kanban-board",
        "reading-list",
        "meeting-notes",
        "time-tracker",
        // Finance (5)
        "expense-tracker",
        "budget-planner",
        "subscription-tracker",
        "bill-tracker",
        "savings-goals",
        // Health (3)
        "workout-tracker",
        "meal-planner",
        "sleep-tracker",
        // Business (3)
        "crm-simple",
        "client-portal",
        "freelance-business",
        // Education (2)
        "student-dashboard",
        "course-planner",
        // Content (2)
        "content-calendar",
        "blog-manager",
        // Personal (2)
        "gratitude-journal",
        "travel-planner"
    ];

    const templates = topTemplates.map(id => {
        const t = CURATED_TEMPLATES.find(ct => ct.id === id);
        return t ? {
            id: t.id,
            name: t.name,
            category: t.category,
            isPro: t.isPro,
            hasDuplicateLink: Boolean(t.duplicateLink)
        } : null;
    }).filter(Boolean);

    return NextResponse.json({
        total: templates.length,
        withLinks: templates.filter(t => t?.hasDuplicateLink).length,
        withoutLinks: templates.filter(t => !t?.hasDuplicateLink).length,
        templates
    });
}
