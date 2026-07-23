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
      body: `Hi ${firstName},\n\nI’m Mitch Russo, founder of PhotoView.io. ${input.opportunity}\n\nPhotoView.io gives serious photographers one place to store, organize, curate, present, and share polished photo and video portfolios. It also includes a customizable photographer website, gallery sharing, client-ready presentation, and automated social campaign tools.\n\nYou can see the application here: https://photoview.io\n\nI believe a partnership could help ${input.company} customers move from finished images to a professional presentation without another manual handoff. Would you be open to a brief conversation to explore the fit?\n\nBest,\nMitch Russo\nFounder, PhotoView.io\nmitch@photoview.io\nhttps://photoview.io`,
    },
    {
      subject: `A simpler path from ${input.company} to a finished portfolio`,
      body: `Hi ${firstName},\n\nI wanted to follow up with one practical thought: a direct PhotoView.io connection could preserve the work your customers have already organized while giving them an immediate gallery, portfolio, website, and sharing destination.\n\nOur goal is ${input.goal.toLowerCase()}. Here is the product if you would like a quick look: https://photoview.io\n\nWould a short working session with your product or partnerships team make sense?\n\nBest,\nMitch Russo\nFounder, PhotoView.io`,
    },
    {
      subject: `A low-friction ${input.company} and PhotoView.io pilot`,
      body: `Hi ${firstName},\n\nOne way to keep this simple would be a small pilot: let selected ${input.company} users send finished work into PhotoView.io, then measure whether the integrated publishing workflow saves time and helps them present more work professionally.\n\nPhotoView.io handles portfolio curation, custom sites, secure sharing, video, and social campaign scheduling from one workspace. I would be glad to walk through the application and a practical integration path.\n\nWould you have 20 minutes to compare notes?\n\nBest,\nMitch Russo\nFounder, PhotoView.io`,
    },
    {
      subject: `Closing the loop on PhotoView.io and ${input.company}`,
      body: `Hi ${firstName},\n\nI wanted to close the loop respectfully. If a PhotoView.io partnership is relevant, I would be happy to share the product and discuss a low-friction test. You can review PhotoView.io at https://photoview.io.\n\nIf the timing is not right, no problem. And if someone else at ${input.company} owns partnerships or integrations, I would appreciate a referral.\n\nBest,\nMitch Russo\nFounder, PhotoView.io\nmitch@photoview.io`,
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
