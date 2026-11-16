import { NextResponse } from "next/server"
import sharp from "sharp"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { deleteManagedPhotoObject, uploadPhotoObject } from "@/lib/photo-storage"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import {
  normalizeTestimonialBody,
  normalizeTestimonialFirstName,
  normalizeTestimonialLastInitial,
  TESTIMONIAL_BODY_MAX_LENGTH,
  TESTIMONIAL_BODY_MIN_LENGTH,
  TESTIMONIAL_HEADSHOT_MAX_BYTES,
} from "@/lib/testimonials"

const ALLOWED_HEADSHOT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: "Please sign in before sharing your story." }, { status: 401 })
  }

  const rateLimit = await checkRequestRateLimit(`testimonial:${session.user.id}:${requestClientKey(request)}`, 5, 24 * 60 * 60 * 1_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You have already submitted several updates today. Please try again tomorrow." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  const formData = await request.formData()
  const firstName = normalizeTestimonialFirstName(String(formData.get("firstName") ?? ""))
  const lastInitial = normalizeTestimonialLastInitial(String(formData.get("lastInitial") ?? ""))
  const body = normalizeTestimonialBody(String(formData.get("body") ?? ""))
  const permissionGranted = formData.get("permissionGranted") === "true"
  const headshot = formData.get("headshot")

  if (!firstName) return NextResponse.json({ error: "Please add your first name." }, { status: 400 })
  if (!lastInitial) return NextResponse.json({ error: "Please add your last initial." }, { status: 400 })
  if (body.length < TESTIMONIAL_BODY_MIN_LENGTH || body.length > TESTIMONIAL_BODY_MAX_LENGTH) {
    return NextResponse.json({ error: `Your testimonial must be ${TESTIMONIAL_BODY_MIN_LENGTH}–${TESTIMONIAL_BODY_MAX_LENGTH} characters.` }, { status: 400 })
  }
  if (!permissionGranted) {
    return NextResponse.json({ error: "Please give PhotoView permission to feature your testimonial and headshot." }, { status: 400 })
  }
  if (!(headshot instanceof File)) return NextResponse.json({ error: "Please add a headshot." }, { status: 400 })
  if (!ALLOWED_HEADSHOT_TYPES.has(headshot.type) || headshot.size > TESTIMONIAL_HEADSHOT_MAX_BYTES) {
    return NextResponse.json({ error: "Use a JPEG, PNG, or WebP headshot no larger than 5 MB." }, { status: 415 })
  }

  const prisma = getPrismaClient()
  const existing = await prisma.testimonial.findUnique({ select: { headshotUrl: true }, where: { userId: session.user.id } })
  let newHeadshotReference: string | null = null

  try {
    const normalizedHeadshot = await sharp(new Uint8Array(await headshot.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(512, 512, { fit: "cover", position: "attention" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer()
    const stored = await uploadPhotoObject({
      addRandomSuffix: true,
      body: normalizedHeadshot,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      contentType: "image/jpeg",
      pathname: `testimonials/${session.user.workspaceId}/${session.user.id}/headshot.jpg`,
    })
    newHeadshotReference = stored.url

    const testimonial = await prisma.testimonial.upsert({
      create: { body, firstName, headshotUrl: stored.url, lastInitial, permissionGranted: true, userId: session.user.id, workspaceId: session.user.workspaceId },
      update: {
        approvedAt: null,
        body,
        firstName,
        headshotUrl: stored.url,
        isFeatured: false,
        lastInitial,
        permissionGranted: true,
        reviewedAt: null,
        status: "PENDING",
        submittedAt: new Date(),
        workspaceId: session.user.workspaceId,
      },
      where: { userId: session.user.id },
    })

    if (existing?.headshotUrl && existing.headshotUrl !== stored.url) {
      await deleteManagedPhotoObject(existing.headshotUrl).catch(() => undefined)
    }
    return NextResponse.json({ id: testimonial.id, ok: true })
  } catch (error) {
    if (newHeadshotReference) await deleteManagedPhotoObject(newHeadshotReference).catch(() => undefined)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Your testimonial could not be submitted." }, { status: 400 })
  }
}
