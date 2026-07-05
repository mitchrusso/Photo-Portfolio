export type PlanSlug = "starter" | "growth" | "studio" | "archive"

export type SubscriberPlan = {
  annualPriceCents: number
  bandwidthLimitBytes: number
  maxUploadBytes: number
  name: string
  slug: PlanSlug
  storageLimitBytes: number
  stripePriceEnv: string
  trialDays: number
}

export const subscriberPlans: SubscriberPlan[] = [
  {
    annualPriceCents: 997,
    bandwidthLimitBytes: 10 * 1024 ** 3,
    maxUploadBytes: 25 * 1024 ** 2,
    name: "Starter",
    slug: "starter",
    storageLimitBytes: 100 * 1024 ** 2,
    stripePriceEnv: "STRIPE_PRICE_STARTER_YEARLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 1997,
    bandwidthLimitBytes: 10 * 1024 ** 3,
    maxUploadBytes: 25 * 1024 ** 2,
    name: "Growth",
    slug: "growth",
    storageLimitBytes: 1024 ** 3,
    stripePriceEnv: "STRIPE_PRICE_GROWTH_YEARLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 4997,
    bandwidthLimitBytes: 10 * 1024 ** 3,
    maxUploadBytes: 25 * 1024 ** 2,
    name: "Studio",
    slug: "studio",
    storageLimitBytes: 5 * 1024 ** 3,
    stripePriceEnv: "STRIPE_PRICE_STUDIO_YEARLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 9997,
    bandwidthLimitBytes: 10 * 1024 ** 3,
    maxUploadBytes: 25 * 1024 ** 2,
    name: "Archive",
    slug: "archive",
    storageLimitBytes: 10 * 1024 ** 3,
    stripePriceEnv: "STRIPE_PRICE_ARCHIVE_YEARLY",
    trialDays: 14,
  },
]

export function getSubscriberPlan(slug: string | null | undefined) {
  return subscriberPlans.find((plan) => plan.slug === slug) ?? subscriberPlans[0]
}

export function formatPlanPrice(plan: SubscriberPlan) {
  return `$${(plan.annualPriceCents / 100).toFixed(2)}/yr`
}

export function formatPlanStorage(bytes: number) {
  if (bytes >= 1024 ** 3) return `${bytes / 1024 ** 3} GB`
  return `${Math.round(bytes / 1024 ** 2)} MB`
}
