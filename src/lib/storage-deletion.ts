import { getPrismaClient } from "./db"
import { deleteManagedPhotoObject } from "./photo-storage"
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
      await prisma.storageDeletionJob.update({
        data: {
          lastError: (error instanceof Error ? error.message : "Storage deletion failed").slice(0, 1000),
          status: StorageDeletionStatus.FAILED,
        },
        where: { id: job.id },
      })
      failed += 1
    }
  }

  return { completed, failed, processed }
}
