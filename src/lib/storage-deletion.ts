import { getPrismaClient } from "./db"
import { deleteManagedPhotoObject } from "./photo-storage"
import { recordOperationalEvent } from "./operational-monitoring"
import { StorageDeletionStatus } from "../generated/prisma/enums"

const MAX_DELETE_ATTEMPTS = 10

export async function processStorageDeletionJobs({
  jobIds,
  limit = 50,
}: {
  jobIds?: string[]
  limit?: number
} = {}) {
  if (!process.env.DATABASE_URL) return { completed: 0, failed: 0, processed: 0 }

  const prisma = getPrismaClient()
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000)
  const retryableStatus = {
    OR: [
      { status: { in: [StorageDeletionStatus.PENDING, StorageDeletionStatus.FAILED] } },
      { status: StorageDeletionStatus.PROCESSING, updatedAt: { lt: staleBefore } },
    ],
  }
  const jobs = await prisma.storageDeletionJob.findMany({
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 250)),
    where: {
      attemptCount: { lt: MAX_DELETE_ATTEMPTS },
      ...(jobIds?.length ? { id: { in: jobIds } } : {}),
      ...retryableStatus,
    },
  })

  let completed = 0
  let failed = 0
  let processed = 0

  for (const job of jobs) {
    const claimed = await prisma.storageDeletionJob.updateMany({
      data: {
        attemptCount: { increment: 1 },
        lastError: null,
        status: StorageDeletionStatus.PROCESSING,
      },
      where: {
        attemptCount: { lt: MAX_DELETE_ATTEMPTS },
        id: job.id,
        ...retryableStatus,
      },
    })
    if (claimed.count === 0) continue
    processed += 1

    try {
      await deleteManagedPhotoObject(job.reference)
      await prisma.storageDeletionJob.update({
        data: {
          completedAt: new Date(),
          status: StorageDeletionStatus.COMPLETED,
        },
        where: { id: job.id },
      })
      completed += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : "Storage deletion failed"
      await prisma.storageDeletionJob.update({
        data: {
          lastError: message.slice(0, 1000),
          status: StorageDeletionStatus.FAILED,
        },
        where: { id: job.id },
      })
      await recordOperationalEvent({
        category: "STORAGE",
        fingerprint: `storage-delete:${job.id}`,
        message,
        metadata: { attemptCount: job.attemptCount + 1, jobId: job.id },
        severity: job.attemptCount + 1 >= 3 ? "CRITICAL" : "WARNING",
        source: "storage-deletion-worker",
        workspaceId: job.workspaceId,
      })
      failed += 1
    }
  }

  return { completed, failed, processed }
}
