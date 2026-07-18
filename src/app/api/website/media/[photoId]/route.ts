import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"
import { WEBSITE_PUBLISHED_SLUG } from "@/lib/website-publication"

type WebsiteMediaRouteProps = {
  params: Promise<{ photoId: string }>
}

function asStringRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function GET(_request: Request, { params }: WebsiteMediaRouteProps) {
  const { photoId } = await params
  const prisma = getPrismaClient()
  const photo = await prisma.photo.findUnique({
    select: {
      displayUrl: true,
      kind: true,
      metadata: true,
      originalUrl: true,
      workspaceId: true,
    },
    where: { id: photoId },
  })

  if (!photo || asStringRecord(photo.metadata).assetPurpose !== "website") {
    return NextResponse.json({ error: "Website media not found" }, { status: 404 })
  }

  const session = await auth()
  const isOwner = session?.user?.workspaceId === photo.workspaceId
  if (!isOwner) {
    const published = await prisma.contentPost.findUnique({
      select: { body: true, status: true },
      where: {
        workspaceId_slug: {
          slug: WEBSITE_PUBLISHED_SLUG,
          workspaceId: photo.workspaceId,
        },
      },
    })
    const publicReference = `/api/website/media/${encodeURIComponent(photoId)}`
    if (published?.status !== "PUBLISHED" || !published.body?.includes(publicReference)) {
      return NextResponse.json({ error: "Website media not found" }, { status: 404 })
    }
  }

  try {
    const deliveryUrl = await getPhotoDeliveryUrl(photo.displayUrl ?? photo.originalUrl, { expiresIn: photo.kind === "VIDEO" ? 60 * 60 : 60 })
    const assetUrl = new URL(deliveryUrl)
    if (assetUrl.protocol !== "https:" && assetUrl.protocol !== "http:") throw new Error("Unsupported media URL")

    const redirect = NextResponse.redirect(assetUrl, { status: 307 })
    redirect.headers.set("Cache-Control", "no-store")
    redirect.headers.set("Referrer-Policy", "no-referrer")
    redirect.headers.set("X-Content-Type-Options", "nosniff")
    return redirect
  } catch {
    return NextResponse.json({ error: "Website media is unavailable" }, { status: 404 })
  }
}
