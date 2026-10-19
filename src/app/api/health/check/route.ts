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

function isAuthorized(request: Request) {
  return hasAuthorizedBearerSecret(request, [process.env.CRON_SECRET])
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
  const websiteBillingWorkspaceIds = new Set([...activeQuantityByWorkspace.keys(), ...billedQuantityByWorkspace.keys()])
  const stripeQuantityByWorkspace = new Map<string, number | null>()
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (stripeKey && websiteBillingWorkspaceIds.size > 0) {
    const stripeClient = new Stripe(stripeKey, { apiVersion: "2026-08-26.dahlia" })
    await Promise.all([...websiteBillingWorkspaceIds].map(async (workspaceId) => {
      const subscription = websiteSubscriptions.find((entry) => entry.workspaceId === workspaceId)
      const stripeSubscriptionId = subscription?.additionalWebsiteStripeSubscriptionId ?? subscription?.stripeSubscriptionId
      if (!stripeSubscriptionId) {
        stripeQuantityByWorkspace.set(workspaceId, 0)
        return
      }
      try {
        const remoteSubscription = await stripeClient.subscriptions.retrieve(stripeSubscriptionId)
        const item = remoteSubscription.items.data.find((candidate) => candidate.id === subscription?.additionalWebsiteStripeItemId)
          ?? remoteSubscription.items.data.find((candidate) => new Set([
            process.env.STRIPE_ADDITIONAL_WEBSITE_MONTHLY_PRICE_ID,
            process.env.STRIPE_ADDITIONAL_WEBSITE_ANNUAL_PRICE_ID,
          ]).has(candidate.price.id))
        stripeQuantityByWorkspace.set(workspaceId, item?.quantity ?? 0)
      } catch {
        stripeQuantityByWorkspace.set(workspaceId, null)
      }
    }))
  }
  const websiteBillingMismatches = [...websiteBillingWorkspaceIds].flatMap((workspaceId) => {
    const activeQuantity = activeQuantityByWorkspace.get(workspaceId) ?? 0
    const billedQuantity = billedQuantityByWorkspace.get(workspaceId) ?? 0
    const stripeQuantity = stripeQuantityByWorkspace.get(workspaceId)
    const matchesLocal = activeQuantity === billedQuantity
    const matchesStripe = stripeQuantity === undefined || (stripeQuantity !== null && stripeQuantity === billedQuantity)
    return matchesLocal && matchesStripe ? [] : [{ activeQuantity, billedQuantity, stripeQuantity: stripeQuantity ?? "unavailable", workspaceId }]
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

  return NextResponse.json({ checks, ok: Object.values(checks).every((status) => status === "healthy") })
}

export async function POST(request: Request) {
  return GET(request)
}
