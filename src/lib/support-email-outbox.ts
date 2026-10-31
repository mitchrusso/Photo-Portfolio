import { getPrismaClient } from "@/lib/db"
import { createEmailUnsubscribeToken } from "@/lib/email-unsubscribe-token"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import {
  escapeSupportEmailHtml,
  supportEmailLayout,
} from "@/lib/support-email-branding"
import { sendSupportGmail, verifySupportGmailSentMessage } from "@/lib/support-gmail"

const MAX_DELIVERY_ATTEMPTS = 8
const PROCESSING_LEASE_MS = 10 * 60 * 1000
const DELIVERY_CHECK_INTERVAL_MS = 5 * 60 * 1000
const DELIVERY_CHECK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const GMAIL_BOUNCE_WINDOW_MS = 30 * 60 * 1000
const OPT_OUT_SOURCES = new Set(["checkout_completion_nudge"])

export const supportReportStatuses = ["ANSWERED", "FIXED", "RECEIVED", "AWAITING_APPROVAL"] as const
export type SupportReportStatus = typeof supportReportStatuses[number]

export type QueueSupportEmailInput = {
  brandKey?: "photoview"
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

function supportEmailHtml(body: string, unsubscribeUrl?: string) {
  const content = body
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;white-space:pre-wrap">${escapeSupportEmailHtml(paragraph)}</p>`)
    .join("")
  const preferences = unsubscribeUrl
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#726b60;">You received this because you asked PhotoView.io to send checkout reminders. <a href="${escapeSupportEmailHtml(unsubscribeUrl)}" style="color:#5f574c;text-decoration:underline;">Unsubscribe from enrollment reminders and product education</a>.</p>`
    : ""
  return supportEmailLayout(`${content}${preferences}`, body.split(/\n+/)[0])
}

function prepareDelivery(candidate: { body: string; source: string; toEmail: string }) {
  if (!OPT_OUT_SOURCES.has(candidate.source)) {
    return { body: candidate.body, html: supportEmailHtml(candidate.body) }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io").replace(/\/+$/, "")
  const token = createEmailUnsubscribeToken(candidate.toEmail)
  const unsubscribeUrl = `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}`
  return {
    body: `${candidate.body}\n\nUnsubscribe from enrollment reminders and product education: ${unsubscribeUrl}`,
    html: supportEmailHtml(candidate.body, unsubscribeUrl),
  }
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

  let replyContext: { providerThreadId: string | null; rfcMessageId: string | null } | null = null
  if (input.reportId) {
    const report = await prisma.subscriberFeedbackReport.findUnique({ select: { id: true }, where: { id: input.reportId } })
    if (!report) throw new Error("The feedback report does not exist.")
    replyContext = await prisma.supportCaseMessage.findFirst({
      orderBy: { receivedAt: "desc" },
      select: { providerThreadId: true, rfcMessageId: true },
      where: { direction: "INBOUND", reportId: input.reportId },
    })
  }

  let queued
  try {
    queued = await prisma.supportEmailOutbox.create({
      data: {
        body: clean(input.body, 12_000),
        brandKey: input.brandKey ?? "photoview",
        deliveryKey,
        gmailThreadId: replyContext?.providerThreadId ?? null,
        inReplyTo: replyContext?.rfcMessageId ?? null,
        recipientName: input.recipientName ? clean(input.recipientName, 120) : null,
        reportId: input.reportId || null,
        resolutionNote: input.resolutionNote ? clean(input.resolutionNote, 2_000) : null,
        source: clean(input.source, 120),
        subject: clean(input.subject, 240),
        targetReportStatus: input.targetReportStatus || null,
        toEmail: input.toEmail.trim().toLowerCase().slice(0, 320),
      },
    })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const duplicate = await prisma.supportEmailOutbox.findUnique({ where: { deliveryKey } })
      if (duplicate) return {
        id: duplicate.id,
        state: ["SENT", "DELIVERED"].includes(duplicate.status) ? "already_sent" as const : "already_queued" as const,
      }
    }
    throw error
  }
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

function gmailProviderMessageId(value: string | null) {
  if (!value) return null
  for (const prefix of ["gmail_sent:", "gmail_sent_verified:", "gmail_no_bounce_verified:"]) {
    if (value.startsWith(prefix)) return value.slice(prefix.length)
  }
  return null
}

export async function reconcileSupportEmailDelivery(options: { limit?: number; now?: Date } = {}) {
  const prisma = getPrismaClient()
  const now = options.now ?? new Date()
  const checkCutoff = new Date(now.getTime() - DELIVERY_CHECK_INTERVAL_MS)
  const sentCutoff = new Date(now.getTime() - DELIVERY_CHECK_WINDOW_MS)
  const limit = Math.min(50, Math.max(1, options.limit ?? 20))
  const outcomes: Array<{ id: string; state: string }> = []

  const gmailMessages = await prisma.supportEmailOutbox.findMany({
    orderBy: { sentAt: "asc" },
    take: limit,
    where: {
      OR: [{ deliveryCheckedAt: null }, { deliveryCheckedAt: { lte: checkCutoff } }],
      providerStatus: { startsWith: "gmail_" },
      sentAt: { gte: sentCutoff },
      status: "SENT",
    },
  })
  for (const message of gmailMessages) {
    const gmailMessageId = gmailProviderMessageId(message.providerStatus)
    if (!gmailMessageId) continue
    try {
      const verification = await verifySupportGmailSentMessage(gmailMessageId)
      if (verification.state === "sent") {
        if (!message.sentAt || message.sentAt.getTime() > now.getTime() - GMAIL_BOUNCE_WINDOW_MS) {
          await prisma.supportEmailOutbox.update({
            data: {
              deliveryCheckedAt: now,
              lastError: null,
              providerStatus: `gmail_sent_verified:${verification.messageId}`,
            },
            where: { id: message.id, status: "SENT" },
          })
          outcomes.push({ id: message.id, state: "gmail_sent_verified" })
          continue
        }
        await prisma.$transaction(async (tx) => {
          await tx.supportEmailOutbox.update({
            data: {
              deliveryCheckedAt: now,
              lastError: null,
              providerStatus: `gmail_no_bounce_verified:${verification.messageId}`,
              status: "DELIVERED",
            },
            where: { id: message.id, status: "SENT" },
          })
          if (message.reportId) {
            await tx.subscriberFeedbackReport.update({
              data: message.source === "support_case_acknowledgment"
                ? { acknowledgedAt: now, gmailThreadId: verification.threadId || undefined }
                : {
                    deliveredAt: now,
                    gmailThreadId: verification.threadId || undefined,
                    ...(message.targetReportStatus ? {
                      ...(message.targetReportStatus === "FIXED" ? { fixedAt: now } : {}),
                      lifecycleState: ["ANSWERED", "FIXED"].includes(message.targetReportStatus) ? "RESOLVED" : "DELIVERED",
                      resolutionNote: message.resolutionNote || `Customer response delivered through support outbox ${message.id}.`,
                      resolvedAt: ["ANSWERED", "FIXED"].includes(message.targetReportStatus) ? now : null,
                      status: message.targetReportStatus,
                    } : {}),
                  },
              where: { id: message.reportId },
            })
          }
        })
        await resolveOperationalEventByFingerprint(`support-outbox-gmail-sent:${message.id}`)
        outcomes.push({ id: message.id, state: "gmail_sent_verified" })
        continue
      }

      const reason = verification.state === "missing" ? "GMAIL_MESSAGE_MISSING" : verification.state === "sent_label_missing" ? "GMAIL_SENT_LABEL_MISSING" : "GMAIL_NOT_CONFIGURED"
      await prisma.supportEmailOutbox.update({
        data: { deliveryCheckedAt: now, lastError: reason },
        where: { id: message.id, status: "SENT" },
      })
      await recordOperationalEvent({
        category: "EMAIL",
        fingerprint: `support-outbox-gmail-sent:${message.id}`,
        message: `Support response ${message.id} could not be verified in the support Gmail Sent folder (${reason}).`,
        metadata: { gmailMessageId, reportId: message.reportId, source: message.source },
        severity: "CRITICAL",
        source: "support-email-outbox",
      })
      outcomes.push({ id: message.id, state: reason.toLowerCase() })
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 500) : "gmail_verification_failed"
      await prisma.supportEmailOutbox.update({ data: { deliveryCheckedAt: now, lastError: reason }, where: { id: message.id } })
      outcomes.push({ id: message.id, state: "gmail_verification_failed" })
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return outcomes

  const messages = await prisma.supportEmailOutbox.findMany({
    orderBy: { sentAt: "asc" },
    take: limit,
    where: {
      OR: [{ deliveryCheckedAt: null }, { deliveryCheckedAt: { lte: checkCutoff } }],
      providerStatus: { not: { startsWith: "gmail_" } },
      sentAt: { gte: sentCutoff },
      status: "SENT",
    },
  })
  if (messages.length === 0) return outcomes

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
        await prisma.$transaction(async (tx) => {
          await tx.supportEmailOutbox.update({
            data: { deliveryCheckedAt: now, lastError: null, providerStatus: "DELIVERED", status: "DELIVERED" },
            where: { id: message.id, status: "SENT" },
          })
          if (message.reportId) {
            await tx.subscriberFeedbackReport.update({
              data: message.source === "support_case_acknowledgment"
                ? { acknowledgedAt: now }
                : {
                    deliveredAt: now,
                    ...(message.targetReportStatus ? {
                      ...(message.targetReportStatus === "FIXED" ? { fixedAt: now } : {}),
                      lifecycleState: ["ANSWERED", "FIXED"].includes(message.targetReportStatus) ? "RESOLVED" : "DELIVERED",
                      resolutionNote: message.resolutionNote || `Customer response delivered through support outbox ${message.id}.`,
                      resolvedAt: ["ANSWERED", "FIXED"].includes(message.targetReportStatus) ? now : null,
                      status: message.targetReportStatus,
                    } : {}),
                  },
              where: { id: message.reportId },
            })
          }
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
    let gmailMessageId: string | null = null
    try {
      const prepared = prepareDelivery(candidate)
      const delivery = await sendSupportGmail({
        body: prepared.body,
        deliveryKey: candidate.deliveryKey,
        inReplyTo: candidate.inReplyTo,
        html: prepared.html,
        threadId: candidate.gmailThreadId,
        subject: candidate.subject,
        to: candidate.toEmail,
      })
      gmailMessageId = delivery.messageId
      providerStatus = delivery.state
    } catch (error) {
      providerStatus = error instanceof Error ? error.message.slice(0, 500) : "gmail_failed"
      console.error("Support outbox delivery threw", error)
    }

    if (providerStatus === "sent") {
      await prisma.$transaction(async (tx) => {
        await tx.supportEmailOutbox.update({
          data: { lastError: null, processingStartedAt: null, providerStatus: `gmail_sent:${gmailMessageId}`, sentAt: now, status: "SENT" },
          where: { id: candidate.id },
        })
        if (candidate.reportId) {
          await tx.subscriberFeedbackReport.update({
            data: candidate.source === "support_case_acknowledgment"
              ? { responseAcceptedAt: now }
              : { lifecycleState: "RESPONSE_ACCEPTED", responseAcceptedAt: now },
            where: { id: candidate.reportId },
          })
        }
      })
      await resolveOperationalEventByFingerprint(`support-outbox:${candidate.id}`)
      if (candidate.source === "feedback_bug_fixed" && candidate.reportId) {
        await resolveOperationalEventByFingerprint(`feedback:repair-dispatch:${candidate.reportId}`)
      }
      outcomes.push({ id: candidate.id, state: "sent" })
      continue
    }

    const terminal = attemptCount >= MAX_DELIVERY_ATTEMPTS
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
