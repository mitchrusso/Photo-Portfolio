import {
  getPlanBillingCycleFromPriceId,
  planPriceMatches,
  subscriberPlans,
  type SubscriberPlan,
} from "./plans.ts"

export type StripePriceEvidence = {
  id?: string | null
  interval?: string | null
  unitAmount?: number | null
}

type ResolvedStripePlan = {
  billingCycle: "ANNUAL" | "MONTHLY"
  plan: SubscriberPlan
}

const legacyCatalog = [
  { annual: 1_999, monthly: 199, planSlug: "starter" },
  { annual: 2_999, monthly: 299, planSlug: "growth" },
  { annual: 5_999, monthly: 599, planSlug: "studio" },
  { annual: 9_999, monthly: 999, planSlug: "premier" },
] as const

export function resolveStripePlan(price: StripePriceEvidence): ResolvedStripePlan | null {
  const priceId = price.id?.trim()
  if (priceId) {
    const plan = subscriberPlans.find((candidate) => planPriceMatches(candidate, priceId))
    const cycle = plan ? getPlanBillingCycleFromPriceId(plan, priceId) : null
    if (plan && cycle) {
      return { billingCycle: cycle, plan }
    }
  }

  const billingCycle = price.interval === "year" ? "ANNUAL" : price.interval === "month" ? "MONTHLY" : null
  if (!billingCycle || typeof price.unitAmount !== "number") return null

  const legacy = legacyCatalog.find((entry) => (
    billingCycle === "ANNUAL" ? entry.annual : entry.monthly
  ) === price.unitAmount)
  const plan = legacy ? subscriberPlans.find((candidate) => candidate.slug === legacy.planSlug) : null
  return plan ? { billingCycle, plan } : null
}
