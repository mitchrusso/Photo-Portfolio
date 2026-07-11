import { NextResponse } from "next/server"
import { z } from "zod"
import { autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { cleanCouponCode, recordCouponLead, validateCouponCode } from "@/lib/coupons"
import { getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { recordReferralLead } from "@/lib/referrals"
import { sendTrialWelcomeEmail } from "@/lib/lifecycle-email"
import {
  persistTrialRegistration,
  updateTrialRegistrationExternalStatus,
} from "@/lib/subscriber-onboarding"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"

const trialRegistrationSchema = z.object({
  couponCode: z.string().trim().optional().or(z.literal("")),
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().min(7).optional().or(z.literal("")),
  planSlug: z.string().trim().default("starter"),
  billingCycle: z.enum(["monthly", "annual"]).default("annual"),
  referralCode: z.string().trim().optional().or(z.literal("")),
  studioName: z.string().trim().optional().or(z.literal("")),
  storageRequested: z.string().trim().optional().or(z.literal("")),
  termsAccepted: z.literal(true),
  website: z.string().trim().optional().or(z.literal("")),
  marketingConsent: z.boolean().default(false),
})

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

export async function POST(request: Request) {
  const parsed = trialRegistrationSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details", issues: parsed.error.flatten() }, { status: 400 })
  }

  const prospect = parsed.data
  const appliedCoupon = await validateCouponCode(prospect.couponCode)
  const requestedCouponCode = cleanCouponCode(prospect.couponCode)

  if (requestedCouponCode && !appliedCoupon) {
    return NextResponse.json({
      error: "Invalid coupon code",
      message: "That coupon code is not active, has expired, or has reached its redemption limit. Please check the code and try again.",
    }, { status: 400 })
  }

  const plan = getSubscriberPlan(appliedCoupon?.planSlug ?? prospect.planSlug)
  const appUrl = getAppUrl(request)
  const trialStartedAt = new Date()
  const termsAcceptedAt = trialStartedAt.toISOString()
  const trialEndsAt = new Date(trialStartedAt)
  trialEndsAt.setDate(trialEndsAt.getDate() + (appliedCoupon?.freeDays ?? plan.trialDays))

  const registration = {
    ...prospect,
    planSlug: plan.slug,
    planName: plan.name,
    couponCode: appliedCoupon?.code ?? null,
    referralCode: prospect.referralCode || null,
    storageLimitBytes: plan.storageLimitBytes,
    bandwidthLimitBytes: plan.bandwidthLimitBytes,
    maxUploadBytes: plan.maxUploadBytes,
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    termsAcceptedAt,
    termsVersion: "2026-07-06",
  }

  let subscriberRecord

  try {
    subscriberRecord = await persistTrialRegistration({
      plan,
      prospect: {
        ...prospect,
        couponCode: appliedCoupon?.code,
        couponCodeId: appliedCoupon?.couponId,
        planSlug: plan.slug,
      },
      trialEndsAt,
      trialStartedAt,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Subscriber record creation failed",
      message: "Registration could not be saved. Please check the database setup.",
      registration,
    }, { status: 500 })
  }

  const autoresponderStatus = await notifyAutoresponder({
    addTags: [
      autoresponderTags.trial,
      autoresponderTags.trialRegistered,
      `photoviewpro:plan:${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      ...(appliedCoupon ? [`photoviewpro:coupon:${appliedCoupon.code}`] : []),
    ],
    email: prospect.email,
    event: "trial_registered",
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    list: "PhotoViewPro Trial",
    metadata: registration,
  })
  if (appliedCoupon) {
    await recordCouponLead({
      coupon: appliedCoupon,
      email: prospect.email,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
    })
  }
  if (prospect.referralCode) {
    try {
      await recordReferralLead({
        email: prospect.email,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        referralCode: prospect.referralCode,
      })
    } catch {
      // Referral tracking should never block trial registration.
    }
  }
  const lifecycleEmailStatus = await sendTrialWelcomeEmail(prospect.email, {
    dashboardUrl: `${appUrl}/dashboard`,
    firstName: prospect.firstName,
    planName: plan.name,
    trialEndsAt,
  })

  const priceId = getPlanPriceId(plan, prospect.billingCycle)
  let checkoutUrl: string | null = null
  let checkoutSessionId: string | null = null

  if (!appliedCoupon && hasStripeCheckoutConfig(priceId)) {
    try {
      const session = await createStripeCheckoutSession({
        cancelUrl: `${appUrl}/register?plan=${plan.slug}`,
        customerEmail: prospect.email,
        metadata: {
          email: prospect.email,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          billingCycle: prospect.billingCycle,
          planSlug: plan.slug,
          referralCode: prospect.referralCode ?? "",
          source: "trial_registration",
          studioName: prospect.studioName ?? "",
          termsAcceptedAt,
          termsVersion: "2026-07-06",
        },
        phone: prospect.phone,
        priceId: priceId!,
        successUrl: `${appUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
        trialDays: plan.trialDays,
      })

      checkoutUrl = session.url
      checkoutSessionId = session.id
    } catch (error) {
      await updateTrialRegistrationExternalStatus(subscriberRecord, {
        autoresponderStatus,
      })

      return NextResponse.json({
        autoresponderStatus,
        lifecycleEmailStatus,
        error: error instanceof Error ? error.message : "Stripe Checkout failed",
        message: "Registration was captured, but Stripe Checkout could not be created.",
        registration,
        subscriberRecord,
      }, { status: 502 })
    }
  }

  await updateTrialRegistrationExternalStatus(subscriberRecord, {
    autoresponderStatus,
    checkoutSessionId,
  })

  const response = NextResponse.json({
    autoresponderStatus,
    checkoutSessionId,
    checkoutUrl,
    lifecycleEmailStatus,
    message: checkoutUrl
      ? "Trial registered. Continue to Stripe to activate billing."
      : appliedCoupon
        ? `Coupon applied. Your free ${plan.name} access is ready through ${trialEndsAt.toLocaleDateString()}.`
      : "Trial registered. Stripe price ids are not configured yet.",
    registration,
    subscriberRecord,
  })

  response.cookies.set("photoviewpro_trial_signup", JSON.stringify({
    email: prospect.email,
    planSlug: plan.slug,
    referralCode: prospect.referralCode || null,
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
