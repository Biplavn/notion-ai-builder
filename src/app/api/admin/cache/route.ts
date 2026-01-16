import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { getCacheAnalytics } from "@/lib/cache/blueprintCache";

/**
 * Admin API for viewing cache analytics
 * GET /api/admin/cache - Get cache statistics
 */
export async function GET(req: NextRequest) {
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

        // Get cache analytics
        const analytics = await getCacheAnalytics();

        if (!analytics) {
            return NextResponse.json({
                totalCached: 0,
                totalHits: 0,
                hitRate: 0,
                popularTemplates: [],
                message: "Cache system not yet initialized"
            });
        }

        return NextResponse.json({
            success: true,
            ...analytics,
            savingsEstimate: {
                apiCallsSaved: analytics.totalHits - analytics.totalCached,
                costSaved: `$${((analytics.totalHits - analytics.totalCached) * 0.002).toFixed(2)}` // Rough estimate at $0.002/call
            }
        });
    } catch (error: any) {
        console.error("Cache analytics error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
