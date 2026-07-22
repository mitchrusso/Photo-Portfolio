export const CRM_SEQUENCE_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const
export const CRM_SEQUENCE_STEP_STATUSES = ["DRAFT", "SCHEDULED", "SENDING", "SENT", "FAILED", "SKIPPED"] as const

export type GeneratedSequenceMessage = { body: string; subject: string }

export function addBusinessDays(input: Date, days: number) {
  const result = new Date(input)
  let remaining = Math.max(0, Math.trunc(days))
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1)
    const weekday = result.getUTCDay()
    if (weekday !== 0 && weekday !== 6) remaining -= 1
  }
  return result
}

export function scheduleSequence(startAt: Date, count: number, spacingBusinessDays: number) {
  return Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, index) =>
    addBusinessDays(startAt, index * Math.max(1, spacingBusinessDays)),
  )
}

export function fallbackSequence(input: {
  company: string
  contactName: string
  goal: string
  opportunity: string
}) : GeneratedSequenceMessage[] {
  const firstName = input.contactName.trim().split(/\s+/)[0] || "there"
  return [
    {
      subject: `A PhotoView.io publishing idea for ${input.company}`,
      body: `Hi ${firstName},\n\n${input.opportunity}\n\nI believe this could help ${input.company} customers move from finished images to polished presentation without another manual handoff. Would you be open to a brief conversation?\n\nBest,\nMitch Russo`,
    },
    {
      subject: `A simpler path from ${input.company} to a finished portfolio`,
      body: `Hi ${firstName},\n\nI wanted to follow up with one practical thought: a direct PhotoView.io connection could preserve the work your customers have already organized while giving them an immediate gallery, portfolio, and sharing destination.\n\nOur goal is ${input.goal.toLowerCase()}. Is this worth a short working session with your product team?\n\nBest,\nMitch Russo`,
    },
    {
      subject: `Should we explore the ${input.company} and PhotoView.io workflow?`,
      body: `Hi ${firstName},\n\nI know priorities move quickly, so I wanted to make one final check. If a publishing connection between ${input.company} and PhotoView.io is relevant, I would be glad to share a concise workflow and discuss what a low-friction test could look like.\n\nIf someone else owns partnerships or integrations, a referral would be greatly appreciated.\n\nBest,\nMitch Russo`,
    },
  ]
}

export function parseGeneratedSequence(value: string, fallback: GeneratedSequenceMessage[]) {
  const candidate = value.match(/\[[\s\S]*\]/)?.[0]
  if (!candidate) return fallback
  try {
    const parsed = JSON.parse(candidate)
    if (!Array.isArray(parsed)) return fallback
    const messages = parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return []
      const subject = typeof item.subject === "string" ? item.subject.trim().replace(/[\r\n]+/g, " ").slice(0, 500) : ""
      const body = typeof item.body === "string" ? item.body.trim().slice(0, 30_000) : ""
      return subject && body ? [{ body, subject }] : []
    })
    return messages.length ? messages.slice(0, 5) : fallback
  } catch {
    return fallback
  }
}
