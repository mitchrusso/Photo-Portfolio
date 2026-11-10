export type SupportMailFilterInput = {
  body?: string
  fromEmail: string
  isBulkAutomated?: boolean
  subject: string
}

export function ignoreSupportMailboxMessage(input: SupportMailFilterInput) {
  const fromEmail = input.fromEmail.trim().toLowerCase()
  const value = `${input.fromEmail} ${input.subject}`.toLowerCase()
  const selfGeneratedOperationalAlert = fromEmail === "support@photoview.io"
  const reactionOnlyNotification = /^\s*\[[^\]\r\n]{1,32}\]\s+[^\r\n]+\s+reacted to your message\s*:/i.test(input.body ?? "")
  return Boolean(input.isBulkAutomated)
    || selfGeneratedOperationalAlert
    || reactionOnlyNotification
    || /mailer-daemon|postmaster|delivery status notification|undeliverable|do-not-reply|donotreply|no-reply/.test(value)
}
