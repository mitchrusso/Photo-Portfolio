import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import sharp from "sharp"
import { getPrismaClient } from "@/lib/db"
import { assertPhotoStorageConfigured, deleteManagedPhotoObject, uploadPhotoObject } from "@/lib/photo-storage"
import { TECHNICAL_UPLOAD_SAFETY_BYTES } from "@/lib/plans"
import { verifyImportToken } from "@/lib/import-token"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
])

type ImportSource = "desktop" | "lightroom"

export async function handlePhotoImport(request: Request, source: ImportSource): Promise<NextResponse> {
  const credential = validateImportKey(request)

  if (credential instanceof NextResponse) {
    return credential
  }

  const entitlement = await getWorkspaceEntitlement(credential.workspaceId)
  if (entitlement.mode !== "write") return subscriptionWriteBlockResponse(entitlement)

  const limit = await checkRequestRateLimit(`photo-import:${credential.workspaceId}:${requestClientKey(request)}`, 60, 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Import rate limit reached. Please retry shortly." },
      { headers: { "Retry-After": String(limit.retryAfterSeconds) }, status: 429 },
    )
  }

  try {
    assertPhotoStorageConfigured()
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Photo storage is not configured.",
      },
      { status: 500 },
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A rendered photo file is required." }, { status: 400 })
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type || "unknown"}` },
      { status: 415 },
    )
  }

  if (file.size > TECHNICAL_UPLOAD_SAFETY_BYTES) {
    return NextResponse.json(
      { error: "This rendered file is too large for the current import method." },
      { status: 413 },
    )
  }

  if (entitlement.storageUsedBytes + file.size > entitlement.storageLimitBytes) {
    return NextResponse.json(
      { error: "This import would exceed the account storage allowance. Upgrade storage before importing." },
      { status: 413 },
    )
  }

  const galleryName = getFormValue(formData, "galleryName", source === "lightroom" ? "Lightroom Portfolio" : "Desktop Uploads")
  const gallerySlug = slugify(getFormValue(formData, "gallerySlug", galleryName))
  const clientName = getFormValue(formData, "clientName", "")
  const makePublic = getFormValue(formData, "makePublic", "false") === "true"
  const originalFileName = getFormValue(formData, "originalFileName", file.name)
  const safeFileName = sanitizeFileName(originalFileName || file.name || "photo-import.jpg")
  const pathname = `imports/${credential.workspaceId}/${source}/${gallerySlug}/${Date.now()}-${safeFileName}`

  let storedPhoto: Awaited<ReturnType<typeof uploadPhotoObject>> | null = null

  try {
    const fileBytes = new Uint8Array(await file.arrayBuffer())
    const imageMetadata = await validateImportedImage(fileBytes, file.type)
    storedPhoto = await uploadPhotoObject({
      pathname,
      body: fileBytes,
      contentType: file.type,
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })
    const persisted = await persistImportedPhoto({
      caption: getFormValue(formData, "caption", ""),
      captureTime: getFormValue(formData, "captureTime", ""),
      clientName,
      fileName: safeFileName,
      galleryLimit: entitlement.galleryLimit,
      galleryName,
      gallerySlug,
      height: imageMetadata.height,
      makePublic,
      photoTitle: getFormValue(formData, "photoTitle", ""),
      size: storedPhoto.size,
      source,
      storageLimitBytes: entitlement.storageLimitBytes,
      storedUrl: storedPhoto.url,
      width: imageMetadata.width,
      workspaceId: credential.workspaceId,
    })

    const payload = {
      ok: true,
      source,
      gallery: {
        name: galleryName,
        slug: gallerySlug,
        clientName,
        public: makePublic,
      },
      photo: {
        id: persisted.photoId,
        url: persisted.deliveryUrl,
        originalUrl: storedPhoto.url,
        downloadUrl: storedPhoto.downloadUrl,
        pathname: storedPhoto.pathname,
        provider: storedPhoto.provider,
        fileName: safeFileName,
        bytes: storedPhoto.size,
        contentType: file.type,
        title: getFormValue(formData, "photoTitle", ""),
        caption: getFormValue(formData, "caption", ""),
        captureTime: getFormValue(formData, "captureTime", ""),
      },
    }

    console.info("Photo import completed", {
      bytes: storedPhoto.size,
      gallerySlug,
      photoId: persisted.photoId,
      source,
      workspaceId: credential.workspaceId,
    })

    return NextResponse.json(payload)
  } catch (error) {
    if (storedPhoto) {
      await deleteManagedPhotoObject(storedPhoto.url).catch(() => undefined)
    }
    const message = error instanceof Error ? error.message : "Photo import failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function validateImportKey(request: Request): NextResponse | { workspaceId: string } {
  const requiredKey = process.env.PHOTOVIEWPRO_IMPORT_API_KEY
  const providedKey = request.headers.get("x-photoviewpro-key")
  const tokenClaims = verifyImportToken(providedKey ?? undefined)
  if (tokenClaims) return { workspaceId: tokenClaims.workspaceId }

  if (!requiredKey) return NextResponse.json({ error: "Invalid or expired PhotoViewPro import key." }, { status: 401 })

  const providedBuffer = Buffer.from(providedKey ?? "")
  const requiredBuffer = Buffer.from(requiredKey)
  if (providedBuffer.length !== requiredBuffer.length || !timingSafeEqual(providedBuffer, requiredBuffer)) {
    return NextResponse.json({ error: "Invalid PhotoViewPro import API key." }, { status: 401 })
  }

  const legacyWorkspaceId = process.env.PHOTOVIEWPRO_IMPORT_WORKSPACE_ID
  if (!legacyWorkspaceId) {
    return NextResponse.json(
      { error: "This legacy import key is not assigned to a subscriber. Generate a fresh import token in PhotoViewPro Settings." },
      { status: 401 },
    )
  }

  return { workspaceId: legacyWorkspaceId }
}

async function validateImportedImage(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength === 0) throw new Error("The imported file is empty.")
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>
  try {
    metadata = await sharp(bytes, { limitInputPixels: 100_000_000 }).metadata()
  } catch {
    throw new Error("The imported file is not a valid image.")
  }

  const expectedFormats: Record<string, string[]> = {
    "image/heic": ["heif"],
    "image/heif": ["heif"],
    "image/jpeg": ["jpeg"],
    "image/png": ["png"],
    "image/tiff": ["tiff"],
    "image/webp": ["webp"],
  }
  if (!metadata.format || !expectedFormats[contentType]?.includes(metadata.format)) {
    throw new Error("The imported file contents do not match its declared type.")
  }

  return { height: metadata.height ?? null, width: metadata.width ?? null }
}

type PersistImportedPhotoInput = {
  caption: string
  captureTime: string
  clientName: string
  fileName: string
  galleryLimit: number | null
  galleryName: string
  gallerySlug: string
  height: number | null
  makePublic: boolean
  photoTitle: string
  size: number
  source: ImportSource
  storageLimitBytes: number
  storedUrl: string
  width: number | null
  workspaceId: string
}

async function persistImportedPhoto(input: PersistImportedPhotoInput) {
  const prisma = getPrismaClient()
  const existingGallery = await prisma.gallery.findUnique({
    select: { id: true },
    where: { workspaceId_slug: { slug: input.gallerySlug, workspaceId: input.workspaceId } },
  })

  if (!existingGallery && input.galleryLimit !== null) {
    const galleryCount = await prisma.gallery.count({ where: { workspaceId: input.workspaceId } })
    if (galleryCount >= input.galleryLimit) {
      throw new Error(`This plan allows ${input.galleryLimit} portfolios. Upgrade before importing into a new portfolio.`)
    }
  }

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.findUnique({
      select: { storageUsedBytes: true },
      where: { id: input.workspaceId },
    })
    if (!workspace) throw new Error("The subscriber workspace could not be found.")
    if (workspace.storageUsedBytes + BigInt(input.size) > BigInt(input.storageLimitBytes)) {
      throw new Error("This import would exceed the account storage allowance. Upgrade storage before importing.")
    }

    let clientId: string | undefined
    if (input.clientName) {
      const existingClient = await tx.client.findFirst({
        select: { id: true },
        where: { name: input.clientName, workspaceId: input.workspaceId },
      })
      clientId = existingClient?.id ?? (await tx.client.create({
        data: { name: input.clientName, workspaceId: input.workspaceId },
        select: { id: true },
      })).id
    }

    const gallery = await tx.gallery.upsert({
      create: {
        clientId,
        name: input.galleryName,
        privacy: input.makePublic ? "PUBLIC" : "PRIVATE",
        slug: input.gallerySlug,
        status: "DRAFT",
        workspaceId: input.workspaceId,
      },
      update: {
        ...(clientId ? { clientId } : {}),
        name: input.galleryName,
      },
      where: { workspaceId_slug: { slug: input.gallerySlug, workspaceId: input.workspaceId } },
    })
    const currentSort = await tx.photo.aggregate({
      _max: { sortOrder: true },
      where: { galleryId: gallery.id },
    })
    const title = input.photoTitle || input.fileName.replace(/\.[^/.]+$/, "") || input.fileName
    const photo = await tx.photo.create({
      data: {
        bytes: BigInt(input.size),
        caption: input.caption || null,
        downloadUrl: input.storedUrl,
        fileName: input.fileName,
        galleryId: gallery.id,
        height: input.height,
        metadata: {
          captureTime: input.captureTime || null,
          importedAt: new Date().toISOString(),
          importSource: input.source,
        },
        originalUrl: input.storedUrl,
        sortOrder: (currentSort._max.sortOrder ?? -1) + 1,
        sourceUrl: input.storedUrl,
        title,
        width: input.width,
        workspaceId: input.workspaceId,
      },
    })
    if (!gallery.coverPhotoId && !gallery.coverImageUrl) {
      await tx.gallery.update({ data: { coverPhotoId: photo.id }, where: { id: gallery.id } })
    }
    await tx.storageUsageEvent.create({
      data: {
        bytesDelta: BigInt(input.size),
        galleryId: gallery.id,
        photoId: photo.id,
        type: "IMPORTED",
        workspaceId: input.workspaceId,
      },
    })
    const galleryStorage = await tx.photo.aggregate({
      _sum: { bytes: true, displayBytes: true, thumbnailBytes: true },
      where: { galleryId: gallery.id },
    })
    const galleryBytes = (galleryStorage._sum.bytes ?? BigInt(0)) +
      (galleryStorage._sum.displayBytes ?? BigInt(0)) +
      (galleryStorage._sum.thumbnailBytes ?? BigInt(0))
    await tx.gallery.update({ data: { storageUsedBytes: galleryBytes }, where: { id: gallery.id } })
    const workspaceStorage = await tx.gallery.aggregate({
      _sum: { storageUsedBytes: true },
      where: { workspaceId: input.workspaceId },
    })
    await tx.workspace.update({
      data: { storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0) },
      where: { id: input.workspaceId },
    })

    return {
      deliveryUrl: `/api/media/${encodeURIComponent(gallery.id)}/${encodeURIComponent(photo.id)}`,
      photoId: photo.id,
    }
  }, { isolationLevel: "Serializable" })
}

function getFormValue(formData: FormData, key: string, fallback: string): string {
  const value = formData.get(key)
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")

  return slug || "photo-import"
}

function sanitizeFileName(value: string): string {
  const parts = value.split(".")
  const extension = parts.length > 1 ? parts.pop() : "jpg"
  const baseName = parts.join(".") || "photo-import"
  const safeBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "") || "photo-import"

  return `${safeBaseName}.${(extension || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"}`
}
