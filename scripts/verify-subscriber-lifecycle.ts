import assert from "node:assert/strict"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import { getPrismaClient } from "@/lib/db"
import { validateMagicLoginToken, verifyMagicLoginToken } from "@/lib/magic-login"
import {
  deleteManagedPhotoObject,
  getPhotoDeliveryUrl,
  uploadPhotoObject,
} from "@/lib/photo-storage"
import { getPlanPriceId, getSubscriberPlan } from "@/lib/plans"
import { findSubscriberAccessByEmail } from "@/lib/subscriber-access"
import {
  persistTrialRegistration,
  updateTrialRegistrationExternalStatus,
  type PersistedTrialRegistration,
} from "@/lib/subscriber-onboarding"
import { evaluateSubscriptionAccess } from "@/lib/subscription-access-rules"
import {
  cancelStripeSubscriptionAtPeriodEnd,
  createStripeCheckoutSession,
  createStripePortalSession,
} from "@/lib/stripe-rest"
import { fulfillStripeWebhookEvent } from "@/lib/stripe-webhook-fulfillment"

type JsonRecord = Record<string, unknown>

const TEST_PREFIX = "qa-lifecycle"
const encoder = new TextEncoder()

function pass(message: string) {
  console.log(`  PASS  ${message}`)
}

function requireTestEnvironment() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
  if (!stripeKey.startsWith("sk_test_")) {
    throw new Error("Lifecycle verification requires a Stripe sk_test_ key and will not run against live mode.")
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.")
  if ((process.env.PHOTO_STORAGE_PROVIDER ?? "r2").trim().toLowerCase() !== "r2") {
    throw new Error("Lifecycle verification requires PHOTO_STORAGE_PROVIDER=r2.")
  }

  for (const name of [
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_ACCOUNT_ID",
    "CLOUDFLARE_R2_BUCKET",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  ]) {
    if (!process.env[name]) throw new Error(`${name} is required.`)
  }
}

async function stripeRequest(path: string, init: { body?: URLSearchParams; method?: string } = {}) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    body: init.body,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(init.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    method: init.method ?? "GET",
  })
  const result = await response.json().catch(() => ({})) as JsonRecord
  if (!response.ok) {
    const error = typeof result.error === "object" && result.error ? result.error as JsonRecord : null
    throw new Error(typeof error?.message === "string" ? error.message : `Stripe returned HTTP ${response.status}.`)
  }
  return result
}

function stripeSubscriptionEvent(subscription: JsonRecord) {
  return {
    data: { object: subscription },
    type: "customer.subscription.updated",
  }
}

async function cleanupDatabase(emailAddresses: string[], workspaceIds: string[]) {
  const prisma = getPrismaClient()
  if (workspaceIds.length > 0) {
    await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } })
    await prisma.operationalEvent.deleteMany({ where: { workspaceId: { in: workspaceIds } } })
    await prisma.emailAutomationDelivery.deleteMany({ where: { workspaceId: { in: workspaceIds } } })
    await prisma.cancellationSurvey.deleteMany({ where: { workspaceId: { in: workspaceIds } } })
  }
  await prisma.magicLoginToken.deleteMany({ where: { email: { in: emailAddresses } } })
  await prisma.trialSignup.deleteMany({ where: { email: { in: emailAddresses } } })
  await prisma.emailAutomationDelivery.deleteMany({ where: { email: { in: emailAddresses } } })
  await prisma.cancellationSurvey.deleteMany({ where: { email: { in: emailAddresses } } })
  await prisma.user.deleteMany({ where: { email: { in: emailAddresses } } })
}

