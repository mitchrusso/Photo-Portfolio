import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

type CoverRouteProps = {
  params: Promise<{
    galleryId: string
  }>
}

const coverSchema = z.object({
  coverUrl: z.string().max(2000).optional(),
  photoId: z.string().min(1).optional(),
})

function asStringRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function POST(request: Request, { params }: CoverRouteProps) {
  const session = await auth()

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = coverSchema.safeParse(await request.json())

  if (!parsed.success || (!parsed.data.photoId && !parsed.data.coverUrl)) {
    return NextResponse.json({ error: "Invalid cover payload" }, { status: 400 })
  }
  if (!parsed.data.photoId && parsed.data.coverUrl) {
    try {
      const coverUrl = new URL(parsed.data.coverUrl)
      if (coverUrl.protocol !== "https:" && coverUrl.protocol !== "http:") throw new Error("Unsupported protocol")
    } catch {
      return NextResponse.json({ error: "Invalid cover URL" }, { status: 400 })
    }
  }

  const { galleryId } = await params
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findFirst({
    include: {
      photos: {
        select: {
          displayUrl: true,
          id: true,
          metadata: true,
          originalUrl: true,
          sourceUrl: true,
          thumbnailUrl: true,
        },
      },
    },
    where: {
      slug: galleryId,
      workspaceId: session.user.workspaceId,
    },
  })

  if (!gallery) return NextResponse.json({ error: "Gallery not found" }, { status: 404 })

  const photo = parsed.data.photoId
    ? gallery.photos.find((candidate) => {
        const metadata = asStringRecord(candidate.metadata)
        return candidate.id === parsed.data.photoId || metadata.externalId === parsed.data.photoId
      })
    : gallery.photos.find((candidate) =>
        [candidate.displayUrl, candidate.thumbnailUrl, candidate.originalUrl, candidate.sourceUrl].includes(parsed.data.coverUrl ?? ""),
      )

  await prisma.gallery.update({
    data: {
      coverImageUrl: photo ? null : parsed.data.coverUrl,
      coverPhotoId: photo?.id ?? null,
    },
    where: {
      id: gallery.id,
    },
  })

  const photoMetadata = photo ? asStringRecord(photo.metadata) : {}
  const publicPhotoId = String(photoMetadata.externalId ?? photo?.id ?? "")
  const deliveryUrl = photo
    ? `/api/media/${encodeURIComponent(gallery.id)}/${encodeURIComponent(publicPhotoId)}?variant=display`
    : parsed.data.coverUrl ?? null

  return NextResponse.json({
    coverPhotoId: photo?.id ?? null,
    coverUrl: deliveryUrl,
    ok: true,
  })
}
