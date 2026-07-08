import { getPlanPriceEnvNames, subscriberPlans } from "@/lib/plans"

type StripeEnvMode = "empty" | "live" | "test" | "unknown"

export type StripePriceConfigRow = {
  billingCycle: "Monthly" | "Annual"
  envName: string
  expectedAmountCents: number
  maskedValue: string
  planName: string
  present: boolean
}

export type StripeConfigSummary = {
  automaticTaxEnabled: boolean
  isLiveReady: boolean
  missingRequired: string[]
  priceRows: StripePriceConfigRow[]
  publishableKeyMode: StripeEnvMode
  secretKeyMode: StripeEnvMode
  webhookSecretPresent: boolean
}

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ""
}

function classifyStripeValue(value: string): StripeEnvMode {
  if (!value) return "empty"
  if (value.startsWith("sk_live_") || value.startsWith("pk_live_")) return "live"
  if (value.startsWith("sk_test_") || value.startsWith("pk_test_")) return "test"
  return "unknown"
}

function maskValue(value: string) {
  if (!value) return "empty"
  if (value.length <= 12) return `${value.slice(0, 4)}...`
  return `${value.slice(0, 10)}...${value.slice(-4)}`
}

export function getStripeConfigSummary(): StripeConfigSummary {
  const secretKey = readEnv("STRIPE_SECRET_KEY")
  const publishableKey = readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
  const webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET")
  const priceRows = subscriberPlans.flatMap((plan): StripePriceConfigRow[] => {
    const monthlyEnvNames = getPlanPriceEnvNames(plan, "monthly")
    const annualEnvNames = getPlanPriceEnvNames(plan, "annual")
    const monthlyValue = monthlyEnvNames.map(readEnv).find(Boolean) ?? ""
    const annualValue = annualEnvNames.map(readEnv).find(Boolean) ?? ""

    return [
      {
        billingCycle: "Monthly",
        envName: monthlyEnvNames.join(" or "),
        expectedAmountCents: plan.monthlyPriceCents,
        maskedValue: maskValue(monthlyValue),
        planName: plan.name,
        present: Boolean(monthlyValue),
      },
      {
        billingCycle: "Annual",
        envName: annualEnvNames.join(" or "),
        expectedAmountCents: plan.annualPriceCents,
        maskedValue: maskValue(annualValue),
        planName: plan.name,
        present: Boolean(annualValue),
      },
    ]
  })
  const missingRequired = [
    !secretKey ? "STRIPE_SECRET_KEY" : null,
    !publishableKey ? "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" : null,
    !webhookSecret ? "STRIPE_WEBHOOK_SECRET" : null,
    ...priceRows.filter((row) => !row.present).map((row) => row.envName),
  ].filter((value): value is string => Boolean(value))
  const secretKeyMode = classifyStripeValue(secretKey)
  const publishableKeyMode = classifyStripeValue(publishableKey)

  return {
    automaticTaxEnabled: readEnv("STRIPE_AUTOMATIC_TAX_ENABLED") === "true",
    isLiveReady: missingRequired.length === 0 && secretKeyMode === "live" && publishableKeyMode === "live",
    missingRequired,
    priceRows,
    publishableKeyMode,
    secretKeyMode,
    webhookSecretPresent: Boolean(webhookSecret),
  }
}
