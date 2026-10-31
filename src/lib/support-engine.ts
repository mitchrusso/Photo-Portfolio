import { createHash, randomUUID } from "node:crypto"

import { rankAiHelpRecipes } from "@/lib/ai-help-recipes"
import { getPrismaClient } from "@/lib/db"
import { dispatchAutomatedBugRepair, feedbackInitialStatus, type FeedbackReportType } from "@/lib/feedback-workflow"
import { getSupportBrand, type SupportBrandKey } from "@/lib/support-brands"
import { getSupportInboundMessage, listSupportInboxMessageIds } from "@/lib/support-gmail"

const CASE_LEASE_MS = 30 * 60 * 1000
const SUPPORT_BACKFILL_START = new Date("2026-10-25T00:00:00.000Z")

type SupportAttachmentInput = {
  contentType: string
  filename: string
  payloadBase64?: string | null
  providerRef?: string | null
  sizeBytes: number
}

export type CreateSupportCaseInput = {
  attachments?: SupportAttachmentInput[]
  brandKey?: SupportBrandKey
  gmailMessageId?: string | null
  gmailThreadId?: string | null
  gmailRfcMessageId?: string | null
  intakeKey: string
  message: string
  pageUrl?: string | null
  providerReceivedAt?: Date | null
  reporterEmail: string
  reporterName: string
  source: "GMAIL" | "IN_APP"
  subject?: string | null
  type: FeedbackReportType
  userId?: string | null
  workspaceId?: string | null
  workspaceLabel?: string | null
}

function clean(value: string, max: number) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max)
}

function acknowledgment(input: Pick<CreateSupportCaseInput, "reporterName" | "type">, reportId: string) {
  const greeting = `Hi ${clean(input.reporterName, 120) || "there"},`
  const closing = ["", `Your reference number is ${reportId}.`, "", "Best,", "PhotoView.io Support"]
  const message = input.type === "bug"
    ? [
        "Thank you for reporting this. We saved your report and have started checking the problem.",
        "We will follow up after the problem has been reproduced, corrected, and checked on PhotoView.io.",
      ]
    : input.type === "improvement"
      ? [
          "Thank you for the suggestion. We saved it and shared it for product review.",
          "Suggestions are reviewed before any product change is approved, and we will follow up if there is an update.",
        ]
      : input.type === "question"
        ? [
            "Thank you for your question. We saved it and are checking the current PhotoView.io behavior and your account details before answering.",
            "We will send a complete answer as soon as that review is finished.",
          ]
        : [
            "Thank you for the feedback. We saved it for review.",
            "If your note requires an answer or a product decision, we will follow up with the result.",
          ]
  return [greeting, "", ...message, ...closing].join("\n")
}

function acknowledgmentSubject(type: FeedbackReportType) {
  if (type === "bug") return "We received your PhotoView.io bug report"
  if (type === "improvement") return "We received your PhotoView.io suggestion"
  if (type === "question") return "We received your PhotoView.io question"
  return "We received your PhotoView.io feedback"
}

function alertKind(type: FeedbackReportType) {
  if (type === "improvement") return "FEATURE_REVIEW"
  if (type === "question") return "QUESTION_REVIEW"
  if (type === "feedback") return "FEEDBACK_REVIEW"
  return "BUG_REPAIR"
}

function lifecycleAfterIntake(type: FeedbackReportType) {
  if (type === "improvement") return "AWAITING_PRODUCT_REVIEW"
  if (type === "question" || type === "feedback") return "ESCALATED"
  return "QUEUED"
}

export function verifiedSupportAnswer(question: string) {
  const risky = /\b(account|billing|charge|payment|refund|cancel|delete|security|privacy|password|sign in|login|domain ownership)\b/i.test(question)
  if (risky) return null
  const [first, second] = rankAiHelpRecipes(question)
  if (!first || first.score < 100 || first.score - (second?.score ?? 0) < 15) return null
  return {
    body: [
      `Here is how to ${first.recipe.topic.toLowerCase()}:`,
      "",
      ...first.recipe.steps.map((step, index) => `${index + 1}. ${step}`),
      "",
      "If these steps do not match what you see, reply to this message and we will check your account.",
      "",
      "Best,",
      "PhotoView.io Support",
    ].join("\n"),
    recipeId: first.recipe.id,
  }
}

