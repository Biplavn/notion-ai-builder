"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState } from "react"
import { env } from "@/config/env"
import pricingConfig from "@/config/pricing-config.json"

export type UserProfile = {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    subscription_plan: keyof typeof pricingConfig.plans
    subscription_status: string
    price_locked: boolean
    grandfathered_price: number | null
    notion_access_token: string | null
    notion_workspace_id: string | null
    notion_workspace_name: string | null
    ai_generations_lifetime: number
}

export function useUser() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const supabase = createBrowserClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    useEffect(() => {
        async function getUser() {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    setLoading(false)
                    return
                }

                setIsAuthenticated(true)

                // Fetch profile with subscription data
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single()

                if (profile) {
                    setUser(profile)
                }
            } catch (error) {
                console.error("Error fetching user:", error)
            } finally {
                setLoading(false)
            }
        }

        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setIsAuthenticated(!!session)
            if (!session) {
                setUser(null)
            } else {
                getUser()
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Helper to check plan status
    const isPro = user?.subscription_plan === "pro" && user?.subscription_status === "active"
    const isFree = user?.subscription_plan === "free"

    // Get current plan details from config
    const planDetails = user ? pricingConfig.plans[user.subscription_plan] : null

    // Free templates are unlimited for everyone
    const canDownloadTemplate = true

    // Check if user can use AI (free users get 5 lifetime generations)
    const canUseAI = user
        ? (user.subscription_plan === "pro" || user.ai_generations_lifetime < pricingConfig.plans.free.limits.aiGenerations)
        : false

    return {
        user,
        loading,
        isAuthenticated,
        isPro,
        isFree,
        planDetails,
        canDownloadTemplate,
        canUseAI,
        supabase // Expose client for direct usage if needed
    }
}
