import { NextResponse } from "next/server"
import Stripe from "stripe"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"
import { getPrismaClient } from "@/lib/db"
import {
  recordOperationalEvent,
  resolveOperationalEventByFingerprint,
} from "@/lib/operational-monitoring"
import { stripeWebhookStaleBefore } from "@/lib/operational-health-rules"
import { assertPhotoStorageConfigured } from "@/lib/photo-storage"
import { getStripeConfigSummary } from "@/lib/stripe-config"

const STRIPE_QUANTITY_VERIFICATION_FINGERPRINT = "health:stripe-website-quantity-verification"
const STRIPE_READ_CONCURRENCY = 5
const STRIPE_READ_ATTEMPTS = 3

function isAuthorized(request: Request) {
  return hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET])
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function stripeReadFailure(error: unknown) {
  const candidate = error as {
    code?: unknown
    statusCode?: unknown
    type?: unknown
  }
  const statusCode = typeof candidate?.statusCode === "number" ? candidate.statusCode : null
  const errorType = typeof candidate?.type === "string" ? candidate.type.slice(0, 80) : "unknown"
  const errorCode = typeof candidate?.code === "string" ? candidate.code.slice(0, 80) : null
  const retryable = statusCode === 409
    || statusCode === 429
    || (statusCode !== null && statusCode >= 500)
    || ["StripeAPIError", "StripeConnectionError", "StripeRateLimitError"].includes(errorType)

  return { errorCode, errorType, retryable, statusCode }
}

async function retrieveStripeSubscription(stripeClient: Stripe, subscriptionId: string) {
  let lastError: unknown
  for (let attempt = 1; attempt <= STRIPE_READ_ATTEMPTS; attempt += 1) {
    try {
      return await stripeClient.subscriptions.retrieve(subscriptionId)
    } catch (error) {
      lastError = error
      const failure = stripeReadFailure(error)
      if (!failure.retryable || attempt === STRIPE_READ_ATTEMPTS) throw error
      await wait(100 * (2 ** (attempt - 1)))
    }
  }
  throw lastError
}

