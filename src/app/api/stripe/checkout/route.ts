import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlanPriceEnvNames, getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"
import { getAppUrl } from "@/lib/app-url"

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional().or(z.literal("")),
  lastName: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  planSlug: z.enum(["starter", "growth", "studio", "premier"]).default("starter"),
  billingCycle: z.enum(["monthly", "annual"]).default("annual"),
})

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request", issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const plan = getSubscriberPlan(data.planSlug)
  const priceEnvNames = getPlanPriceEnvNames(plan, data.billingCycle)
  const priceId = getPlanPriceId(plan, data.billingCycle)

  if (!hasStripeCheckoutConfig(priceId)) {
    return NextResponse.json({
      error: "Stripe is not configured",
      requiredEnv: ["STRIPE_SECRET_KEY", priceEnvNames.join(" or ")],
    }, { status: 503 })
  }

  const appUrl = getAppUrl(request)
  try {
    const session = await createStripeCheckoutSession({
      cancelUrl: `${appUrl}/register?plan=${plan.slug}`,
      customerEmail: data.email,
      metadata: {
        email: data.email,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        billingCycle: data.billingCycle,
        expectedPriceId: priceId ?? "",
        planSlug: plan.slug,
        storageLimitBytes: String(plan.storageLimitBytes),
        source: "direct_checkout",
      },
      phone: data.phone,
      priceId: priceId!,
      successUrl: `${appUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      trialDays: plan.trialDays,
    })

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id })
  } catch (error) {
    console.error("Stripe checkout session creation failed", error)
    return NextResponse.json({
      error: "Stripe Checkout could not be started. Please try again.",
    }, { status: 502 })
  }
}
