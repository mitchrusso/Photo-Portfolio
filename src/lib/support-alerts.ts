import { getPrismaClient } from "@/lib/db"
import { getSupportBrand } from "@/lib/support-brands"
import { sendSupportGmail, verifySupportGmailSentMessage } from "@/lib/support-gmail"

const MAX_ATTEMPTS = 8
const LEASE_MS = 10 * 60 * 1000

function retryAt(attemptCount: number, now: Date) {
  return new Date(now.getTime() + Math.min(6 * 60, 2 ** Math.max(0, attemptCount - 1) * 5) * 60 * 1000)
}

function twilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const to = process.env.SUPPORT_OWNER_SMS_TO?.trim()
  const from = process.env.TWILIO_SUPPORT_ALERT_FROM?.trim()
  const messagingServiceSid = process.env.TWILIO_SUPPORT_MESSAGING_SERVICE_SID?.trim()
  if (!accountSid || !authToken || !to || (!from && !messagingServiceSid)) return null
  return { accountSid, authToken, from, messagingServiceSid, to }
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
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
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
    { headers: { Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}` } },
  )
  const result = await response.json().catch(() => null) as { status?: string } | null
  if (!response.ok) throw new Error(`Twilio delivery verification failed (${response.status}).`)
  return result?.status || "unknown"
}

async function refreshAlertStatus(alertId: string, now: Date) {
  const prisma = getPrismaClient()
  const deliveries = await prisma.supportAlertDelivery.findMany({ where: { alertId } })
  const delivered = deliveries.length === 2 && deliveries.every((item) => item.status === "DELIVERED")
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
  const candidates = await prisma.supportAlertDelivery.findMany({
    include: { alert: true },
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
        const delivery = await sendSupportGmail({
          body: `${candidate.alert.summary}\n\n${candidate.alert.adminUrl}`,
          deliveryKey: `owner-alert:${candidate.alert.eventKey}:email`,
          html: `<p>${candidate.alert.summary}</p><p><a href="${candidate.alert.adminUrl}">Open PhotoView support</a></p>`,
          subject: `[PhotoView.io Support] ${candidate.alert.kind.replaceAll("_", " ").toLowerCase()}`,
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
            providerStatus: "gmail_sent_verified",
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
      const providerStatus = await checkOwnerSms(delivery.providerId!)
      if (["delivered", "sent"].includes(providerStatus)) {
        await prisma.supportAlertDelivery.update({
          data: { deliveredAt: now, lastError: null, providerStatus, status: "DELIVERED" },
          where: { id: delivery.id },
        })
        outcomes.push({ channel: "SMS", id: delivery.id, state: "delivered" })
      } else if (["failed", "undelivered", "canceled"].includes(providerStatus)) {
        await prisma.supportAlertDelivery.update({
          data: { lastError: providerStatus, nextAttemptAt: retryAt(delivery.attemptCount, now), providerStatus, status: delivery.attemptCount >= MAX_ATTEMPTS ? "FAILED" : "RETRY" },
          where: { id: delivery.id },
        })
        outcomes.push({ channel: "SMS", id: delivery.id, state: "retry" })
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