export function classifySupportMessage(subject: string, body: string): FeedbackReportType {
  const value = `${subject}\n${body}`.toLowerCase()
  if (/\b(feature request|suggestion|would be (?:great|helpful)|please add|could you add|wish (?:i|we) could)\b/.test(value)) return "improvement"
  if (/\b(error|bug|broken|doesn'?t work|not working|crash|failed|failure|404|unable to|cannot|can'?t sign in|timeout)\b/.test(value)) return "bug"
  if (/\?|\b(how do i|how can i|where (?:is|do)|can i|what is|why does|help me)\b/.test(value)) return "question"
  return "feedback"
}

function ignoreMailboxMessage(fromEmail: string, subject: string) {
  const value = `${fromEmail} ${subject}`.toLowerCase()
  return /mailer-daemon|postmaster|delivery status notification|undeliverable|do-not-reply|donotreply|no-reply/.test(value)
}

function isMailboxBounce(fromEmail: string, subject: string) {
  const value = `${fromEmail} ${subject}`.toLowerCase()
  return /mailer-daemon|postmaster|delivery status notification|undeliverable/.test(value)
}

async function recordMailboxBounce(reportId: string, providerMessageId: string) {
  const prisma = getPrismaClient()
  const brand = getSupportBrand()
  await prisma.$transaction(async (tx) => {
    await tx.supportEmailOutbox.updateMany({
      data: { lastError: "GMAIL_BOUNCE", providerStatus: "BOUNCED", status: "FAILED" },
      where: { reportId, status: { in: ["SENT", "DELIVERED"] } },
    })
    await tx.subscriberFeedbackReport.update({
      data: {
        escalatedAt: new Date(),
        escalationReason: "The subscriber email bounced and needs another contact path.",
        lifecycleState: "ESCALATED",
        resolvedAt: null,
      },
      where: { id: reportId },
    })
    await tx.supportAlert.upsert({
      create: {
        adminUrl: `${brand.adminUrl}?report=${encodeURIComponent(reportId)}`,
        brandKey: brand.key,
        deliveries: { create: [{ brandKey: brand.key, channel: "EMAIL" }, { brandKey: brand.key, channel: "SMS" }] },
        eventKey: `support-bounce:${providerMessageId}`,
        kind: "DELIVERY_FAILURE",
        reportId,
        summary: `A subscriber response for support case ${reportId} bounced and needs attention.`,
      },
      update: {},
      where: { eventKey: `support-bounce:${providerMessageId}` },
    })
  })
}

