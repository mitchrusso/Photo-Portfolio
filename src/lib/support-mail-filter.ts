export type SupportMailFilterInput = {
  fromEmail: string
  isBulkAutomated?: boolean
  subject: string
}

export function ignoreSupportMailboxMessage(input: SupportMailFilterInput) {
  const value = `${input.fromEmail} ${input.subject}`.toLowerCase()
  const selfGeneratedOperationalAlert = input.fromEmail.trim().toLowerCase() === "support@photoview.io"
    && /^\[photoview\.io\]\s+(?:ai|auth|billing|email|storage|system|upload)\s+incident\b/i.test(input.subject.trim())
  return Boolean(input.isBulkAutomated)
    || selfGeneratedOperationalAlert
    || /mailer-daemon|postmaster|delivery status notification|undeliverable|do-not-reply|donotreply|no-reply/.test(value)
}
