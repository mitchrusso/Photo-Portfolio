import { NextResponse } from "next/server"
import { z } from "zod"
import { autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { cleanCouponCode, recordCouponLead, validateCouponCode } from "@/lib/coupons"
import { getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { recordReferralLead } from "@/lib/referrals"
import { sendTrialWelcomeEmail } from "@/lib/lifecycle-email"
import {
  findExistingSubscriberRegistration,
  persistTrialRegistration,
  updateTrialRegistrationExternalStatus,
} from "@/lib/subscriber-onboarding"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"
import { getAppUrl } from "@/lib/app-url"

const trialRegistrationSchema = z.object({
  couponCode: z.string().trim().optional().or(z.literal("")),
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().min(7).optional().or(z.literal("")),
  planSlug: z.enum(["starter", "growth", "studio", "premier"]).default("starter"),
  billingCycle: z.enum(["monthly", "annual"]).default("annual"),
  referralCode: z.string().trim().optional().or(z.literal("")),
  studioName: z.string().trim().optional().or(z.literal("")),
  storageRequested: z.string().trim().optional().or(z.literal("")),
  termsAccepted: z.literal(true),
  website: z.string().trim().optional().or(z.literal("")),
  marketingConsent: z.boolean().default(false),
})

export async function POST(request: Request) {
  const parsed = trialRegistrationSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details", issues: parsed.error.flatten() }, { status: 400 })
  }

  const prospect = parsed.data
  const existingSubscriber = await findExistingSubscriberRegistration(prospect.email)
  const canResumeIncompleteCheckout = existingSubscriber?.status === "INCOMPLETE" && !existingSubscriber.stripeCustomerId

  if (existingSubscriber && !canResumeIncompleteCheckout) {
    return NextResponse.json({
      error: "Subscriber account already exists",
      message: "An account already exists for this email. Sign in to manage the trial, plan, payment method, or cancellation.",
    }, { status: 409 })
  }
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
  const priceId = getPlanPriceId(plan, prospect.billingCycle)
  const requiresCheckout = !appliedCoupon && hasStripeCheckoutConfig(priceId)

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
      initialStatus: requiresCheckout ? "INCOMPLETE" : "TRIALING",
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
    console.error("Trial subscriber record creation failed", error)
    return NextResponse.json({
      error: "Registration could not be saved. Please try again.",
    }, { status: 500 })
  }

  const autoresponderStatus = await notifyAutoresponder({
    addTags: [
      autoresponderTags.trialRegistered,
      ...(requiresCheckout ? [autoresponderTags.checkoutPending] : [autoresponderTags.trial]),
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
  const lifecycleEmailStatus = requiresCheckout
    ? "deferred_until_checkout"
    : await sendTrialWelcomeEmail(prospect.email, {
        dashboardUrl: `${appUrl}/dashboard`,
        firstName: prospect.firstName,
        planName: plan.name,
        trialEndsAt,
      })

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
          expectedPriceId: priceId ?? "",
          planSlug: plan.slug,
          storageLimitBytes: String(plan.storageLimitBytes),
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
      console.error("Trial Stripe checkout session creation failed", error)
      await updateTrialRegistrationExternalStatus(subscriberRecord, {
        autoresponderStatus,
      })

      return NextResponse.json({
        autoresponderStatus,
        lifecycleEmailStatus,
        error: "Stripe Checkout could not be started. Please try again.",
        message: "Registration was captured, but Stripe Checkout could not be created.",
      }, { status: 502 })
    }
  }

  await updateTrialRegistrationExternalStatus(subscriberRecord, {
    autoresponderStatus,
    checkoutSessionId,
  })

  return NextResponse.json({
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

}