export async function createSupportCase(input: CreateSupportCaseInput) {
  const prisma = getPrismaClient()
  const brand = getSupportBrand(input.brandKey)
  const intakeKey = clean(input.intakeKey, 240)
  if (!intakeKey) throw new Error("A durable support intake key is required.")
  const existing = await prisma.subscriberFeedbackReport.findUnique({ where: { intakeKey } })
  if (existing) return { report: existing, state: "duplicate" as const }

  const message = clean(input.message, 20_000)
  const caseType = input.type === "feedback"
    ? classifySupportMessage(input.subject ?? "", message)
    : input.type
  const reporterEmail = input.reporterEmail.trim().toLowerCase().slice(0, 320)
  const reporterName = clean(input.reporterName, 120) || "PhotoView.io subscriber"
  const attachments = input.attachments ?? []
  const automaticAnswer = caseType === "question" ? verifiedSupportAnswer(message) : null

  let report
  try {
    report = await prisma.$transaction(async (tx) => {
    const created = await tx.subscriberFeedbackReport.create({
      data: {
        attachmentCount: attachments.length,
        brandKey: brand.key,
        escalationReason: !automaticAnswer && (caseType === "question" || caseType === "feedback") ? "A support review is required before a complete answer." : null,
        escalatedAt: !automaticAnswer && (caseType === "question" || caseType === "feedback") ? new Date() : null,
        gmailMessageId: input.gmailMessageId || null,
        gmailThreadId: input.gmailThreadId || null,
        intakeKey,
        lifecycleState: automaticAnswer ? "RESPONSE_QUEUED" : lifecycleAfterIntake(caseType),
        message,
        pageUrl: input.pageUrl || null,
        reporterEmail,
        reporterName,
        source: input.source,
        status: feedbackInitialStatus[caseType],
        type: caseType,
        userId: input.userId || null,
        workspaceId: input.workspaceId || null,
        workspaceLabel: input.workspaceLabel || null,
      },
    })

    if (attachments.length > 0) {
      await tx.supportCaseAttachment.createMany({
        data: attachments.map((attachment) => {
          const payload = attachment.payloadBase64 ? Buffer.from(attachment.payloadBase64, "base64") : null
          return {
            contentType: clean(attachment.contentType, 120) || "application/octet-stream",
            filename: clean(attachment.filename, 180) || "attachment",
            payload,
            providerRef: attachment.providerRef ? clean(attachment.providerRef, 500) : null,
            reportId: created.id,
            sha256: createHash("sha256").update(payload ?? `${attachment.providerRef ?? ""}:${attachment.sizeBytes}`).digest("hex"),
            sizeBytes: Math.max(0, attachment.sizeBytes),
          }
        }),
      })
    }

    if (input.gmailMessageId && input.gmailThreadId) {
      await tx.supportCaseMessage.create({
        data: {
          body: message,
          direction: "INBOUND",
          providerMessageId: input.gmailMessageId,
          providerThreadId: input.gmailThreadId,
          rfcMessageId: input.gmailRfcMessageId || null,
          receivedAt: input.providerReceivedAt ?? new Date(),
          reportId: created.id,
          senderEmail: reporterEmail,
          senderName: reporterName,
          subject: input.subject ? clean(input.subject, 240) : null,
        },
      })
    }

    await tx.supportEmailOutbox.create({
      data: {
        body: automaticAnswer
          ? [`Hi ${reporterName},`, "", automaticAnswer.body, "", `Reference: ${created.id}`].join("\n")
          : acknowledgment({ reporterName, type: caseType }, created.id),
        brandKey: brand.key,
        deliveryKey: `support-ack:${created.id}`,
        gmailThreadId: input.gmailThreadId || null,
        inReplyTo: input.gmailRfcMessageId || null,
        recipientName: reporterName,
        reportId: created.id,
        resolutionNote: automaticAnswer ? `Answered from verified help recipe ${automaticAnswer.recipeId}.` : null,
        source: automaticAnswer ? "support_verified_answer" : "support_case_acknowledgment",
        subject: input.source === "GMAIL" && input.subject
          ? `Re: ${clean(input.subject.replace(/^re:\s*/i, ""), 230)}`
          : automaticAnswer ? "Your PhotoView.io answer" : acknowledgmentSubject(caseType),
        targetReportStatus: automaticAnswer ? "ANSWERED" : null,
        toEmail: reporterEmail,
      },
    })

    await tx.supportAlert.create({
      data: {
        adminUrl: `${brand.adminUrl}?report=${encodeURIComponent(created.id)}`,
        brandKey: brand.key,
        deliveries: {
          create: [
            { brandKey: brand.key, channel: "EMAIL" },
            { brandKey: brand.key, channel: "SMS" },
          ],
        },
        eventKey: `support-case:${created.id}`,
        kind: alertKind(caseType),
        reportId: created.id,
        summary: `New ${caseType === "improvement" ? "feature suggestion" : caseType} case ${created.id} received through ${input.source === "GMAIL" ? "support email" : "PhotoView.io"}.`,
      },
    })
      return created
    })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const duplicate = await prisma.subscriberFeedbackReport.findUnique({ where: { intakeKey } })
      if (duplicate) return { report: duplicate, state: "duplicate" as const }
    }
    throw error
  }

  return { report, state: "created" as const }
}

