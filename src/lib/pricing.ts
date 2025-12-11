import pricingConfig from "@/config/pricing-config.json"

export type PlanId = keyof typeof pricingConfig.plans

export interface UserSubscription {
    planId: PlanId
    status: "active" | "canceled" | "past_due" | "trialing"
    priceLocked?: number
    grandfathered?: boolean
}

export const PRICING = pricingConfig

export function getPlanDetails(planId: PlanId) {
    return PRICING.plans[planId]
}

export function getBillingAmount(user: UserSubscription) {
    // If user has a locked price (grandfathered), return that
    if (user.priceLocked !== undefined) {
        return user.priceLocked
    }

    // Otherwise return current price for the plan
    return PRICING.plans[user.planId].price
}

export function isFeatureEnabled(planId: PlanId, featureKey: string) {
    // Check if a feature is enabled for a plan
    const plan = PRICING.plans[planId]

    // For unlimited features, limits are set to -1
    if (plan.limits && featureKey in plan.limits) {
        return plan.limits[featureKey as keyof typeof plan.limits] !== 0
    }

    return true
}

export function canDownloadTemplate(
    planId: PlanId,
    currentDownloads: number
): boolean {
    const plan = PRICING.plans[planId]
    const limit = plan.limits.templatesLifetime

    // -1 means unlimited
    if (limit === -1) return true

    return currentDownloads < limit
}

export function canUseAI(
    planId: PlanId,
    currentGenerations: number
): boolean {
    const plan = PRICING.plans[planId]
    const limit = plan.limits.aiGenerations

    // -1 means unlimited
    if (limit === -1) return true

    return currentGenerations < limit
}

export function formatPrice(price: number, currency: string = "INR"): string {
    if (price === 0) return "Free"

    if (currency === "INR") {
        return `₹${price}`
    }

    return `${currency} ${price}`
}
