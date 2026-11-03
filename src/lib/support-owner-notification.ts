import { escapeSupportEmailHtml, supportEmailLayout } from "./support-email-branding.ts"

export type SupportOwnerCase = {
  message: string
  reporterEmail: string
  reporterName: string
  subject?: string | null
  type: string
}

export type SupportOwnerCaseDetails = SupportOwnerCase & { reportId: string }

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

export function supportOwnerAlertExcerpt(message: string) {
  return message.trim()
}

function plainCase(input: SupportOwnerCaseDetails) {
  const kind = label(input.type)
  const subjectLine = input.subject?.trim() || "(No subject)"
  return [
    `${kind} from ${input.reporterName.trim() || "PhotoView.io subscriber"} <${input.reporterEmail}>`,
    `Email subject: ${subjectLine}`,
    `Case: ${input.reportId}`,
    "",
    "Complete customer message:",
    supportOwnerAlertExcerpt(input.message),
  ].join("\n")
}

function htmlCase(input: SupportOwnerCaseDetails) {
  const kind = label(input.type)
  const subjectLine = input.subject?.trim() || "(No subject)"
  return [
    `<section style="margin:0 0 24px">`,
    `<p style="margin:0 0 8px"><strong>${escapeSupportEmailHtml(kind)} from ${escapeSupportEmailHtml(input.reporterName.trim() || "PhotoView.io subscriber")}</strong></p>`,
    `<p style="margin:0 0 4px">${escapeSupportEmailHtml(input.reporterEmail)}</p>`,
    `<p style="margin:0 0 4px;color:#726b60">${escapeSupportEmailHtml(subjectLine)}</p>`,
    `<p style="margin:0 0 16px;color:#726b60">Case: ${escapeSupportEmailHtml(input.reportId)}</p>`,
    `<p style="margin:0 0 8px"><strong>Complete customer message</strong></p>`,
    `<div style="margin:0;padding:16px;border:1px solid #ded6c9;border-radius:8px;background:#fbfaf7;white-space:pre-wrap">${escapeSupportEmailHtml(supportOwnerAlertExcerpt(input.message))}</div>`,
    `</section>`,
  ].join("")
}

export function supportOwnerAlertMessage(input: SupportOwnerCaseDetails) {
  const kind = label(input.type)
  const body = plainCase(input)
  const html = supportEmailLayout([
    htmlCase(input),
  ].join(""), `${kind} from ${input.reporterName}`)
  return { body, html, subject: supportOwnerAlertSubject(input) }
}

export function supportOwnerWatchdogMessage(input: { cases: SupportOwnerCaseDetails[]; summary: string }) {
  const count = input.cases.length
  const heading = count === 1 ? "1 unresolved customer case" : `${count} unresolved customer cases`
  const body = [
    input.summary,
    "",
    ...(count > 0
      ? input.cases.flatMap((item, index) => [
          `Customer case ${index + 1} of ${count}`,
          plainCase(item),
          "",
        ])
      : ["No customer message is associated with this system alert."]),
  ].join("\n").trim()
  const html = supportEmailLayout([
    `<p style="margin:0 0 20px"><strong>${escapeSupportEmailHtml(input.summary)}</strong></p>`,
    count > 0
      ? input.cases.map((item, index) => [
          `<p style="margin:0 0 8px;color:#726b60;text-transform:uppercase;letter-spacing:.08em;font-size:12px">Customer case ${index + 1} of ${count}</p>`,
          htmlCase(item),
        ].join("")).join("")
      : `<p style="margin:0">No customer message is associated with this system alert.</p>`,
  ].join(""), count > 0 ? heading : "PhotoView.io support system alert")
  return {
    body,
    html,
    subject: `[PhotoView.io Support] ${count > 0 ? heading : "system alert"}`,
  }
}
