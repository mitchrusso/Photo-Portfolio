export type MailboxMessageForClassification = {
  body: string
  fromEmail: string
  subject: string
}

export function isUnsolicitedMarketingMessage(message: MailboxMessageForClassification) {
  const value = `${message.fromEmail}\n${message.subject}\n${message.body}`.toLowerCase()

  const directSolicitation = [
    /\bguest post (?:opportunity|placement|service)\b/,
    /\b(?:do-?follow|high-quality) backlinks?\b/,
    /\b(?:seo|link building) services?\b/,
    /\b(?:paid|sponsored) (?:post|placement|content)\b/,
  ].some((pattern) => pattern.test(value))

  const reciprocalMentionPitch = /\bmention each other'?s (?:work|content|site|website)\b/.test(value)
    && /\b(?:open to discussing|collaborat(?:e|ion)|partnership|natural way)\b/.test(value)

  return directSolicitation || reciprocalMentionPitch
}
