import { NextResponse } from "next/server"
import { z } from "zod"
import { getSubscriberPlan } from "@/lib/plans"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"

const trialRegistrationSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().min(7).optional().or(z.literal("")),
  planSlug: z.string().trim().default("starter"),
  studioName: z.string().trim().optional().or(z.literal("")),
  storageRequested: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  marketingConsent: z.boolean().default(false),
})

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

async function notifyAutoresponder(payload: Record<string, unknown>) {
  if (!process.env.AUTORESPONDER_WEBHOOK_URL) {
    return "not_configured"
  }

  try {
    const response = await fetch(process.env.AUTORESPONDER_WEBHOOK_URL, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    return response.ok ? "sent" : "failed"
  } catch {
    return "failed"
  }
}

export async function POST(request: Request) {
  const parsed = trialRegistrationSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details", issues: parsed.error.flatten() }, { status: 400 })
  }

  const prospect = parsed.data
  const plan = getSubscriberPlan(prospect.planSlug)
  const appUrl = getAppUrl(request)
  const trialStartedAt = new Date()
  const trialEndsAt = new Date(trialStartedAt)
  trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays)

  const registration = {
    ...prospect,
    planSlug: plan.slug,
    planName: plan.name,
    storageLimitBytes: plan.storageLimitBytes,
    bandwidthLimitBytes: plan.bandwidthLimitBytes,
    maxUploadBytes: plan.maxUploadBytes,
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
  }

  const autoresponderStatus = await notifyAutoresponder({
    event: "trial_registered",
    source: "PhotoViewPro",
    ...registration,
  })

  const priceId = process.env[plan.stripePriceEnv]
  let checkoutUrl: string | null = null
  let checkoutSessionId: string | null = null

  if (hasStripeCheckoutConfig(priceId)) {
    try {
      const session = await createStripeCheckoutSession({
        cancelUrl: `${appUrl}/register?plan=${plan.slug}`,
        customerEmail: prospect.email,
        metadata: {
          email: prospect.email,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          planSlug: plan.slug,
          source: "trial_registration",
          studioName: prospect.studioName ?? "",
        },
        phone: prospect.phone,
        priceId: priceId!,
        successUrl: `${appUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
        trialDays: plan.trialDays,
      })

      checkoutUrl = session.url
      checkoutSessionId = session.id
    } catch (error) {
      return NextResponse.json({
        autoresponderStatus,
        error: error instanceof Error ? error.message : "Stripe Checkout failed",
        message: "Registration was captured, but Stripe Checkout could not be created.",
        registration,
      }, { status: 502 })
    }
  }

  const response = NextResponse.json({
    autoresponderStatus,
    checkoutSessionId,
    checkoutUrl,
    message: checkoutUrl
      ? "Trial registered. Continue to Stripe to activate billing."
      : "Trial registered. Stripe price ids are not configured yet.",
    registration,
  })

  response.cookies.set("photoviewpro_trial_signup", JSON.stringify({
    email: prospect.email,
    planSlug: plan.slug,
    trialEndsAt: trialEndsAt.toISOString(),
  }), {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * plan.trialDays,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
