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

const MAX_VIDEO_BYTES = 5 * 1024 ** 3
const MAX_POSTER_BYTES = 3 * 1024 ** 2

type VideoRequest = {
  fileName?: string
  fileSize?: number
  fileType?: string
  galleryId?: string
  originalReference?: string
  playbackFileName?: string
  playbackReference?: string
  playbackSize?: number
  posterReference?: string
  posterSize?: number
  references?: string[]
  title?: string
}

export async function DELETE(request: Request) {
  const access = await writeAccess()
  if (access.error) return access.error
  const body = await request.json().catch(() => ({})) as VideoRequest
  const galleryId = body.galleryId?.trim() ?? ""
  const gallery = await getPrismaClient().gallery.findUnique({ where: { workspaceId_slug: { slug: galleryId, workspaceId: access.session.user.workspaceId } } })
  if (!gallery) return NextResponse.json({ error: "The selected portfolio could not be found." }, { status: 404 })
  const prefix = `portfolio-video/${access.session.user.workspaceId}/${gallery.id}/`
  const references = Array.from(new Set((body.references ?? []).filter((reference) => {
    const object = resolveR2ObjectReference(reference)
    return Boolean(object?.pathname.startsWith(prefix))
  }))).slice(0, 3)
  if (references.length === 0) return NextResponse.json({ ok: true })

  const used = await getPrismaClient().photo.findMany({
    select: { displayUrl: true, originalUrl: true, thumbnailUrl: true },
    where: {
      OR: [
        { originalUrl: { in: references } },
        { displayUrl: { in: references } },
        { thumbnailUrl: { in: references } },
      ],
      workspaceId: access.session.user.workspaceId,
    },
  })
  const retained = new Set(used.flatMap((photo) => [photo.originalUrl, photo.displayUrl, photo.thumbnailUrl].filter((value): value is string => Boolean(value))))
  await Promise.allSettled(references.filter((reference) => !retained.has(reference)).map((reference) => deleteManagedPhotoObject(reference)))
  return NextResponse.json({ ok: true })
}

function safeBase(value: string) {
  return value.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "portfolio-video"
}

function extension(value: string) {
  return value.toLowerCase().endsWith(".mov") ? ".mov" : ".mp4"
}

async function writeAccess() {
  const session = await auth()
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return { error: subscriptionWriteBlockResponse(entitlement) }
  return { entitlement, session }
}

export async function POST(request: Request) {
  const access = await writeAccess()
  if (access.error) return access.error
  const limit = await checkRequestRateLimit(`portfolio-video:${access.session.user.workspaceId}`, 100, 15 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ error: "Too many video uploads were started. Please wait and try again." }, { status: 429 })
  const body = await request.json().catch(() => ({})) as VideoRequest
  const galleryId = body.galleryId?.trim() ?? ""
  const fileSize = Number(body.fileSize ?? 0)
  const playbackSize = Number(body.playbackSize ?? 0)
  const posterSize = Number(body.posterSize ?? 0)
  const fileType = body.fileType === "video/quicktime" ? "video/quicktime" : body.fileType === "video/mp4" ? "video/mp4" : ""
  if (!galleryId) return NextResponse.json({ error: "Choose a portfolio before uploading video." }, { status: 400 })
  if (!fileType || !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Choose an MP4 or MOV video smaller than 5 GB." }, { status: 400 })
  }
  if (playbackSize && (!Number.isSafeInteger(playbackSize) || playbackSize <= 0 || playbackSize > MAX_VIDEO_BYTES)) {
    return NextResponse.json({ error: "The playback copy is invalid." }, { status: 400 })
  }
  if (!Number.isSafeInteger(posterSize) || posterSize <= 0 || posterSize > MAX_POSTER_BYTES) {
    return NextResponse.json({ error: "The video poster is invalid." }, { status: 400 })
  }
  const gallery = await getPrismaClient().gallery.findUnique({ where: { workspaceId_slug: { slug: galleryId, workspaceId: access.session.user.workspaceId } } })
  if (!gallery) return NextResponse.json({ error: "The selected portfolio could not be found." }, { status: 404 })
  const incoming = fileSize + playbackSize + posterSize
  if (access.entitlement.storageUsedBytes + incoming > access.entitlement.storageLimitBytes) {
    return NextResponse.json({ error: "This video and its playback files would exceed the account storage allowance." }, { status: 413 })
  }

  const prefix = `portfolio-video/${access.session.user.workspaceId}/${gallery.id}`
  const base = safeBase(body.fileName ?? "portfolio-video")
  const original = await createDirectPhotoUpload({ contentType: fileType, pathname: `${prefix}/original/${base}${extension(body.fileName ?? "")}` })
  const playback = playbackSize
    ? await createDirectPhotoUpload({ contentType: "video/mp4", pathname: `${prefix}/playback/${base}.mp4` })
    : undefined
  const poster = posterSize
    ? await createDirectPhotoUpload({ contentType: "image/jpeg", pathname: `${prefix}/poster/${base}.jpg` })
    : undefined
  return NextResponse.json({ original: { ...original, contentType: fileType }, playback: playback ? { ...playback, contentType: "video/mp4" } : undefined, poster: poster ? { ...poster, contentType: "image/jpeg" } : undefined })
}

