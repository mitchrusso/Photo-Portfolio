import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type PhotoMoveRouteProps = {
  params: Promise<{ galleryId: string; photoId: string }>
}

const movePhotoSchema = z.object({
  targetGalleryId: z.string().trim().min(1).max(180),
})

function asStringRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function POST(request: Request, { params }: PhotoMoveRouteProps) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const parsed = movePhotoSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Choose a destination portfolio." }, { status: 400 })

  const { galleryId, photoId } = await params
  if (galleryId === parsed.data.targetGalleryId) {
    return NextResponse.json({ error: "That photo is already in this portfolio." }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const [sourceGallery, targetGallery] = await Promise.all([
    prisma.gallery.findFirst({
      include: { photos: { orderBy: { sortOrder: "asc" } } },
      where: { slug: galleryId, workspaceId: session.user.workspaceId },
    }),
    prisma.gallery.findFirst({
      include: { photos: { orderBy: { sortOrder: "asc" } } },
      where: { slug: parsed.data.targetGalleryId, workspaceId: session.user.workspaceId },
    }),
  ])
  if (!sourceGallery) return NextResponse.json({ error: "Source portfolio not found" }, { status: 404 })
  if (!targetGallery) return NextResponse.json({ error: "Destination portfolio not found" }, { status: 404 })

  const photo = sourceGallery.photos.find((candidate) => {
    const metadata = asStringRecord(candidate.metadata)
    return candidate.id === photoId || metadata.externalId === photoId
  })
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  const movedReferences = new Set([
    photo.originalUrl,
    photo.displayUrl,
    photo.thumbnailUrl,
    photo.downloadUrl,
    photo.sourceUrl,
  ].filter((value): value is string => Boolean(value)))
  const remainingSourcePhotos = sourceGallery.photos.filter((candidate) => candidate.id !== photo.id)
  const sourceCoverWasMoved = sourceGallery.coverPhotoId === photo.id || Boolean(
    sourceGallery.coverImageUrl && movedReferences.has(sourceGallery.coverImageUrl),
  )
  const replacementSourceCover = sourceCoverWasMoved
    ? remainingSourcePhotos.find((candidate) => !candidate.isHidden) ?? null
    : null
  const targetNeedsCover = !targetGallery.coverPhotoId && !targetGallery.coverImageUrl
  const targetSortOrder = (targetGallery.photos.at(-1)?.sortOrder ?? -1) + 1

  await prisma.$transaction(async (tx) => {
    const moved = await tx.photo.updateMany({
      data: { galleryId: targetGallery.id, sortOrder: targetSortOrder },
      where: { galleryId: sourceGallery.id, id: photo.id },
    })
    if (moved.count !== 1) throw new Error("The photo changed before it could be moved. Please try again.")
    await tx.proofSelection.updateMany({
      data: { galleryId: targetGallery.id },
      where: { photoId: photo.id },
    })
    const [sourceStorage, targetStorage] = await Promise.all([
      tx.photo.aggregate({
        _sum: { bytes: true, displayBytes: true, thumbnailBytes: true },
        where: { galleryId: sourceGallery.id },
      }),
      tx.photo.aggregate({
        _sum: { bytes: true, displayBytes: true, thumbnailBytes: true },
        where: { galleryId: targetGallery.id },
      }),
    ])
    const totalStorage = (storage: typeof sourceStorage) =>
      (storage._sum.bytes ?? BigInt(0)) +
      (storage._sum.displayBytes ?? BigInt(0)) +
      (storage._sum.thumbnailBytes ?? BigInt(0))
    await tx.gallery.update({
      data: {
        ...(sourceCoverWasMoved
          ? { coverImageUrl: null, coverPhotoId: replacementSourceCover?.id ?? null }
          : {}),
        storageUsedBytes: totalStorage(sourceStorage),
      },
      where: { id: sourceGallery.id },
    })
    await tx.gallery.update({
      data: {
        ...(targetNeedsCover ? { coverPhotoId: photo.id } : {}),
        storageUsedBytes: totalStorage(targetStorage),
      },
      where: { id: targetGallery.id },
    })
  })

  return NextResponse.json({
    ok: true,
    photoId: photo.id,
    sourceGalleryId: sourceGallery.slug,
    targetGalleryId: targetGallery.slug,
    targetSortOrder,
  })
}
