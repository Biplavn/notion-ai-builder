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
        } catch (e: any) {
            console.error("Auth callback exception:", e.message)
            return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("Failed to complete sign in")}`)
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}/`)
}
