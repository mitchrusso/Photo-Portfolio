export type SupportMailFilterInput = {
  fromEmail: string
  isBulkAutomated?: boolean
  subject: string
}

export function ignoreSupportMailboxMessage(input: SupportMailFilterInput) {
  const fromEmail = input.fromEmail.trim().toLowerCase()
  const value = `${input.fromEmail} ${input.subject}`.toLowerCase()
  const selfGeneratedOperationalAlert = fromEmail === "support@photoview.io"
  return Boolean(input.isBulkAutomated)
    || selfGeneratedOperationalAlert
    || /mailer-daemon|postmaster|delivery status notification|undeliverable|do-not-reply|donotreply|no-reply/.test(value)
}
