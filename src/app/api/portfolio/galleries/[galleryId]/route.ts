import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { uniqueManagedPhotoReferences } from "@/lib/photo-storage"
import { getWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"
import { processStorageDeletionJobs } from "@/lib/storage-deletion"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type GalleryRouteProps = {
  params: Promise<{
    galleryId: string
  }>
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

function photoStorageBytes(photo: {
  bytes: bigint | number | null
  displayBytes: bigint | number | null
  thumbnailBytes: bigint | number | null
}) {
  return numberFromBigInt(photo.bytes) + numberFromBigInt(photo.displayBytes) + numberFromBigInt(photo.thumbnailBytes)
}

export async function DELETE(_request: Request, { params }: GalleryRouteProps) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const { galleryId } = await params
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findFirst({
    include: { photos: true },
    where: {
      slug: galleryId,
      workspaceId: session.user.workspaceId,
    },
  })

  // Keep deletion idempotent so a stale dashboard tab can remove a portfolio
  // that was already deleted in another tab or by a completed cleanup run.
  if (!gallery) return NextResponse.json({ alreadyDeleted: true, ok: true })

  const references = uniqueManagedPhotoReferences([
    gallery.coverImageUrl,
    gallery.watermarkImageUrl,
    ...gallery.photos.flatMap((photo) => [
      photo.originalUrl,
      photo.displayUrl,
      photo.thumbnailUrl,
      photo.downloadUrl,
      photo.sourceUrl,
    ]),
  ])
  const [sharedPhotos, sharedGalleries] = references.length > 0
    ? await Promise.all([
        prisma.photo.findMany({
          select: {
            displayUrl: true,
            downloadUrl: true,
            originalUrl: true,
            sourceUrl: true,
            thumbnailUrl: true,
          },
          where: {
            galleryId: { not: gallery.id },
            OR: [
              { displayUrl: { in: references } },
              { downloadUrl: { in: references } },
              { originalUrl: { in: references } },
              { sourceUrl: { in: references } },
              { thumbnailUrl: { in: references } },
            ],
          },
        }),
        prisma.gallery.findMany({
          select: { coverImageUrl: true, watermarkImageUrl: true },
          where: {
            id: { not: gallery.id },
            OR: [
              { coverImageUrl: { in: references } },
              { watermarkImageUrl: { in: references } },
            ],
          },
        }),
      ])
    : [[], []]
  const sharedReferences = new Set(uniqueManagedPhotoReferences([
    ...sharedPhotos.flatMap((photo) => [
      photo.displayUrl,
      photo.downloadUrl,
      photo.originalUrl,
      photo.sourceUrl,
      photo.thumbnailUrl,
    ]),
    ...sharedGalleries.flatMap((candidate) => [candidate.coverImageUrl, candidate.watermarkImageUrl]),
  ]))
  const referencesToDelete = references.filter((reference) => !sharedReferences.has(reference))
  const deletedBytes = gallery.photos.reduce((sum, photo) => sum + photoStorageBytes(photo), 0)

  const deletion = await prisma.$transaction(async (tx) => {
    const isLastPortfolio = await tx.gallery.count({
      where: { workspaceId: session.user.workspaceId },
    }) === 1
    const jobs = await Promise.all(
      referencesToDelete.map((reference) => tx.storageDeletionJob.create({
        data: {
          galleryId: gallery.id,
          reference,
          workspaceId: session.user.workspaceId,
        },
        select: { id: true },
      })),
    )

    await tx.storageUsageEvent.create({
      data: {
        bytesDelta: BigInt(-deletedBytes),
        galleryId: gallery.id,
        pathname: referencesToDelete[0] ?? null,
        type: "FILE_DELETED",
        workspaceId: session.user.workspaceId,
      },
    })
    await tx.gallery.delete({ where: { id: gallery.id } })

    if (isLastPortfolio) {
      await tx.gallery.create({
        data: {
          allowDownloads: true,
          allowSocialSharing: true,
          description: "A clean portfolio ready for your next collection.",
          name: "My First Portfolio",
          privacy: "PRIVATE",
          settings: {
            favorites: 0,
            infoPaneEnabled: false,
            photoLabelMode: "none",
            revenue: "$0",
            showFileNames: false,
          },
          slug: "my-first-portfolio",
          status: "DRAFT",
          workspaceId: session.user.workspaceId,
        },
      })
    }

    const workspaceStorage = await tx.gallery.aggregate({
      _sum: { storageUsedBytes: true },
      where: { workspaceId: session.user.workspaceId },
    })
    await tx.workspace.update({
      data: { storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0) },
      where: { id: session.user.workspaceId },
    })

    return { isLastPortfolio, jobIds: jobs.map((job) => job.id) }
  })

  const cleanup = await processStorageDeletionJobs({ jobIds: deletion.jobIds }).catch((error) => {
    console.error("Immediate portfolio storage cleanup failed; the cron will retry it", error)
    return { completed: 0, failed: deletion.jobIds.length, processed: 0 }
  })
  const replacement = deletion.isLastPortfolio
    ? (await getWorkspacePortfolioGalleries(session.user.workspaceId))[0] ?? null
    : null

  return NextResponse.json({
    cleanupPending: cleanup.failed > 0 || cleanup.processed < deletion.jobIds.length,
    deletedBytes,
    ok: true,
    replacement,
  })
}