async function mapWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += concurrency) {
    await Promise.all(items.slice(index, index + concurrency).map(task))
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrismaClient()
  const now = new Date()
  const since = new Date(now.getTime() - 60 * 60 * 1000)
  const [failedDeletionJobs, failedEmails, failedWebhookEvents, staleWebhookEvents, activeWebsiteCounts, websiteSubscriptions] = await Promise.all([
    prisma.storageDeletionJob.count({ where: { status: "FAILED" } }),
    prisma.emailAutomationDelivery.count({
      where: { status: "FAILED", updatedAt: { gte: since } },
    }),
    prisma.stripeWebhookEvent.count({ where: { status: "FAILED" } }),
    prisma.stripeWebhookEvent.count({
      where: { status: "PROCESSING", updatedAt: { lt: stripeWebhookStaleBefore(now) } },
    }),
    prisma.website.groupBy({
      _count: { _all: true },
      by: ["workspaceId"],
      where: { billingType: "ADD_ON", deletedAt: null, status: "ACTIVE" },
    }),
    prisma.subscription.findMany({
      select: {
        additionalWebsiteQuantity: true,
        additionalWebsiteStripeItemId: true,
        additionalWebsiteStripeSubscriptionId: true,
        stripeSubscriptionId: true,
        workspaceId: true,
      },
    }),
  ])
  const checks: Record<string, "degraded" | "healthy"> = {}

  try {
    assertPhotoStorageConfigured()
    checks.storageConfiguration = "healthy"
    await resolveOperationalEventByFingerprint("health:storage-configuration")
  } catch (error) {
    checks.storageConfiguration = "degraded"
    await recordOperationalEvent({
      category: "STORAGE",
      fingerprint: "health:storage-configuration",
      message: error instanceof Error ? error.message : "Photo storage configuration is incomplete.",
      severity: "CRITICAL",
      source: "health-check",
    })
  }

  if (failedDeletionJobs > 0) {
    checks.storageCleanup = "degraded"
    await recordOperationalEvent({
      category: "STORAGE",
      fingerprint: "health:storage-cleanup",
      message: `${failedDeletionJobs} storage cleanup job${failedDeletionJobs === 1 ? " is" : "s are"} waiting for intervention.`,
      metadata: { failedDeletionJobs },
      severity: failedDeletionJobs >= 3 ? "CRITICAL" : "WARNING",
      source: "health-check",
    })
  } else {
    checks.storageCleanup = "healthy"
    await resolveOperationalEventByFingerprint("health:storage-cleanup")
  }

  if (failedEmails > 0) {
    checks.email = "degraded"
    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: "health:email-delivery",
      message: `${failedEmails} lifecycle email${failedEmails === 1 ? " has" : "s have"} failed in the last hour.`,
      metadata: { failedEmails },
      severity: failedEmails >= 5 ? "CRITICAL" : "WARNING",
      source: "health-check",
    })
  } else {
    checks.email = "healthy"
    await resolveOperationalEventByFingerprint("health:email-delivery")
  }

  const stripe = getStripeConfigSummary()
  if (stripe.isLiveReady || stripe.isTestReady) {
    checks.billing = "healthy"
    await resolveOperationalEventByFingerprint("health:billing-configuration")
  } else {
    checks.billing = "degraded"
    await recordOperationalEvent({
      category: "BILLING",
      fingerprint: "health:billing-configuration",
      message: "Stripe keys, webhook verification, or plan prices are incomplete or mismatched.",
      metadata: { missingItems: stripe.missingRequired.length },
      severity: "CRITICAL",
      source: "health-check",
    })
  }

  const unhealthyWebhookEvents = failedWebhookEvents + staleWebhookEvents
  if (unhealthyWebhookEvents > 0) {
    checks.billingWebhooks = "degraded"
    await recordOperationalEvent({
      category: "BILLING",
      fingerprint: "health:stripe-webhooks",
      message: `${unhealthyWebhookEvents} Stripe webhook event${unhealthyWebhookEvents === 1 ? " requires" : "s require"} attention.`,
      metadata: { failedWebhookEvents, staleWebhookEvents },
      severity: unhealthyWebhookEvents >= 3 || staleWebhookEvents > 0 ? "CRITICAL" : "WARNING",
      source: "health-check",
    })
  } else {
    checks.billingWebhooks = "healthy"
    await resolveOperationalEventByFingerprint("health:stripe-webhooks")
  }

  const activeQuantityByWorkspace = new Map(activeWebsiteCounts.map((entry) => [entry.workspaceId, entry._count._all]))
  const billedQuantityByWorkspace = new Map(websiteSubscriptions.map((entry) => [entry.workspaceId, entry.additionalWebsiteQuantity]))
  const subscriptionsWithWebsiteBilling = websiteSubscriptions.filter((entry) => (
    entry.additionalWebsiteQuantity > 0
    || Boolean(entry.additionalWebsiteStripeItemId)
    || Boolean(entry.additionalWebsiteStripeSubscriptionId)
  ))
  const websiteBillingWorkspaceIds = new Set([
    ...activeQuantityByWorkspace.keys(),
    ...subscriptionsWithWebsiteBilling.map((entry) => entry.workspaceId),
  ])
  const stripeQuantityByWorkspace = new Map<string, number | null>()
  const stripeVerificationFailures: Array<{
    errorCode: string | null
    errorType: string
    statusCode: number | null
    workspaceId: string
  }> = []
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (stripeKey && websiteBillingWorkspaceIds.size > 0) {
    const stripeClient = new Stripe(stripeKey, { apiVersion: "2026-08-26.dahlia" })
    await mapWithConcurrency([...websiteBillingWorkspaceIds], STRIPE_READ_CONCURRENCY, async (workspaceId) => {
      const subscription = websiteSubscriptions.find((entry) => entry.workspaceId === workspaceId)
      const stripeSubscriptionId = subscription?.additionalWebsiteStripeSubscriptionId ?? subscription?.stripeSubscriptionId
      if (!stripeSubscriptionId) {
        stripeQuantityByWorkspace.set(workspaceId, 0)
        return
      }
      try {
        const remoteSubscription = await retrieveStripeSubscription(stripeClient, stripeSubscriptionId)
        const item = remoteSubscription.items.data.find((candidate) => candidate.id === subscription?.additionalWebsiteStripeItemId)
          ?? remoteSubscription.items.data.find((candidate) => new Set([
            process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID,
            process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID,
          ]).has(candidate.price.id))
        stripeQuantityByWorkspace.set(workspaceId, item?.quantity ?? 0)
      } catch (error) {
        const failure = stripeReadFailure(error)
        if (failure.statusCode === 404) {
          stripeQuantityByWorkspace.set(workspaceId, 0)
          return
        }
        stripeQuantityByWorkspace.set(workspaceId, null)
        stripeVerificationFailures.push({
          errorCode: failure.errorCode,
          errorType: failure.errorType,
          statusCode: failure.statusCode,
          workspaceId,
        })
      }
    })
  }
  const websiteBillingMismatches = [...websiteBillingWorkspaceIds].flatMap((workspaceId) => {
    const activeQuantity = activeQuantityByWorkspace.get(workspaceId) ?? 0
    const billedQuantity = billedQuantityByWorkspace.get(workspaceId) ?? 0
    const stripeQuantity = stripeQuantityByWorkspace.get(workspaceId)
    const matchesLocal = activeQuantity === billedQuantity
    const matchesStripe = stripeQuantity === undefined || stripeQuantity === null || stripeQuantity === billedQuantity
    return matchesLocal && matchesStripe ? [] : [{ activeQuantity, billedQuantity, stripeQuantity, workspaceId }]
  })
  if (websiteBillingMismatches.length > 0) {
    checks.websiteBilling = "degraded"
    await recordOperationalEvent({
      category: "BILLING",
      fingerprint: "health:additional-website-quantity",
      message: `${websiteBillingMismatches.length} account${websiteBillingMismatches.length === 1 ? " has" : "s have"} a mismatch between active additional websites and the Stripe-synchronized billing quantity.`,
      metadata: {
        mismatchCount: websiteBillingMismatches.length,
        mismatches: JSON.stringify(websiteBillingMismatches),
      },
      severity: "CRITICAL",
      source: "health-check",
    })
  } else {
    checks.websiteBilling = "healthy"
    await resolveOperationalEventByFingerprint("health:additional-website-quantity")
  }

  if (stripeVerificationFailures.length > 0) {
    checks.websiteBillingVerification = "degraded"
    await recordOperationalEvent({
      category: "BILLING",
      fingerprint: STRIPE_QUANTITY_VERIFICATION_FINGERPRINT,
      message: `Stripe quantity verification was temporarily unavailable for ${stripeVerificationFailures.length} additional website account${stripeVerificationFailures.length === 1 ? "" : "s"}. Local billing reconciliation still ran.`,
      metadata: {
        failureCount: stripeVerificationFailures.length,
        failures: JSON.stringify(stripeVerificationFailures),
      },
      severity: "WARNING",
      source: "health-check",
    })
  } else {
    checks.websiteBillingVerification = "healthy"
    await resolveOperationalEventByFingerprint(STRIPE_QUANTITY_VERIFICATION_FINGERPRINT)
  }

  return NextResponse.json({ checks, ok: Object.values(checks).every((status) => status === "healthy") })
}

export async function POST(request: Request) {
  return GET(request)
}
