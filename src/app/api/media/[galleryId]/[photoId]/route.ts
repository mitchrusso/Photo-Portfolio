import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { recordBandwidthUsage } from "@/lib/bandwidth-metering"
import { galleryAccessCookieName, verifyGalleryAccessToken } from "@/lib/gallery-access"

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

function bandwidthLimitSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <rect width="1200" height="800" fill="#050505"/>
    <rect x="90" y="90" width="1020" height="620" rx="28" fill="#111" stroke="#3a3020"/>
    <text x="600" y="350" text-anchor="middle" fill="#f4d47e" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">Bandwidth limit reached</text>
    <text x="600" y="416" text-anchor="middle" fill="#c9c2b8" font-family="Arial, Helvetica, sans-serif" font-size="25">This PhotoViewPro gallery is temporarily paused.</text>
    <text x="600" y="462" text-anchor="middle" fill="#8d8579" font-family="Arial, Helvetica, sans-serif" font-size="21">The photographer has been notified with upgrade options.</text>
  </svg>`
}

function throttledImageResponse() {
  return new NextResponse(bandwidthLimitSvg(), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
    status: 429,
  })
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
    return {
      bytes: numberFromBigInt(photo.thumbnailBytes) || numberFromBigInt(photo.displayBytes) || numberFromBigInt(photo.bytes),
      url: photo.thumbnailUrl ?? photo.displayUrl ?? photo.originalUrl,
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
          id: true,
          isHidden: true,
          metadata: true,
          originalUrl: true,
          thumbnailBytes: true,
          thumbnailUrl: true,
        },
      },
    },
    where: {
      slug: galleryId,
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
    if (gallery.status === "DRAFT" || gallery.status === "ARCHIVED") {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 })
    }
    if (gallery.privacy === "PRIVATE" || gallery.privacy === "CLIENT_PORTAL" || photo.isHidden) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
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
  let assetUrl: URL
  try {
    assetUrl = new URL(asset.url)
  } catch {
    return NextResponse.json({ error: "Photo is unavailable" }, { status: 404 })
  }
  if (assetUrl.protocol !== "https:" && assetUrl.protocol !== "http:") {
    return NextResponse.json({ error: "Photo is unavailable" }, { status: 404 })
  }
  const gate = await recordBandwidthUsage({
    bytes: asset.bytes,
    galleryId: gallery.id,
    pathname: url.pathname,
    photoId: photo.id,
    workspaceId: gallery.workspaceId,
  })

  if (!gate.allowed) return throttledImageResponse()

  const redirect = NextResponse.redirect(assetUrl, { status: 307 })
  redirect.headers.set("Cache-Control", "no-store")
  redirect.headers.set("Referrer-Policy", "no-referrer")
  redirect.headers.set("X-Content-Type-Options", "nosniff")
  return redirect
}
