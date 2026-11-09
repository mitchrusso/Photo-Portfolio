import { getPrismaClient } from "@/lib/db"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { getSupportBrand } from "@/lib/support-brands"
import { sendSupportGmail, verifySupportGmailSentMessage } from "@/lib/support-gmail"
import { supportOwnerAlertMessage, supportOwnerWatchdogMessage } from "@/lib/support-owner-notification"

const MAX_ATTEMPTS = 8
const LEASE_MS = 10 * 60 * 1000
const A2P_RECHECK_MS = 24 * 60 * 60 * 1000
const A2P_EVENT_FINGERPRINT = "support:sms-a2p-registration-pending"
const A2P_PROVIDER_STATUS = "a2p_registration_pending"
const ESCALATION_SLA_MS = 60 * 60 * 1000

function retryAt(attemptCount: number, now: Date) {
  return new Date(now.getTime() + Math.min(6 * 60, 2 ** Math.max(0, attemptCount - 1) * 5) * 60 * 1000)
}

function twilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim()
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim()
  const to = process.env.SUPPORT_OWNER_SMS_TO?.trim() || process.env.SUPERADMIN_MFA_PHONE_E164?.trim()
  const from = process.env.TWILIO_SUPPORT_ALERT_FROM?.trim()
  const messagingServiceSid = process.env.TWILIO_SUPPORT_MESSAGING_SERVICE_SID?.trim()
  const accountCredential = accountSid && authToken ? { authSecret: authToken, authUser: accountSid } : null
  const apiCredential = apiKeySid && apiKeySecret ? { authSecret: apiKeySecret, authUser: apiKeySid } : null
  const auth = accountCredential ?? apiCredential
  if (!accountSid || !auth || !to || (!from && !messagingServiceSid)) return null
  return { accountSid, ...auth, from, messagingServiceSid, to }
}

async function sendOwnerSms(body: string) {
  const config = twilioCredentials()
  if (!config) throw new Error("PhotoView owner SMS is not configured.")
  const form = new URLSearchParams({ Body: body, To: config.to })
  if (config.messagingServiceSid) form.set("MessagingServiceSid", config.messagingServiceSid)
  else if (config.from) form.set("From", config.from)
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`, {
    body: form,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.authUser}:${config.authSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })
  const result = await response.json().catch(() => null) as { message?: string; sid?: string; status?: string } | null
  if (!response.ok || !result?.sid) throw new Error(`Twilio rejected the owner alert (${response.status}).`)
  return { providerId: result.sid, providerStatus: result.status || "queued" }
}

async function checkOwnerSms(providerId: string) {
  const config = twilioCredentials()
  if (!config) throw new Error("PhotoView owner SMS is not configured.")
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages/${encodeURIComponent(providerId)}.json`,
    { headers: { Authorization: `Basic ${Buffer.from(`${config.authUser}:${config.authSecret}`).toString("base64")}` } },
  )
  const result = await response.json().catch(() => null) as { error_code?: number | null; error_message?: string | null; status?: string } | null
  if (!response.ok) throw new Error(`Twilio delivery verification failed (${response.status}).`)
  return {
    errorCode: result?.error_code ?? null,
    errorMessage: result?.error_message ?? null,
    status: result?.status || "unknown",
  }
}

async function refreshAlertStatus(alertId: string, now: Date) {
  const prisma = getPrismaClient()
  const deliveries = await prisma.supportAlertDelivery.findMany({ where: { alertId } })
  const delivered = deliveries.length > 0 && deliveries.every((item) => ["DELIVERED", "SUPPRESSED"].includes(item.status))
  const failed = deliveries.some((item) => item.status === "FAILED")
  await prisma.supportAlert.update({
    data: {
      completedAt: delivered ? now : null,
      status: delivered ? "COMPLETE" : failed ? "FAILED" : "PENDING",
    },
    where: { id: alertId },
  })
}

