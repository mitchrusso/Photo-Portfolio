import { getPrismaClient } from "@/lib/db"
import { recordOperationalEvent, resolveOperationalEventByFingerprint } from "@/lib/operational-monitoring"
import { queueSupportEmail } from "@/lib/support-email-outbox"

export type FeedbackReportType = "bug" | "feedback" | "improvement" | "question"

export const feedbackInitialStatus: Record<FeedbackReportType, string> = {
  bug: "PENDING_REPAIR",
  feedback: "RECEIVED",
  improvement: "AWAITING_APPROVAL",
  question: "RECEIVED",
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

  const body = [
    `Hi ${report.reporterName},`,
    "",
    "Thank you for reporting the problem to PhotoView.io. The issue has now been fixed, and you should be able to use PhotoView.io normally going forward.",
    resolutionNote?.trim() ? `What changed: ${resolutionNote.trim()}` : "",
    "",
    `If you still see the problem, reply to this message and mention report ${report.id}.`,
    "",
    "Thank you again for helping us improve PhotoView.io.",
  ].filter(Boolean).join("\n")
  const queued = await queueSupportEmail({
    body,
    deliveryKey: `feedback-bug-fixed:${report.id}`,
    recipientName: report.reporterName,
    reportId: report.id,
    resolutionNote: resolutionNote?.trim() || null,
    source: "feedback_bug_fixed",
    subject: "Your PhotoView.io bug report has been fixed",
    targetReportStatus: "FIXED",
    toEmail: report.reporterEmail,
  })
  return { outboxId: queued.id, state: queued.state }
}
