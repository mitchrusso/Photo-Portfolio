import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { validateFeedbackAttachment } from "@/lib/feedback-attachment-safety"
import { dispatchAutomatedBugRepair } from "@/lib/feedback-workflow"
import { recordOperationalEvent } from "@/lib/operational-monitoring"
import { checkRequestRateLimit } from "@/lib/request-rate-limit"
import { deliverSupportAlerts } from "@/lib/support-alerts"
import { deliverSupportEmailOutbox } from "@/lib/support-email-outbox"
import { createSupportCase } from "@/lib/support-engine"

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
  submissionId: z.string().uuid().optional(),
  type: z.enum(["bug", "improvement", "question", "feedback"]),
})

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

  const reporterEmail = parsed.data.reporterEmail || session.user.email
  const reporterName = parsed.data.reporterName || session.user.name || "PhotoView.io subscriber"
  const workspaceLabel = session.user.workspaceSlug || session.user.workspaceId
  const fallbackKey = createHash("sha256")
    .update([session.user.id, parsed.data.type, parsed.data.message, String(Math.floor(Date.now() / 600_000))].join("|"))
    .digest("hex")
  const intake = await createSupportCase({
    attachments: files.map((attachment) => ({
      contentType: attachment.contentType,
      filename: attachment.filename,
      payloadBase64: attachment.base64,
      sizeBytes: decodedBytes(attachment.base64),
    })),
    intakeKey: `in-app:${parsed.data.submissionId ?? fallbackKey}`,
    message: parsed.data.message,
    pageUrl: parsed.data.pageUrl || null,
    reporterEmail,
    reporterName,
    source: "IN_APP",
    type: parsed.data.type,
    userId: session.user.id,
    workspaceId: session.user.workspaceId,
    workspaceLabel,
  })
  const report = intake.report

  let repairDispatch: "dispatched" | "failed" | "not_configured" | null = null
  if (parsed.data.type === "bug" && intake.state === "created") {
    try {
      repairDispatch = await dispatchAutomatedBugRepair(report)
      if (repairDispatch === "dispatched") {
        await getPrismaClient().subscriberFeedbackReport.update({
          data: { lifecycleState: "REPAIR_IN_PROGRESS" },
          where: { id: report.id },
        })
      }
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
  await Promise.allSettled([
    deliverSupportEmailOutbox({ limit: 5 }),
    deliverSupportAlerts({ limit: 4 }),
  ])
  return NextResponse.json({ accepted: true, repairDispatch, reportId: report.id, type: parsed.data.type })
}
