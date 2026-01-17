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

    // Track current fetch to deduplicate by user ID
    const currentFetchRef = useRef<string | null>(null)
    const pendingPromiseRef = useRef<Promise<UserProfile | null> | null>(null)

    const fetchUserProfile = useCallback(async (userId: string, userEmail: string, userMetadata: any): Promise<UserProfile | null> => {
        // If already fetching the same user, wait for that result
        if (currentFetchRef.current === userId && pendingPromiseRef.current) {
            return pendingPromiseRef.current
        }

        currentFetchRef.current = userId

        const fetchPromise = (async (): Promise<UserProfile | null> => {
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
                // Return fallback profile instead of null to prevent UI issues
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
            } finally {
                currentFetchRef.current = null
                pendingPromiseRef.current = null
            }
        })()

        pendingPromiseRef.current = fetchPromise
        return fetchPromise
    }, [supabase])

    useEffect(() => {
        let isMounted = true
        let timeoutId: NodeJS.Timeout | null = null

        async function getUser() {
            try {
                // Always fetch session on mount - don't skip based on refs
                const { data: { session } } = await supabase.auth.getSession()

                if (!isMounted) return

                if (!session?.user) {
                    setIsAuthenticated(false)
                    setUser(null)
                    setLoading(false)
                    return
                }

                // Set authenticated immediately when we have a session
                setIsAuthenticated(true)

                const profile = await fetchUserProfile(
                    session.user.id,
                    session.user.email || "",
                    session.user.user_metadata
                )

                if (isMounted) {
                    // Always set user (profile is guaranteed non-null from fetchUserProfile)
                    if (profile) {
                        setUser(profile)
                    }
                    // Only set loading false AFTER user is set
                    setLoading(false)
                }
            } catch (error) {
                console.error("Error fetching user:", error)
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

            // For INITIAL_SESSION, handle it immediately without debounce
            if (event === 'INITIAL_SESSION') {
                if (session?.user) {
                    setIsAuthenticated(true)
                    const profile = await fetchUserProfile(
                        session.user.id,
                        session.user.email || "",
                        session.user.user_metadata
                    )
                    if (isMounted) {
                        if (profile) setUser(profile)
                        setLoading(false)
                    }
                } else {
                    setIsAuthenticated(false)
                    setUser(null)
                    setLoading(false)
                }
                return
            }

            // Debounce other auth state changes to prevent rapid firing
            timeoutId = setTimeout(async () => {
                if (!isMounted) return

                if (!session) {
                    setIsAuthenticated(false)
                    setUser(null)
                    setLoading(false)
                } else {
                    setIsAuthenticated(true)
                    // Refetch on sign in, token refresh, or user update
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