async function appendMailboxReply(message: Awaited<ReturnType<typeof getSupportInboundMessage>>, reportId: string) {
  const prisma = getPrismaClient()
  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.supportCaseMessage.findUnique({ where: { providerMessageId: message.messageId } })
    if (duplicate) return "duplicate" as const
    await tx.supportCaseMessage.create({
      data: {
        body: message.body,
        direction: "INBOUND",
        providerMessageId: message.messageId,
        providerThreadId: message.threadId,
        rfcMessageId: message.rfcMessageId,
        receivedAt: message.receivedAt,
        reportId,
        senderEmail: message.fromEmail,
        senderName: message.fromName,
        subject: message.subject,
      },
    })
    await tx.subscriberFeedbackReport.update({
      data: {
        escalatedAt: new Date(),
        escalationReason: "The subscriber replied and needs a follow-up.",
        lifecycleState: "ESCALATED",
        resolvedAt: null,
        status: "RECEIVED",
      },
      where: { id: reportId },
    })
    await tx.supportAlert.create({
      data: {
        adminUrl: `${getSupportBrand().adminUrl}?report=${encodeURIComponent(reportId)}`,
        brandKey: "photoview",
        deliveries: { create: [{ brandKey: "photoview", channel: "EMAIL" }, { brandKey: "photoview", channel: "SMS" }] },
        eventKey: `support-reply:${message.messageId}`,
        kind: "SUBSCRIBER_REPLY",
        reportId,
        summary: `Subscriber reply received for support case ${reportId}.`,
      },
    })
    return "appended" as const
  })
}

export async function syncSupportMailbox(options: { after?: Date; limit?: number } = {}) {
  const prisma = getPrismaClient()
  const listing = await listSupportInboxMessageIds({
    after: options.after && options.after > SUPPORT_BACKFILL_START ? options.after : SUPPORT_BACKFILL_START,
    limit: options.limit ?? 5_000,
  })
  if (!listing.configured) return { configured: false, created: 0, ignored: 0, replies: 0 }
  let created = 0
  let ignored = 0
  let replies = 0
  let inspected = 0
  for (const candidate of [...listing.messages].reverse()) {
    const known = await prisma.supportCaseMessage.findUnique({ where: { providerMessageId: candidate.id } })
      ?? await prisma.subscriberFeedbackReport.findUnique({ where: { gmailMessageId: candidate.id } })
      ?? await prisma.supportMailboxReceipt.findUnique({ where: { messageId: candidate.id } })
    if (known) continue
    if (inspected >= 50) break
    inspected += 1
    const message = await getSupportInboundMessage(candidate.id)
    const threadCase = await prisma.subscriberFeedbackReport.findFirst({
      orderBy: { createdAt: "desc" },
      where: { gmailThreadId: message.threadId },
    })
    if (threadCase && isMailboxBounce(message.fromEmail, message.subject)) {
      await recordMailboxBounce(threadCase.id, message.messageId)
      await prisma.supportMailboxReceipt.upsert({
        create: { disposition: "BOUNCE", messageId: message.messageId, receivedAt: message.receivedAt },
        update: {},
        where: { messageId: message.messageId },
      })
      ignored += 1
      continue
    }
    if (ignoreMailboxMessage(message.fromEmail, message.subject)) {
      await prisma.supportMailboxReceipt.upsert({
        create: { disposition: "IGNORED_AUTOMATED", messageId: message.messageId, receivedAt: message.receivedAt },
        update: {},
        where: { messageId: message.messageId },
      })
      ignored += 1
      continue
    }
    if (threadCase) {
      const result = await appendMailboxReply(message, threadCase.id)
      if (result === "appended") replies += 1
      continue
    }
    const result = await createSupportCase({
      attachments: message.attachments,
      gmailMessageId: message.messageId,
      gmailRfcMessageId: message.rfcMessageId,
      gmailThreadId: message.threadId,
      intakeKey: `gmail:${message.messageId}`,
      message: message.body,
      providerReceivedAt: message.receivedAt,
      reporterEmail: message.fromEmail,
      reporterName: message.fromName || "PhotoView.io subscriber",
      source: "GMAIL",
      subject: message.subject,
      type: classifySupportMessage(message.subject, message.body),
    })
    if (result.state === "created") created += 1
  }
  return { configured: true, created, ignored, replies }
}

