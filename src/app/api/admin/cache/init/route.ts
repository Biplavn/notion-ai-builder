import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { getAllCacheablePrompts, generateSampleBlueprint, getTemplateKeywords } from "@/lib/cache/preloadCache";
import { CURATED_TEMPLATES } from "@/lib/templates/metadata";

/**
 * Admin API to initialize cache with curated templates
 * POST /api/admin/cache/init - Preload cache with template prompts
 */
export async function POST(req: NextRequest) {
    try {
        // Validate admin access
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: user } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

        if (!user?.is_admin) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Use service role for cache operations
        if (!env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
        }
        const adminClient = createClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get all cacheable prompts
        const cacheablePrompts = getAllCacheablePrompts();

        let inserted = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const { templateId, prompt, keywords } of cacheablePrompts) {
            try {
                // Generate a sample blueprint for this template
                const blueprint = generateSampleBlueprint(templateId);
                if (!blueprint) {
                    skipped++;
                    continue;
                }

                // Get template metadata
                const template = CURATED_TEMPLATES.find(t => t.id === templateId);

                // Normalize prompt
                const normalizedPrompt = prompt
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();

                // Generate hash
                let hash = 0;
                for (let i = 0; i < normalizedPrompt.length; i++) {
                    const char = normalizedPrompt.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                const promptHash = Math.abs(hash).toString(16).padStart(8, "0");

                // Insert into cache
                const { error } = await adminClient
                    .from("blueprint_cache")
                    .upsert({
                        prompt_hash: promptHash,
                        prompt_original: prompt,
                        prompt_normalized: normalizedPrompt,
                        keywords: keywords,
                        blueprint: blueprint,
                        template_title: blueprint.title,
                        template_category: template?.category?.toLowerCase() || "general",
                        successful_builds: 1, // Mark as successful so it can be used
                        times_used: 0
                    }, {
                        onConflict: "prompt_hash",
                        ignoreDuplicates: true
                    });

                if (error) {
                    errors.push(`${templateId}: ${error.message}`);
                } else {
                    inserted++;
                }
            } catch (err: any) {
                errors.push(`${templateId}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cache initialized with ${inserted} template prompts`,
            stats: {
                total: cacheablePrompts.length,
                inserted,
                skipped,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined
        });
    } catch (error: any) {
        console.error("Cache initialization error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
