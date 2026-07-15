import { createHash } from "node:crypto"

import { getPrismaClient } from "@/lib/db"
import {
  CRITICAL_ALERT_COOLDOWN_MS,
  criticalAlertCooldownElapsed,
  stripeWebhookStaleBefore,
} from "@/lib/operational-health-rules"
import { assertPhotoStorageConfigured, getPhotoStorageProvider } from "@/lib/photo-storage"
import { getStripeConfigSummary } from "@/lib/stripe-config"

export type OperationalCategory = "AI" | "AUTH" | "BILLING" | "EMAIL" | "STORAGE" | "SYSTEM" | "UPLOAD"
export type OperationalSeverity = "CRITICAL" | "ERROR" | "INFO" | "WARNING"
export type OperationalServiceStatus = "DEGRADED" | "HEALTHY" | "OUTAGE"

type RecordOperationalEventInput = {
  category: OperationalCategory
  fingerprint?: string
  message: string
  metadata?: Record<string, boolean | number | string | null | undefined>
  severity: OperationalSeverity
  source: string
  workspaceId?: string | null
}

function safeMessage(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 1000) || "Operational failure"
}

function cleanMetadata(value: Record<string, boolean | number | string | null | undefined> | undefined) {
  if (!value) return undefined
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .slice(0, 24)
      .map(([key, item]) => [key.slice(0, 80), typeof item === "string" ? item.slice(0, 500) : item]),
  )
}

function eventFingerprint(input: RecordOperationalEventInput) {
  if (input.fingerprint?.trim()) return input.fingerprint.trim().slice(0, 190)
  return createHash("sha256")
    .update([input.category, input.source, input.workspaceId ?? "platform", safeMessage(input.message)].join("|"))
    .digest("hex")
}

function adminAlertRecipients() {
  return Array.from(new Set(
    (process.env.ADMIN_ALERT_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ))
}

async function sendCriticalAlert(input: RecordOperationalEventInput, eventId: string, now: Date) {
  if (process.env.VERCEL_ENV !== "production") return false
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL
  const recipients = adminAlertRecipients()
  if (!apiKey || !from || recipients.length === 0) {
    console.error(JSON.stringify({
      level: "error",
      message: "Operational alert email is not configured",
    }))
    return false
  }

  const adminUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io").replace(/\/+$/, "")}/admin?tab=health`
  const message = safeMessage(input.message)

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        subject: `[PhotoViewPro] ${input.category} incident`,
        text: `${message}\n\nSource: ${input.source}\nSeverity: ${input.severity}\nIncident: ${eventId}\n\nReview system health: ${adminUrl}`,
        to: recipients,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `operational-alert:${eventId}:${Math.floor(now.getTime() / CRITICAL_ALERT_COOLDOWN_MS)}`,
      },
      method: "POST",
    })
    if (!response.ok) {
      console.error(JSON.stringify({ level: "error", message: "Operational alert email failed", status: response.status }))
      return false
    }
    return true
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      level: "error",
      message: "Operational alert email failed",
    }))
    return false
  }
}

export async function recordOperationalEvent(input: RecordOperationalEventInput) {
  const message = safeMessage(input.message)
  const fingerprint = eventFingerprint(input)
  const now = new Date()

  console.error(JSON.stringify({
    category: input.category,
    fingerprint,
    level: input.severity === "INFO" ? "info" : input.severity.toLowerCase(),
    message,
    source: input.source,
    workspaceId: input.workspaceId ?? null,
  }))

  if (!process.env.DATABASE_URL) return null

  try {
    const prisma = getPrismaClient()
    const event = await prisma.operationalEvent.upsert({
      create: {
        category: input.category,
        fingerprint,
        firstOccurredAt: now,
        lastOccurredAt: now,
        message,
        metadata: cleanMetadata(input.metadata),
        severity: input.severity,
        source: input.source,
        workspaceId: input.workspaceId ?? null,
      },
      update: {
        lastOccurredAt: now,
        message,
        metadata: cleanMetadata(input.metadata),
        occurrenceCount: { increment: 1 },
        resolvedAt: null,
        severity: input.severity,
        status: "OPEN",
        workspaceId: input.workspaceId ?? null,
      },
      where: { fingerprint },
    })

    const shouldAlert = input.severity === "CRITICAL" && criticalAlertCooldownElapsed(event.lastAlertedAt, now)
    if (shouldAlert) {
      const claimed = await prisma.operationalEvent.updateMany({
        data: { lastAlertedAt: now },
        where: {
          id: event.id,
          OR: [
            { lastAlertedAt: null },
            { lastAlertedAt: { lte: new Date(now.getTime() - CRITICAL_ALERT_COOLDOWN_MS) } },
          ],
        },
      })
      if (claimed.count === 1) {
        const delivered = await sendCriticalAlert(input, event.id, now)
        if (!delivered) {
          await prisma.operationalEvent.updateMany({
            data: { lastAlertedAt: event.lastAlertedAt },
            where: { id: event.id, lastAlertedAt: now },
          })
        }
      }
    }

    return event
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      level: "error",
      message: "Operational event persistence failed",
      source: input.source,
    }))
    return null
  }
}

