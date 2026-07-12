import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import {
  createGalleryAccessToken,
  galleryAccessCookieName,
  hashGalleryPassword,
  verifyGalleryAccessToken,
  verifyGalleryPassword,
} from "@/lib/gallery-access"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import type { Prisma } from "@/generated/prisma/client"

type RouteProps = { params: Promise<{ galleryId: string }> }
const unlockSchema = z.object({ password: z.string().min(1).max(300) })

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function safePlaintextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

async function findGallery(slug: string) {
  const galleries = await getPrismaClient().gallery.findMany({
    select: { id: true, passwordHash: true, privacy: true, settings: true, workspaceId: true },
    take: 2,
    where: { slug },
  })
  return galleries.length === 1 ? galleries[0] : null
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { galleryId } = await params
  const gallery = await findGallery(galleryId)
  if (!gallery) return NextResponse.json({ unlocked: false }, { status: 404 })

  const session = await auth()
  const isOwner = session?.user?.workspaceId === gallery.workspaceId
  const token = request.cookies.get(galleryAccessCookieName(gallery.id))?.value
  const unlocked = gallery.privacy !== "PASSWORD" || isOwner || verifyGalleryAccessToken(token, gallery.id)
  return NextResponse.json({ unlocked })
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { galleryId } = await params
  const limit = checkRequestRateLimit(`gallery-unlock:${galleryId}:${requestClientKey(request)}`, 10, 15 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many password attempts. Please wait and try again." },
      { headers: { "Retry-After": String(limit.retryAfterSeconds) }, status: 429 },
    )
  }

  const parsed = unlockSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "A password is required." }, { status: 400 })

  const gallery = await findGallery(galleryId)
  if (!gallery || gallery.privacy !== "PASSWORD") {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 })
  }

  const settings = asRecord(gallery.settings)
  const legacyPassword = typeof settings.password === "string" ? settings.password : ""
  const valid = gallery.passwordHash
    ? verifyGalleryPassword(parsed.data.password, gallery.passwordHash)
    : Boolean(legacyPassword && safePlaintextEqual(parsed.data.password, legacyPassword))

  if (!valid) return NextResponse.json({ error: "That password did not match." }, { status: 401 })

  if (!gallery.passwordHash && legacyPassword) {
    const safeSettings = { ...settings }
    delete safeSettings.password
    await getPrismaClient().gallery.update({
      data: { passwordHash: hashGalleryPassword(parsed.data.password), settings: safeSettings as Prisma.InputJsonValue },
      where: { id: gallery.id },
    })
  }

  const response = NextResponse.json({ unlocked: true })
  response.cookies.set(galleryAccessCookieName(gallery.id), createGalleryAccessToken(gallery.id), {
    httpOnly: true,
    maxAge: 12 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
