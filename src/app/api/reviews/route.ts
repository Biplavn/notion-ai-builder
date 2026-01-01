import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// GET - Get reviews for a template
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
        return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

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

    const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const reviewCount = data?.length || 0;
    const avgRating = reviewCount > 0
        ? data!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    return NextResponse.json({
        reviews: data || [],
        stats: { reviewCount, avgRating }
    });
}

// POST - Submit a review
export async function POST(req: Request) {
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

    if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { templateId, rating, reviewText } = await req.json();

    if (!templateId || !rating) {
        return NextResponse.json({ error: "Template ID and rating required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Get user profile for name/avatar
    const { data: profile } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

    // Check if user already reviewed this template
    const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("template_id", templateId)
        .single();

    if (existing) {
        // Update existing review
        const { error } = await supabase
            .from("reviews")
            .update({
                rating,
                review_text: reviewText || null,
                user_name: profile?.full_name || null,
                user_avatar: profile?.avatar_url || null,
                updated_at: new Date().toISOString()
            })
            .eq("id", existing.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, action: "updated" });
    }

    // Create new review
    const { error } = await supabase.from("reviews").insert({
        user_id: session.user.id,
        template_id: templateId,
        rating,
        review_text: reviewText || null,
        user_name: profile?.full_name || null,
        user_avatar: profile?.avatar_url || null
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "created" });
}

// DELETE - Delete own review
export async function DELETE(req: Request) {
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

    if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { reviewId } = await req.json();

    // Only allow deleting own reviews
    const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", session.user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
