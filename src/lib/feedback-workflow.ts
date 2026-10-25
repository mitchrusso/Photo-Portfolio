import { getPrismaClient } from "@/lib/db"
import { claimEmailDelivery, finishEmailDelivery } from "@/lib/email-delivery-idempotency"
import { sendTransactionalEmail } from "@/lib/email-delivery-health"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { supportEmailAddress, supportEmailFrom, supportEmailLayout } from "@/lib/support-email-branding"

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
  return supportEmailLayout(content, preview)
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
  const githubToken = process.env.GITHUB_REPAIR_DISPATCH_TOKEN?.trim()
  if (githubToken) {
    const repository = process.env.GITHUB_REPAIR_REPOSITORY?.trim() || "mitchrusso/Photo-Portfolio"
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
      throw new Error("GITHUB_REPAIR_REPOSITORY is invalid.")
    }
    const [owner, repo] = repository.split("/")
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/autonomous-bug-repair.yml/dispatches`,
      {
        body: JSON.stringify({ ref: "main" }),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "PhotoView-Repair-Dispatcher",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        method: "POST",
      },
    )
    if (!response.ok) {
      await recordOperationalEvent({
        category: "SYSTEM",
        fingerprint: `feedback:repair-dispatch:${report.id}`,
        message: `GitHub repair dispatch failed for bug report ${report.id} with HTTP ${response.status}.`,
        severity: "ERROR",
        source: "feedback-workflow",
        workspaceId: report.workspaceId,
      })
      return "failed" as const
    }

    await resolveOperationalEventByFingerprint(`feedback:repair-dispatch:${report.id}`)
    return "dispatched" as const
  }

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
    from: supportEmailFrom(),
    html: emailLayout(`
      <h1 style="margin:18px 0 16px;font-size:28px;line-height:1.2;color:#1f211e;">Your reported problem is fixed</h1>
      <p>Hi ${escapeHtml(report.reporterName)},</p>
      <p>Thank you for reporting the problem to PhotoView.io. The issue has now been fixed, and you should be able to use PhotoView.io normally going forward.</p>
      ${resolutionNote?.trim() ? `<div style="margin:20px 0;padding:14px 16px;border-radius:8px;background:#f7f4ef;"><strong>What changed</strong><br>${escapeHtml(resolutionNote.trim())}</div>` : ""}
      <p>If you still see the problem, reply to this message and mention report <strong>${escapeHtml(report.id)}</strong>.</p>
      <p>Thank you again for helping us improve PhotoView.io.</p>
    `, preview),
    preview,
    replyTo: supportEmailAddress(),
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
