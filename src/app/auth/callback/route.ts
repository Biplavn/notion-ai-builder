import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const errorDescription = requestUrl.searchParams.get("error_description")
    const origin = requestUrl.origin

    // Handle OAuth errors
    if (error) {
        console.error(`OAuth error: ${error} - ${errorDescription}`)
        return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`)
    }

    if (code) {
        try {
            const supabase = await createClient()
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error("Session exchange error:", exchangeError.message)
                return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`)
            }

            console.log("✅ Session established for user:", data?.user?.email)

            // Create or update user record in public.users table
            if (data?.user) {
                const { error: upsertError } = await supabase
                    .from("users")
                    .upsert({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
                        avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
                        subscription_plan: "free",
                        subscription_status: "active",
                        ai_generations_lifetime: 0,
                        bonus_credits: 0,
                        is_suspended: false,
                        is_admin: data.user.email === "biplavsoccer007@gmail.com",
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: "id",
                        ignoreDuplicates: false
                    })

                if (upsertError) {
                    console.error("User upsert error:", upsertError.message)
                } else {
                    console.log("✅ User record created/updated for:", data.user.email)
                }
            }
        } catch (e: any) {
            console.error("Auth callback exception:", e.message)
            return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("Failed to complete sign in")}`)
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}/`)
}
