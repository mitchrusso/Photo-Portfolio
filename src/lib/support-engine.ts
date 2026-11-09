import { createHash, randomUUID } from "node:crypto"

import { rankAiHelpRecipes } from "@/lib/ai-help-recipes"
import { classifySupportMessage, isBenignClosingReply, isResolvedSupportStatus, supportReplyTransition } from "@/lib/support-case-state"
import { getPrismaClient } from "@/lib/db"
import { dispatchAutomatedBugRepair, feedbackInitialStatus, type FeedbackReportType } from "@/lib/feedback-workflow"
import { getSupportBrand, type SupportBrandKey } from "@/lib/support-brands"
import { getSupportInboundMessage, listSupportInboxMessageIds, listSupportOwnerReplyMessageIds, supportGmailMessageId } from "@/lib/support-gmail"
import { ignoreSupportMailboxMessage } from "@/lib/support-mail-filter"
import { supportOwnerFeatureDecision, supportOwnerReplyText } from "@/lib/support-owner-reply"

const CASE_LEASE_MS = 30 * 60 * 1000
const PLAIN_TEXT_RECOVERY_SOURCE = "support_delivery_recovery_plain_text"
// The durable mailbox worker was enabled on 2026-10-31. Never move this
// default backwards: doing so would turn already-handled historical inbox mail
// into new cases and queue duplicate subscriber acknowledgments.
export const SUPPORT_BACKFILL_START = new Date(
  process.env.SUPPORT_MAILBOX_BACKFILL_START?.trim() || "2026-10-31T16:35:32.000Z",
)
// Owner alerts moved into the support mailbox on 2026-11-09. Do not scan
// older Sent mail as owner replies; those alerts used a separate recipient.
export const SUPPORT_SELF_ROUTING_START = new Date(
  process.env.SUPPORT_SELF_ROUTING_START?.trim() || "2026-11-09T18:45:00.000Z",
)

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

function isMailboxBounce(fromEmail: string, subject: string) {
  const value = `${fromEmail} ${subject}`.toLowerCase()
  return /mailer-daemon|postmaster|delivery status notification|undeliverable/.test(value)
}

async function recordMailboxBounce(reportId: string, providerMessageId: string) {
  const prisma = getPrismaClient()
  const brand = getSupportBrand()
  await prisma.$transaction(async (tx) => {
    const bounced = await tx.supportEmailOutbox.findFirst({
      orderBy: { createdAt: "desc" },
      where: {
        reportId,
        source: { not: "support_resolution_owner_copy" },
        status: { in: ["SENT", "DELIVERED"] },
      },
    })
    await tx.supportEmailOutbox.updateMany({
      data: { lastError: "GMAIL_BOUNCE", providerStatus: "BOUNCED", status: "FAILED" },
      where: { reportId, status: { in: ["SENT", "DELIVERED"] } },
    })
    if (bounced && bounced.source !== PLAIN_TEXT_RECOVERY_SOURCE) {
      const deliveryKey = `${bounced.deliveryKey}:plain-text-recovery`.slice(0, 240)
      await tx.supportEmailOutbox.upsert({
        create: {
          body: bounced.body,
          brandKey: bounced.brandKey,
          deliveryKey,
          gmailThreadId: bounced.gmailThreadId,
          inReplyTo: bounced.inReplyTo,
          recipientName: bounced.recipientName,
          reportId: bounced.reportId,
          resolutionNote: bounced.resolutionNote,
          source: PLAIN_TEXT_RECOVERY_SOURCE,
          subject: bounced.subject,
          targetReportStatus: bounced.targetReportStatus,
          toEmail: bounced.toEmail,
        },
        update: {},
        where: { deliveryKey },
      })
    }
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
        deliveries: { create: [{ brandKey: brand.key, channel: "EMAIL" }] },
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
        deliveries: { create: [{ brandKey: brand.key, channel: "EMAIL" }] },
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
  const replyType = classifySupportMessage(message.subject, message.body)
  const automaticAnswer = replyType === "question" ? verifiedSupportAnswer(message.body) : null
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
    const report = await tx.subscriberFeedbackReport.findUnique({
      select: { message: true, status: true, type: true },
      where: { id: reportId },
    })
    const recordsClosureWithoutReopening = Boolean(report && isBenignClosingReply(message.body))
    if (recordsClosureWithoutReopening) return "recorded_closure" as const
    if (!report) throw new Error("Support case not found for mailbox reply.")
    const transition = supportReplyTransition(report, message)
    if (automaticAnswer) {
      const subject = `Re: ${message.subject.replace(/^re:\s*/i, "")}`.slice(0, 240)
      await tx.subscriberFeedbackReport.update({
        data: {
          ...transition,
          escalatedAt: null,
          escalationReason: null,
          lifecycleState: "RESPONSE_QUEUED",
        },
        where: { id: reportId },
      })
      await tx.supportEmailOutbox.create({
        data: {
          body: [`Hi ${message.fromName || "there"},`, "", automaticAnswer.body, "", `Reference: ${reportId}`].join("\n"),
          brandKey: "photoview",
          deliveryKey: `support-followup-answer:${message.messageId}`,
          gmailThreadId: message.threadId,
          inReplyTo: message.rfcMessageId,
          recipientName: message.fromName,
          reportId,
          resolutionNote: `Answered follow-up from verified help recipe ${automaticAnswer.recipeId}.`,
          source: "support_verified_followup_answer",
          subject,
          targetReportStatus: "ANSWERED",
          toEmail: message.fromEmail,
        },
      })
      return "answered" as const
    }
    const reopenedBug = isResolvedSupportStatus(report.status) && transition.type === "bug"
    await tx.subscriberFeedbackReport.update({
      data: transition,
      where: { id: reportId },
    })
    await tx.supportAlert.create({
      data: {
        adminUrl: `${getSupportBrand().adminUrl}?report=${encodeURIComponent(reportId)}`,
        brandKey: "photoview",
        deliveries: { create: [{ brandKey: "photoview", channel: "EMAIL" }] },
        eventKey: `support-reply:${message.messageId}`,
        kind: reopenedBug ? "BUG_REPAIR" : "SUBSCRIBER_REPLY",
        reportId,
        summary: reopenedBug
          ? `Subscriber reports the prior solution still fails for support case ${reportId}; a new repair cycle is queued.`
          : `Subscriber reply received for support case ${reportId}.`,
      },
    })
    return "appended" as const
  })
}