async function verifiedObject(reference: string, prefix: string, allowedTypes: string[], maxBytes: number) {
  const resolved = resolveR2ObjectReference(reference)
  if (!resolved || !resolved.pathname.startsWith(prefix)) throw new Error("The video upload reference is invalid.")
  const stored = await getPhotoObjectMetadata(reference)
  if (!allowedTypes.includes(stored.contentType) || stored.contentLength <= 0 || stored.contentLength > maxBytes) throw new Error("The uploaded video file is invalid.")
  return stored
}

async function verifyIsoMedia(reference: string) {
  const bytes = await getPhotoObjectRange(reference, 0, 31)
  if (bytes.byteLength < 12 || String.fromCharCode(...bytes.slice(4, 8)) !== "ftyp") throw new Error("The uploaded file is not a valid MP4 or MOV video.")
}

async function verifyJpeg(reference: string) {
  const bytes = await getPhotoObjectRange(reference, 0, 2)
  if (bytes.byteLength < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error("The uploaded video poster is invalid.")
}

export async function PUT(request: Request) {
  const access = await writeAccess()
  if (access.error) return access.error
  const body = await request.json().catch(() => ({})) as VideoRequest
  const galleryId = body.galleryId?.trim() ?? ""
  const originalReference = body.originalReference?.trim() ?? ""
  const playbackReference = body.playbackReference?.trim() ?? ""
  const posterReference = body.posterReference?.trim() ?? ""
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findUnique({ where: { workspaceId_slug: { slug: galleryId, workspaceId: access.session.user.workspaceId } } })
  if (!gallery) return NextResponse.json({ error: "The selected portfolio could not be found." }, { status: 404 })
  const prefix = `portfolio-video/${access.session.user.workspaceId}/${gallery.id}/`
  const references = [originalReference, playbackReference, posterReference].filter(Boolean)
  let databaseWriteStarted = false
  try {
    const original = await verifiedObject(originalReference, `${prefix}original/`, ["video/mp4", "video/quicktime"], MAX_VIDEO_BYTES)
    await verifyIsoMedia(originalReference)
    const playback = playbackReference ? await verifiedObject(playbackReference, `${prefix}playback/`, ["video/mp4"], MAX_VIDEO_BYTES) : null
    if (playback) await verifyIsoMedia(playbackReference)
    if (original.contentType === "video/quicktime" && !playback) throw new Error("A web playback copy is required for MOV video.")
    if (!posterReference) throw new Error("A poster image is required for portfolio video.")
    const poster = await verifiedObject(posterReference, `${prefix}poster/`, ["image/jpeg"], MAX_POSTER_BYTES)
    await verifyJpeg(posterReference)
    const incomingBytes = original.contentLength + (playback?.contentLength ?? 0) + (poster?.contentLength ?? 0)

    databaseWriteStarted = true
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.findUnique({ select: { storageUsedBytes: true }, where: { id: access.session.user.workspaceId } })
      if (!workspace) throw new Error("The subscriber workspace could not be found.")
      if (workspace.storageUsedBytes + BigInt(incomingBytes) > BigInt(access.entitlement.storageLimitBytes)) throw new Error("This video would exceed the account storage allowance.")
      const existing = await tx.photo.findFirst({
        select: { id: true },
        where: {
          OR: [
            { originalUrl: originalReference },
            ...(playbackReference ? [{ displayUrl: playbackReference }] : []),
            { thumbnailUrl: posterReference },
          ],
          workspaceId: access.session.user.workspaceId,
        },
      })
      if (existing) throw new Error("This video upload has already been saved.")
      const order = await tx.photo.aggregate({ _max: { sortOrder: true }, where: { galleryId: gallery.id } })
      const photo = await tx.photo.create({
        data: {
          bytes: BigInt(original.contentLength),
          displayBytes: BigInt(playback?.contentLength ?? 0),
          displayUrl: playbackReference || null,
          downloadUrl: originalReference,
          fileName: body.fileName?.trim() || original.pathname.split("/").pop() || "portfolio-video.mp4",
          galleryId: gallery.id,
          kind: "VIDEO",
          metadata: { contentType: original.contentType, playbackContentType: "video/mp4", uploadedAt: new Date().toISOString() },
          originalUrl: originalReference,
          sortOrder: (order._max.sortOrder ?? -1) + 1,
          sourceUrl: originalReference,
          thumbnailBytes: BigInt(poster.contentLength),
          thumbnailUrl: posterReference,
          title: body.title?.trim() || body.fileName?.replace(/\.[^/.]+$/, "") || "Video",
          workspaceId: access.session.user.workspaceId,
        },
      })
      const events = [
        { bytesDelta: BigInt(original.contentLength), pathname: original.pathname, type: "ORIGINAL_UPLOADED" as const },
        ...(playback ? [{ bytesDelta: BigInt(playback.contentLength), pathname: playback.pathname, type: "DISPLAY_GENERATED" as const }] : []),
        { bytesDelta: BigInt(poster.contentLength), pathname: poster.pathname, type: "THUMBNAIL_GENERATED" as const },
      ]
      await tx.storageUsageEvent.createMany({ data: events.map((event) => ({ ...event, galleryId: gallery.id, photoId: photo.id, workspaceId: access.session.user.workspaceId })) })
      const storage = await tx.photo.aggregate({ _sum: { bytes: true, displayBytes: true, thumbnailBytes: true }, where: { galleryId: gallery.id } })
      const galleryBytes = (storage._sum.bytes ?? BigInt(0)) + (storage._sum.displayBytes ?? BigInt(0)) + (storage._sum.thumbnailBytes ?? BigInt(0))
      await tx.gallery.update({ data: { storageUsedBytes: galleryBytes }, where: { id: gallery.id } })
      const workspaceStorage = await tx.gallery.aggregate({ _sum: { storageUsedBytes: true }, where: { workspaceId: access.session.user.workspaceId } })
      await tx.workspace.update({ data: { storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0) }, where: { id: access.session.user.workspaceId } })
      const assetCount = await tx.photo.count({ where: { galleryId: gallery.id, isHidden: false } })
      return { assetCount, galleryBytes, photo }
    }, { isolationLevel: "Serializable" })

    const deliveryUrl = `/api/media/${encodeURIComponent(gallery.id)}/${encodeURIComponent(result.photo.id)}`
    return NextResponse.json({
      downloadUrl: `${deliveryUrl}?variant=download`,
      gallery: { id: gallery.slug, images: result.assetCount, storageUsedBytes: Number(result.galleryBytes) },
      ok: true,
      pathname: original.pathname,
      photo: {
        blobUrl: originalReference,
        bytes: original.contentLength,
        deliveryUrl,
        displayBytes: playback?.contentLength ?? 0,
        displayUrl: playbackReference || undefined,
        downloadUrl: originalReference,
        fileName: result.photo.fileName,
        height: null,
        hidden: false,
        id: result.photo.id,
        kind: "Video",
        sourceUrl: originalReference,
        thumbnailBytes: poster.contentLength,
        thumbnailUrl: posterReference,
        title: result.photo.title,
        width: null,
      },
      provider: "r2",
      size: original.contentLength,
      url: deliveryUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The uploaded video could not be saved."
    const savedReference = databaseWriteStarted
      ? await prisma.photo.findFirst({
          select: { id: true },
          where: {
            OR: [
              ...(originalReference ? [{ originalUrl: originalReference }] : []),
              ...(playbackReference ? [{ displayUrl: playbackReference }] : []),
              ...(posterReference ? [{ thumbnailUrl: posterReference }] : []),
            ],
            workspaceId: access.session.user.workspaceId,
          },
        }).catch(() => null)
      : null
    if (!savedReference) {
      await Promise.allSettled(references.map((reference) => deleteManagedPhotoObject(reference)))
    }
    return NextResponse.json({ error: message }, { status: /already been saved/i.test(message) ? 409 : 400 })
  }
}
