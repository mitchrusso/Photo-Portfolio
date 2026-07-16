import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { isSuperAdminSession } from "@/lib/admin-access"

const catalog = [
  { plan: "starter", name: "Starter", monthly: 399, annual: 3999 },
  { plan: "growth", name: "Growth", monthly: 599, annual: 5999 },
  { plan: "studio", name: "Studio", monthly: 799, annual: 7999 },
  { plan: "premier", name: "Premier", monthly: 1199, annual: 11999 },
] as const

type StripeJson = Record<string, unknown> & { data?: Array<Record<string, unknown>>; error?: { message?: string }; id?: string }

async function stripeRequest(secretKey: string, path: string, options: { method?: "GET" | "POST"; params?: Record<string, string> } = {}) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    body: options.params ? new URLSearchParams(options.params) : undefined,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(options.params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    method: options.method ?? "GET",
  })
  const body = await response.json().catch(() => ({})) as StripeJson
  if (!response.ok) throw new Error(body.error?.message || `Stripe API returned HTTP ${response.status}`)
  return body
}

async function findOrCreateProduct(secretKey: string, entry: (typeof catalog)[number]) {
  const query = encodeURIComponent(`active:'true' AND metadata['photoview_plan']:'${entry.plan}'`)
  const result = await stripeRequest(secretKey, `/products/search?query=${query}`)
  const name = `PhotoView.io ${entry.name}`
  const existing = result.data?.find((product) => product.name === name)
  if (existing?.id && typeof existing.id === "string") return existing.id

  const product = await stripeRequest(secretKey, "/products", {
    method: "POST",
    params: {
      name,
      description: `${entry.name} subscription for PhotoView.io`,
      "metadata[photoview_plan]": entry.plan,
      "metadata[catalog_version]": "2026-07",
    },
  })
  if (typeof product.id !== "string") throw new Error(`Stripe did not return a product for ${entry.name}.`)
  return product.id
}

async function findOrCreatePrice(secretKey: string, input: {
  amount: number
  cycle: "annual" | "monthly"
  envName: string
  plan: string
  productId: string
}) {
  const lookupKey = `photoview_${input.plan}_${input.cycle}_2026_07`
  const interval = input.cycle === "monthly" ? "month" : "year"
  const query = new URLSearchParams({ active: "true", limit: "10" })
  query.append("lookup_keys[]", lookupKey)
  const result = await stripeRequest(secretKey, `/prices?${query}`)
  const existing = result.data?.find((price) => (
    price.product === input.productId
    && price.unit_amount === input.amount
    && price.currency === "usd"
    && typeof price.recurring === "object"
    && price.recurring !== null
    && (price.recurring as Record<string, unknown>).interval === interval
  ))
  if (existing?.id && typeof existing.id === "string") return [input.envName, existing.id] as const

  const price = await stripeRequest(secretKey, "/prices", {
    method: "POST",
    params: {
      product: input.productId,
      currency: "usd",
      unit_amount: String(input.amount),
      "recurring[interval]": interval,
      lookup_key: lookupKey,
      nickname: `${input.cycle === "monthly" ? "Monthly" : "Annual"} ${input.plan} 2026-07`,
      "metadata[photoview_plan]": input.plan,
      "metadata[billing_cycle]": input.cycle,
      "metadata[catalog_version]": "2026-07",
    },
  })
  if (typeof price.id !== "string") throw new Error(`Stripe did not return a price for ${input.plan} ${input.cycle}.`)
  return [input.envName, price.id] as const
}

export async function POST() {
  const session = await auth()
  if (!isSuperAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
  if (!secretKey.startsWith("sk_live_")) {
    return NextResponse.json({ error: "The production Stripe live key is not configured." }, { status: 503 })
  }

  try {
    const assignments: Record<string, string> = {}
    for (const entry of catalog) {
      const productId = await findOrCreateProduct(secretKey, entry)
      const prices = await Promise.all([
        findOrCreatePrice(secretKey, {
          amount: entry.monthly,
          cycle: "monthly",
          envName: `STRIPE_PRICE_${entry.plan.toUpperCase()}_MONTHLY`,
          plan: entry.plan,
          productId,
        }),
        findOrCreatePrice(secretKey, {
          amount: entry.annual,
          cycle: "annual",
          envName: `STRIPE_PRICE_${entry.plan.toUpperCase()}_YEARLY`,
          plan: entry.plan,
          productId,
        }),
      ])
      for (const [name, id] of prices) assignments[name] = id
    }

    const configuredPriceIdsMatch = Object.entries(assignments).every(([name, id]) => process.env[name] === id)
    return NextResponse.json({ assignments, configuredPriceIdsMatch, legacyPricesChanged: false, ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe catalog migration failed." }, { status: 502 })
  }
}
