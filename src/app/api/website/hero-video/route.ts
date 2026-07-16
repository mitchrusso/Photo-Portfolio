import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import {
  createDirectPhotoUpload,
  deleteManagedPhotoObject,
  getPhotoObjectMetadata,
  getPhotoObjectRange,
  resolveR2ObjectReference,
} from "@/lib/photo-storage"
import { checkRequestRateLimit } from "@/lib/request-rate-limit"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

const HERO_VIDEO_MAX_BYTES = 200 * 1024 ** 2
const HERO_VIDEO_MAX_SECONDS = 90
const HERO_VIDEO_CONTENT_TYPE = "video/mp4"
const HERO_VIDEO_METADATA_MAX_BYTES = 16 * 1024 ** 2

type HeroVideoRequest = {
  fileName?: string
  fileSize?: number
  galleryId?: string
  reference?: string
  url?: string
}

function safeFileName(value: string) {
  const base = value.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
  return `${base || "hero-video"}.mp4`
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function isString(value: string | null): value is string {
  return Boolean(value)
}

function websiteMediaPhotoId(url: string) {
  const match = url.match(/^\/api\/website\/media\/([^/?#]+)$/)
  return match ? decodeURIComponent(match[1]) : ""
}

async function authorizedWriteSession() {
  const session = await auth()
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return { error: subscriptionWriteBlockResponse(entitlement) }
  return { entitlement, session }
}

export async function POST(request: Request) {
  const access = await authorizedWriteSession()
  if (access.error) return access.error
  const rateLimit = await checkRequestRateLimit(`hero-video:${access.session.user.workspaceId}`, 12, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many Hero video uploads. Please wait before trying again." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  const body = await request.json().catch(() => ({})) as HeroVideoRequest
  const fileName = safeFileName(body.fileName ?? "hero-video.mp4")
  const fileSize = Number(body.fileSize ?? 0)
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: "Choose an MP4 video before uploading." }, { status: 400 })
  }
  if (fileSize > HERO_VIDEO_MAX_BYTES) {
    return NextResponse.json({ error: "The Hero video must be 200 MB or smaller." }, { status: 413 })
  }
  const upload = await createDirectPhotoUpload({
    contentType: HERO_VIDEO_CONTENT_TYPE,
    pathname: `website/hero-video/${access.session.user.workspaceId}/${fileName}`,
  })
  return NextResponse.json({
    contentType: HERO_VIDEO_CONTENT_TYPE,
    maxBytes: HERO_VIDEO_MAX_BYTES,
    reference: upload.reference,
    uploadUrl: upload.uploadUrl,
  })
}

export async function PUT(request: Request) {
  const access = await authorizedWriteSession()
  if (access.error) return access.error

  const body = await request.json().catch(() => ({})) as HeroVideoRequest
  const reference = body.reference?.trim() ?? ""
  const object = resolveR2ObjectReference(reference)
  const expectedPrefix = `website/hero-video/${access.session.user.workspaceId}/`
  if (!object || !object.pathname.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "The Hero video upload reference is invalid." }, { status: 400 })
  }

  try {
    const stored = await getPhotoObjectMetadata(reference)
    if (stored.contentType !== HERO_VIDEO_CONTENT_TYPE) throw new Error("The Hero video must be an MP4 file.")
    if (stored.contentLength <= 0 || stored.contentLength > HERO_VIDEO_MAX_BYTES) throw new Error("The Hero video must be 200 MB or smaller.")
    const durationSeconds = await readMp4Duration(reference, stored.contentLength)
    if (durationSeconds > HERO_VIDEO_MAX_SECONDS + 0.05) throw new Error("The Hero video must be 90 seconds or shorter.")

    const gallerySlug = body.galleryId?.trim() ?? ""
    const prisma = getPrismaClient()
    const gallery = gallerySlug
      ? await prisma.gallery.findUnique({ where: { workspaceId_slug: { slug: gallerySlug, workspaceId: access.session.user.workspaceId } } })
      : await prisma.gallery.findFirst({ orderBy: { createdAt: "asc" }, where: { workspaceId: access.session.user.workspaceId } })
    if (!gallery) throw new Error("Create a portfolio before uploading a Hero video.")

    const existingWebsiteVideos = (await prisma.photo.findMany({
      select: { bytes: true, downloadUrl: true, galleryId: true, id: true, metadata: true, originalUrl: true, sourceUrl: true },
      where: { isHidden: true, kind: "VIDEO", workspaceId: access.session.user.workspaceId },
    })).filter((photo) => asRecord(photo.metadata).assetPurpose === "website" && asRecord(photo.metadata).heroVideo === true)
    const existingBytes = existingWebsiteVideos.reduce((sum, photo) => sum + photo.bytes, BigInt(0))
    const oldReferences = existingWebsiteVideos.flatMap((photo) => [photo.originalUrl, photo.downloadUrl, photo.sourceUrl]).filter((value, index, values): value is string => isString(value) && values.indexOf(value) === index)

    const photo = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.findUnique({ select: { storageUsedBytes: true }, where: { id: access.session.user.workspaceId } })
      if (!workspace) throw new Error("The subscriber workspace could not be found.")
      const projectedBytes = workspace.storageUsedBytes - existingBytes + BigInt(stored.contentLength)
      if (projectedBytes > BigInt(access.entitlement.storageLimitBytes)) throw new Error("This video would exceed the account storage allowance.")

      if (existingWebsiteVideos.length > 0) {
        await tx.photo.deleteMany({ where: { id: { in: existingWebsiteVideos.map((item) => item.id) } } })
        for (const previous of existingWebsiteVideos) {
          await tx.storageUsageEvent.create({
            data: {
              bytesDelta: -previous.bytes,
              galleryId: previous.galleryId,
              photoId: null,
              type: "FILE_DELETED",
              workspaceId: access.session.user.workspaceId,
            },
          })
        }
      }

      const currentOrder = await tx.photo.aggregate({ _max: { sortOrder: true }, where: { galleryId: gallery.id } })
      const created = await tx.photo.create({
        data: {
          bytes: BigInt(stored.contentLength),
          downloadUrl: reference,
          fileName: safeFileName(body.fileName ?? stored.pathname.split("/").pop() ?? "hero-video.mp4"),
          galleryId: gallery.id,
          isHidden: true,
          kind: "VIDEO",
          metadata: {
            assetPurpose: "website",
            contentType: HERO_VIDEO_CONTENT_TYPE,
            durationSeconds,
            heroVideo: true,
            originalPathname: stored.pathname,
            uploadedAt: new Date().toISOString(),
          },
          originalUrl: reference,
          sortOrder: (currentOrder._max.sortOrder ?? -1) + 1,
          sourceUrl: reference,
          title: "Website Hero video",
          workspaceId: access.session.user.workspaceId,
        },
      })
      await tx.storageUsageEvent.create({
        data: {
          bytesDelta: BigInt(stored.contentLength),
          galleryId: gallery.id,
          pathname: stored.pathname,
          photoId: created.id,
          type: "ORIGINAL_UPLOADED",
          workspaceId: access.session.user.workspaceId,
        },
      })

      const affectedGalleryIds = Array.from(new Set([gallery.id, ...existingWebsiteVideos.map((item) => item.galleryId)]))
      for (const galleryId of affectedGalleryIds) {
        const storage = await tx.photo.aggregate({ _sum: { bytes: true, displayBytes: true, thumbnailBytes: true }, where: { galleryId } })
        await tx.gallery.update({
          data: { storageUsedBytes: (storage._sum.bytes ?? BigInt(0)) + (storage._sum.displayBytes ?? BigInt(0)) + (storage._sum.thumbnailBytes ?? BigInt(0)) },
          where: { id: galleryId },
        })
      }
      const workspaceStorage = await tx.gallery.aggregate({ _sum: { storageUsedBytes: true }, where: { workspaceId: access.session.user.workspaceId } })
      await tx.workspace.update({ data: { storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0) }, where: { id: access.session.user.workspaceId } })
      return created
    }, { isolationLevel: "Serializable" })

    await Promise.allSettled(oldReferences.map((oldReference) => deleteManagedPhotoObject(oldReference)))
    return NextResponse.json({ durationSeconds, ok: true, url: `/api/website/media/${encodeURIComponent(photo.id)}` })
  } catch (error) {
    await Promise.allSettled([deleteManagedPhotoObject(reference)])
    return NextResponse.json({ error: error instanceof Error ? error.message : "The Hero video could not be saved." }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const access = await authorizedWriteSession()
  if (access.error) return access.error
  const body = await request.json().catch(() => ({})) as HeroVideoRequest
  const photoId = websiteMediaPhotoId(body.url?.trim() ?? "")
  if (!photoId) return NextResponse.json({ error: "The Hero video reference is invalid." }, { status: 400 })

  const prisma = getPrismaClient()
  const photo = await prisma.photo.findFirst({ where: { id: photoId, workspaceId: access.session.user.workspaceId } })
  if (!photo || photo.kind !== "VIDEO" || asRecord(photo.metadata).heroVideo !== true) {
    return NextResponse.json({ error: "Hero video not found." }, { status: 404 })
  }
  const references = [photo.originalUrl, photo.downloadUrl, photo.sourceUrl].filter((value, index, values): value is string => isString(value) && values.indexOf(value) === index)
  await prisma.$transaction(async (tx) => {
    await tx.photo.delete({ where: { id: photo.id } })
    await tx.storageUsageEvent.create({ data: { bytesDelta: -photo.bytes, galleryId: photo.galleryId, type: "FILE_DELETED", workspaceId: access.session.user.workspaceId } })
    const storage = await tx.photo.aggregate({ _sum: { bytes: true, displayBytes: true, thumbnailBytes: true }, where: { galleryId: photo.galleryId } })
    await tx.gallery.update({ data: { storageUsedBytes: (storage._sum.bytes ?? BigInt(0)) + (storage._sum.displayBytes ?? BigInt(0)) + (storage._sum.thumbnailBytes ?? BigInt(0)) }, where: { id: photo.galleryId } })
    const workspaceStorage = await tx.gallery.aggregate({ _sum: { storageUsedBytes: true }, where: { workspaceId: access.session.user.workspaceId } })
    await tx.workspace.update({ data: { storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0) }, where: { id: access.session.user.workspaceId } })
  })
  await Promise.allSettled(references.map((reference) => deleteManagedPhotoObject(reference)))
  return NextResponse.json({ ok: true })
}

