"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
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
    bonus_credits: number
    is_suspended: boolean
    is_admin: boolean
    created_at: string
}

// Singleton Supabase client to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
    }
    return supabaseInstance
}

export function useUser() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Use singleton client to prevent recreation
    const supabase = useMemo(() => getSupabaseClient(), [])

    // Track if initial load is complete to prevent double fetching
    const initialLoadDone = useRef(false)
    const fetchingRef = useRef(false)

    const fetchUserProfile = useCallback(async (userId: string, userEmail: string, userMetadata: any): Promise<UserProfile | null> => {
        // Prevent concurrent fetches
        if (fetchingRef.current) return null
        fetchingRef.current = true

        try {
            const { data: profile, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single()

            if (profile && !error) {
                return profile as UserProfile
            } else {
                // Profile might not exist yet, return basic user from session
                console.log("Profile not found, using session data")
                return {
                    id: userId,
                    email: userEmail,
                    full_name: userMetadata?.full_name || null,
                    avatar_url: userMetadata?.avatar_url || null,
                    subscription_plan: "free" as const,
                    subscription_status: "active",
                    price_locked: false,
                    grandfathered_price: null,
                    notion_access_token: null,
                    notion_workspace_id: null,
                    notion_workspace_name: null,
                    ai_generations_lifetime: 0,
                    bonus_credits: 0,
                    is_suspended: false,
                    is_admin: false,
                    created_at: new Date().toISOString()
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error)
            return null
        } finally {
            fetchingRef.current = false
        }
    }, [supabase])

    useEffect(() => {
        let isMounted = true
        let timeoutId: NodeJS.Timeout | null = null

        async function getUser() {
            // Skip if already fetched
            if (initialLoadDone.current) return

            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!isMounted) return

                if (!session?.user) {
                    setIsAuthenticated(false)
                    setUser(null)
                    setLoading(false)
                    initialLoadDone.current = true
                    return
                }

                setIsAuthenticated(true)

                const profile = await fetchUserProfile(
                    session.user.id,
                    session.user.email || "",
                    session.user.user_metadata
                )

                if (isMounted && profile) {
                    setUser(profile)
                }
                initialLoadDone.current = true
            } catch (error) {
                console.error("Error fetching user:", error)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        getUser()

        // Listen for auth changes with debouncing to prevent rapid updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return

            // Clear any pending timeout
            if (timeoutId) clearTimeout(timeoutId)

            // Debounce auth state changes to prevent rapid firing
            timeoutId = setTimeout(async () => {
                if (!isMounted) return

                if (!session) {
                    setIsAuthenticated(false)
                    setUser(null)
                    setLoading(false)
                } else {
                    setIsAuthenticated(true)
                    // Only refetch on specific events, not on every change
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        const profile = await fetchUserProfile(
                            session.user.id,
                            session.user.email || "",
                            session.user.user_metadata
                        )
                        if (isMounted && profile) {
                            setUser(profile)
                        }
                    }
                    setLoading(false)
                }
            }, 100) // 100ms debounce
        })

        return () => {
            isMounted = false
            if (timeoutId) clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [supabase, fetchUserProfile])

    // Helper to check plan status
    const isPro = user?.subscription_plan === "pro" && user?.subscription_status === "active"
    const isFree = user?.subscription_plan === "free"

    // Get current plan details from config
    const planDetails = user ? pricingConfig.plans[user.subscription_plan] : null

    // Free templates are unlimited for everyone
    const canDownloadTemplate = true

    // Check if user can use AI (free users get 10 lifetime generations + bonus credits)
    const canUseAI = user
        ? (user.subscription_plan === "pro" ||
           (user.ai_generations_lifetime < pricingConfig.plans.free.limits.aiGenerations + (user.bonus_credits || 0)))
        : false

    // Calculate remaining credits
    const remainingCredits = user
        ? (user.subscription_plan === "pro"
            ? Infinity
            : Math.max(0, pricingConfig.plans.free.limits.aiGenerations + (user.bonus_credits || 0) - user.ai_generations_lifetime))
        : 0

    return {
        user,
        loading,
        isAuthenticated,
        isPro,
        isFree,
        planDetails,
        canDownloadTemplate,
        canUseAI,
        remainingCredits,
        supabase // Expose client for direct usage if needed
    }
}
