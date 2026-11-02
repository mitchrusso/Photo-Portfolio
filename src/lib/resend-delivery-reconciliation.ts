import { getPrismaClient } from "@/lib/db"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import {
  resendApiDeliveryStatus,
  shouldSuppressRecipientForDeliveryStatus,
} from "@/lib/resend-delivery-policy"

const RECONCILIATION_DELAY_MS = 5 * 60 * 1000
const RECONCILIATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const RECENT_WEBHOOK_WINDOW_MS = 15 * 60 * 1000
const TERMINAL_DELIVERY_STATUSES = new Set(["BOUNCED", "COMPLAINED", "FAILED", "SUPPRESSED"])

export async function reconcileResendDeliveryReceipts(options: { limit?: number; now?: Date } = {}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || !process.env.DATABASE_URL) return { checked: 0, confirmed: 0, failed: 0, pending: 0 }

  const prisma = getPrismaClient()
  const now = options.now ?? new Date()
  const recentMatchedWebhook = await prisma.emailDeliveryWebhookEvent.findFirst({
    select: { webhookId: true },
    where: {
      matchedAttempts: { gt: 0 },
      receivedAt: { gte: new Date(now.getTime() - RECENT_WEBHOOK_WINDOW_MS) },
    },
  })
  if (recentMatchedWebhook) {
    await resolveOperationalEventByFingerprint("email:resend:reconciliation")
    return { checked: 0, confirmed: 0, failed: 0, pending: 0 }
  }

  const candidates = await prisma.emailDeliveryAttempt.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      providerMessageId: true,
      recipientHash: true,
    },
    take: Math.min(100, Math.max(1, options.limit ?? 50)),
    where: {
      createdAt: {
        gte: new Date(now.getTime() - RECONCILIATION_WINDOW_MS),
        lte: new Date(now.getTime() - RECONCILIATION_DELAY_MS),
      },
      deliveryStatus: null,
      providerMessageId: { not: null },
      status: "SENT",
    },
  })

  const outcomes = { checked: 0, confirmed: 0, failed: 0, pending: 0 }
  for (const candidate of candidates) {
    if (!candidate.providerMessageId) continue
    outcomes.checked += 1
    try {
      const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(candidate.providerMessageId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!response.ok) {
        outcomes.failed += 1
        continue
      }

      const body = await response.json().catch(() => null) as { last_event?: unknown } | null
      const deliveryStatus = resendApiDeliveryStatus(body?.last_event)
      if (!deliveryStatus) {
        outcomes.pending += 1
        continue
      }

      await prisma.$transaction(async (transaction) => {
        await transaction.emailDeliveryAttempt.updateMany({
          data: { deliveryStatus, deliveryUpdatedAt: now },
          where: { deliveryStatus: null, id: candidate.id },
        })
        if (shouldSuppressRecipientForDeliveryStatus(deliveryStatus)) {
          await transaction.emailSuppression.upsert({
            create: { reason: deliveryStatus, recipientHash: candidate.recipientHash, source: "resend_reconciliation" },
            update: { reason: deliveryStatus, source: "resend_reconciliation" },
            where: { recipientHash: candidate.recipientHash },
          })
        }
      })

      if (TERMINAL_DELIVERY_STATUSES.has(deliveryStatus)) {
        await recordOperationalEvent({
          category: "EMAIL",
          fingerprint: `email:delivery:${candidate.id}`,
          message: `An automated email reached terminal delivery status ${deliveryStatus}.`,
          metadata: { attemptId: candidate.id, deliveryStatus },
          severity: "ERROR",
          source: "resend-delivery-reconciliation",
        })
      } else {
        await resolveOperationalEventByFingerprint(`email:delivery:${candidate.id}`)
      }
      outcomes.confirmed += 1
    } catch {
      outcomes.failed += 1
    }
  }

  if (candidates.length > 0 && outcomes.failed === candidates.length) {
    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: "email:resend:reconciliation",
      message: "PhotoView could not retrieve automated-email delivery receipts from Resend.",
      metadata: { checked: outcomes.checked, failed: outcomes.failed },
      severity: "WARNING",
      source: "resend-delivery-reconciliation",
    })
  } else if (outcomes.checked > 0) {
    await resolveOperationalEventByFingerprint("email:resend:reconciliation")
  }

  return outcomes
}
