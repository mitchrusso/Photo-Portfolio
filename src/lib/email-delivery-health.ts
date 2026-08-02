import { createHash, randomUUID } from "node:crypto"

import { getPrismaClient } from "@/lib/db"
import {
  emailRetryDelayMs,
  getEmailQuotaLevel,
  getEmailQuotaLimits,
  getEmailQuotaWindowStarts,
  isRetryableEmailStatus,
} from "@/lib/email-delivery-policy"
import {
  recordOperationalEvent,
  resolveOperationalEventByFingerprint,
  resolveOperationalEventsByFingerprintPrefix,
} from "@/lib/operational-monitoring"

export type TransactionalEmailStatus = "not_configured" | "sent" | "failed"

export type TransactionalEmailPayload = {
  html: string
  preview?: string
  replyTo?: string
  subject: string
  text: string
  to: string
}

export type TransactionalEmailOptions = {
  idempotencyKey?: string
  messageType?: string
}

type AttemptStatus = "FAILED" | "NOT_CONFIGURED" | "RETRYABLE_FAILURE" | "SENT"

const MAX_ATTEMPTS = 3

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL
  return apiKey && from ? { apiKey, from } : null
}

function safeCode(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 120)
    : null
}

function recipientDomain(email: string) {
  const domain = email.trim().toLowerCase().split("@").at(-1)
  return domain?.includes(".") ? domain.slice(0, 190) : null
}

function recipientHash(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}

async function persistAttempt(input: {
  attempt: number
  durationMs: number
  errorCode?: string | null
  httpStatus?: number | null
  messageType: string
  providerMessageId?: string | null
  requestId: string
  status: AttemptStatus
  to: string
}) {
  if (!process.env.DATABASE_URL) return

  try {
    await getPrismaClient().emailDeliveryAttempt.create({
      data: {
        attempt: input.attempt,
        durationMs: input.durationMs,
        errorCode: input.errorCode ?? null,
        httpStatus: input.httpStatus ?? null,
        messageType: input.messageType,
        providerMessageId: input.providerMessageId ?? null,
        recipientDomain: recipientDomain(input.to),
        recipientHash: recipientHash(input.to),
        requestId: input.requestId,
        status: input.status,
      },
    })
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      level: "error",
      message: "Email delivery attempt could not be persisted",
    }))
  }
}

async function updateQuotaIncidents(now = new Date()) {
  if (!process.env.DATABASE_URL) return

  const prisma = getPrismaClient()
  const limits = getEmailQuotaLimits()
  const windows = getEmailQuotaWindowStarts(now)
  const [dailySent, monthlySent] = await Promise.all([
    prisma.emailDeliveryAttempt.count({
      where: { createdAt: { gte: windows.day }, status: "SENT" },
    }),
    prisma.emailDeliveryAttempt.count({
      where: { createdAt: { gte: windows.month }, status: "SENT" },
    }),
  ])

  for (const usage of [
    { fingerprint: "email:quota:daily", label: "daily", limit: limits.daily, sent: dailySent },
    { fingerprint: "email:quota:monthly", label: "monthly", limit: limits.monthly, sent: monthlySent },
  ]) {
    const level = getEmailQuotaLevel(usage.sent, usage.limit)
    if (level === "healthy") {
      await resolveOperationalEventByFingerprint(usage.fingerprint)
      continue
    }

    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: usage.fingerprint,
      message: `Resend ${usage.label} usage is ${usage.sent} of ${usage.limit} configured emails.`,
      metadata: {
        limit: usage.limit,
        percentUsed: Math.round((usage.sent / usage.limit) * 100),
        sent: usage.sent,
      },
      severity: level === "critical" ? "CRITICAL" : "WARNING",
      source: "email-delivery-health",
    })
  }
}

async function wait(delayMs: number) {
  await new Promise((resolve) => setTimeout(resolve, delayMs))
}

export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload,
  options: TransactionalEmailOptions = {},
): Promise<TransactionalEmailStatus> {
  const config = emailConfig()
  const requestId = (options.idempotencyKey?.trim() || `email-${randomUUID()}`).slice(0, 240)
  const messageType = (options.messageType?.trim() || "lifecycle").slice(0, 120)

  if (!config) {
    await persistAttempt({
      attempt: 1,
      durationMs: 0,
      errorCode: "email_not_configured",
      messageType,
      requestId,
      status: "NOT_CONFIGURED",
      to: payload.to,
    })
    await recordOperationalEvent({
      category: "EMAIL",
      fingerprint: "email:resend:not-configured",
      message: "Resend email delivery is not configured.",
      severity: "CRITICAL",
      source: "email-delivery-health",
    })
    return "not_configured"
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now()

    try {
      const response = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
          from: config.from,
          html: payload.html,
          ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
          subject: payload.subject,
          text: payload.text,
          to: payload.to,
        }),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": requestId,
        },
        method: "POST",
      })
      const responseBody = await response.json().catch(() => null) as {
        code?: unknown
        id?: unknown
        name?: unknown
      } | null
      const retryable = isRetryableEmailStatus(response.status)

      if (response.ok) {
        await persistAttempt({
          attempt,
          durationMs: Date.now() - startedAt,
          httpStatus: response.status,
          messageType,
          providerMessageId: typeof responseBody?.id === "string" ? responseBody.id.slice(0, 190) : null,
          requestId,
          status: "SENT",
          to: payload.to,
        })
        const monitoringResults = await Promise.allSettled([
          resolveOperationalEventsByFingerprintPrefix("email:resend:"),
          updateQuotaIncidents(),
        ])
        for (const monitoringResult of monitoringResults) {
          if (monitoringResult.status === "rejected") {
            console.error(
              "[email-delivery] Post-send monitoring update failed:",
              monitoringResult.reason,
            )
          }
        }
        return "sent"
      }

      const errorCode = safeCode(responseBody?.name) ?? safeCode(responseBody?.code) ?? `http_${response.status}`
      await persistAttempt({
        attempt,
        durationMs: Date.now() - startedAt,
        errorCode,
        httpStatus: response.status,
        messageType,
        requestId,
        status: retryable && attempt < MAX_ATTEMPTS ? "RETRYABLE_FAILURE" : "FAILED",
        to: payload.to,
      })

      if (retryable && attempt < MAX_ATTEMPTS) {
        await wait(emailRetryDelayMs(attempt, response.headers.get("retry-after")))
        continue
      }

      await recordOperationalEvent({
        category: "EMAIL",
        fingerprint: `email:resend:${response.status}`,
        message: `Resend rejected a ${messageType} email with HTTP ${response.status}.`,
        metadata: { attempt, errorCode, status: response.status },
        severity: response.status >= 500 || response.status === 429 ? "CRITICAL" : "ERROR",
        source: "email-delivery-health",
      })
      return "failed"
    } catch (error) {
      const errorCode = error instanceof Error ? safeCode(error.name) : "network_error"
      await persistAttempt({
        attempt,
        durationMs: Date.now() - startedAt,
        errorCode,
        messageType,
        requestId,
        status: attempt < MAX_ATTEMPTS ? "RETRYABLE_FAILURE" : "FAILED",
        to: payload.to,
      })

      if (attempt < MAX_ATTEMPTS) {
        await wait(emailRetryDelayMs(attempt))
        continue
      }

      await recordOperationalEvent({
        category: "EMAIL",
        fingerprint: "email:resend:network",
        message: "Resend email delivery failed after three attempts.",
        metadata: { attempt, errorCode },
        severity: "CRITICAL",
        source: "email-delivery-health",
      })
      return "failed"
    }
  }

  return "failed"
}
