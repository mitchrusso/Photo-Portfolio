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

async function dispatchGithubRepairWorkflow(inputs: Record<string, string>, userAgent: string) {
  const githubToken = process.env.GITHUB_REPAIR_DISPATCH_TOKEN?.trim()
  if (!githubToken) return "not_configured" as const
  const repository = process.env.GITHUB_REPAIR_REPOSITORY?.trim() || "mitchrusso/Photo-Portfolio"
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPAIR_REPOSITORY is invalid.")
  }
  const [owner, repo] = repository.split("/")
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/autonomous-bug-repair.yml/dispatches`,
    {
      body: JSON.stringify({ inputs, ref: "main" }),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      method: "POST",
    },
  )
  return response.ok ? "dispatched" as const : "failed" as const
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
  if (process.env.GITHUB_REPAIR_DISPATCH_TOKEN?.trim()) {
    const dispatch = await dispatchGithubRepairWorkflow({}, "PhotoView-Repair-Dispatcher")
    if (dispatch !== "dispatched") {
      await recordOperationalEvent({
        category: "SYSTEM",
        fingerprint: `feedback:repair-dispatch:${report.id}`,
        message: `GitHub repair dispatch failed for bug report ${report.id}.`,
        severity: "ERROR",
        source: "feedback-workflow",
        workspaceId: report.workspaceId,
      })
      return "failed" as const
    }

    await resolveOperationalEventByFingerprint(`feedback:repair-dispatch:${report.id}`)
    return dispatch
  }

  const webhookUrl = process.env.BUG_REPAIR_WEBHOOK_URL?.trim()
  const webhookSecret = process.env.BUG_REPAIR_WEBHOOK_SECRET?.trim()
  if (!webhookUrl || !webhookSecret) {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: `feedback:repair-dispatch:${report.id}`,
      message: `Immediate automated repair dispatch is not configured for bug report ${report.id}. The 15-minute recovery scan must claim it.`,
      severity: "CRITICAL",
      source: "feedback-workflow",
      workspaceId: report.workspaceId,
    })
    return "not_configured" as const
  }

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

export async function dispatchApprovedFeatureImplementation(report: {
  id: string
  workspaceId: string | null
}) {
  const dispatch = await dispatchGithubRepairWorkflow(
    { approved_feature_report_id: report.id },
    "PhotoView-Feature-Dispatcher",
  )
  if (dispatch !== "dispatched") {
    await recordOperationalEvent({
      category: "SYSTEM",
      fingerprint: `feedback:feature-dispatch:${report.id}`,
      message: dispatch === "not_configured"
        ? `Approved feature implementation dispatch is not configured for report ${report.id}.`
        : `GitHub feature implementation dispatch failed for report ${report.id}.`,
      severity: "ERROR",
      source: "feedback-workflow",
      workspaceId: report.workspaceId,
    })
    return dispatch
  }
  await resolveOperationalEventByFingerprint(`feedback:feature-dispatch:${report.id}`)
  return dispatch
}

export async function declineFeatureRequest({ reportId, resolutionNote }: { reportId: string; resolutionNote?: string | null }) {
  const prisma = getPrismaClient()
  const report = await prisma.subscriberFeedbackReport.findUnique({ where: { id: reportId } })
  if (!report || report.type !== "improvement") throw new Error("Feature request not found.")
  if (report.status === "DECLINED") return { state: "already_declined" as const }
  const ownerNote = resolutionNote?.trim() || "This request is not being added at this time because it would not provide enough benefit across the PhotoView community."
  const body = [
    `Hi ${report.reporterName},`,
    "",
    "Thank you for taking the time to share your suggestion with PhotoView.io.",
    "",
    "After reviewing it, we have decided not to make this change at this time because we do not believe it would provide enough benefit across the PhotoView community to justify changing the platform.",
    "",
    "We genuinely appreciate the idea. Suggestions like yours help us understand what photographers need and make PhotoView better for everyone.",
    "",
    "Kind regards,",
    "PhotoView.io Support",
  ].join("\n")
  const queued = await queueSupportEmail({
    body,
    deliveryKey: `feedback-feature-declined:${report.id}`,
    recipientName: report.reporterName,
    reportId: report.id,
    resolutionNote: ownerNote,
    source: "feedback_feature_declined",
    subject: "Thank you for your PhotoView suggestion",
    targetReportStatus: "DECLINED",
    toEmail: report.reporterEmail,
  })
  await prisma.subscriberFeedbackReport.update({
    data: {
      escalationReason: null,
      leaseExpiresAt: null,
      leaseId: null,
      lifecycleState: "RESPONSE_QUEUED",
      resolutionNote: ownerNote,
    },
    where: { id: report.id },
  })
  return { outboxId: queued.id, state: queued.state }
}

export async function finalizeFeatureImplementation({
  leaseId,
  reportId,
  resolutionNote,
}: {
  leaseId?: string | null
  reportId: string
  resolutionNote?: string | null
}) {
  const prisma = getPrismaClient()
  const report = await prisma.subscriberFeedbackReport.findUnique({ where: { id: reportId } })
  if (!report || report.type !== "improvement") throw new Error("Feature request not found.")
  if (leaseId && report.leaseId !== leaseId) throw new Error("The feature implementation lease is no longer current.")
  if (report.status === "IMPLEMENTED") return { state: "already_implemented" as const }
  const summary = resolutionNote?.trim() || "The approved feature is now available in PhotoView.io."
  const body = [
    `Hi ${report.reporterName},`,
    "",
    "Your PhotoView.io feature suggestion has been implemented and is now available.",
    summary,
    "",
    "Thank you for helping make PhotoView a better platform for every photographer.",
    "",
    "Kind regards,",
    "PhotoView.io Support",
  ].join("\n")
  const queued = await queueSupportEmail({
    body,
    deliveryKey: `feedback-feature-implemented:${report.id}`,
    recipientName: report.reporterName,
    reportId: report.id,
    resolutionNote: summary,
    source: "feedback_feature_implemented",
    subject: "Your PhotoView suggestion is now available",
    targetReportStatus: "IMPLEMENTED",
    toEmail: report.reporterEmail,
  })
  await prisma.subscriberFeedbackReport.update({
    data: {
      leaseExpiresAt: null,
      leaseId: null,
      lifecycleState: "IMPLEMENTATION_VERIFIED",
      resolutionNote: summary,
    },
    where: { id: report.id },
  })
  await resolveOperationalEventByFingerprint(`feedback:repair:${report.id}`)
  return { outboxId: queued.id, state: queued.state }
}

export async function finalizeBugRepair({
  leaseId,
  reportId,
  resolutionNote,
}: {
  leaseId?: string | null
  reportId: string
  resolutionNote?: string | null
}) {
  const prisma = getPrismaClient()
  const report = await prisma.subscriberFeedbackReport.findUnique({ where: { id: reportId } })
  if (!report || report.type !== "bug") throw new Error("Bug report not found.")
  if (leaseId && report.leaseId !== leaseId) throw new Error("The bug repair lease is no longer current.")
  if (report.status === "FIXED") {
    await resolveOperationalEventByFingerprint(`feedback:repair:${report.id}`)
    return { state: "already_fixed" as const }
  }

  const [latestInbound, previousFixedNotice] = await Promise.all([
    prisma.supportCaseMessage.findFirst({
      orderBy: { receivedAt: "desc" },
      select: { providerMessageId: true },
      where: { direction: "INBOUND", reportId: report.id },
    }),
    prisma.supportEmailOutbox.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true },
      where: { reportId: report.id, source: "feedback_bug_fixed" },
    }),
  ])
  const deliveryKey = previousFixedNotice && latestInbound
    ? `feedback-bug-fixed:${report.id}:${latestInbound.providerMessageId}`
    : `feedback-bug-fixed:${report.id}`

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
    deliveryKey,
    recipientName: report.reporterName,
    reportId: report.id,
    resolutionNote: resolutionNote?.trim() || null,
    source: "feedback_bug_fixed",
    subject: "Your PhotoView.io bug report has been fixed",
    targetReportStatus: "FIXED",
    toEmail: report.reporterEmail,
  })
  await prisma.subscriberFeedbackReport.update({
    data: {
      leaseExpiresAt: null,
      leaseId: null,
      lifecycleState: "REPAIR_VERIFIED",
      resolutionNote: resolutionNote?.trim() || null,
    },
    where: { id: report.id },
  })
  await resolveOperationalEventByFingerprint(`feedback:repair:${report.id}`)
  return { outboxId: queued.id, state: queued.state }
}
