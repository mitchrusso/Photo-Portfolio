import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { uniqueManagedPhotoReferences } from "@/lib/photo-storage"
import { processStorageDeletionJobs } from "@/lib/storage-deletion"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type PhotoRouteProps = {
  params: Promise<{
    galleryId: string
    photoId: string
  }>
}

const photoUpdateSchema = z.object({
  caption: z.string().max(240).optional(),
  hidden: z.boolean().optional(),
}).refine((payload) => payload.caption !== undefined || payload.hidden !== undefined, {
  message: "At least one photo field is required",
})

function asStringRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

async function findGalleryPhoto(workspaceId: string, gallerySlug: string, photoId: string) {
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findFirst({
    include: {
      photos: true,
    },
    where: {
      slug: gallerySlug,
      workspaceId,
    },
  })

  if (!gallery) return null

  const photo = gallery.photos.find((candidate) => {
    const metadata = asStringRecord(candidate.metadata)
    return candidate.id === photoId || metadata.externalId === photoId
  })

  if (!photo) return null

  return { gallery, photo }
}

function photoStorageBytes(photo: {
  bytes: bigint | number | null
  displayBytes: bigint | number | null
  thumbnailBytes: bigint | number | null
}) {
  return numberFromBigInt(photo.bytes) + numberFromBigInt(photo.displayBytes) + numberFromBigInt(photo.thumbnailBytes)
}

async function findSharedStorageReferences(photoId: string, galleryId: string, references: string[]) {
  if (references.length === 0) return new Set<string>()

  const prisma = getPrismaClient()
  const [photos, galleries] = await Promise.all([
    prisma.photo.findMany({
      select: {
        displayUrl: true,
        downloadUrl: true,
        originalUrl: true,
        sourceUrl: true,
        thumbnailUrl: true,
      },
      where: {
        id: { not: photoId },
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
      select: {
        coverImageUrl: true,
        id: true,
        watermarkImageUrl: true,
      },
      where: {
        OR: [
          { coverImageUrl: { in: references } },
          { watermarkImageUrl: { in: references } },
        ],
      },
    }),
  ])

  return new Set(
    uniqueManagedPhotoReferences([
      ...photos.flatMap((photo) => [
        photo.displayUrl,
        photo.downloadUrl,
        photo.originalUrl,
        photo.sourceUrl,
        photo.thumbnailUrl,
      ]),
      ...galleries.flatMap((gallery) => [
        gallery.id === galleryId && gallery.coverImageUrl && references.includes(gallery.coverImageUrl)
          ? null
          : gallery.coverImageUrl,
        gallery.watermarkImageUrl,
      ]),
    ]),
  )
}

export async function PATCH(request: Request, { params }: PhotoRouteProps) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const parsed = photoUpdateSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid photo update payload" }, { status: 400 })
  }

  const { galleryId, photoId } = await params
  const result = await findGalleryPhoto(session.user.workspaceId, galleryId, photoId)

  if (!result) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  const prisma = getPrismaClient()
  await prisma.photo.update({
    data: {
      ...(parsed.data.caption !== undefined ? { caption: parsed.data.caption.trim() || null } : {}),
      ...(parsed.data.hidden !== undefined ? { isHidden: parsed.data.hidden } : {}),
    },
    where: {
      id: result.photo.id,
    },
  })

  if (parsed.data.hidden === true && result.gallery.coverPhotoId === result.photo.id) {
    await prisma.gallery.update({
      data: {
        coverPhotoId: null,
      },
      where: {
        id: result.gallery.id,
      },
    })
  }

  return NextResponse.json({
    caption: parsed.data.caption,
    hidden: parsed.data.hidden,
    ok: true,
  })
}

export async function DELETE(_request: Request, { params }: PhotoRouteProps) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const { galleryId, photoId } = await params
  const result = await findGalleryPhoto(session.user.workspaceId, galleryId, photoId)

  // DELETE is intentionally idempotent. An older dashboard tab can still show a
  // photo that another tab or cleanup workflow already removed. Returning
  // success lets that stale client clear its local card without exposing whether
  // the requested workspace-scoped record ever existed.
  if (!result) return NextResponse.json({ alreadyDeleted: true, ok: true })

  const references = uniqueManagedPhotoReferences([
    result.photo.originalUrl,
    result.photo.displayUrl,
    result.photo.thumbnailUrl,
    result.photo.downloadUrl,
    result.photo.sourceUrl,
  ])
  const sharedReferences = await findSharedStorageReferences(result.photo.id, result.gallery.id, references)
  const referencesToDelete = references.filter((reference) => !sharedReferences.has(reference))
  const deletedBytes = photoStorageBytes(result.photo)
  const prisma = getPrismaClient()

  const deletionJobIds = await prisma.$transaction(async (tx) => {
    const jobs = await Promise.all(
      referencesToDelete.map((reference) =>
        tx.storageDeletionJob.create({
          data: {
            galleryId: result.gallery.id,
            photoId: result.photo.id,
            reference,
            workspaceId: session.user.workspaceId,
          },
          select: { id: true },
        }),
      ),
    )

    await tx.photo.delete({
      where: {
        id: result.photo.id,
      },
    })

    const remainingPhotos = await tx.photo.findMany({
      select: {
        bytes: true,
        displayBytes: true,
        thumbnailBytes: true,
      },
      where: {
        galleryId: result.gallery.id,
      },
    })
    const galleryBytes = remainingPhotos.reduce((sum, photo) => sum + photoStorageBytes(photo), 0)

    await tx.gallery.update({
      data: {
        ...(result.gallery.coverPhotoId === result.photo.id ? { coverPhotoId: null } : {}),
        ...(result.gallery.coverImageUrl && references.includes(result.gallery.coverImageUrl)
          ? { coverImageUrl: null }
          : {}),
        storageUsedBytes: BigInt(galleryBytes),
      },
      where: {
        id: result.gallery.id,
      },
    })

    const workspaceStorage = await tx.gallery.aggregate({
      _sum: {
        storageUsedBytes: true,
      },
      where: {
        workspaceId: session.user.workspaceId,
      },
    })

    await tx.workspace.update({
      data: {
        storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0),
      },
      where: {
        id: session.user.workspaceId,
      },
    })

    await tx.storageUsageEvent.create({
      data: {
        bytesDelta: BigInt(-deletedBytes),
        galleryId: result.gallery.id,
        pathname: referencesToDelete[0] ?? null,
        photoId: result.photo.id,
        type: "FILE_DELETED",
        workspaceId: session.user.workspaceId,
      },
    })

    return jobs.map((job) => job.id)
  })

  const cleanup = await processStorageDeletionJobs({ jobIds: deletionJobIds }).catch((error) => {
    console.error("Immediate photo storage cleanup failed; the cron will retry it", error)
    return { completed: 0, failed: deletionJobIds.length, processed: 0 }
  })

  return NextResponse.json({
    cleanupPending: cleanup.failed > 0 || cleanup.processed < deletionJobIds.length,
    deletedBytes,
    ok: true,
  })
}