function retryAt(attemptCount: number, now: Date) {
  return new Date(now.getTime() + Math.min(6 * 60, 2 ** Math.max(0, attemptCount - 1) * 5) * 60 * 1000)
}

export async function processSupportCaseQueue(options: { limit?: number; now?: Date } = {}) {
  const prisma = getPrismaClient()
  const now = options.now ?? new Date()
  const limit = Math.min(25, Math.max(1, options.limit ?? 10))
  const due = await prisma.subscriberFeedbackReport.findMany({
    orderBy: { createdAt: "asc" },
    take: limit,
    where: {
      OR: [
        { lifecycleState: { in: ["QUEUED", "RETRYING"] }, nextAttemptAt: { lte: now } },
        { leaseExpiresAt: { lte: now }, lifecycleState: "PROCESSING" },
      ],
    },
  })
  const outcomes: Array<{ id: string; state: string }> = []
  for (const candidate of due) {
    const leaseId = randomUUID()
    const claim = await prisma.subscriberFeedbackReport.updateMany({
      data: {
        attemptCount: { increment: 1 },
        leaseExpiresAt: new Date(now.getTime() + CASE_LEASE_MS),
        leaseId,
        lifecycleState: "PROCESSING",
      },
      where: {
        id: candidate.id,
        OR: [
          { lifecycleState: { in: ["QUEUED", "RETRYING"] }, nextAttemptAt: { lte: now } },
          { leaseExpiresAt: { lte: now }, lifecycleState: "PROCESSING" },
        ],
      },
    })
    if (claim.count !== 1) continue
    try {
      if (candidate.type === "bug") {
        const dispatch = await dispatchAutomatedBugRepair(candidate)
        if (dispatch !== "dispatched") throw new Error(`Bug repair dispatch is ${dispatch}.`)
        await prisma.subscriberFeedbackReport.update({
          data: { leaseExpiresAt: null, leaseId: null, lifecycleState: "REPAIR_IN_PROGRESS" },
          where: { id: candidate.id, leaseId },
        })
        outcomes.push({ id: candidate.id, state: "repair_dispatched" })
      } else {
        const state = candidate.type === "improvement" ? "AWAITING_PRODUCT_REVIEW" : "ESCALATED"
        await prisma.subscriberFeedbackReport.update({
          data: {
            escalatedAt: candidate.escalatedAt ?? now,
            escalationReason: candidate.escalationReason ?? "A support review is required before a complete response.",
            leaseExpiresAt: null,
            leaseId: null,
            lifecycleState: state,
          },
          where: { id: candidate.id, leaseId },
        })
        outcomes.push({ id: candidate.id, state: state.toLowerCase() })
      }
    } catch (error) {
      const attemptCount = candidate.attemptCount + 1
      await prisma.subscriberFeedbackReport.update({
        data: {
          escalationReason: clean(error instanceof Error ? error.message : "Support processing failed.", 500),
          leaseExpiresAt: null,
          leaseId: null,
          lifecycleState: attemptCount >= 8 ? "ESCALATED" : "RETRYING",
          nextAttemptAt: retryAt(attemptCount, now),
        },
        where: { id: candidate.id, leaseId },
      })
      outcomes.push({ id: candidate.id, state: attemptCount >= 8 ? "escalated" : "retrying" })
    }
  }
  return outcomes
}
