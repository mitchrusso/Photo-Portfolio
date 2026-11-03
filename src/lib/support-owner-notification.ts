import { escapeSupportEmailHtml, supportEmailLayout } from "./support-email-branding.ts"

export type SupportOwnerCase = {
  message: string
  reporterEmail: string
  reporterName: string
  subject?: string | null
  type: string
}

function label(type: string) {
  if (type === "bug") return "Bug report"
  if (type === "improvement") return "Feature suggestion"
  if (type === "feedback") return "Feedback"
  if (type === "question") return "Question"
  return "Support request"
}

export function supportOwnerAlertSubject(input: SupportOwnerCase) {
  return `[PhotoView.io Support] ${input.reporterName.trim() || input.reporterEmail} — ${label(input.type)}`.slice(0, 240)
}

export function supportOwnerAlertExcerpt(message: string, max = 1_600) {
  const current = message.split(/\n\s*On .+wrote:\s*\n/i)[0]?.trim() || message.trim()
  return current.length <= max ? current : `${current.slice(0, Math.max(1, max - 1)).trimEnd()}…`
}

export function supportOwnerAlertMessage(input: SupportOwnerCase & { adminUrl: string; reportId: string }) {
  const kind = label(input.type)
  const excerpt = supportOwnerAlertExcerpt(input.message)
  const subjectLine = input.subject?.trim() || "(No subject)"
  const body = [
    `${kind} from ${input.reporterName.trim() || "PhotoView.io subscriber"} <${input.reporterEmail}>`,
    `Email subject: ${subjectLine}`,
    `Case: ${input.reportId}`,
    "",
    `${kind}:`,
    excerpt,
    "",
    `Open this case in the PhotoView Support Center: ${input.adminUrl}`,
  ].join("\n")
  const html = supportEmailLayout([
    `<p style="margin:0 0 8px"><strong>${escapeSupportEmailHtml(kind)} from ${escapeSupportEmailHtml(input.reporterName.trim() || "PhotoView.io subscriber")}</strong></p>`,
    `<p style="margin:0 0 4px">${escapeSupportEmailHtml(input.reporterEmail)}</p>`,
    `<p style="margin:0 0 20px;color:#726b60">${escapeSupportEmailHtml(subjectLine)}</p>`,
    `<div style="margin:0 0 20px;padding:16px;border:1px solid #ded6c9;border-radius:8px;background:#fbfaf7;white-space:pre-wrap">${escapeSupportEmailHtml(excerpt)}</div>`,
    `<p style="margin:0"><a href="${escapeSupportEmailHtml(input.adminUrl)}" style="color:#5f574c;font-weight:700;text-decoration:underline">Open this case in the PhotoView Support Center</a></p>`,
  ].join(""), `${kind} from ${input.reporterName}`)
  return { body, html, subject: supportOwnerAlertSubject(input) }
}
