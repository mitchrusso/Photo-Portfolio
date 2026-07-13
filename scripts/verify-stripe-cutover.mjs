import { pathToFileURL } from "node:url"

export const REQUIRED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.deleted",
  "customer.subscription.updated",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
]

export const PLAN_PRICES = [
  { amount: 199, cycle: "monthly", envNames: ["STRIPE_PRICE_STARTER_MONTHLY"], interval: "month", plan: "Starter" },
  { amount: 1999, cycle: "annual", envNames: ["STRIPE_PRICE_STARTER_YEARLY"], interval: "year", plan: "Starter" },
  { amount: 299, cycle: "monthly", envNames: ["STRIPE_PRICE_GROWTH_MONTHLY"], interval: "month", plan: "Growth" },
  { amount: 2999, cycle: "annual", envNames: ["STRIPE_PRICE_GROWTH_YEARLY"], interval: "year", plan: "Growth" },
  { amount: 599, cycle: "monthly", envNames: ["STRIPE_PRICE_STUDIO_MONTHLY"], interval: "month", plan: "Studio" },
  { amount: 5999, cycle: "annual", envNames: ["STRIPE_PRICE_STUDIO_YEARLY"], interval: "year", plan: "Studio" },
  { amount: 999, cycle: "monthly", envNames: ["STRIPE_PRICE_PREMIER_MONTHLY", "STRIPE_PRICE_ARCHIVE_MONTHLY"], interval: "month", plan: "Premier" },
  { amount: 9999, cycle: "annual", envNames: ["STRIPE_PRICE_PREMIER_YEARLY", "STRIPE_PRICE_ARCHIVE_YEARLY"], interval: "year", plan: "Premier" },
]

export function classifyStripeMode(value = "") {
  if (value.startsWith("sk_live_") || value.startsWith("pk_live_")) return "live"
  if (value.startsWith("sk_test_") || value.startsWith("pk_test_")) return "test"
  return "unknown"
}

export function validatePrice(price, expected, mode) {
  const problems = []
  const product = typeof price.product === "object" && price.product ? price.product : null

  if (price.active !== true) problems.push("price is inactive")
  if (price.type !== "recurring") problems.push("price is not recurring")
  if (price.currency !== "usd") problems.push(`currency is ${price.currency ?? "missing"}, expected usd`)
  if (price.unit_amount !== expected.amount) problems.push(`amount is ${price.unit_amount ?? "missing"}, expected ${expected.amount}`)
  if (price.recurring?.interval !== expected.interval) problems.push(`interval is ${price.recurring?.interval ?? "missing"}, expected ${expected.interval}`)
  if (price.recurring?.interval_count !== 1) problems.push("interval count is not 1")
  if (price.livemode !== (mode === "live")) problems.push(`price is not in ${mode} mode`)
  if (!product) problems.push("product was not expanded")
  else if (product.active !== true) problems.push("product is inactive")

  return problems
}

export function missingWebhookEvents(enabledEvents = []) {
  if (enabledEvents.includes("*")) return []
  return REQUIRED_WEBHOOK_EVENTS.filter((event) => !enabledEvents.includes(event))
}

function readFirst(names) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return { name, value }
  }
  return { name: names.join(" or "), value: "" }
}

async function stripeGet(path, secretKey) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body?.error?.message || `Stripe API returned HTTP ${response.status}`)
  }

  return body
}

function normalizeAppUrl(value) {
  return value.replace(/\/$/, "")
}

