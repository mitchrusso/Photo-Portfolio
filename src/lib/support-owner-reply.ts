export function supportOwnerReplyText(body: string) {
  return body
    .split(/\n(?:On .+wrote:|From:\s*PhotoView\.io Support|-----Original Message-----)\s*/i, 1)[0]
    .split("\n")
    .filter((line) => !/^\s*>/.test(line))
    .join("\n")
    .trim()
    .slice(0, 12_000)
}

export function supportOwnerFeatureDecision(body: string) {
  const reply = supportOwnerReplyText(body)
  const [firstLine = "", ...remainingLines] = reply.split("\n")
  const match = firstLine.trim().match(/^(APPROVE|APPROVED|DECLINE|DECLINED)(?:\s*[:\-]\s*(.*))?$/i)
  if (!match) return null
  const action = match[1].toUpperCase().startsWith("APPROV") ? "approve" as const : "decline" as const
  const note = [match[2] || "", ...remainingLines].join("\n").trim().slice(0, 2_000)
  return { action, note }
}
