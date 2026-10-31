type GmailMessageInput = {
  body: string
  from: string
  html?: string
  inReplyTo?: string
  messageId?: string
  references?: string
  replyTo?: string
  senderName?: string
  subject: string
  to: string
}

function base64Lines(value: string) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? ""
}

function encodedHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
}

function safeHeader(value: string) {
  if (/[\r\n]/.test(value)) throw new Error("Email headers cannot contain line breaks.")
  return value
}

export function buildGmailRawMessage({ body, from, html, inReplyTo, messageId, references, replyTo, senderName = "PhotoView.io", subject, to }: GmailMessageInput) {
  const boundary = `photoview-${Buffer.from(`${subject}:${to}`, "utf8").toString("base64url").slice(0, 32)}`
  const message = [
    `From: ${safeHeader(senderName)} <${safeHeader(from)}>`,
    `To: ${safeHeader(to)}`,
    ...(replyTo ? [`Reply-To: ${safeHeader(replyTo)}`] : []),
    ...(messageId ? [`Message-ID: <${safeHeader(messageId)}>`] : []),
    ...(inReplyTo ? [`In-Reply-To: ${safeHeader(inReplyTo)}`] : []),
    ...(references ? [`References: ${safeHeader(references)}`] : []),
    `Subject: ${encodedHeader(subject)}`,
    "MIME-Version: 1.0",
    ...(html ? [
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(body),
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(html),
      `--${boundary}--`,
    ] : [
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      base64Lines(body),
    ]),
  ].join("\r\n")
  return Buffer.from(message, "utf8").toString("base64url")
}
