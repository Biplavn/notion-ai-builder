import { NextRequest, NextResponse } from "next/server";
import { NotionBuilder } from "@/lib/notion/builder";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function POST(req: NextRequest) {
    try {
        const { blueprint, parentPageId } = await req.json();

        // Get user's Notion token from Supabase
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

        // Get user's Notion access token from profile
        const { data: profile } = await supabase
            .from("users")
            .select("notion_access_token")
            .eq("id", session.user.id)
            .single();

        const accessToken = profile?.notion_access_token;

        if (!accessToken) {
            return NextResponse.json({
                error: "Notion not connected. Please connect your Notion workspace first.",
                needsNotionAuth: true
            }, { status: 403 });
        }

        if (!blueprint || !parentPageId) {
            return NextResponse.json({ error: "Missing blueprint or parentPageId" }, { status: 400 });
        }

        console.log(`Building template: ${blueprint.title} under parent: ${parentPageId}`);
        const builder = new NotionBuilder(accessToken);
        const rootPageId = await builder.build(blueprint, parentPageId);

        return NextResponse.json({ success: true, pageId: rootPageId });
    } catch (error: any) {
        console.error("Build error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