async function readMp4Duration(reference: string, fileSize: number) {
  let offset = 0
  let sawFtyp = false
  for (let boxIndex = 0; boxIndex < 64 && offset + 8 <= fileSize; boxIndex += 1) {
    const header = await getPhotoObjectRange(reference, offset, Math.min(fileSize - 1, offset + 31))
    if (header.byteLength < 8) break
    const view = new DataView(header.buffer, header.byteOffset, header.byteLength)
    const size32 = view.getUint32(0)
    const type = String.fromCharCode(...header.slice(4, 8))
    let headerSize = 8
    let boxSize = size32
    if (size32 === 1) {
      if (header.byteLength < 16) throw new Error("The MP4 metadata is invalid.")
      boxSize = Number(view.getBigUint64(8))
      headerSize = 16
    } else if (size32 === 0) {
      boxSize = fileSize - offset
    }
    if (!Number.isSafeInteger(boxSize) || boxSize < headerSize || offset + boxSize > fileSize) throw new Error("The MP4 metadata is invalid.")
    if (type === "ftyp") sawFtyp = true

    if (type === "moov") {
      if (boxSize > HERO_VIDEO_METADATA_MAX_BYTES) throw new Error("The MP4 metadata is too large. Export the video with web optimization enabled.")
      const bytes = await getPhotoObjectRange(reference, offset, offset + boxSize - 1)
      const duration = parseMovieHeaderDuration(bytes, headerSize)
      if (!duration || !Number.isFinite(duration) || duration <= 0) throw new Error("The MP4 duration could not be verified.")
      if (!sawFtyp) throw new Error("The uploaded file is not a valid MP4 video.")
      return duration
    }
    offset += boxSize
  }
  throw new Error("The MP4 duration could not be verified. Export the video with web optimization or fast start enabled.")
}

function parseMovieHeaderDuration(moov: Uint8Array, firstChildOffset: number) {
  let offset = firstChildOffset
  while (offset + 8 <= moov.byteLength) {
    const view = new DataView(moov.buffer, moov.byteOffset + offset, moov.byteLength - offset)
    const size = view.getUint32(0)
    const type = String.fromCharCode(...moov.slice(offset + 4, offset + 8))
    if (size < 8 || offset + size > moov.byteLength) return null
    if (type === "mvhd") {
      const payload = offset + 8
      const version = moov[payload]
      const payloadView = new DataView(moov.buffer, moov.byteOffset + payload, moov.byteLength - payload)
      if (version === 1) {
        if (payloadView.byteLength < 32) return null
        const timescale = payloadView.getUint32(20)
        const duration = Number(payloadView.getBigUint64(24))
        return timescale > 0 ? duration / timescale : null
      }
      if (payloadView.byteLength < 20) return null
      const timescale = payloadView.getUint32(12)
      const duration = payloadView.getUint32(16)
      return timescale > 0 ? duration / timescale : null
    }
    offset += size
  }
  return null
}
