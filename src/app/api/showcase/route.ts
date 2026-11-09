import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { SUBSCRIBER_SHOWCASE_ENABLED } from "@/lib/release-flags"

const showcaseCategory = z.enum([
  "Architecture",
  "Black & White",
  "Fine Art",
  "Landscape",
  "Street",
  "Travel",
  "Wildlife",
])

const submissionSchema = z.object({
  category: showcaseCategory,
  galleryId: z.string().trim().min(1).max(200),
  photoId: z.string().trim().min(1).max(200),
})

function objectRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 8) : []
}

function showcaseOnHold() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

function toShowcasePhoto(submission: {
  category: string
  createdAt: Date
  gallerySlug: string
  id: string
  location: string | null
  photographer: string
  photoId: string
  portfolioName: string
  status: string
  tags: unknown
  title: string
  workspaceSlug: string
}) {
  return {
    category: submission.category,
    comments: 0,
    id: submission.id,
    imageUrl: `/api/media/${encodeURIComponent(submission.gallerySlug)}/${encodeURIComponent(submission.photoId)}?variant=display`,
    location: submission.location ?? undefined,
    photographer: submission.photographer,
    portfolioId: submission.gallerySlug,
    portfolioName: submission.portfolioName,
    status: submission.status === "FEATURED" ? "Featured" : "Approved",
    submittedAt: submission.createdAt.toISOString(),
    tags: stringList(submission.tags),
    thumbnailUrl: `/api/media/${encodeURIComponent(submission.gallerySlug)}/${encodeURIComponent(submission.photoId)}?variant=thumbnail`,
    title: submission.title,
    votes: 0,
    workspaceSlug: submission.workspaceSlug,
  }
}

export async function GET(request: Request) {
  if (!SUBSCRIBER_SHOWCASE_ENABLED) return showcaseOnHold()

  const prisma = getPrismaClient()
  const url = new URL(request.url)
  if (url.searchParams.get("mine") === "1") {
    const session = await auth()
    if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const submissions = await prisma.showcaseSubmission.findMany({
      select: { galleryId: true, photoId: true },
      where: { workspaceId: session.user.workspaceId },
    })
    return NextResponse.json({ keys: submissions.map((submission) => `${submission.galleryId}:${submission.photoId}`) })
  }
  const submissions = await prisma.showcaseSubmission.findMany({
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 300,
    where: { status: { in: ["APPROVED", "FEATURED"] } },
  })

  return NextResponse.json({ photos: submissions.map(toShowcasePhoto) })
}

export async function POST(request: Request) {
  if (!SUBSCRIBER_SHOWCASE_ENABLED) return showcaseOnHold()

  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = submissionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid showcase submission" }, { status: 400 })

  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findFirst({
    include: { photos: true, workspace: true },
    where: {
      OR: [{ id: parsed.data.galleryId }, { slug: parsed.data.galleryId }],
      workspaceId: session.user.workspaceId,
    },
  })
  if (!gallery) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
  if (gallery.privacy !== "PUBLIC" || gallery.status === "DRAFT" || gallery.status === "ARCHIVED") {
    return NextResponse.json({ error: "Only photographs from a public, published portfolio can join the showcase." }, { status: 400 })
  }

  const photo = gallery.photos.find((candidate) => {
    const metadata = objectRecord(candidate.metadata)
    return candidate.id === parsed.data.photoId || metadata.externalId === parsed.data.photoId
  })
  if (!photo || photo.isHidden || photo.kind !== "IMAGE") {
    return NextResponse.json({ error: "Photo not found or not publicly visible" }, { status: 404 })
  }

  const metadata = objectRecord(photo.metadata)
  const externalPhotoId = typeof metadata.externalId === "string" ? metadata.externalId : photo.id
  const tags = stringList(metadata.tags)
  const submission = await prisma.showcaseSubmission.upsert({
    create: {
      category: parsed.data.category,
      galleryId: gallery.id,
      gallerySlug: gallery.slug,
      location: typeof metadata.location === "string" ? metadata.location : null,
      photographer: gallery.workspace.publicBrandName?.trim() || gallery.workspace.ownerName?.trim() || session.user.name?.trim() || "PhotoView.io Photographer",
      photoId: externalPhotoId,
      portfolioName: gallery.name,
      status: "APPROVED",
      tags,
      title: photo.caption?.trim() || photo.title.trim() || photo.fileName,
      workspaceId: gallery.workspaceId,
      workspaceSlug: gallery.workspace.slug,
    },
    update: {
      category: parsed.data.category,
      gallerySlug: gallery.slug,
      location: typeof metadata.location === "string" ? metadata.location : null,
      photographer: gallery.workspace.publicBrandName?.trim() || gallery.workspace.ownerName?.trim() || session.user.name?.trim() || "PhotoView.io Photographer",
      portfolioName: gallery.name,
      status: "APPROVED",
      tags,
      title: photo.caption?.trim() || photo.title.trim() || photo.fileName,
      workspaceSlug: gallery.workspace.slug,
    },
    where: {
      workspaceId_galleryId_photoId: {
        galleryId: gallery.id,
        photoId: externalPhotoId,
        workspaceId: gallery.workspaceId,
      },
    },
  })

  return NextResponse.json({ photo: toShowcasePhoto(submission) }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!SUBSCRIBER_SHOWCASE_ENABLED) return showcaseOnHold()

  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = submissionSchema.pick({ galleryId: true, photoId: true }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid showcase removal" }, { status: 400 })

  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findFirst({
    include: { photos: { select: { id: true, metadata: true } } },
    where: { OR: [{ id: parsed.data.galleryId }, { slug: parsed.data.galleryId }], workspaceId: session.user.workspaceId },
  })
  if (!gallery) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
  const photo = gallery.photos.find((candidate) => {
    const metadata = objectRecord(candidate.metadata)
    return candidate.id === parsed.data.photoId || metadata.externalId === parsed.data.photoId
  })
  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })
  const metadata = objectRecord(photo.metadata)
  const externalPhotoId = typeof metadata.externalId === "string" ? metadata.externalId : photo.id

  await prisma.showcaseSubmission.deleteMany({
    where: { galleryId: gallery.id, photoId: externalPhotoId, workspaceId: session.user.workspaceId },
  })
  return NextResponse.json({ removed: true })
}