export async function deliverSupportAlerts(options: { limit?: number; now?: Date } = {}) {
  const prisma = getPrismaClient()
  const now = options.now ?? new Date()
  const leaseCutoff = new Date(now.getTime() - LEASE_MS)
  const legacyRoutineSms = await prisma.supportAlertDelivery.findMany({
    select: { alertId: true, id: true },
    where: {
      alert: { kind: { not: "WATCHDOG_CRITICAL" } },
      channel: "SMS",
      status: { in: ["PENDING", "RETRY", "PROCESSING", "PAUSED"] },
    },
  })
  if (legacyRoutineSms.length > 0) {
    await prisma.supportAlertDelivery.updateMany({
      data: {
        deliveredAt: now,
        lastError: null,
        processingStartedAt: null,
        providerStatus: "suppressed_by_owner_policy",
        status: "SUPPRESSED",
      },
      where: { id: { in: legacyRoutineSms.map((item) => item.id) } },
    })
    for (const alertId of new Set(legacyRoutineSms.map((item) => item.alertId))) {
      await refreshAlertStatus(alertId, now)
    }
  }
  const candidates = await prisma.supportAlertDelivery.findMany({
    include: {
      alert: {
        include: {
          report: {
            include: {
              attachments: { orderBy: { createdAt: "asc" } },
              messages: {
                orderBy: { receivedAt: "desc" },
                take: 1,
                where: { direction: "INBOUND" },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(50, Math.max(1, options.limit ?? 20)),
    where: {
      OR: [
        { nextAttemptAt: { lte: now }, status: { in: ["PENDING", "RETRY"] } },
        { processingStartedAt: { lte: leaseCutoff }, status: "PROCESSING" },
      ],
    },
  })
  const outcomes: Array<{ channel: string; id: string; state: string }> = []
  for (const candidate of candidates) {
    const claimed = await prisma.supportAlertDelivery.updateMany({
      data: { attemptCount: { increment: 1 }, lastError: null, processingStartedAt: now, status: "PROCESSING" },
      where: { id: candidate.id, status: candidate.status, updatedAt: candidate.updatedAt },
    })
    if (claimed.count !== 1) continue
    const attemptCount = candidate.attemptCount + 1
    try {
      if (candidate.channel === "EMAIL") {
        const brand = getSupportBrand()
        const report = candidate.alert.report
        const ownerMessage = report ? supportOwnerAlertMessage({
          attachments: report.attachments.map((attachment) => ({ filename: attachment.filename, sizeBytes: attachment.sizeBytes })),
          message: report.messages[0]?.body || report.message,
          reporterEmail: report.reporterEmail,
          reporterName: report.reporterName,
          reportId: report.id,
          subject: report.messages[0]?.subject,
          type: report.type,
        }) : await (async () => {
          const escalatedReports = candidate.alert.eventKey.startsWith("support-watchdog:support:escalations-open:")
            ? await prisma.subscriberFeedbackReport.findMany({
                include: {
                  messages: {
                    orderBy: { receivedAt: "desc" },
                    take: 1,
                    where: { direction: "INBOUND" },
                  },
                },
                orderBy: { escalatedAt: "asc" },
                where: {
                  escalatedAt: { lte: new Date(now.getTime() - ESCALATION_SLA_MS) },
                  lifecycleState: "ESCALATED",
                  resolvedAt: null,
                },
              })
            : []
          return supportOwnerWatchdogMessage({
            cases: escalatedReports.map((item) => ({
              message: item.messages[0]?.body || item.message,
              reporterEmail: item.reporterEmail,
              reporterName: item.reporterName,
              reportId: item.id,
              subject: item.messages[0]?.subject,
              type: item.type,
            })),
            summary: candidate.alert.summary,
          })
        })()
        const delivery = await sendSupportGmail({
          attachments: report?.attachments.flatMap((attachment) => attachment.payload
            ? [{ content: attachment.payload, contentType: attachment.contentType, filename: attachment.filename }]
            : []),
          body: ownerMessage.body,
          deliveryKey: `owner-alert:${candidate.alert.eventKey}:email`,
          html: ownerMessage.html,
          subject: ownerMessage.subject,
          to: brand.supportEmail,
        })
        if (delivery.state !== "sent" || !delivery.messageId) throw new Error("Support Gmail owner alert is not configured.")
        const verified = await verifySupportGmailSentMessage(delivery.messageId)
        if (verified.state !== "sent") throw new Error(`Owner alert email verification returned ${verified.state}.`)
        await prisma.supportAlertDelivery.update({
          data: {
            acceptedAt: now,
            deliveredAt: now,
            lastError: null,
            processingStartedAt: null,
            providerId: delivery.messageId,
            providerStatus: `gmail_sent_verified:${verified.threadId ?? delivery.threadId ?? ""}`,
            status: "DELIVERED",
          },
          where: { id: candidate.id },
        })
        outcomes.push({ channel: candidate.channel, id: candidate.id, state: "delivered" })
      } else if (candidate.channel === "SMS") {
        const sms = await sendOwnerSms(`${candidate.alert.summary} ${candidate.alert.adminUrl}`.slice(0, 1500))
        await prisma.supportAlertDelivery.update({
          data: {
            acceptedAt: now,
            lastError: null,
            processingStartedAt: null,
            providerId: sms.providerId,
            providerStatus: sms.providerStatus,
            status: "ACCEPTED",
          },
          where: { id: candidate.id },
        })
        outcomes.push({ channel: candidate.channel, id: candidate.id, state: "accepted" })
      } else {
        throw new Error(`Unsupported owner alert channel ${candidate.channel}.`)
      }
    } catch (error) {
      const terminal = attemptCount >= MAX_ATTEMPTS
      await prisma.supportAlertDelivery.update({
        data: {
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Owner alert delivery failed.",
          nextAttemptAt: retryAt(attemptCount, now),
          processingStartedAt: null,
          status: terminal ? "FAILED" : "RETRY",
        },
        where: { id: candidate.id },
      })
      outcomes.push({ channel: candidate.channel, id: candidate.id, state: terminal ? "failed" : "retry" })
    }
    await refreshAlertStatus(candidate.alertId, now)
  }

  const acceptedSms = await prisma.supportAlertDelivery.findMany({
    orderBy: { acceptedAt: "asc" },
    take: Math.min(50, Math.max(1, options.limit ?? 20)),
    where: { channel: "SMS", providerId: { not: null }, status: "ACCEPTED" },
  })
  for (const delivery of acceptedSms) {
    try {
      const verification = await checkOwnerSms(delivery.providerId!)
      const providerStatus = verification.status
      if (["delivered", "sent"].includes(providerStatus)) {
        await prisma.supportAlertDelivery.update({
          data: { deliveredAt: now, lastError: null, providerStatus, status: "DELIVERED" },
          where: { id: delivery.id },
        })
        await prisma.supportAlertDelivery.updateMany({
          data: {
            acceptedAt: null,
            attemptCount: 0,
            lastError: null,
            nextAttemptAt: now,
            processingStartedAt: null,
            providerId: null,
            providerStatus: null,
            status: "RETRY",
          },
          where: { channel: "SMS", providerStatus: A2P_PROVIDER_STATUS, status: "PAUSED" },
        })
        await resolveOperationalEventByFingerprint(A2P_EVENT_FINGERPRINT)
        outcomes.push({ channel: "SMS", id: delivery.id, state: "delivered" })
      } else if (["failed", "undelivered", "canceled"].includes(providerStatus)) {
        if (verification.errorCode === 30034) {
          const existingCanary = await prisma.supportAlertDelivery.findFirst({
            where: { channel: "SMS", id: { not: delivery.id }, providerStatus: A2P_PROVIDER_STATUS, status: "RETRY" },
          })
          const canary = !existingCanary
          await prisma.supportAlertDelivery.update({
            data: {
              attemptCount: 0,
              lastError: "Twilio 30034: US A2P 10DLC registration is pending.",
              nextAttemptAt: new Date(now.getTime() + A2P_RECHECK_MS),
              processingStartedAt: null,
              providerStatus: A2P_PROVIDER_STATUS,
              status: canary ? "RETRY" : "PAUSED",
            },
            where: { id: delivery.id },
          })
          await recordOperationalEvent({
            category: "SYSTEM",
            countOccurrence: false,
            fingerprint: A2P_EVENT_FINGERPRINT,
            message: "Owner SMS alerts are paused while Twilio reviews the US A2P 10DLC registration. Email alerts remain active.",
            metadata: { twilioErrorCode: verification.errorCode },
            severity: "INFO",
            source: "support-alerts",
          })
          outcomes.push({ channel: "SMS", id: delivery.id, state: canary ? "retry" : "paused" })
        } else {
          await prisma.supportAlertDelivery.update({
            data: { lastError: verification.errorMessage || providerStatus, nextAttemptAt: retryAt(delivery.attemptCount, now), providerStatus, status: delivery.attemptCount >= MAX_ATTEMPTS ? "FAILED" : "RETRY" },
            where: { id: delivery.id },
          })
          outcomes.push({ channel: "SMS", id: delivery.id, state: "retry" })
        }
      } else {
        await prisma.supportAlertDelivery.update({ data: { providerStatus }, where: { id: delivery.id } })
      }
    } catch (error) {
      await prisma.supportAlertDelivery.update({
        data: { lastError: error instanceof Error ? error.message.slice(0, 500) : "SMS verification failed." },
        where: { id: delivery.id },
      })
    }
    await refreshAlertStatus(delivery.alertId, now)
  }
  return outcomes
}
