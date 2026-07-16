export type PlanSlug = "starter" | "growth" | "studio" | "premier"

export type SubscriberPlan = {
  aliases?: string[]
  annualPriceCents: number
  legacyStripeAnnualPriceEnv?: string
  legacyStripeMonthlyPriceEnv?: string
  monthlyPriceCents: number
  name: string
  slug: PlanSlug
  storageLimitBytes: number
  stripeAnnualPriceEnv: string
  stripeMonthlyPriceEnv: string
  trialDays: number
}

// The current upload routes decode files in memory before storing them. This is
// an infrastructure safeguard, not a plan allowance or billable usage limit.
export const TECHNICAL_UPLOAD_SAFETY_BYTES = 100 * 1024 ** 2

export const subscriberPlans: SubscriberPlan[] = [
  {
    annualPriceCents: 3999,
    monthlyPriceCents: 399,
    name: "Starter",
    slug: "starter",
    storageLimitBytes: 5 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_STARTER_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_STARTER_MONTHLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 5999,
    monthlyPriceCents: 599,
    name: "Growth",
    slug: "growth",
    storageLimitBytes: 20 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_GROWTH_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_GROWTH_MONTHLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 7999,
    monthlyPriceCents: 799,
    name: "Studio",
    slug: "studio",
    storageLimitBytes: 50 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_STUDIO_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_STUDIO_MONTHLY",
    trialDays: 14,
  },
  {
    annualPriceCents: 11999,
    aliases: ["archive"],
    monthlyPriceCents: 1199,
    name: "Premier",
    slug: "premier",
    storageLimitBytes: 150 * 1024 ** 3,
    stripeAnnualPriceEnv: "STRIPE_PRICE_PREMIER_YEARLY",
    stripeMonthlyPriceEnv: "STRIPE_PRICE_PREMIER_MONTHLY",
    legacyStripeAnnualPriceEnv: "STRIPE_PRICE_ARCHIVE_YEARLY",
    legacyStripeMonthlyPriceEnv: "STRIPE_PRICE_ARCHIVE_MONTHLY",
    trialDays: 14,
  },
]

export function getSubscriberPlan(slug: string | null | undefined) {
  return subscriberPlans.find((plan) => plan.slug === slug || plan.aliases?.includes(slug ?? "")) ?? subscriberPlans[0]
}

export function getCanonicalPlanSlug(slug: string | null | undefined): PlanSlug {
  return getSubscriberPlan(slug).slug
}

export function getSubscriberPlanIndex(slug: string | null | undefined) {
  const canonicalSlug = getCanonicalPlanSlug(slug)
  return subscriberPlans.findIndex((plan) => plan.slug === canonicalSlug)
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

export function getPlanPriceEnvNames(plan: SubscriberPlan, billingCycle: "monthly" | "annual") {
  const primary = getPlanPriceEnv(plan, billingCycle)
  const legacy = billingCycle === "monthly" ? plan.legacyStripeMonthlyPriceEnv : plan.legacyStripeAnnualPriceEnv
  return legacy ? [primary, legacy] : [primary]
}

export function getPlanPriceId(plan: SubscriberPlan, billingCycle: "monthly" | "annual") {
  for (const envName of getPlanPriceEnvNames(plan, billingCycle)) {
    const value = process.env[envName]?.trim()
    if (value) return value
  }

  return undefined
}

export function planPriceMatches(plan: SubscriberPlan, priceId: string | null | undefined) {
  if (!priceId) return false
  return getPlanPriceEnvNames(plan, "monthly").some((envName) => process.env[envName] === priceId)
    || getPlanPriceEnvNames(plan, "annual").some((envName) => process.env[envName] === priceId)
}

export function getPlanBillingCycleFromPriceId(plan: SubscriberPlan, priceId: string | null | undefined) {
  if (!priceId) return null
  if (getPlanPriceEnvNames(plan, "monthly").some((envName) => process.env[envName] === priceId)) return "MONTHLY"
  if (getPlanPriceEnvNames(plan, "annual").some((envName) => process.env[envName] === priceId)) return "ANNUAL"
  return null
}

export function formatPlanStorage(bytes: number) {
  if (bytes >= 1024 ** 3) return `${bytes / 1024 ** 3} GB`
  return `${Math.round(bytes / 1024 ** 2)} MB`
}