export async function verifyStripeCutover({ requireLive = false } = {}) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ""
  const expectedMode = process.env.STRIPE_EXPECTED_MODE?.trim().toLowerCase() || null
  const secretMode = classifyStripeMode(secretKey)
  const publishableMode = classifyStripeMode(publishableKey)
  const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "")
  const failures = []
  const successes = []

  if (secretMode === "unknown") failures.push("STRIPE_SECRET_KEY is missing or invalid")
  if (publishableMode === "unknown") failures.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing or invalid")
  if (secretMode !== "unknown" && publishableMode !== secretMode) failures.push("secret and publishable keys use different modes")
  if (!webhookSecret.startsWith("whsec_")) failures.push("STRIPE_WEBHOOK_SECRET is missing or invalid")
  if (expectedMode && !["test", "live"].includes(expectedMode)) failures.push("STRIPE_EXPECTED_MODE must be test or live")
  if (expectedMode && secretMode !== "unknown" && expectedMode !== secretMode) failures.push(`STRIPE_EXPECTED_MODE requires ${expectedMode}, but keys are ${secretMode}`)
  if (requireLive && secretMode !== "live") failures.push("live verification was requested, but Stripe keys are not live")
  if (!appUrl) failures.push("NEXT_PUBLIC_APP_URL is missing")
  else if (requireLive && (!appUrl.startsWith("https://") || appUrl.includes("localhost"))) failures.push("live verification requires a public HTTPS NEXT_PUBLIC_APP_URL")

  const configuredPrices = PLAN_PRICES.map((expected) => ({ expected, ...readFirst(expected.envNames) }))
  const missingPrices = configuredPrices.filter((entry) => !entry.value)
  failures.push(...missingPrices.map((entry) => `${entry.name} is missing`))

  const priceIds = configuredPrices.map((entry) => entry.value).filter(Boolean)
  if (priceIds.some((priceId) => !priceId.startsWith("price_"))) failures.push("one or more plan prices is not a valid price_ id")
  if (new Set(priceIds).size !== priceIds.length) failures.push("each plan and billing cycle must use a distinct Stripe price")

  if (failures.length > 0) return { failures, mode: secretMode, successes }

  await stripeGet("/account", secretKey)
  successes.push(`Stripe ${secretMode} account authenticated`)

  for (const { expected, value } of configuredPrices) {
    const price = await stripeGet(`/prices/${encodeURIComponent(value)}?expand[]=product`, secretKey)
    const priceProblems = validatePrice(price, expected, secretMode)
    if (priceProblems.length > 0) {
      failures.push(`${expected.plan} ${expected.cycle}: ${priceProblems.join(", ")}`)
    } else {
      successes.push(`${expected.plan} ${expected.cycle}: $${(expected.amount / 100).toFixed(2)} USD`)
    }
  }

  const webhookUrl = `${appUrl}/api/stripe/webhook`
  const webhookEndpoints = await stripeGet("/webhook_endpoints?limit=100", secretKey)
  const endpoint = webhookEndpoints.data?.find((candidate) => candidate.url === webhookUrl)

  if (!endpoint) {
    failures.push(`no Stripe webhook endpoint targets ${webhookUrl}`)
  } else {
    if (endpoint.status !== "enabled") failures.push("production webhook endpoint is disabled")
    if (endpoint.livemode !== (secretMode === "live")) failures.push(`production webhook endpoint is not in ${secretMode} mode`)
    const missingEvents = missingWebhookEvents(endpoint.enabled_events)
    if (missingEvents.length > 0) failures.push(`production webhook is missing events: ${missingEvents.join(", ")}`)
    if (endpoint.status === "enabled" && missingEvents.length === 0) successes.push("Production webhook endpoint and required events verified")
  }

  return { failures, mode: secretMode, successes }
}

async function main() {
  const requireLive = process.argv.includes("--require-live")

  try {
    const result = await verifyStripeCutover({ requireLive })
    console.log(`Stripe cutover verification: ${result.mode} mode`)
    result.successes.forEach((message) => console.log(`  PASS  ${message}`))
    result.failures.forEach((message) => console.error(`  FAIL  ${message}`))

    if (result.failures.length > 0) process.exitCode = 1
    else console.log(requireLive ? "Live Stripe cutover is ready." : "Stripe configuration is internally consistent.")
  } catch (error) {
    console.error(`Stripe verification could not complete: ${error instanceof Error ? error.message : "Unknown error"}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
