import { getPrismaClient } from "@/lib/db"
import { sendTransactionalEmail } from "@/lib/email-delivery-health"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

const MAX_DELIVERY_ATTEMPTS = 8
const PROCESSING_LEASE_MS = 10 * 60 * 1000
const DELIVERY_CHECK_INTERVAL_MS = 5 * 60 * 1000
const DELIVERY_CHECK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export const supportReportStatuses = ["ANSWERED", "FIXED", "RECEIVED", "AWAITING_APPROVAL"] as const
export type SupportReportStatus = typeof supportReportStatuses[number]

export type QueueSupportEmailInput = {
  body: string
  deliveryKey: string
  recipientName?: string | null
  reportId?: string | null
  resolutionNote?: string | null
  source: string
  subject: string
  targetReportStatus?: SupportReportStatus | null
  toEmail: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function supportEmailHtml(body: string) {
  const content = body
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;white-space:pre-wrap">${escapeHtml(paragraph)}</p>`)
    .join("")
  return `<!doctype html><html><body style="margin:0;background:#f7f4ef;color:#1f211e;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dfd6c8;border-radius:12px"><tr><td style="padding:28px 30px 10px;color:#b98225;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">PhotoView.io</td></tr><tr><td style="padding:12px 30px 22px;font-size:16px;line-height:1.65;color:#34342f">${content}</td></tr></table></td></tr></table></body></html>`
}

function clean(value: string, max: number) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max)
}

export async function queueSupportEmail(input: QueueSupportEmailInput) {
  const prisma = getPrismaClient()
  const deliveryKey = clean(input.deliveryKey, 240)
  if (!deliveryKey) throw new Error("A support email delivery key is required.")
  const existing = await prisma.supportEmailOutbox.findUnique({ where: { deliveryKey } })
  if (existing) return {
    id: existing.id,
    state: ["SENT", "DELIVERED"].includes(existing.status) ? "already_sent" as const : "already_queued" as const,
  }

  if (input.reportId) {
    const report = await prisma.subscriberFeedbackReport.findUnique({ select: { id: true }, where: { id: input.reportId } })
    if (!report) throw new Error("The feedback report does not exist.")
  }

  const queued = await prisma.supportEmailOutbox.create({
    data: {
      body: clean(input.body, 12_000),
      deliveryKey,
      recipientName: input.recipientName ? clean(input.recipientName, 120) : null,
      reportId: input.reportId || null,
      resolutionNote: input.resolutionNote ? clean(input.resolutionNote, 2_000) : null,
      source: clean(input.source, 120),
      subject: clean(input.subject, 240),
      targetReportStatus: input.targetReportStatus || null,
      toEmail: input.toEmail.trim().toLowerCase().slice(0, 320),
    },
  })
  return { id: queued.id, state: "queued" as const }
}

function retryAt(attemptCount: number, now: Date) {
  const minutes = Math.min(6 * 60, 2 ** Math.max(0, attemptCount - 1) * 5)
  return new Date(now.getTime() + minutes * 60 * 1000)
}

function normalizeResendStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : null
}

const terminalDeliveryStatuses = new Set(["bounced", "canceled", "complained", "failed", "suppressed"])

