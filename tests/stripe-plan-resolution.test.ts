import assert from "node:assert/strict"
import test from "node:test"

import { resolveStripePlan } from "../src/lib/stripe-plan-resolution.ts"

test("recognizes the legacy annual Growth price from Stripe evidence", () => {
  const resolved = resolveStripePlan({
    id: "price_legacy_growth",
    interval: "year",
    unitAmount: 2_999,
  })

  assert.equal(resolved?.plan.slug, "growth")
  assert.equal(resolved?.billingCycle, "ANNUAL")
})

test("prefers a configured current price ID over an amount shared with a legacy tier", () => {
  const previousMonthly = process.env.STRIPE_PRICE_GROWTH_MONTHLY
  const previousYearly = process.env.STRIPE_PRICE_GROWTH_YEARLY
  process.env.STRIPE_PRICE_GROWTH_MONTHLY = "price_current_growth_monthly"
  process.env.STRIPE_PRICE_GROWTH_YEARLY = "price_current_growth"
  const resolved = resolveStripePlan({
    id: "price_current_growth",
    interval: "year",
    unitAmount: 5_999,
  })

  assert.equal(resolved?.plan.slug, "growth")
  assert.equal(resolved?.billingCycle, "ANNUAL")
  if (previousMonthly === undefined) delete process.env.STRIPE_PRICE_GROWTH_MONTHLY
  else process.env.STRIPE_PRICE_GROWTH_MONTHLY = previousMonthly
  if (previousYearly === undefined) delete process.env.STRIPE_PRICE_GROWTH_YEARLY
  else process.env.STRIPE_PRICE_GROWTH_YEARLY = previousYearly
})
