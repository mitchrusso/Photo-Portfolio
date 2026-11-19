export type SupportDeliveryNotice = "DELIVERY_DELAYED" | "TERMINAL_BOUNCE" | "NOT_DELIVERY_NOTICE"

export function classifySupportDeliveryNotice(input: { body: string; fromEmail: string; subject: string }): SupportDeliveryNotice {
  const header = `${input.fromEmail} ${input.subject}`.toLowerCase()
  if (!/mailer-daemon|postmaster|delivery status notification|undeliverable|delivery incomplete/.test(header)) {
    return "NOT_DELIVERY_NOTICE"
  }

  const content = `${input.subject}\n${input.body}`.toLowerCase()
  if (/delivery failed|permanent(?:ly)?|address not found|user unknown|mailbox unavailable|message blocked|recipient rejected|undeliverable/.test(content)) {
    return "TERMINAL_BOUNCE"
  }
  if (/temporary problem|will retry|still trying|delivery delayed|delivery incomplete|warning: message still undelivered/.test(content)) {
    return "DELIVERY_DELAYED"
  }
  return "TERMINAL_BOUNCE"
}
