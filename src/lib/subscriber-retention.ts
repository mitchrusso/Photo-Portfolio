import { StorageDeletionStatus } from "@/generated/prisma/enums"
import { getPrismaClient } from "@/lib/db"
import { isInternalSubscriberEmail } from "@/lib/internal-subscriber"
import { uniqueManagedPhotoReferences } from "@/lib/photo-storage"
import { processStorageDeletionJobs } from "@/lib/storage-deletion"
import { subscriberDeletionDate } from "@/lib/subscriber-retention-policy"

export class SubscriberRetentionError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "SubscriberRetentionError"
    this.code = code
    this.status = status
  }
}

export async function scheduleSubscriberDeletion({
  confirmationEmail,
  reason = "REFUND_REQUESTED",
  userId,
}: {
  confirmationEmail: string
  reason?: string
  userId: string
}) {
  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
    where: { id: userId },
  })

  if (!user || user.email.toLowerCase() !== confirmationEmail.trim().toLowerCase()) {
    throw new SubscriberRetentionError("subscriber_mismatch", "The subscriber identity did not match.", 404)
  }
  if (isInternalSubscriberEmail(user.email)) {
    throw new SubscriberRetentionError("protected_internal_account", "This internal owner account cannot be scheduled for deletion.", 409)
  }
  if (user.memberships.length !== 1 || user.memberships[0].role !== "OWNER") {
    throw new SubscriberRetentionError("shared_account", "This account requires manual shared-workspace review.", 409)
  }

  const workspace = user.memberships[0].workspace
  const now = new Date()
  const deletionScheduledAt = workspace.deletionScheduledAt ?? subscriberDeletionDate(now)

  await prisma.$transaction([
    prisma.workspace.update({
      data: {
        accessDisabledAt: workspace.accessDisabledAt ?? now,
        deletionReason: reason,
        deletionScheduledAt,
      },
      where: { id: workspace.id },
    }),
    prisma.website.updateMany({
      data: { disabledAt: now, status: "DISABLED" },
      where: { deletedAt: null, workspaceId: workspace.id },
    }),
    prisma.gallery.updateMany({
      data: { privacy: "PRIVATE" },
      where: { workspaceId: workspace.id },
    }),
    prisma.magicLoginToken.deleteMany({
      where: { OR: [{ email: user.email }, { userId: user.id }] },
    }),
    prisma.importCredential.deleteMany({ where: { workspaceId: workspace.id } }),
  ])

  return {
    accessDisabledAt: (workspace.accessDisabledAt ?? now).toISOString(),
    deletionScheduledAt: deletionScheduledAt.toISOString(),
    email: user.email,
    userId: user.id,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
  }
}

async function queueWorkspaceStorage(workspaceId: string) {
  const prisma = getPrismaClient()
  const [photos, galleries, existing] = await Promise.all([
    prisma.photo.findMany({
      select: { displayUrl: true, downloadUrl: true, originalUrl: true, sourceUrl: true, thumbnailUrl: true },
      where: { workspaceId },
    }),
    prisma.gallery.findMany({
      select: { coverImageUrl: true, watermarkImageUrl: true },
      where: { workspaceId },
    }),
    prisma.storageDeletionJob.findMany({ select: { reference: true }, where: { workspaceId } }),
  ])
  const references = uniqueManagedPhotoReferences([
    ...photos.flatMap((photo) => [photo.originalUrl, photo.displayUrl, photo.thumbnailUrl, photo.downloadUrl, photo.sourceUrl]),
    ...galleries.flatMap((gallery) => [gallery.coverImageUrl, gallery.watermarkImageUrl]),
  ])
  const queued = new Set(existing.map((job) => job.reference))
  const missing = references.filter((reference) => !queued.has(reference))
  if (missing.length) {
    await prisma.storageDeletionJob.createMany({
      data: missing.map((reference) => ({ reference, workspaceId })),
    })
  }
}

async function finalizeSubscriberDeletion(workspaceId: string) {
  const prisma = getPrismaClient()
  const workspace = await prisma.workspace.findUnique({
    include: {
      members: { include: { user: true }, where: { role: "OWNER" } },
      subscription: true,
    },
    where: { id: workspaceId },
  })
  if (!workspace || workspace.members.length !== 1) return false
  const owner = workspace.members[0].user
  const anonymizedEmail = `deleted-${owner.id}@photoview.invalid`

  await prisma.$transaction(async (tx) => {
    await tx.emailAutomationDelivery.deleteMany({
      where: { OR: [{ email: owner.email }, { workspaceId }] },
    })
    await tx.cancellationSurvey.deleteMany({
      where: { OR: [{ email: owner.email }, { workspaceId }] },
    })
    await tx.registrationEmailVerification.deleteMany({ where: { email: owner.email } })
    await tx.leadCapture.deleteMany({ where: { email: owner.email } })
    await tx.oneTimeAccessCode.deleteMany({ where: { recipientEmail: owner.email } })
    await tx.trialSignup.deleteMany({
      where: { OR: [{ email: owner.email }, { userId: owner.id }, { workspaceId }] },
    })
    await tx.subscriberFeedbackReport.updateMany({
      data: {
        reporterEmail: anonymizedEmail,
        reporterName: "Deleted subscriber",
        userId: null,
        workspaceId: null,
        workspaceLabel: null,
      },
      where: { OR: [{ reporterEmail: owner.email }, { userId: owner.id }, { workspaceId }] },
    })
    await tx.workspace.delete({ where: { id: workspaceId } })
    await tx.user.delete({ where: { id: owner.id } })
  })
  return true
}

export async function processScheduledSubscriberDeletions({ limit = 10 }: { limit?: number } = {}) {
  if (!process.env.DATABASE_URL) return { deleted: 0, pending: 0, processed: 0 }
  const prisma = getPrismaClient()
  const due = await prisma.workspace.findMany({
    orderBy: { deletionScheduledAt: "asc" },
    select: {
      id: true,
      members: {
        select: { user: { select: { email: true } } },
        where: { role: "OWNER" },
      },
    },
    take: Math.max(1, Math.min(limit, 50)),
    where: { accessDisabledAt: { not: null }, deletionScheduledAt: { lte: new Date() } },
  })
  let deleted = 0
  let pending = 0

  for (const workspace of due) {
    if (workspace.members.some(({ user }) => isInternalSubscriberEmail(user.email))) {
      await prisma.workspace.update({
        data: { accessDisabledAt: null, deletionReason: null, deletionScheduledAt: null },
        where: { id: workspace.id },
      })
      continue
    }
    await queueWorkspaceStorage(workspace.id)
    const jobs = await prisma.storageDeletionJob.findMany({
      select: { id: true },
      where: { status: { not: StorageDeletionStatus.COMPLETED }, workspaceId: workspace.id },
    })
    if (jobs.length) {
      await processStorageDeletionJobs({ jobIds: jobs.map((job) => job.id), limit: 250 })
    }
    const remaining = await prisma.storageDeletionJob.count({
      where: { status: { not: StorageDeletionStatus.COMPLETED }, workspaceId: workspace.id },
    })
    if (remaining > 0) {
      pending += 1
      continue
    }
    if (await finalizeSubscriberDeletion(workspace.id)) deleted += 1
  }

  return { deleted, pending, processed: due.length }
}
