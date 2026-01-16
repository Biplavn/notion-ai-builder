import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint } from "@/lib/ai/generator";
import { findCachedBlueprint, cacheBlueprint } from "@/lib/cache/blueprintCache";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        console.log("[Blueprint API] Processing request for:", prompt);

        // Get user ID if authenticated
        let userId: string | undefined;
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        } catch {
            // Not authenticated, continue without user ID
        }

        // Step 1: Check cache for similar blueprint
        const cacheResult = await findCachedBlueprint(prompt);

        if (cacheResult.found && cacheResult.blueprint) {
            console.log(`[Blueprint API] Cache hit! Returning cached blueprint (${(cacheResult.similarity! * 100).toFixed(1)}% match)`);
            return NextResponse.json({
                success: true,
                blueprint: cacheResult.blueprint,
                cached: true,
                cacheId: cacheResult.cacheId,
                similarity: cacheResult.similarity,
            });
        }

        // Step 2: Generate new blueprint with AI
        console.log("[Blueprint API] Cache miss. Generating new blueprint with AI...");
        const blueprint = await generateBlueprint(prompt);

        // Step 3: Cache the new blueprint for future use
        const cacheId = await cacheBlueprint(prompt, blueprint, userId);

        console.log("[Blueprint API] New blueprint generated and cached");
        return NextResponse.json({
            success: true,
            blueprint,
            cached: false,
            cacheId: cacheId || undefined,
        });
    } catch (error: any) {
        console.error("[Blueprint API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
