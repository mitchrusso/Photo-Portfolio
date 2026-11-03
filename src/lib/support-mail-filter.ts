export type SupportMailFilterInput = {
  fromEmail: string
  isBulkAutomated?: boolean
  subject: string
}

export function ignoreSupportMailboxMessage(input: SupportMailFilterInput) {
  const value = `${input.fromEmail} ${input.subject}`.toLowerCase()
  return Boolean(input.isBulkAutomated)
    || /mailer-daemon|postmaster|delivery status notification|undeliverable|do-not-reply|donotreply|no-reply/.test(value)
}