async function main() {
  requireTestEnvironment()

  const prisma = getPrismaClient()
  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`
  const ownerEmail = `${TEST_PREFIX}+owner-${runId}@example.com`
  const neighborEmail = `${TEST_PREFIX}+neighbor-${runId}@example.com`
  const emails = [ownerEmail, neighborEmail]
  const workspaceIds: string[] = []
  let checkoutSessionId: string | null = null
  let stripeCustomerId: string | null = null
  let r2Reference: string | null = null
  const originalPlanPriceIds = new Map<string, string | null>()

  const starter = getSubscriberPlan("starter")
  const growth = getSubscriberPlan("growth")
  const starterPriceId = getPlanPriceId(starter, "monthly")
  const growthPriceId = getPlanPriceId(growth, "monthly")
  assert.ok(starterPriceId, "Starter monthly Stripe price is configured.")
  assert.ok(growthPriceId, "Growth monthly Stripe price is configured.")

  for (const slug of [starter.slug, growth.slug]) {
    const plan = await prisma.plan.findUnique({ select: { stripePriceId: true }, where: { slug } })
    originalPlanPriceIds.set(slug, plan?.stripePriceId ?? null)
  }

  console.log(`PhotoViewPro subscriber lifecycle verification (${runId})`)
  console.log("  Test mode only. All generated Stripe, database, and R2 records will be removed.")

  try {
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + starter.trialDays * 24 * 60 * 60 * 1000)
    const registration = await persistTrialRegistration({
      acceptableUseAcceptedAt: now,
      acceptableUseVersion: "lifecycle-test",
      initialStatus: "INCOMPLETE",
      plan: starter,
      prospect: {
        billingCycle: "monthly",
        email: ownerEmail,
        firstName: "Lifecycle",
        lastName: "Owner",
        marketingConsent: false,
        planSlug: starter.slug,
        studioName: `Lifecycle Owner ${runId}`,
      },
      termsAcceptedAt: now,
      termsVersion: "lifecycle-test",
      trialEndsAt,
      trialStartedAt: now,
    })
    assert.equal(registration.persisted, true)
    const ownerRegistration = registration as PersistedTrialRegistration
    workspaceIds.push(ownerRegistration.workspaceId)
    pass("trial registration creates an isolated subscriber workspace")

    const neighborTrialEndsAt = new Date(now.getTime() + starter.trialDays * 24 * 60 * 60 * 1000)
    const neighbor = await persistTrialRegistration({
      acceptableUseAcceptedAt: now,
      acceptableUseVersion: "lifecycle-test",
      initialStatus: "TRIALING",
      plan: starter,
      prospect: {
        billingCycle: "monthly",
        email: neighborEmail,
        firstName: "Lifecycle",
        lastName: "Neighbor",
        marketingConsent: false,
        planSlug: starter.slug,
        studioName: `Lifecycle Neighbor ${runId}`,
      },
      termsAcceptedAt: now,
      termsVersion: "lifecycle-test",
      trialEndsAt: neighborTrialEndsAt,
      trialStartedAt: now,
    })
    assert.equal(neighbor.persisted, true)
    const neighborRegistration = neighbor as PersistedTrialRegistration
    workspaceIds.push(neighborRegistration.workspaceId)

    const checkout = await createStripeCheckoutSession({
      cancelUrl: "https://photoviewpro.com/register?qa=canceled",
      customerEmail: ownerEmail,
      metadata: {
        billingCycle: "monthly",
        email: ownerEmail,
        planSlug: starter.slug,
        source: "subscriber_lifecycle_verifier",
        workspaceId: ownerRegistration.workspaceId,
      },
      priceId: starterPriceId,
      successUrl: "https://photoviewpro.com/register/success?session_id={CHECKOUT_SESSION_ID}",
      trialDays: starter.trialDays,
    })
    assert.ok(checkout.id.startsWith("cs_test_"))
    assert.ok(checkout.url?.startsWith("https://checkout.stripe.com/"))
    checkoutSessionId = checkout.id
    await updateTrialRegistrationExternalStatus(ownerRegistration, { checkoutSessionId })
    pass("registration creates a real Stripe test Checkout session")

    const customer = await stripeRequest("/customers", {
      body: new URLSearchParams({
        email: ownerEmail,
        "invoice_settings[default_payment_method]": "pm_card_visa",
        name: "Lifecycle Owner",
        payment_method: "pm_card_visa",
        "metadata[qaRunId]": runId,
        "metadata[source]": "subscriber_lifecycle_verifier",
      }),
      method: "POST",
    })
    stripeCustomerId = String(customer.id)

    const stripeSubscription = await stripeRequest("/subscriptions", {
      body: new URLSearchParams({
        customer: stripeCustomerId,
        "items[0][price]": starterPriceId,
        "metadata[billingCycle]": "monthly",
        "metadata[email]": ownerEmail,
        "metadata[planSlug]": starter.slug,
        "metadata[qaRunId]": runId,
        "metadata[source]": "subscriber_lifecycle_verifier",
        trial_period_days: String(starter.trialDays),
      }),
      method: "POST",
    })
    assert.equal(stripeSubscription.status, "trialing")
    const stripeSubscriptionId = String(stripeSubscription.id)

    const checkoutFulfillment = await fulfillStripeWebhookEvent({
      data: {
        object: {
          customer: stripeCustomerId,
          customer_details: { email: ownerEmail },
          id: checkoutSessionId,
          metadata: { billingCycle: "monthly", email: ownerEmail, planSlug: starter.slug },
          subscription: stripeSubscriptionId,
          subscription_data: { trial_end: stripeSubscription.trial_end },
        },
      },
      type: "checkout.session.completed",
    })
    assert.equal(checkoutFulfillment.persisted, true)

    const trialFulfillment = await fulfillStripeWebhookEvent({
      data: { object: stripeSubscription },
      type: "customer.subscription.created",
    })
    assert.equal(trialFulfillment.persisted, true)
    let storedSubscription = await prisma.subscription.findUniqueOrThrow({
      include: { plan: true, workspace: true },
      where: { id: ownerRegistration.subscriptionId },
    })
    assert.equal(storedSubscription.status, "TRIALING")
    assert.equal(storedSubscription.plan.slug, starter.slug)
    assert.equal(storedSubscription.workspace.storageLimitBytes, BigInt(starter.storageLimitBytes))
    assert.equal(evaluateSubscriptionAccess(storedSubscription).mode, "write")
    pass("signed-up trial receives the correct plan, storage, and write entitlement")

    const ownerGallery = await prisma.gallery.create({
      data: {
        name: "Lifecycle Portfolio",
        slug: "lifecycle-portfolio",
        workspaceId: ownerRegistration.workspaceId,
      },
    })
    const neighborGallery = await prisma.gallery.create({
      data: {
        name: "Lifecycle Portfolio",
        slug: "lifecycle-portfolio",
        workspaceId: neighborRegistration.workspaceId,
      },
    })
    const ownerScopedGallery = await prisma.gallery.findUnique({
      where: {
        workspaceId_slug: {
          slug: neighborGallery.slug,
          workspaceId: ownerRegistration.workspaceId,
        },
      },
    })
    assert.equal(ownerScopedGallery?.id, ownerGallery.id)
    assert.notEqual(ownerScopedGallery?.id, neighborGallery.id)
    assert.equal(await prisma.gallery.count({ where: { id: neighborGallery.id, workspaceId: ownerRegistration.workspaceId } }), 0)
    pass("identical portfolio slugs remain tenant-isolated")

    const magicToken = randomBytes(32).toString("base64url")
    await prisma.magicLoginToken.create({
      data: {
        email: ownerEmail,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        tokenHash: createHash("sha256").update(magicToken).digest("hex"),
        userId: ownerRegistration.userId,
      },
    })
    assert.equal((await validateMagicLoginToken(magicToken))?.workspaceId, ownerRegistration.workspaceId)
    assert.equal((await verifyMagicLoginToken(magicToken))?.workspaceId, ownerRegistration.workspaceId)
    assert.equal(await verifyMagicLoginToken(magicToken), null)
    pass("magic login tokens are workspace-scoped, single-use, and expire safely")

    const probeBody = encoder.encode(`PhotoViewPro lifecycle probe ${runId}`)
    const storedObject = await uploadPhotoObject({
      addRandomSuffix: false,
      body: probeBody,
      contentType: "text/plain",
      pathname: `${TEST_PREFIX}/${runId}/probe.txt`,
    })
    r2Reference = storedObject.url
    assert.equal(storedObject.provider, "r2")
    const deliveryUrl = await getPhotoDeliveryUrl(storedObject.url, { expiresIn: 60 })
    const delivered = await fetch(deliveryUrl)
    assert.equal(delivered.status, 200)
    assert.equal(await delivered.text(), new TextDecoder().decode(probeBody))
    pass("R2 accepts private objects and serves them through short-lived signed URLs")

    const subscriptionItems = stripeSubscription.items as JsonRecord
    const firstItem = Array.isArray(subscriptionItems.data) ? subscriptionItems.data[0] as JsonRecord : null
    assert.ok(firstItem?.id)
    const upgradedStripeSubscription = await stripeRequest(`/subscriptions/${stripeSubscriptionId}`, {
      body: new URLSearchParams({
        "items[0][id]": String(firstItem.id),
        "items[0][price]": growthPriceId,
        proration_behavior: "none",
        trial_end: "now",
      }),
      method: "POST",
    })
    const upgradeFulfillment = await fulfillStripeWebhookEvent(stripeSubscriptionEvent(upgradedStripeSubscription))
    assert.equal(upgradeFulfillment.persisted, true)
    storedSubscription = await prisma.subscription.findUniqueOrThrow({
      include: { plan: true, workspace: true },
      where: { id: ownerRegistration.subscriptionId },
    })
    assert.equal(storedSubscription.plan.slug, growth.slug)
    assert.equal(storedSubscription.workspace.storageLimitBytes, BigInt(growth.storageLimitBytes))
    assert.equal(storedSubscription.status, "ACTIVE")
    pass("Stripe plan changes update the local plan, storage entitlement, and paid status")

    const latestInvoiceId = typeof upgradedStripeSubscription.latest_invoice === "string"
      ? upgradedStripeSubscription.latest_invoice
      : null
    assert.ok(latestInvoiceId, "Stripe created an invoice when the trial converted.")
    const paidInvoice = await stripeRequest(`/invoices/${latestInvoiceId}`)
    assert.equal(paidInvoice.status, "paid")
    const paymentFulfillment = await fulfillStripeWebhookEvent({
      data: { object: paidInvoice },
      type: "invoice.payment_succeeded",
    })
    assert.equal(paymentFulfillment.persisted, true)
    storedSubscription = await prisma.subscription.findUniqueOrThrow({
      include: { plan: true, workspace: true },
      where: { id: ownerRegistration.subscriptionId },
    })
    assert.equal(storedSubscription.status, "ACTIVE")
    assert.equal(evaluateSubscriptionAccess(storedSubscription).mode, "write")
    pass("a paid invoice converts the trial to an active subscriber")

    const access = await findSubscriberAccessByEmail(ownerEmail)
    assert.equal(access?.workspaceId, ownerRegistration.workspaceId)
    assert.equal(access?.subscriptionStatus, "ACTIVE")

    const portal = await createStripePortalSession({
      customerId: stripeCustomerId,
      returnUrl: "https://photoviewpro.com/account",
    })
    assert.ok(portal.id.startsWith("bps_"))
    assert.ok(portal.url.startsWith("https://billing.stripe.com/"))
    pass("the subscriber can open Stripe's secure billing portal")

    const scheduledCancellation = await cancelStripeSubscriptionAtPeriodEnd(stripeSubscriptionId) as JsonRecord
    const cancellationFulfillment = await fulfillStripeWebhookEvent(stripeSubscriptionEvent({
      ...scheduledCancellation,
      status: "active",
      trial_end: null,
    }))
    assert.equal(cancellationFulfillment.persisted, true)
    storedSubscription = await prisma.subscription.findUniqueOrThrow({
      include: { plan: true, workspace: true },
      where: { id: ownerRegistration.subscriptionId },
    })
    assert.equal(storedSubscription.cancelAtPeriodEnd, true)
    assert.equal(storedSubscription.status, "ACTIVE")
    pass("cancellation can be scheduled without ending paid access early")

    const canceledStripeSubscription = await stripeRequest(`/subscriptions/${stripeSubscriptionId}`, { method: "DELETE" })
    const deletedFulfillment = await fulfillStripeWebhookEvent({
      data: { object: canceledStripeSubscription },
      type: "customer.subscription.deleted",
    })
    assert.equal(deletedFulfillment.persisted, true)
    storedSubscription = await prisma.subscription.findUniqueOrThrow({
      include: { plan: true, workspace: true },
      where: { id: ownerRegistration.subscriptionId },
    })
    assert.equal(storedSubscription.status, "CANCELED")
    assert.equal(evaluateSubscriptionAccess(storedSubscription).mode, "read-only")
    pass("ended subscriptions become read-only while retained work remains available")

    console.log("Subscriber lifecycle verification passed.")
  } finally {
    const cleanupErrors: unknown[] = []

    if (r2Reference) {
      try {
        await deleteManagedPhotoObject(r2Reference)
      } catch (error) {
        cleanupErrors.push(error)
      }
    }
    if (checkoutSessionId) {
      try {
        await stripeRequest(`/checkout/sessions/${checkoutSessionId}/expire`, { method: "POST" })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!/already expired|complete session/i.test(message)) cleanupErrors.push(error)
      }
    }
    if (stripeCustomerId) {
      try {
        await stripeRequest(`/customers/${stripeCustomerId}`, { method: "DELETE" })
      } catch (error) {
        cleanupErrors.push(error)
      }
    }
    try {
      await cleanupDatabase(emails, workspaceIds)
      for (const [slug, stripePriceId] of originalPlanPriceIds) {
        await prisma.plan.updateMany({ data: { stripePriceId }, where: { slug } })
      }
    } catch (error) {
      cleanupErrors.push(error)
    }
    await prisma.$disconnect()

    if (cleanupErrors.length > 0) {
      console.error("Lifecycle verification cleanup needs attention:")
      cleanupErrors.forEach((error) => console.error(`  ${error instanceof Error ? error.message : String(error)}`))
      process.exitCode = 1
    } else {
      console.log("  CLEAN  Stripe, database, and R2 test artifacts removed")
    }
  }
}

main().catch((error) => {
  console.error(`Subscriber lifecycle verification failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  process.exitCode = 1
})
