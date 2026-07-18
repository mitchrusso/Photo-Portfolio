const RESERVED_AUTOMATION_EMAIL_DOMAINS = [
  "example.com",
  "example.net",
  "example.org",
  "invalid",
  "localhost",
  "test",
]

export function isDeliverableAutomationEmail(value: string) {
  const email = value.trim().toLowerCase()
  const separator = email.lastIndexOf("@")
  if (separator <= 0 || separator === email.length - 1) return false

  const domain = email.slice(separator + 1).replace(/\.$/, "")
  return !RESERVED_AUTOMATION_EMAIL_DOMAINS.some(
    (reserved) => domain === reserved || domain.endsWith(`.${reserved}`),
  )
}
