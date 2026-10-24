import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrimarySuperAdminEmail } from "@/lib/admin-access"
import { getPrismaClient } from "@/lib/db"
import { validateFeedbackAttachment } from "@/lib/feedback-attachment-safety"
import { dispatchAutomatedBugRepair, feedbackInitialStatus } from "@/lib/feedback-workflow"
import { recordOperationalEvent } from "@/lib/operational-monitoring"
import { checkRequestRateLimit } from "@/lib/request-rate-limit"

export const dynamic = "force-dynamic"

const MAX_TOTAL_ATTACHMENT_BYTES = 3 * 1024 * 1024
const MAX_REQUEST_BYTES = 4_300_000

const attachmentSchema = z.object({
  base64: z.string().min(1).max(4_200_000).regex(/^[A-Za-z0-9+/=]+$/),
  contentType: z.string().trim().min(1).max(120),
  filename: z.string().trim().min(1).max(180),
})

const feedbackSchema = z.object({
  attachments: z.array(attachmentSchema).max(5).optional().default([]),
  message: z.string().trim().min(1).max(8_000),
  pageUrl: z.string().trim().url().max(2_048).refine((value) => /^https?:\/\//i.test(value), "Invalid page URL").optional(),
  reporterEmail: z.string().trim().email().max(320).optional().or(z.literal("")),
  reporterName: z.string().trim().max(120).optional().or(z.literal("")),
  screenshot: attachmentSchema.optional(),
  type: z.enum(["bug", "improvement", "question", "feedback"]),
})

const typeLabels: Record<z.infer<typeof feedbackSchema>["type"], string> = {
  bug: "Bug",
  feedback: "Feedback",
  improvement: "Improvement",
  question: "Question",
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function decodedBytes(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: "Please sign in before sending feedback." }, { status: 401 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "The attached files are too large to send." }, { status: 413 })
  }

  const rateLimit = await checkRequestRateLimit(`feedback:${session.user.workspaceId}`, 5, 30 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many feedback messages were sent. Please try again later." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a feedback type and describe what happened." }, { status: 400 })
  }

  const files = [parsed.data.screenshot, ...parsed.data.attachments].filter(
    (attachment): attachment is z.infer<typeof attachmentSchema> => Boolean(attachment),
  )
  const totalAttachmentBytes = files.reduce((sum, attachment) => sum + decodedBytes(attachment.base64), 0)
  if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "The screenshot and attached files must be 3 MB or smaller in total." }, { status: 413 })
  }
  if (files.some((attachment) => !validateFeedbackAttachment(attachment))) {
    return NextResponse.json(
      { error: "Attachments must be valid JPEG, PNG, WebP, or plain-text files." },
      { status: 415 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL
  const supportDestination = process.env.SUPPORT_EMAIL?.trim() || "support@photoview.io"
  if (!apiKey || !from) {
    return NextResponse.json({ error: "Feedback delivery is temporarily unavailable." }, { status: 503 })
  }

  const feedbackType = typeLabels[parsed.data.type]
  const reporterEmail = parsed.data.reporterEmail || session.user.email
  const reporterName = parsed.data.reporterName || session.user.name || "PhotoView.io subscriber"
  const workspaceLabel = session.user.workspaceSlug || session.user.workspaceId
  const report = await getPrismaClient().subscriberFeedbackReport.create({
    data: {
      attachmentCount: files.length,
      message: parsed.data.message,
      pageUrl: parsed.data.pageUrl || null,
      reporterEmail,
      reporterName,
      status: feedbackInitialStatus[parsed.data.type],
      type: parsed.data.type,
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      workspaceLabel,
    },
  })
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://photoview.io").replace(/\/+$/, "")
  const adminReportUrl = `${appUrl}/admin/feedback?report=${encodeURIComponent(report.id)}`
  const isFeatureRequest = parsed.data.type === "improvement"
  const alertDestination = isFeatureRequest ? getPrimarySuperAdminEmail() : supportDestination
  const workflowInstruction = parsed.data.type === "bug"
    ? "This bug is in the repair queue. Verify the problem, repair it safely, run the relevant checks, and mark it fixed only after verification. The subscriber will then receive the fixed confirmation automatically."
    : isFeatureRequest
      ? "Approval required. Do not implement this feature until Mitch approves it."
      : "Review and respond as appropriate."
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      attachments: files.map((attachment) => ({
        content: attachment.base64,
        content_type: attachment.contentType,
        filename: attachment.filename.replace(/[\r\n]/g, " "),
      })),
      from,
      html: `
        <h1>PhotoView.io ${escapeHtml(feedbackType)}</h1>
        <table style="border-collapse:collapse;max-width:720px;width:100%">
          <tr><td style="padding:6px 12px 6px 0;color:#6b6257">Subscriber</td><td>${escapeHtml(reporterName)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b6257">Email</td><td>${escapeHtml(reporterEmail)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b6257">User ID</td><td>${escapeHtml(session.user.id)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b6257">Workspace</td><td>${escapeHtml(workspaceLabel)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#6b6257">Report ID</td><td>${escapeHtml(report.id)}</td></tr>
          ${parsed.data.pageUrl ? `<tr><td style="padding:6px 12px 6px 0;color:#6b6257">Page</td><td>${escapeHtml(parsed.data.pageUrl)}</td></tr>` : ""}
        </table>
        <div style="margin-top:16px;border:1px solid #ded8cc;border-radius:8px;background:#fbfaf7;padding:16px;white-space:pre-wrap">${escapeHtml(parsed.data.message)}</div>
        <div style="margin-top:16px;border-left:4px solid #b98225;background:#fff8e8;padding:14px 16px"><strong>Workflow</strong><br>${escapeHtml(workflowInstruction)}</div>
        <p style="margin-top:18px"><a href="${escapeHtml(adminReportUrl)}">Open the tracked report</a></p>
      `,
      reply_to: reporterEmail,
      subject: parsed.data.type === "bug"
        ? `[PhotoView.io Bug ${report.id}] Repair required`
        : isFeatureRequest
          ? `[PhotoView.io Feature ${report.id}] Approval required`
          : `[PhotoView.io ${feedbackType} ${report.id}] Subscriber feedback`,
      text: [
        `Type: ${feedbackType}`,
        `Subscriber: ${reporterName} <${reporterEmail}>`,
        `User ID: ${session.user.id}`,
        `Workspace: ${workspaceLabel}`,
        `Report ID: ${report.id}`,
        parsed.data.pageUrl ? `Page: ${parsed.data.pageUrl}` : "",
        "",
        parsed.data.message,
        "",
        `Workflow: ${workflowInstruction}`,
        `Tracked report: ${adminReportUrl}`,
      ].filter(Boolean).join("\n"),
      to: alertDestination,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `feedback-alert:${report.id}`,
    },
    method: "POST",
  })

  if (!response.ok) {
    await getPrismaClient().subscriberFeedbackReport.update({
      data: { status: "ALERT_DELIVERY_FAILED" },
      where: { id: report.id },
    })
    console.error("Subscriber feedback delivery failed", { status: response.status })
    return NextResponse.json({ error: "Your feedback could not be delivered. Please try again." }, { status: 502 })
  }

  let repairDispatch: "dispatched" | "failed" | "not_configured" | null = null
  if (parsed.data.type === "bug") {
    try {
      repairDispatch = await dispatchAutomatedBugRepair(report)
    } catch (error) {
      repairDispatch = "failed"
      await recordOperationalEvent({
        category: "SYSTEM",
        fingerprint: `feedback:repair-dispatch:${report.id}`,
        message: error instanceof Error ? error.message : `Automated repair dispatch failed for ${report.id}.`,
        severity: "ERROR",
        source: "/api/feedback",
        workspaceId: report.workspaceId,
      })
    }
  }

  return NextResponse.json({ delivered: true, repairDispatch, reportId: report.id, type: parsed.data.type })
}
