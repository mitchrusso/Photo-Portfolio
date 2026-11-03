export const resolvedSupportStatuses = ["ANSWERED", "FIXED", "CLOSED"] as const

export type SupportMessageType = "bug" | "feedback" | "improvement" | "question"

function cleanSupportText(value: string, max: number) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max)
}

export function classifySupportMessage(subject: string, body: string): SupportMessageType {
  const value = `${subject}\n${body}`.toLowerCase()
  if (/\b(feature request|suggestion|would be (?:great|helpful)|would it be possible|please add|could you add|wish (?:i|we) could)\b/.test(value)) return "improvement"
  if (/\b(can(?:not|'t) find|where (?:is|do)|how do i|how can i)\b/.test(value) && !/\b(404|error|broken|crash|failed|failure|timeout)\b/.test(value)) return "question"
  if (/\b(error|bug|broken|doesn'?t work|not working|crash|failed|failure|404|unable to|cannot|can'?t sign in|timeout)\b/.test(value)) return "bug"
  if (/\?|\b(how do i|how can i|where (?:is|do)|can i|what is|why does|help me)\b/.test(value)) return "question"
  return "feedback"
}

export function supportReplyTransition(
  report: { message: string; type: string },
  message: { body: string; subject: string },
  now = new Date(),
) {
  const replyType = classifySupportMessage(message.subject, message.body)
  if (replyType === "bug") {
    return {
      attemptCount: 0,
      deliveredAt: null,
      escalatedAt: null,
      escalationReason: null,
      fixedAt: null,
      leaseExpiresAt: null,
      leaseId: null,
      lifecycleState: "QUEUED",
      message: cleanSupportText(`${report.message}\n\nLatest subscriber follow-up:\n${message.body}`, 20_000),
      nextAttemptAt: now,
      resolvedAt: null,
      responseAcceptedAt: null,
      status: "PENDING_REPAIR",
      type: "bug",
    }
  }
  if (replyType === "improvement") {
    return {
      escalatedAt: null,
      escalationReason: null,
      leaseExpiresAt: null,
      leaseId: null,
      lifecycleState: "AWAITING_PRODUCT_REVIEW",
      resolvedAt: null,
      status: "AWAITING_APPROVAL",
      type: "improvement",
    }
  }
  return {
    escalatedAt: now,
    escalationReason: "The subscriber replied and needs a follow-up.",
    leaseExpiresAt: null,
    leaseId: null,
    lifecycleState: "ESCALATED",
    resolvedAt: null,
    status: "RECEIVED",
    type: replyType,
  }
}

export function isResolvedSupportStatus(status: string) {
  return (resolvedSupportStatuses as readonly string[]).includes(status)
}

const supportStatusRank: Record<string, number> = {
  RECEIVED: 0,
  AWAITING_APPROVAL: 1,
  ANSWERED: 2,
  FIXED: 3,
  CLOSED: 4,
}

export function canAdvanceSupportStatus(currentStatus: string, targetStatus: string) {
  const currentRank = supportStatusRank[currentStatus]
  const targetRank = supportStatusRank[targetStatus]
  if (currentRank === undefined || targetRank === undefined) return true
  return targetRank >= currentRank
}

function newestReplyText(body: string) {
  return body
    .split(/\n(?:On .+wrote:|From:|-----Original Message-----)\s*/i, 1)[0]
    .split("\n")
    .filter((line) => !/^\s*>/.test(line))
    .join("\n")
    .trim()
}

export function isBenignClosingReply(body: string) {
  const reply = newestReplyText(body).slice(0, 800)
  if (!reply || reply.includes("?")) return false
  if (/\b(?:but|however|still|not|problem|issue|error|failed|broken|can't|cannot|won't|help)\b/i.test(reply)) return false
  const isThankYou = /\b(?:thank you|thanks|appreciate)\b/i.test(reply)
  return isThankYou && (
    reply.length <= 200
    || /\b(?:looks? good|works?|working|fixed|resolved|all set|good now|check it out|got it|understood)\b/i.test(reply)
  )
}
