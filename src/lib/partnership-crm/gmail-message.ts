type GmailMessageInput = {
  body: string
  from: string
  subject: string
  to: string
}

function base64Lines(value: string) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") ?? ""
}

function encodedHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
}

export function buildGmailRawMessage({ body, from, subject, to }: GmailMessageInput) {
  const message = [
    `From: PhotoView.io <${from}>`,
    `To: ${to}`,
    `Subject: ${encodedHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(body),
  ].join("\r\n")
  return Buffer.from(message, "utf8").toString("base64url")
}
