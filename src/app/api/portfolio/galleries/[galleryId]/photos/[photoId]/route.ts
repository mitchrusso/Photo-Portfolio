import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

type PhotoRouteProps = {
  params: Promise<{
    galleryId: string
    photoId: string
  }>
}

const visibilitySchema = z.object({
  hidden: z.boolean(),
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

async function refreshStorageTotals(workspaceId: string, galleryId: string) {
  const prisma = getPrismaClient()
  const photos = await prisma.photo.findMany({
    select: {
      bytes: true,
      displayBytes: true,
      thumbnailBytes: true,
    },
    where: {
      galleryId,
    },
  })
  const galleryBytes = photos.reduce(
    (sum, photo) =>
      sum + numberFromBigInt(photo.bytes) + numberFromBigInt(photo.displayBytes) + numberFromBigInt(photo.thumbnailBytes),
    0,
  )

  await prisma.gallery.update({
    data: {
      storageUsedBytes: BigInt(galleryBytes),
    },
    where: {
      id: galleryId,
    },
  })

  const workspaceStorage = await prisma.gallery.aggregate({
    _sum: {
      storageUsedBytes: true,
    },
    where: {
      workspaceId,
    },
  })

  await prisma.workspace.update({
    data: {
      storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0),
    },
    where: {
      id: workspaceId,
    },
  })
}

export async function PATCH(request: Request, { params }: PhotoRouteProps) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = visibilitySchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid photo update payload" }, { status: 400 })
  }

  const { galleryId, photoId } = await params
  const result = await findGalleryPhoto(session.user.workspaceId, galleryId, photoId)

  if (!result) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  const prisma = getPrismaClient()
  await prisma.photo.update({
    data: {
      isHidden: parsed.data.hidden,
    },
    where: {
      id: result.photo.id,
    },
  })

  if (parsed.data.hidden && result.gallery.coverPhotoId === result.photo.id) {
    await prisma.gallery.update({
      data: {
        coverPhotoId: null,
      },
      where: {
        id: result.gallery.id,
      },
    })
  }

  return NextResponse.json({ hidden: parsed.data.hidden, ok: true })
}

export async function DELETE(_request: Request, { params }: PhotoRouteProps) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { galleryId, photoId } = await params
  const result = await findGalleryPhoto(session.user.workspaceId, galleryId, photoId)

  if (!result) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  const prisma = getPrismaClient()
  await prisma.photo.delete({
    where: {
      id: result.photo.id,
    },
  })

  if (result.gallery.coverPhotoId === result.photo.id) {
    await prisma.gallery.update({
      data: {
        coverPhotoId: null,
      },
      where: {
        id: result.gallery.id,
      },
    })
  }

  await refreshStorageTotals(session.user.workspaceId, result.gallery.id)

  return NextResponse.json({ ok: true })
}
