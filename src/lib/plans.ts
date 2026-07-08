export type PlanSlug = "starter" | "growth" | "studio" | "archive"

export type SubscriberPlan = {
  annualPriceCents: number
  bandwidthLimitBytes: number
  maxUploadBytes: number
  monthlyPriceCents: number
  name: string
  slug: PlanSlug
  storageLimitBytes: number
  stripeAnnualPriceEnv: string
  stripeMonthlyPriceEnv: string
  trialDays: number
}

export const STANDARD_MAX_UPLOAD_BYTES = 100 * 1024 ** 2

export const subscriberPlans: SubscriberPlan[] = [
  {
    annualPriceCents: 1999,
    bandwidthLimitBytes: 5 * 1024 ** 3,
    maxUploadBytes: STANDARD_MAX_UPLOAD_BYTES,
    monthlyPriceCents: 199,
    name: "Starter",
    slug: "starter",
    storageLimitBytes: 2 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_STARTER_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_STARTER_MONTHLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 2999,
    bandwidthLimitBytes: 20 * 1024 ** 3,
    maxUploadBytes: STANDARD_MAX_UPLOAD_BYTES,
    monthlyPriceCents: 299,
    name: "Growth",
    slug: "growth",
    storageLimitBytes: 10 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_GROWTH_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_GROWTH_MONTHLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 5999,
    bandwidthLimitBytes: 50 * 1024 ** 3,
    maxUploadBytes: STANDARD_MAX_UPLOAD_BYTES,
    monthlyPriceCents: 599,
    name: "Studio",
    slug: "studio",
    storageLimitBytes: 25 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_STUDIO_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_STUDIO_MONTHLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 9999,
    bandwidthLimitBytes: 150 * 1024 ** 3,
    maxUploadBytes: STANDARD_MAX_UPLOAD_BYTES,
    monthlyPriceCents: 999,
    name: "Archive",
    slug: "archive",
    storageLimitBytes: 75 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_ARCHIVE_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_ARCHIVE_MONTHLY",
    trialDays: 14,
  },
]

export function getSubscriberPlan(slug: string | null | undefined) {
  return subscriberPlans.find((plan) => plan.slug === slug) ?? subscriberPlans[0]
}

export function formatPlanPrice(plan: SubscriberPlan) {
  return `$${(plan.annualPriceCents / 100).toFixed(2)}/yr`
}

export function formatMonthlyPlanPrice(plan: SubscriberPlan) {
  return `$${(plan.monthlyPriceCents / 100).toFixed(2)}/mo`
}

export function getPlanPriceEnv(plan: SubscriberPlan, billingCycle: "monthly" | "annual") {
  return billingCycle === "monthly" ? plan.stripeMonthlyPriceEnv : plan.stripeAnnualPriceEnv
}

export function formatPlanStorage(bytes: number) {
  if (bytes >= 1024 ** 3) return `${bytes / 1024 ** 3} GB`
  return `${Math.round(bytes / 1024 ** 2)} MB`
}

export function formatPlanBandwidth(bytes: number) {
  if (bytes >= 1024 ** 3) return `${bytes / 1024 ** 3} GB`
  return `${Math.round(bytes / 1024 ** 2)} MB`
}
