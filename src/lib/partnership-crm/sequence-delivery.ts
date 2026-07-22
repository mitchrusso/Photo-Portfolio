import { getPrismaClient } from "@/lib/db"
import { buildGmailRawMessage } from "@/lib/partnership-crm/gmail-message"
import { crmGmailAddress, getGoogleAccess } from "@/lib/partnership-crm/google"

async function contactHasReplied(accessToken: string, email: string, since: Date) {
  const query = encodeURIComponent(`from:${email} after:${Math.floor(since.getTime() / 1000)}`)
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=1`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return false
  const result = await response.json() as { resultSizeEstimate?: number }
  return Boolean(result.resultSizeEstimate)
}

export async function runCrmSequenceDelivery() {
  const prisma = getPrismaClient()
  const due = await prisma.crmEmailStep.findMany({
    include: { sequence: { include: { contact: true, partner: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 25,
    where: { scheduledAt: { lte: new Date() }, sequence: { status: "ACTIVE" }, status: "SCHEDULED" },
  })
  const result = { failed: 0, sent: 0, stopped: 0 }
  for (const step of due) {
    const claimed = await prisma.crmEmailStep.updateMany({ data: { status: "SENDING" }, where: { id: step.id, status: "SCHEDULED" } })
    if (claimed.count !== 1) continue
    const google = await getGoogleAccess(step.sequence.createdById)
    if (!google || !step.sequence.contact.email) {
      await prisma.crmEmailStep.update({ data: { lastError: "Gmail is disconnected or the contact email is missing.", status: "FAILED" }, where: { id: step.id } })
      await prisma.crmEmailSequence.update({ data: { pausedAt: new Date(), status: "PAUSED" }, where: { id: step.sequenceId } })
      result.failed++
      continue
    }
    if (step.sequence.stopOnReply && step.position > 1 && step.sequence.approvedAt && await contactHasReplied(google.accessToken, step.sequence.contact.email, step.sequence.approvedAt)) {
      await prisma.$transaction([
        prisma.crmEmailStep.updateMany({ data: { status: "SKIPPED" }, where: { sequenceId: step.sequenceId, status: { in: ["SCHEDULED", "SENDING"] } } }),
        prisma.crmEmailSequence.update({ data: { completedAt: new Date(), status: "COMPLETED" }, where: { id: step.sequenceId } }),
        prisma.crmActivity.create({ data: { detail: `Stopped automatically after ${step.sequence.contact.email} replied.`, occurredAt: new Date(), partnerId: step.sequence.partnerId, title: "Outreach sequence stopped", type: "email" } }),
      ])
      result.stopped++
      continue
    }
    try {
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        body: JSON.stringify({ raw: buildGmailRawMessage({ body: step.body, from: crmGmailAddress(), subject: step.subject, to: step.sequence.contact.email }) }),
        cache: "no-store",
        headers: { Authorization: `Bearer ${google.accessToken}`, "Content-Type": "application/json" },
        method: "POST",
      })
      if (!response.ok) throw new Error("Google rejected the scheduled message.")
      const gmail = await response.json() as { id?: string }
      const sentAt = new Date()
      await prisma.$transaction([
        prisma.crmEmailStep.update({ data: { gmailMessageId: gmail.id ?? null, lastError: null, sentAt, status: "SENT" }, where: { id: step.id } }),
        prisma.crmActivity.create({ data: { detail: `Sent “${step.subject}” to ${step.sequence.contact.email}.`, occurredAt: sentAt, partnerId: step.sequence.partnerId, title: `Sequence email ${step.position} sent`, type: "email" } }),
      ])
      const remaining = await prisma.crmEmailStep.count({ where: { sequenceId: step.sequenceId, status: { in: ["DRAFT", "SCHEDULED", "SENDING"] } } })
      if (remaining === 0) await prisma.crmEmailSequence.update({ data: { completedAt: sentAt, status: "COMPLETED" }, where: { id: step.sequenceId } })
      result.sent++
    } catch (error) {
      await prisma.$transaction([
        prisma.crmEmailStep.update({ data: { lastError: error instanceof Error ? error.message : "Scheduled delivery failed.", status: "FAILED" }, where: { id: step.id } }),
        prisma.crmEmailSequence.update({ data: { pausedAt: new Date(), status: "PAUSED" }, where: { id: step.sequenceId } }),
      ])
      result.failed++
    }
  }
  return result
}
