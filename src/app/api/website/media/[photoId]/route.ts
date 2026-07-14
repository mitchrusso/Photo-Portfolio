import { NextResponse } from "next/server"

import { getPrismaClient } from "@/lib/db"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"

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
      metadata: true,
      originalUrl: true,
    },
    where: { id: photoId },
  })

  if (!photo || asStringRecord(photo.metadata).assetPurpose !== "website") {
    return NextResponse.json({ error: "Website image not found" }, { status: 404 })
  }

  try {
    const deliveryUrl = await getPhotoDeliveryUrl(photo.displayUrl ?? photo.originalUrl, { expiresIn: 60 })
    const assetUrl = new URL(deliveryUrl)
    if (assetUrl.protocol !== "https:" && assetUrl.protocol !== "http:") throw new Error("Unsupported image URL")

    const redirect = NextResponse.redirect(assetUrl, { status: 307 })
    redirect.headers.set("Cache-Control", "no-store")
    redirect.headers.set("Referrer-Policy", "no-referrer")
    redirect.headers.set("X-Content-Type-Options", "nosniff")
    return redirect
  } catch {
    return NextResponse.json({ error: "Website image is unavailable" }, { status: 404 })
  }
}
