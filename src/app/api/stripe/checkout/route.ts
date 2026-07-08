import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlanPriceEnvNames, getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().optional().or(z.literal("")),
  lastName: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  planSlug: z.string().trim().default("starter"),
  billingCycle: z.enum(["monthly", "annual"]).default("annual"),
})

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

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
        planSlug: plan.slug,
        source: "direct_checkout",
      },
      phone: data.phone,
      priceId: priceId!,
      successUrl: `${appUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      trialDays: plan.trialDays,
    })

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Stripe Checkout failed",
    }, { status: 502 })
  }
}
