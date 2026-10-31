export const resolvedSupportStatuses = ["ANSWERED", "FIXED", "CLOSED"] as const

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