export async function reconcileSupportEmailDelivery(options: { limit?: number; now?: Date } = {}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return []

  const prisma = getPrismaClient()
  const now = options.now ?? new Date()
  const checkCutoff = new Date(now.getTime() - DELIVERY_CHECK_INTERVAL_MS)
  const sentCutoff = new Date(now.getTime() - DELIVERY_CHECK_WINDOW_MS)
  const messages = await prisma.supportEmailOutbox.findMany({
    orderBy: { sentAt: "asc" },
    take: Math.min(50, Math.max(1, options.limit ?? 20)),
    where: {
      OR: [{ deliveryCheckedAt: null }, { deliveryCheckedAt: { lte: checkCutoff } }],
      sentAt: { gte: sentCutoff },
      status: "SENT",
    },
  })
  if (messages.length === 0) return []

  const attempts = await prisma.emailDeliveryAttempt.findMany({
    orderBy: { createdAt: "desc" },
    select: { providerMessageId: true, requestId: true },
    where: {
      providerMessageId: { not: null },
      requestId: { in: messages.map((message) => message.deliveryKey) },
      status: "SENT",
    },
  })
  const providerIdByKey = new Map<string, string>()
  for (const attempt of attempts) {
    if (attempt.providerMessageId && !providerIdByKey.has(attempt.requestId)) {
      providerIdByKey.set(attempt.requestId, attempt.providerMessageId)
    }
  }

  const outcomes: Array<{ id: string; state: string }> = []
  for (const message of messages) {
    const providerMessageId = providerIdByKey.get(message.deliveryKey)
    if (!providerMessageId) {
      await prisma.supportEmailOutbox.update({ data: { deliveryCheckedAt: now }, where: { id: message.id } })
      outcomes.push({ id: message.id, state: "provider_id_pending" })
      continue
    }

    try {
      const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(providerMessageId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const body = await response.json().catch(() => null) as { last_event?: unknown } | null
      if (!response.ok) {
        await prisma.supportEmailOutbox.update({ data: { deliveryCheckedAt: now }, where: { id: message.id } })
        outcomes.push({ id: message.id, state: `check_http_${response.status}` })
        continue
      }

      const providerStatus = normalizeResendStatus(body?.last_event) || "unknown"
      if (providerStatus === "delivered") {
        await prisma.supportEmailOutbox.update({
          data: { deliveryCheckedAt: now, lastError: null, providerStatus: "DELIVERED", status: "DELIVERED" },
          where: { id: message.id, status: "SENT" },
        })
        await resolveOperationalEventByFingerprint(`support-outbox:${message.id}`)
        outcomes.push({ id: message.id, state: "delivered" })
        continue
      }

      if (terminalDeliveryStatuses.has(providerStatus)) {
        await prisma.supportEmailOutbox.update({
          data: { deliveryCheckedAt: now, lastError: providerStatus.toUpperCase(), providerStatus: providerStatus.toUpperCase(), status: "FAILED" },
          where: { id: message.id, status: "SENT" },
        })
        await recordOperationalEvent({
          category: "EMAIL",
          fingerprint: `support-outbox:${message.id}`,
          message: `Customer support email ${message.id} reached terminal provider status ${providerStatus}.`,
          metadata: { reportId: message.reportId, source: message.source },
          severity: "CRITICAL",
          source: "support-email-outbox",
        })
        outcomes.push({ id: message.id, state: "failed" })
        continue
      }

      await prisma.supportEmailOutbox.update({
        data: { deliveryCheckedAt: now, providerStatus },
        where: { id: message.id, status: "SENT" },
      })
      outcomes.push({ id: message.id, state: providerStatus })
    } catch (error) {
      console.error("Support outbox delivery reconciliation threw", error)
      await prisma.supportEmailOutbox.update({ data: { deliveryCheckedAt: now }, where: { id: message.id } })
      outcomes.push({ id: message.id, state: "check_failed" })
    }
  }

  return outcomes
}

export async function deliverSupportEmailOutbox(options: { limit?: number; now?: Date } = {}) {
  const prisma = getPrismaClient()
  const now = options.now ?? new Date()
  const leaseCutoff = new Date(now.getTime() - PROCESSING_LEASE_MS)
  const candidates = await prisma.supportEmailOutbox.findMany({
    orderBy: { createdAt: "asc" },
    take: Math.min(50, Math.max(1, options.limit ?? 20)),
    where: {
      OR: [
        { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
        { processingStartedAt: { lte: leaseCutoff }, status: "PROCESSING" },
      ],
    },
  })

  const outcomes: Array<{ id: string; state: string }> = []
  for (const candidate of candidates) {
    const claimed = await prisma.supportEmailOutbox.updateMany({
      data: { attemptCount: { increment: 1 }, lastError: null, processingStartedAt: now, status: "PROCESSING" },
      where: { id: candidate.id, status: candidate.status, updatedAt: candidate.updatedAt },
    })
    if (claimed.count !== 1) continue

    const attemptCount = candidate.attemptCount + 1
    let providerStatus: string
    try {
      providerStatus = await sendTransactionalEmail({
        html: supportEmailHtml(candidate.body),
        replyTo: process.env.SUPPORT_EMAIL?.trim() || "support@photoview.io",
        subject: candidate.subject,
        text: candidate.body,
        to: candidate.toEmail,
      }, {
        idempotencyKey: candidate.deliveryKey,
        messageType: "support_response",
      })
    } catch (error) {
      providerStatus = "failed"
      console.error("Support outbox delivery threw", error)
    }

    if (providerStatus === "sent") {
      await prisma.$transaction(async (tx) => {
        await tx.supportEmailOutbox.update({
          data: { lastError: null, processingStartedAt: null, providerStatus, sentAt: now, status: "SENT" },
          where: { id: candidate.id },
        })
        if (candidate.reportId && candidate.targetReportStatus) {
          await tx.subscriberFeedbackReport.update({
            data: {
              ...(candidate.targetReportStatus === "FIXED" ? { fixedAt: now } : {}),
              resolutionNote: candidate.resolutionNote || `Customer response sent through support outbox ${candidate.id}.`,
              status: candidate.targetReportStatus,
            },
            where: { id: candidate.reportId },
          })
        }
      })
      await resolveOperationalEventByFingerprint(`support-outbox:${candidate.id}`)
      outcomes.push({ id: candidate.id, state: "sent" })
      continue
    }

    const terminal = attemptCount >= MAX_DELIVERY_ATTEMPTS || providerStatus === "suppressed"
    await prisma.supportEmailOutbox.update({
      data: {
        lastError: providerStatus,
        nextAttemptAt: retryAt(attemptCount, now),
        processingStartedAt: null,
        providerStatus,
        status: terminal ? "FAILED" : "RETRY",
      },
      where: { id: candidate.id },
    })
    if (terminal) {
      await recordOperationalEvent({
        category: "EMAIL",
        fingerprint: `support-outbox:${candidate.id}`,
        message: `Customer support email ${candidate.id} could not be delivered after ${attemptCount} attempts (${providerStatus}).`,
        metadata: { attemptCount, reportId: candidate.reportId, source: candidate.source },
        severity: "CRITICAL",
        source: "support-email-outbox",
      })
    }
    outcomes.push({ id: candidate.id, state: terminal ? "failed" : "retry" })
  }

  const reconciled = await reconcileSupportEmailDelivery({ limit: options.limit, now })
  return [...outcomes, ...reconciled]
}
