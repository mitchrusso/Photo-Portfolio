import { NextResponse } from "next/server"

import { getPrismaClient } from "@/lib/db"
import {
  recordOperationalEvent,
  resolveOperationalEventByFingerprint,
} from "@/lib/operational-monitoring"
import { assertPhotoStorageConfigured } from "@/lib/photo-storage"
import { getStripeConfigSummary } from "@/lib/stripe-config"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prisma = getPrismaClient()
  const since = new Date(Date.now() - 60 * 60 * 1000)
  const [failedDeletionJobs, failedEmails] = await Promise.all([
    prisma.storageDeletionJob.count({ where: { status: "FAILED" } }),
    prisma.emailAutomationDelivery.count({
      where: { createdAt: { gte: since }, status: "FAILED" },
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

  return NextResponse.json({ checks, ok: Object.values(checks).every((status) => status === "healthy") })
}

export async function POST(request: Request) {
  return GET(request)
}
