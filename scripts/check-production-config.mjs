const production = process.env.VERCEL_ENV === "production"

if (!production) {
  process.exit(0)
}

const required = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_STARTER_YEARLY",
  "STRIPE_PRICE_GROWTH_MONTHLY",
  "STRIPE_PRICE_GROWTH_YEARLY",
  "STRIPE_PRICE_STUDIO_MONTHLY",
  "STRIPE_PRICE_STUDIO_YEARLY",
]

if (!process.env.EMAIL_FROM?.trim() && !process.env.RESEND_FROM_EMAIL?.trim()) {
  required.push("EMAIL_FROM or RESEND_FROM_EMAIL")
}

const missing = required.filter((name) => !process.env[name]?.trim())
const premierMonthly = process.env.STRIPE_PRICE_PREMIER_MONTHLY?.trim() || process.env.STRIPE_PRICE_ARCHIVE_MONTHLY?.trim()
const premierYearly = process.env.STRIPE_PRICE_PREMIER_YEARLY?.trim() || process.env.STRIPE_PRICE_ARCHIVE_YEARLY?.trim()

if (!premierMonthly) missing.push("STRIPE_PRICE_PREMIER_MONTHLY or STRIPE_PRICE_ARCHIVE_MONTHLY")
if (!premierYearly) missing.push("STRIPE_PRICE_PREMIER_YEARLY or STRIPE_PRICE_ARCHIVE_YEARLY")

if (missing.length > 0) {
  console.error(`Production billing configuration is incomplete: ${missing.join(", ")}`)
  process.exit(1)
}

const secretMode = process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live" : process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "test" : "unknown"
const publishableMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_") ? "live" : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_") ? "test" : "unknown"
const expectedMode = process.env.STRIPE_EXPECTED_MODE?.trim().toLowerCase()

if (secretMode === "unknown" || publishableMode === "unknown" || secretMode !== publishableMode) {
  console.error("Production Stripe secret and publishable keys must use the same valid test or live mode.")
  process.exit(1)
}

if (expectedMode && !["live", "test"].includes(expectedMode)) {
  console.error("Production STRIPE_EXPECTED_MODE must be either test or live.")
  process.exit(1)
}

if (expectedMode && secretMode !== expectedMode) {
  console.error(`Production Stripe configuration is in ${secretMode} mode, but STRIPE_EXPECTED_MODE requires ${expectedMode} mode.`)
  process.exit(1)
}

if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
  console.error("Production STRIPE_WEBHOOK_SECRET is not a valid Stripe endpoint secret.")
  process.exit(1)
}

const priceIds = [
  process.env.STRIPE_PRICE_STARTER_MONTHLY,
  process.env.STRIPE_PRICE_STARTER_YEARLY,
  process.env.STRIPE_PRICE_GROWTH_MONTHLY,
  process.env.STRIPE_PRICE_GROWTH_YEARLY,
  process.env.STRIPE_PRICE_STUDIO_MONTHLY,
  process.env.STRIPE_PRICE_STUDIO_YEARLY,
  premierMonthly,
  premierYearly,
]

if (priceIds.some((priceId) => !priceId?.startsWith("price_"))) {
  console.error("Every production Stripe plan price must be a valid price_ id.")
  process.exit(1)
}

if (new Set(priceIds).size !== priceIds.length) {
  console.error("Every production Stripe plan and billing cycle must use a distinct price id.")
  process.exit(1)
}

console.log(`Production billing configuration validated in ${secretMode} mode.`)