export async function resolveOperationalEventByFingerprint(fingerprint: string) {
  if (!process.env.DATABASE_URL) return
  await getPrismaClient().operationalEvent.updateMany({
    data: { resolvedAt: new Date(), status: "RESOLVED" },
    where: { fingerprint, status: "OPEN" },
  })
}

export async function resolveOperationalEventsByFingerprintPrefix(fingerprintPrefix: string) {
  if (!process.env.DATABASE_URL) return
  await getPrismaClient().operationalEvent.updateMany({
    data: { resolvedAt: new Date(), status: "RESOLVED" },
    where: { fingerprint: { startsWith: fingerprintPrefix }, status: "OPEN" },
  })
}

export async function resolveOperationalEventById(id: string) {
  return getPrismaClient().operationalEvent.update({
    data: { resolvedAt: new Date(), status: "RESOLVED" },
    where: { id },
  })
}

export async function getSubscriberServiceNotice() {
  if (!process.env.DATABASE_URL) return null
  const recentCutoff = new Date(Date.now() - 60 * 60 * 1000)
  const criticalCount = await getPrismaClient().operationalEvent.count({
    where: {
      lastOccurredAt: { gte: recentCutoff },
      severity: "CRITICAL",
      status: "OPEN",
      workspaceId: null,
    },
  })
  return criticalCount > 0
    ? "Some PhotoViewPro services are experiencing delays. Your stored photographs remain safe; please retry the action shortly."
    : null
}

export async function getOperationalHealthSummary() {
  const prisma = getPrismaClient()
  const now = new Date()
  const since24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const [events, failedDeletionJobs, failedEmails, failedWebhookEvents, staleWebhookEvents] = await Promise.all([
    prisma.operationalEvent.findMany({
      include: { workspace: { select: { name: true } } },
      orderBy: { lastOccurredAt: "desc" },
      take: 100,
    }),
    prisma.storageDeletionJob.count({ where: { status: "FAILED" } }),
    prisma.emailAutomationDelivery.count({
      where: { status: "FAILED", updatedAt: { gte: since24Hours } },
    }),
    prisma.stripeWebhookEvent.count({ where: { status: "FAILED" } }),
    prisma.stripeWebhookEvent.count({
      where: { status: "PROCESSING", updatedAt: { lt: stripeWebhookStaleBefore(now) } },
    }),
  ])
  const stripe = getStripeConfigSummary()
  let storageConfigured = true
  try {
    assertPhotoStorageConfigured()
  } catch {
    storageConfigured = false
  }
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL))
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  const openEvents = events.filter((event) => event.status === "OPEN")
  const criticalCount = openEvents.filter((event) => event.severity === "CRITICAL").length
  const warningCount = openEvents.filter((event) => ["ERROR", "WARNING"].includes(event.severity)).length
  const status: OperationalServiceStatus = criticalCount > 0
    ? "OUTAGE"
    : warningCount > 0 || failedDeletionJobs > 0 || failedEmails > 0 || failedWebhookEvents > 0 || staleWebhookEvents > 0 || !storageConfigured || (!stripe.isLiveReady && !stripe.isTestReady)
      ? "DEGRADED"
      : "HEALTHY"

  return {
    criticalCount,
    events: events.map((event) => ({
      category: event.category,
      firstOccurredAt: event.firstOccurredAt.toISOString(),
      id: event.id,
      lastOccurredAt: event.lastOccurredAt.toISOString(),
      message: event.message,
      occurrenceCount: event.occurrenceCount,
      resolvedAt: event.resolvedAt?.toISOString() ?? null,
      severity: event.severity,
      source: event.source,
      status: event.status,
      workspaceName: event.workspace?.name ?? null,
    })),
    openCount: openEvents.length,
    services: [
      { detail: "Database queries are responding.", key: "database", label: "Database", status: "HEALTHY" as const },
      {
        detail: storageConfigured
          ? `${getPhotoStorageProvider() === "r2" ? "Cloudflare R2" : "Vercel Blob"} configured; ${failedDeletionJobs} failed cleanup jobs.`
          : "Photo storage configuration is incomplete.",
        key: "storage",
        label: "Photo storage",
        status: storageConfigured && failedDeletionJobs === 0 ? "HEALTHY" as const : "DEGRADED" as const,
      },
      {
        detail: `${stripe.isLiveReady ? "Live billing configured." : stripe.isTestReady ? "Stripe test mode is ready." : "Stripe configuration needs attention."} ${failedWebhookEvents} failed and ${staleWebhookEvents} stale webhook events.`,
        key: "billing",
        label: "Billing",
        status: (stripe.isLiveReady || stripe.isTestReady) && failedWebhookEvents === 0 && staleWebhookEvents === 0 ? "HEALTHY" as const : "DEGRADED" as const,
      },
      {
        detail: emailConfigured ? `${failedEmails} failed automation emails in the last 24 hours.` : "Email delivery is not configured.",
        key: "email",
        label: "Email",
        status: emailConfigured && failedEmails === 0 ? "HEALTHY" as const : "DEGRADED" as const,
      },
      {
        detail: aiConfigured ? "Subscriber AI assistance is configured." : "AI assistance configuration is missing.",
        key: "ai",
        label: "AI assistance",
        status: aiConfigured ? "HEALTHY" as const : "DEGRADED" as const,
      },
    ],
    status,
    warningCount,
  }
}
