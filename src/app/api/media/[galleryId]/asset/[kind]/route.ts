import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { galleryAccessCookieName, verifyGalleryAccessToken } from "@/lib/gallery-access"
import { getPrismaClient } from "@/lib/db"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"

type GalleryAssetRouteProps = {
  params: Promise<{
    galleryId: string
    kind: string
  }>
}

const kindSchema = z.enum(["cover", "watermark"])

export async function GET(request: NextRequest, { params }: GalleryAssetRouteProps) {
  const { galleryId, kind: requestedKind } = await params
  const parsedKind = kindSchema.safeParse(requestedKind)
  if (!parsedKind.success) return NextResponse.json({ error: "Asset not found" }, { status: 404 })

  const prisma = getPrismaClient()
  const galleries = await prisma.gallery.findMany({
    select: {
      coverImageUrl: true,
      id: true,
      privacy: true,
      status: true,
      watermarkEnabled: true,
      watermarkImageUrl: true,
      workspaceId: true,
    },
    where: {
      OR: [
        { id: galleryId },
        { slug: galleryId },
      ],
    },
    take: 2,
  })

  if (galleries.length !== 1) return NextResponse.json({ error: "Asset not found" }, { status: 404 })
  const gallery = galleries[0]
  const session = await auth()
  const isOwner = session?.user?.workspaceId === gallery.workspaceId

  if (!isOwner) {
    if (gallery.status === "DRAFT" || gallery.status === "ARCHIVED") {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }
    if (gallery.privacy === "PRIVATE" || gallery.privacy === "CLIENT_PORTAL") {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }
    if (gallery.privacy === "PASSWORD") {
      const accessToken = request.cookies.get(galleryAccessCookieName(gallery.id))?.value
      if (!verifyGalleryAccessToken(accessToken, gallery.id)) {
        return NextResponse.json({ error: "Gallery password required" }, { status: 403 })
      }
    }
  }

  const reference = parsedKind.data === "cover"
    ? gallery.coverImageUrl
    : gallery.watermarkEnabled
      ? gallery.watermarkImageUrl
      : null
  if (!reference) return NextResponse.json({ error: "Asset not found" }, { status: 404 })

  let assetUrl: URL
  try {
    assetUrl = new URL(await getPhotoDeliveryUrl(reference, { expiresIn: 60 }))
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 })
  }
  if (assetUrl.protocol !== "https:" && assetUrl.protocol !== "http:") {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 })
  }

  const response = NextResponse.redirect(assetUrl, { status: 307 })
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  response.headers.set("X-Content-Type-Options", "nosniff")
  return response
}
