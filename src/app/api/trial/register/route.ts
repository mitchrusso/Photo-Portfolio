import { NextResponse } from "next/server"
import { z } from "zod"
import { autoresponderAudiences, autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { cleanCouponCode, recordCouponLead, validateCouponCode } from "@/lib/coupons"
import { getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { recordReferralLead } from "@/lib/referrals"
import { sendTrialWelcomeEmail } from "@/lib/lifecycle-email"
import {
  CouponUnavailableError,
  findExistingSubscriberRegistration,
  persistTrialRegistration,
  updateTrialRegistrationExternalStatus,
} from "@/lib/subscriber-onboarding"
import { createStripeCheckoutSession, hasStripeCheckoutConfig } from "@/lib/stripe-rest"
import { getAppUrl } from "@/lib/app-url"
import { recordOperationalEvent } from "@/lib/operational-monitoring"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { getSubscriberRegistrationReadiness } from "@/lib/subscriber-registration-config"
import { SUBSCRIBER_LICENSE_VERSION } from "@/lib/subscriber-license"

const trialRegistrationSchema = z.object({
  acceptableUseAccepted: z.literal(true),
  couponCode: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().max(320),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
  planSlug: z.enum(["starter", "growth", "studio", "premier"]).default("starter"),
  billingCycle: z.enum(["monthly", "annual"]).default("annual"),
  referralCode: z.string().trim().max(100).optional().or(z.literal("")),
  studioName: z.string().trim().max(120).optional().or(z.literal("")),
  storageRequested: z.string().trim().max(1_000).optional().or(z.literal("")),
  subscriberLicenseAccepted: z.literal(true),
  termsAccepted: z.literal(true),
  website: z.string().trim().max(2_048).optional().or(z.literal("")),
  marketingConsent: z.boolean().default(false),
})

export async function POST(request: Request) {
  const rateLimit = await checkRequestRateLimit(`trial-register:${requestClientKey(request)}`, 8, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many registration attempts.",
        message: "Please wait a few minutes before trying to register again.",
      },
      {
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        status: 429,
      },
    )
  }

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
  const acceptableUseAcceptedAt = trialStartedAt.toISOString()
  const subscriberLicenseAcceptedAt = trialStartedAt.toISOString()
  const termsAcceptedAt = trialStartedAt.toISOString()
  const trialEndsAt = new Date(trialStartedAt)
  trialEndsAt.setDate(trialEndsAt.getDate() + (appliedCoupon?.freeDays ?? plan.trialDays))
  const priceId = getPlanPriceId(plan, prospect.billingCycle)
  const readiness = getSubscriberRegistrationReadiness({
    couponApplied: Boolean(appliedCoupon),
    priceId,
  })

  if (!readiness.ready) {
    await recordOperationalEvent({
      category: "BILLING",
      fingerprint: "registration:configuration",
      message: `Subscriber registration is unavailable because required services are missing: ${readiness.missing.join(", ")}.`,
      metadata: { missingItems: readiness.missing.join(", "), planSlug: plan.slug },
      severity: "CRITICAL",
      source: "/api/trial/register",
    })
    return NextResponse.json({
      error: "Subscriber registration is temporarily unavailable.",
      message: "We cannot securely create your trial right now. Please try again shortly.",
    }, { status: 503 })
  }

  const requiresCheckout = !appliedCoupon && hasStripeCheckoutConfig(priceId)

  const registration = {
    ...prospect,
    planSlug: plan.slug,
    planName: plan.name,
    couponCode: appliedCoupon?.code ?? null,
    referralCode: prospect.referralCode || null,
    storageLimitBytes: plan.storageLimitBytes,
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    acceptableUseAcceptedAt,
    acceptableUseVersion: "2026-07-06",
    subscriberLicenseAcceptedAt,
    subscriberLicenseSignerName: `${prospect.firstName.trim()} ${prospect.lastName.trim()}`,
    subscriberLicenseVersion: SUBSCRIBER_LICENSE_VERSION,
    termsAcceptedAt,
    termsVersion: "2026-07-06",
  }

  let subscriberRecord

  try {
    subscriberRecord = await persistTrialRegistration({
      acceptableUseAcceptedAt: trialStartedAt,
      acceptableUseVersion: "2026-07-06",
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
      subscriberLicenseAcceptedAt: trialStartedAt,
      subscriberLicenseSignerName: `${prospect.firstName.trim()} ${prospect.lastName.trim()}`,
      subscriberLicenseVersion: SUBSCRIBER_LICENSE_VERSION,
      termsAcceptedAt: trialStartedAt,
      termsVersion: "2026-07-06",
    })
  } catch (error) {
    if (error instanceof CouponUnavailableError) {
      return NextResponse.json({
        error: "Invalid coupon code",
        message: "That coupon code has reached its redemption limit. Please choose another plan or coupon.",
      }, { status: 409 })
    }

    console.error("Trial subscriber record creation failed", error)
    await recordOperationalEvent({
      category: "AUTH",
      fingerprint: "registration:persistence",
      message: error instanceof Error ? error.message : "Trial subscriber record creation failed",
      metadata: { planSlug: plan.slug },
      severity: "CRITICAL",
      source: "/api/trial/register",
    })
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
    list: autoresponderAudiences.trial,
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
          acceptableUseAcceptedAt,
          acceptableUseVersion: "2026-07-06",
          subscriberLicenseAcceptedAt,
          subscriberLicenseSignerName: `${prospect.firstName.trim()} ${prospect.lastName.trim()}`,
          subscriberLicenseVersion: SUBSCRIBER_LICENSE_VERSION,
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
      await recordOperationalEvent({
        category: "BILLING",
        fingerprint: "registration:stripe-checkout",
        message: error instanceof Error ? error.message : "Trial Stripe checkout session creation failed",
        metadata: { billingCycle: prospect.billingCycle, planSlug: plan.slug },
        severity: "CRITICAL",
        source: "/api/trial/register",
        workspaceId: subscriberRecord.persisted ? subscriberRecord.workspaceId : null,
      })
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
      : "Trial registered.",
    registration,
    subscriberRecord,
  })

}
