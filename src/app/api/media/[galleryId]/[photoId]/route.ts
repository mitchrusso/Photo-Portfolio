import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { galleryAccessCookieName, verifyGalleryAccessToken } from "@/lib/gallery-access"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"
import { parseSecureShareToken, secureShareTargetAllows } from "@/lib/secure-share-links"

type MediaRouteProps = {
  params: Promise<{
    galleryId: string
    photoId: string
  }>
}

const variantSchema = z.enum(["display", "download", "original", "thumbnail"]).default("display")

function asStringRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

function getVariantAsset(photo: {
  bytes: bigint
  displayBytes: bigint
  displayUrl: string | null
  downloadUrl: string | null
  originalUrl: string
  thumbnailBytes: bigint
  thumbnailUrl: string | null
}, variant: z.infer<typeof variantSchema>) {
  if (variant === "thumbnail") {
    const reference = photo.thumbnailUrl ?? photo.displayUrl ?? photo.originalUrl
    return {
      bytes: numberFromBigInt(photo.thumbnailBytes) || numberFromBigInt(photo.displayBytes) || numberFromBigInt(photo.bytes),
      url: reference,
    }
  }

  if (variant === "original" || variant === "download") {
    return {
      bytes: numberFromBigInt(photo.bytes),
      url: variant === "download" ? photo.downloadUrl ?? photo.originalUrl : photo.originalUrl,
    }
  }

  return {
    bytes: numberFromBigInt(photo.displayBytes) || numberFromBigInt(photo.bytes),
    url: photo.displayUrl ?? photo.originalUrl,
  }
}

export async function GET(request: NextRequest, { params }: MediaRouteProps) {
  const { galleryId, photoId } = await params
  const url = new URL(request.url)
  const parsedVariant = variantSchema.safeParse(url.searchParams.get("variant") ?? "display")
  if (!parsedVariant.success) return NextResponse.json({ error: "Unsupported media variant" }, { status: 400 })
  const variant = parsedVariant.data
  const prisma = getPrismaClient()
  const galleries = await prisma.gallery.findMany({
    include: {
      photos: {
        select: {
          bytes: true,
          displayBytes: true,
          displayUrl: true,
          downloadUrl: true,
          fileName: true,
          id: true,
          isHidden: true,
          metadata: true,
          originalUrl: true,
          thumbnailBytes: true,
          thumbnailUrl: true,
        },
      },
      workspace: {
        select: { slug: true },
      },
    },
    where: {
      OR: [
        { id: galleryId },
        { slug: galleryId },
      ],
    },
    take: 2,
  })

  if (galleries.length !== 1) return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
  const gallery = galleries[0]

  const photo = gallery.photos.find((candidate) => {
    const metadata = asStringRecord(candidate.metadata)
    return candidate.id === photoId || metadata.externalId === photoId
  })

  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

  const session = await auth()
  const isOwner = session?.user?.workspaceId === gallery.workspaceId
  if (!isOwner) {
    if (gallery.status === "ARCHIVED") {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
    }
    if (gallery.privacy === "PRIVATE" || gallery.privacy === "CLIENT_PORTAL" || photo.isHidden) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }
    if (gallery.privacy === "UNLISTED" || gallery.privacy === "PASSWORD") {
      const shareTarget = parseSecureShareToken(url.searchParams.get("share") ?? "")
      if (!secureShareTargetAllows(shareTarget, {
        gallerySlug: gallery.slug,
        photoId,
        workspaceSlug: gallery.workspace.slug,
      })) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 })
      }
    }
    if (gallery.privacy === "PASSWORD") {
      const accessToken = request.cookies.get(galleryAccessCookieName(gallery.id))?.value
      if (!verifyGalleryAccessToken(accessToken, gallery.id)) {
        return NextResponse.json({ error: "Gallery password required" }, { status: 403 })
      }
    }
    if ((variant === "download" || variant === "original") && !gallery.allowDownloads) {
      return NextResponse.json({ error: "Downloads are disabled for this gallery" }, { status: 403 })
    }
  }

  const asset = getVariantAsset(photo, variant)
  let deliveryUrl: string
  try {
    deliveryUrl = await getPhotoDeliveryUrl(asset.url, {
      download: variant === "download",
      expiresIn: 60,
      fileName: photo.fileName,
    })
  } catch {
    return NextResponse.json({ error: "Photo is unavailable" }, { status: 404 })
  }
  let assetUrl: URL
  try {
    assetUrl = new URL(deliveryUrl)
  } catch {
    return NextResponse.json({ error: "Photo is unavailable" }, { status: 404 })
  }
  if (assetUrl.protocol !== "https:" && assetUrl.protocol !== "http:") {
    return NextResponse.json({ error: "Photo is unavailable" }, { status: 404 })
  }
  const redirect = NextResponse.redirect(assetUrl, { status: 307 })
  redirect.headers.set("Cache-Control", "no-store")
  redirect.headers.set("Referrer-Policy", "no-referrer")
  redirect.headers.set("X-Content-Type-Options", "nosniff")
  return redirect
}