async function appendOwnerReply(message: Awaited<ReturnType<typeof getSupportInboundMessage>>, reportId: string) {
  const prisma = getPrismaClient()
  const body = supportOwnerReplyText(message.body)
  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.supportCaseMessage.findUnique({ where: { providerMessageId: message.messageId } })
    if (duplicate) return "duplicate" as const
    if (!body) {
      await tx.supportMailboxReceipt.upsert({
        create: { disposition: "IGNORED_EMPTY_OWNER_REPLY", messageId: message.messageId, receivedAt: message.receivedAt },
        update: {},
        where: { messageId: message.messageId },
      })
      return "ignored" as const
    }
    const report = await tx.subscriberFeedbackReport.findUnique({ where: { id: reportId } })
    if (!report) throw new Error("Support case not found for owner reply.")
    const featureDecision = report.type === "improvement" ? supportOwnerFeatureDecision(message.body) : null
    if (featureDecision) {
      await tx.supportCaseMessage.create({
        data: {
          body,
          direction: "OWNER_INBOUND",
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
        data: featureDecision.action === "approve"
          ? {
              approvedAt: new Date(),
              escalationReason: null,
              lifecycleState: "APPROVED",
              resolutionNote: featureDecision.note || "Feature implementation approved by the PhotoView owner.",
              status: "APPROVED",
            }
          : {
              escalationReason: null,
              lifecycleState: "RESOLVED",
              resolutionNote: featureDecision.note || "Feature request declined by the PhotoView owner.",
              resolvedAt: new Date(),
              status: "DECLINED",
            },
        where: { id: reportId },
      })
      return featureDecision.action === "approve" ? "approved" as const : "declined" as const
    }
    const latestCustomer = await tx.supportCaseMessage.findFirst({
      orderBy: { receivedAt: "desc" },
      where: { direction: "INBOUND", reportId },
    })
    const latestOutgoing = await tx.supportEmailOutbox.findFirst({
      orderBy: { createdAt: "desc" },
      where: { reportId, source: { not: "support_resolution_owner_copy" }, status: { in: ["SENT", "DELIVERED"] } },
    })
    await tx.supportCaseMessage.create({
      data: {
        body,
        direction: "OWNER_INBOUND",
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
    const originalSubject = latestCustomer?.subject || latestOutgoing?.subject || "PhotoView.io support follow-up"
    const subject = `Re: ${originalSubject.replace(/^re:\s*/i, "")}`.slice(0, 240)
    const targetReportStatus = ["question", "feedback"].includes(report.type) ? "ANSWERED" : null
    await tx.supportEmailOutbox.create({
      data: {
        body,
        brandKey: report.brandKey,
        deliveryKey: `owner-reply:${message.messageId}`,
        gmailThreadId: latestCustomer?.providerThreadId || report.gmailThreadId || latestOutgoing?.gmailThreadId || null,
        inReplyTo: latestCustomer?.rfcMessageId || (latestOutgoing ? `<${supportGmailMessageId(latestOutgoing.deliveryKey)}>` : null),
        recipientName: report.reporterName,
        reportId,
        resolutionNote: targetReportStatus ? "Owner response delivered through the PhotoView support mailbox." : null,
        source: "support_owner_reply",
        subject,
        targetReportStatus,
        toEmail: report.reporterEmail,
      },
    })
    if (targetReportStatus) {
      await tx.subscriberFeedbackReport.update({
        data: { lifecycleState: "RESPONSE_QUEUED", resolvedAt: null },
        where: { id: reportId },
      })
    }
    return "queued" as const
  })
}

export async function syncSupportMailbox(options: { after?: Date; limit?: number } = {}) {
  const prisma = getPrismaClient()
  const scanOptions = {
    after: options.after && options.after > SUPPORT_BACKFILL_START ? options.after : SUPPORT_BACKFILL_START,
    limit: options.limit ?? 5_000,
  }
  const [listing, ownerReplyListing] = await Promise.all([
    listSupportInboxMessageIds(scanOptions),
    listSupportOwnerReplyMessageIds({
      ...scanOptions,
      after: scanOptions.after > SUPPORT_SELF_ROUTING_START ? scanOptions.after : SUPPORT_SELF_ROUTING_START,
    }),
  ])
  if (!listing.configured || !ownerReplyListing.configured) return { configured: false, created: 0, ignored: 0, ownerReplies: 0, replies: 0 }
  let created = 0
  let ignored = 0
  let ownerReplies = 0
  let replies = 0
  let inspected = 0
  const messages = new Map([...listing.messages, ...ownerReplyListing.messages].map((message) => [message.id, message]))
  for (const candidate of [...messages.values()].reverse()) {
    const known = await prisma.supportCaseMessage.findUnique({ where: { providerMessageId: candidate.id } })
      ?? await prisma.subscriberFeedbackReport.findUnique({ where: { gmailMessageId: candidate.id } })
      ?? await prisma.supportMailboxReceipt.findUnique({ where: { messageId: candidate.id } })
    if (known) continue
    if (inspected >= 50) break
    inspected += 1
    const message = await getSupportInboundMessage(candidate.id)
    const ownerAlertDelivery = await prisma.supportAlertDelivery.findFirst({
      select: { alert: { select: { reportId: true } }, providerId: true },
      where: {
        channel: "EMAIL",
        providerStatus: `gmail_sent_verified:${message.threadId}`,
        status: "DELIVERED",
      },
    })
    if (ownerAlertDelivery?.alert.reportId) {
      if (message.messageId === ownerAlertDelivery.providerId) {
        await prisma.supportMailboxReceipt.upsert({
          create: { disposition: "IGNORED_OWNER_ALERT_COPY", messageId: message.messageId, receivedAt: message.receivedAt },
          update: {},
          where: { messageId: message.messageId },
        })
        ignored += 1
        continue
      }
      if (message.fromEmail !== getSupportBrand().supportEmail) {
        await prisma.supportMailboxReceipt.upsert({
          create: { disposition: "IGNORED_UNAUTHORIZED_OWNER_REPLY", messageId: message.messageId, receivedAt: message.receivedAt },
          update: {},
          where: { messageId: message.messageId },
        })
        ignored += 1
        continue
      }
      const result = await appendOwnerReply(message, ownerAlertDelivery.alert.reportId)
      if (result === "queued") ownerReplies += 1
      else if (result === "ignored") ignored += 1
      continue
    }
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
    if (ignoreSupportMailboxMessage({ fromEmail: message.fromEmail, isBulkAutomated: message.isBulkAutomated, subject: message.subject })) {
      await prisma.supportMailboxReceipt.upsert({
        create: { disposition: message.isBulkAutomated ? "IGNORED_BULK" : "IGNORED_AUTOMATED", messageId: message.messageId, receivedAt: message.receivedAt },
        update: {},
        where: { messageId: message.messageId },
      })
      ignored += 1
      continue
    }
    if (threadCase) {
      const result = await appendMailboxReply(message, threadCase.id)
      if (result === "appended" || result === "answered") replies += 1
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
  return { configured: true, created, ignored, ownerReplies, replies }
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
