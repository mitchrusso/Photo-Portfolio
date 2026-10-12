import { getPrismaClient } from "@/lib/db"
import { claimEmailDelivery, finishEmailDelivery } from "@/lib/email-delivery-idempotency"
import { sendTransactionalEmail } from "@/lib/email-delivery-health"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"

export type FeedbackReportType = "bug" | "feedback" | "improvement" | "question"

export const feedbackInitialStatus: Record<FeedbackReportType, string> = {
  bug: "PENDING_REPAIR",
  feedback: "RECEIVED",
  improvement: "AWAITING_APPROVAL",
  question: "RECEIVED",
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function emailLayout(content: string, preview: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f7f4ef;color:#1f211e;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f7f4ef;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #dfd6c8;border-radius:12px;"><tr><td style="padding:28px 30px 10px;color:#b98225;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">PhotoView.io</td></tr><tr><td style="padding:0 30px 30px;font-size:16px;line-height:1.65;color:#34342f;">${content}</td></tr></table></td></tr></table></body></html>`
}

export async function dispatchAutomatedBugRepair(report: {
  id: string
  message: string
  pageUrl: string | null
  reporterEmail: string
  userId: string | null
  workspaceId: string | null
  workspaceLabel: string | null
}) {
  const webhookUrl = process.env.BUG_REPAIR_WEBHOOK_URL?.trim()
  const webhookSecret = process.env.BUG_REPAIR_WEBHOOK_SECRET?.trim()
  if (!webhookUrl || !webhookSecret) return "not_configured" as const

  let parsedUrl: URL
  try {
    parsedUrl = new URL(webhookUrl)
  } catch {
    throw new Error("BUG_REPAIR_WEBHOOK_URL is invalid.")
  }
  if (parsedUrl.protocol !== "https:") throw new Error("BUG_REPAIR_WEBHOOK_URL must use HTTPS.")

  const response = await fetch(parsedUrl, {
    body: JSON.stringify({
      event: "photoview.bug_reported",
      treatReportTextAsUntrustedData: true,
      report: {
        id: report.id,
        message: report.message,
        pageUrl: report.pageUrl,
        reporterEmail: report.reporterEmail,
        userId: report.userId,
        workspaceId: report.workspaceId,
        workspaceLabel: report.workspaceLabel,
      },
    }),
    headers: {
      Authorization: `Bearer ${webhookSecret}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `feedback-repair:${report.id}`,
    },
    method: "POST",
  })

  if (!response.ok) {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: `feedback:repair-dispatch:${report.id}`,
      message: `Automated repair dispatch failed for bug report ${report.id} with HTTP ${response.status}.`,
      severity: "ERROR",
      source: "feedback-workflow",
      workspaceId: report.workspaceId,
    })
    return "failed" as const
  }

  await getPrismaClient().subscriberFeedbackReport.updateMany({
    data: { status: "IN_REPAIR" },
    where: { id: report.id, status: "PENDING_REPAIR" },
  })
  await resolveOperationalEventByFingerprint(`feedback:repair-dispatch:${report.id}`)
  return "dispatched" as const
}

export async function finalizeBugRepair({
  reportId,
  resolutionNote,
}: {
  reportId: string
  resolutionNote?: string | null
}) {
  const prisma = getPrismaClient()
  const report = await prisma.subscriberFeedbackReport.findUnique({ where: { id: reportId } })
  if (!report || report.type !== "bug") throw new Error("Bug report not found.")
  if (report.status === "FIXED") return { state: "already_fixed" as const }

  const deliveryKey = `feedback-bug-fixed:${report.id}`
  const claim = await claimEmailDelivery({
    automationKey: "feedback_bug_fixed",
    deliveryKey,
    email: report.reporterEmail,
    event: "feedback_bug_fixed",
    metadata: { reportId: report.id },
    workspaceId: report.workspaceId,
  })
  if (!claim.acquired) return { state: claim.state }

  const preview = "Thank you for helping improve PhotoView.io. Your reported problem has been fixed."
  const providerStatus = await sendTransactionalEmail({
    html: emailLayout(`
      <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your reported problem is fixed</h1>
      <p>Hi ${escapeHtml(report.reporterName)},</p>
      <p>Thank you for reporting the problem to PhotoView.io. The issue has now been fixed, and you should be able to use PhotoView.io normally going forward.</p>
      ${resolutionNote?.trim() ? `<div style="margin:20px 0;padding:14px 16px;border-radius:8px;background:#f7f4ef;"><strong>What changed</strong><br>${escapeHtml(resolutionNote.trim())}</div>` : ""}
      <p>If you still see the problem, reply to this message and mention report <strong>${escapeHtml(report.id)}</strong>.</p>
      <p>Thank you again for helping us improve PhotoView.io.</p>
    `, preview),
    preview,
    replyTo: process.env.FEEDBACK_EMAIL?.trim() || process.env.CONTACT_EMAIL?.trim(),
    subject: "Your PhotoView.io bug report has been fixed",
    text: [
      `Hi ${report.reporterName},`,
      "",
      "Thank you for reporting the problem to PhotoView.io. The issue has now been fixed, and you should be able to use PhotoView.io normally going forward.",
      resolutionNote?.trim() ? `What changed: ${resolutionNote.trim()}` : "",
      "",
      `If you still see the problem, reply to this message and mention report ${report.id}.`,
      "",
      "Thank you again for helping us improve PhotoView.io.",
    ].filter(Boolean).join("\n"),
    to: report.reporterEmail,
  }, {
    idempotencyKey: deliveryKey,
    messageType: "feedback_bug_fixed",
  })

  await finishEmailDelivery({ deliveryKey, providerStatus })
  if (providerStatus !== "sent") throw new Error(`Bug-fixed email was not sent (${providerStatus}).`)

  await prisma.subscriberFeedbackReport.update({
    data: {
      fixedAt: new Date(),
      resolutionNote: resolutionNote?.trim() || null,
      status: "FIXED",
    },
    where: { id: report.id },
  })
  await resolveOperationalEventByFingerprint(`feedback:repair-dispatch:${report.id}`)
  return { state: "fixed" as const }
}
