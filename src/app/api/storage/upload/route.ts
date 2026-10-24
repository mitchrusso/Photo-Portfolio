import { NextResponse } from "next/server"
import sharp, { type Metadata } from "sharp"
import { auth } from "@/auth"
import { withDatabaseRetry } from "@/lib/database-retry"
import { getPrismaClient } from "@/lib/db"
import {
  createDirectPhotoUpload,
  deleteManagedPhotoObject,
  getPhotoObjectBytes,
  getPhotoObjectMetadata,
  getPhotoObjectRange,
  resolveR2ObjectReference,
  uploadPhotoObject,
} from "@/lib/photo-storage"
import { recordOperationalEvent } from "@/lib/operational-monitoring"
import { TECHNICAL_UPLOAD_SAFETY_BYTES } from "@/lib/plans"
import {
  isPhotoshopContentType,
  isPhotoshopFileName,
  PHOTOSHOP_CONTENT_TYPE,
  PHOTOSHOP_PREVIEW_SAFETY_BYTES,
  PHOTOSHOP_UPLOAD_SAFETY_BYTES,
  photoshopFileVersion,
} from "@/lib/photoshop-upload"
import { isAllowedPortfolioImageContentType } from "@/lib/portfolio-upload-rules"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { getWorkspaceEntitlement, type WorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

const MAX_IMAGE_PIXELS = 100_000_000
const MAX_WATERMARK_BYTES = 10 * 1024 * 1024
const MAX_WATERMARK_PIXELS = 16_000_000
const SHARP_FORMATS_BY_CONTENT_TYPE: Record<string, Set<string>> = {
  "image/avif": new Set(["heif"]),
  "image/heic": new Set(["heif"]),
  "image/heif": new Set(["heif"]),
  "image/jpeg": new Set(["jpeg"]),
  "image/png": new Set(["png"]),
  "image/tiff": new Set(["tiff"]),
  "image/webp": new Set(["webp"]),
}

type DirectPhotoUploadRequest = {
  assetPurpose?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  galleryId?: string
  pathname?: string
  previewReference?: string
  reference?: string
  title?: string
}

async function writeAccess() {
  const session = await auth()
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return { error: subscriptionWriteBlockResponse(entitlement) }
  return { entitlement, session }
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return subscriptionWriteBlockResponse(entitlement)

  const rateLimit = await checkRequestRateLimit(
    `portfolio-upload:${session.user.workspaceId}:${requestClientKey(request)}`,
    1_000,
    15 * 60 * 1000,
  )
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many uploads were started at once. Please wait a few minutes and try again." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  if (request.headers.get("content-type")?.includes("application/json")) {
    return initiateDirectBrowserUpload(request, session.user.workspaceId, entitlement)
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const pathname = getFormValue(formData, "pathname", "")
  let galleryId = getFormValue(formData, "galleryId", "")
  const requestedAssetPurpose = getFormValue(formData, "assetPurpose", "")
  const assetPurpose = requestedAssetPurpose === "website" || pathname.startsWith("website/")
    ? "website"
    : requestedAssetPurpose === "watermark" || pathname.startsWith("watermarks/")
      ? "watermark"
      : ""
  const title = getFormValue(formData, "title", "")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 })
  }

  if (!pathname) {
    return NextResponse.json({ error: "An upload path is required." }, { status: 400 })
  }

  if (requestedAssetPurpose && requestedAssetPurpose !== "website" && requestedAssetPurpose !== "watermark") {
    return NextResponse.json({ error: "Unsupported upload purpose." }, { status: 400 })
  }

  if (!galleryId && assetPurpose === "website") {
    const fallbackGallery = await getPrismaClient().gallery.findFirst({
      orderBy: { createdAt: "asc" },
      select: { slug: true },
      where: { workspaceId: session.user.workspaceId },
    })
    galleryId = fallbackGallery?.slug ?? ""
  }

  if (!galleryId) {
    return NextResponse.json({ error: "Choose a portfolio before uploading photos." }, { status: 400 })
  }

  if (!isAllowedPortfolioImageContentType(file.type)) {
    return NextResponse.json(
      { error: "Portfolio uploads accept still images only. Add an MP4 from the Hero Video controls in My Website." },
      { status: 415 },
    )
  }

  if (isPhotoshopFileName(file.name) || isPhotoshopContentType(file.type)) {
    return NextResponse.json(
      { error: "Upload Photoshop documents from the portfolio Photo and Video Upload control so PhotoView can prepare a display copy." },
      { status: 415 },
    )
  }

  if (file.size > TECHNICAL_UPLOAD_SAFETY_BYTES) {
    return NextResponse.json({ error: "This file is too large for the current browser upload method." }, { status: 413 })
  }
  if (assetPurpose === "watermark" && file.size > MAX_WATERMARK_BYTES) {
    return NextResponse.json({ error: "Custom watermark images must be 10 MB or smaller." }, { status: 413 })
  }

  let originalReference: string | null = null
  let uploadCommitted = false

  try {
    const fileBytes = new Uint8Array(await file.arrayBuffer())
    await validateUploadedFile(
      fileBytes,
      file.type,
      assetPurpose === "watermark" ? MAX_WATERMARK_PIXELS : MAX_IMAGE_PIXELS,
    )
    assertStorageCapacity(entitlement.storageUsedBytes, entitlement.storageLimitBytes, file.size)
    const storedFile = await uploadPhotoObject({
      pathname: sanitizePathname(pathname),
      body: fileBytes,
      contentType: file.type,
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })
    originalReference = storedFile.url
    const persisted = await persistUploadedPhoto({
      assetPurpose: assetPurpose || undefined,
      contentType: file.type,
      fileName: file.name || pathname.split("/").pop() || "photo",
      gallerySlug: galleryId,
      pathname: storedFile.pathname,
      photoBytes: fileBytes,
      size: storedFile.size,
      storageLimitBytes: entitlement.storageLimitBytes,
      storedUrl: storedFile.url,
      title,
      workspaceId: session.user.workspaceId,
    })
    uploadCommitted = true

    const immediateUrl = persisted.photo.deliveryUrl

    return NextResponse.json({
      ok: true,
      provider: storedFile.provider,
      pathname: storedFile.pathname,
      url: immediateUrl,
      downloadUrl: `${persisted.photo.deliveryUrl}?variant=download`,
      size: storedFile.size,
      ...(persisted ? persisted : {}),
    })
  } catch (error) {
    if (originalReference && !uploadCommitted) {
      await Promise.allSettled([deleteManagedPhotoObject(originalReference)])
    }
    const message = error instanceof Error ? error.message : "Upload failed."
    const isExpectedRejection = /exceed|could not be found|invalid|unsupported|decode|pixel|dimensions|empty/i.test(message)
    if (!isExpectedRejection) {
      await recordOperationalEvent({
        category: "UPLOAD",
        message,
        metadata: { fileSize: file.size, fileType: file.type, galleryId },
        severity: "ERROR",
        source: "/api/storage/upload",
        workspaceId: session.user.workspaceId,
      })
    }
    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}

async function initiateDirectBrowserUpload(
  request: Request,
  workspaceId: string,
  entitlement: WorkspaceEntitlement,
) {
  const body = await request.json().catch(() => ({})) as DirectPhotoUploadRequest
  const galleryId = body.galleryId?.trim() ?? ""
  const fileName = body.fileName?.trim() || "photo"
  const fileSize = Number(body.fileSize ?? 0)
  const fileType = body.fileType?.trim().toLowerCase() ?? ""
  const assetPurpose = body.assetPurpose === "website" || body.assetPurpose === "watermark" ? body.assetPurpose : undefined
  const isPhotoshop = isPhotoshopFileName(fileName) || isPhotoshopContentType(fileType)

  if (body.assetPurpose && !assetPurpose) {
    return NextResponse.json({ error: "Unsupported upload purpose." }, { status: 400 })
  }
  if (!galleryId) return NextResponse.json({ error: "Choose a portfolio before uploading photos." }, { status: 400 })
  if (!isAllowedPortfolioImageContentType(fileType)) {
    return NextResponse.json({ error: "Choose an AVIF, JPEG, PNG, WebP, HEIC, TIFF, PSD, or PSB image." }, { status: 415 })
  }
  const uploadLimit = isPhotoshop ? PHOTOSHOP_UPLOAD_SAFETY_BYTES : TECHNICAL_UPLOAD_SAFETY_BYTES
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > uploadLimit) {
    return NextResponse.json({ error: isPhotoshop
      ? "Photoshop documents must be larger than 0 bytes and no more than 500 MB."
      : "Photos must be larger than 0 bytes and no more than 100 MB." }, { status: 413 })
  }
  if (isPhotoshop && assetPurpose) {
    return NextResponse.json({ error: "Photoshop documents can be added to portfolios, but cannot be used as website assets or watermarks." }, { status: 415 })
  }
  if (assetPurpose === "watermark" && fileSize > MAX_WATERMARK_BYTES) {
    return NextResponse.json({ error: "Custom watermark images must be 10 MB or smaller." }, { status: 413 })
  }
  try {
    assertStorageCapacity(entitlement.storageUsedBytes, entitlement.storageLimitBytes, fileSize)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The photo exceeds the account storage allowance." },
      { status: 413 },
    )
  }

  const gallery = await getPrismaClient().gallery.findUnique({
    select: { id: true },
    where: { workspaceId_slug: { slug: galleryId, workspaceId } },
  })
  if (!gallery) return NextResponse.json({ error: "The selected portfolio could not be found." }, { status: 404 })

  const safePath = sanitizePathname(body.pathname?.trim() || fileName) || sanitizePathname(fileName) || "photo"
  const prefix = `portfolio-photo/${workspaceId}/${gallery.id}/original`
  try {
    const upload = await createDirectPhotoUpload({
      contentType: isPhotoshop ? PHOTOSHOP_CONTENT_TYPE : fileType,
      expiresIn: 15 * 60,
      pathname: `${prefix}/${safePath}`,
    })
    if (isPhotoshop) {
      const preview = await createDirectPhotoUpload({
        contentType: "image/webp",
        expiresIn: 15 * 60,
        pathname: `portfolio-photo/${workspaceId}/${gallery.id}/photoshop-preview/${safePath}.webp`,
      })
      return NextResponse.json({
        ...upload,
        contentType: PHOTOSHOP_CONTENT_TYPE,
        previewContentType: "image/webp",
        previewReference: preview.reference,
        previewUploadUrl: preview.uploadUrl,
      })
    }
    return NextResponse.json({ ...upload, contentType: fileType })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The photo upload could not be started." },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const access = await writeAccess()
  if (access.error) return access.error
  const body = await request.json().catch(() => ({})) as DirectPhotoUploadRequest
  const galleryId = body.galleryId?.trim() ?? ""
  const reference = body.reference?.trim() ?? ""
  const fileName = body.fileName?.trim() || "photo"
  const expectedSize = Number(body.fileSize ?? 0)
  const previewReference = body.previewReference?.trim() ?? ""
  const assetPurpose = body.assetPurpose === "website" || body.assetPurpose === "watermark" ? body.assetPurpose : undefined
  if (body.assetPurpose && !assetPurpose) {
    return NextResponse.json({ error: "Unsupported upload purpose." }, { status: 400 })
  }
  const requestedPhotoshop = isPhotoshopFileName(fileName)
  const uploadLimit = requestedPhotoshop ? PHOTOSHOP_UPLOAD_SAFETY_BYTES : TECHNICAL_UPLOAD_SAFETY_BYTES
  if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0 || expectedSize > uploadLimit) {
    return NextResponse.json({ error: "The expected photo size is invalid." }, { status: 400 })
  }
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findUnique({
    select: { id: true, slug: true },
    where: { workspaceId_slug: { slug: galleryId, workspaceId: access.session.user.workspaceId } },
  })
  if (!gallery) return NextResponse.json({ error: "The selected portfolio could not be found." }, { status: 404 })

  const object = resolveR2ObjectReference(reference)
  const prefix = `portfolio-photo/${access.session.user.workspaceId}/${gallery.id}/original/`
  if (!object || !object.pathname.startsWith(prefix)) {
    return NextResponse.json({ error: "The photo upload reference is invalid." }, { status: 400 })
  }

  const existing = await prisma.photo.findFirst({
    select: { id: true },
    where: { originalUrl: reference, workspaceId: access.session.user.workspaceId },
  })
  if (existing) return NextResponse.json({ error: "This photo upload has already been saved." }, { status: 409 })

  let saved = false
  try {
    const stored = await getPhotoObjectMetadata(reference)
    if (!isAllowedPortfolioImageContentType(stored.contentType)) throw new Error("The uploaded image type is not supported.")
    const isPhotoshop = requestedPhotoshop || isPhotoshopContentType(stored.contentType)
    const storedLimit = isPhotoshop ? PHOTOSHOP_UPLOAD_SAFETY_BYTES : TECHNICAL_UPLOAD_SAFETY_BYTES
    if (stored.contentLength <= 0 || stored.contentLength > storedLimit) {
      throw new Error(isPhotoshop
        ? "The uploaded Photoshop document is empty or exceeds 500 MB."
        : "The uploaded image is empty or exceeds 100 MB.")
    }
    if (stored.contentLength !== expectedSize) throw new Error("The uploaded image transfer was incomplete.")
    if (assetPurpose === "watermark" && stored.contentLength > MAX_WATERMARK_BYTES) {
      throw new Error("Custom watermark images must be 10 MB or smaller.")
    }
    let displaySourceBytes: Uint8Array
    let displaySourceContentType: string
    let photoshopVersion: 1 | 2 | undefined
    if (isPhotoshop) {
      if (assetPurpose) throw new Error("Photoshop documents cannot be used as website assets or watermarks.")
      photoshopVersion = photoshopFileVersion(await getPhotoObjectRange(reference, 0, 5)) ?? undefined
      if (!photoshopVersion) throw new Error("The file is not a valid PSD or PSB Photoshop document.")
      if (!previewReference) throw new Error("The Photoshop display copy is missing. Upload the document again.")
      const previewObject = resolveR2ObjectReference(previewReference)
      const previewPrefix = `portfolio-photo/${access.session.user.workspaceId}/${gallery.id}/photoshop-preview/`
      if (!previewObject || !previewObject.pathname.startsWith(previewPrefix)) {
        throw new Error("The Photoshop display copy reference is invalid.")
      }
      const previewMetadata = await getPhotoObjectMetadata(previewReference)
      if (previewMetadata.contentType !== "image/webp" || previewMetadata.contentLength <= 0 || previewMetadata.contentLength > PHOTOSHOP_PREVIEW_SAFETY_BYTES) {
        throw new Error("The Photoshop display copy is invalid or too large.")
      }
      displaySourceBytes = await getPhotoObjectBytes(previewReference, PHOTOSHOP_PREVIEW_SAFETY_BYTES)
      displaySourceContentType = "image/webp"
      await validateUploadedFile(displaySourceBytes, displaySourceContentType, MAX_IMAGE_PIXELS)
    } else {
      displaySourceBytes = await getPhotoObjectBytes(reference, TECHNICAL_UPLOAD_SAFETY_BYTES)
      displaySourceContentType = stored.contentType
      await validateUploadedFile(
        displaySourceBytes,
        displaySourceContentType,
        assetPurpose === "watermark" ? MAX_WATERMARK_PIXELS : MAX_IMAGE_PIXELS,
      )
    }
    assertStorageCapacity(
      access.entitlement.storageUsedBytes,
      access.entitlement.storageLimitBytes,
      stored.contentLength + (isPhotoshop ? displaySourceBytes.byteLength : 0),
    )
    const persisted = await persistUploadedPhoto({
      assetPurpose,
      contentType: stored.contentType,
      displaySourceBytes,
      displaySourceContentType,
      fileName,
      gallerySlug: gallery.slug,
      pathname: stored.pathname,
      photoshopVersion,
      previewReference: isPhotoshop ? previewReference : undefined,
      size: stored.contentLength,
      storageLimitBytes: access.entitlement.storageLimitBytes,
      storedUrl: reference,
      title: body.title?.trim() ?? "",
      workspaceId: access.session.user.workspaceId,
    })
    saved = true
    const immediateUrl = persisted.photo.deliveryUrl
    return NextResponse.json({
      ...persisted,
      downloadUrl: `${immediateUrl}?variant=download`,
      ok: true,
      pathname: stored.pathname,
      provider: "r2",
      size: stored.contentLength,
      url: immediateUrl,
    })
  } catch (error) {
    if (!saved) {
      const persisted = await prisma.photo.findFirst({
        select: { id: true },
        where: { originalUrl: reference, workspaceId: access.session.user.workspaceId },
      }).catch(() => null)
      if (!persisted) {
        await Promise.allSettled([
          deleteManagedPhotoObject(reference),
          ...(previewReference ? [deleteManagedPhotoObject(previewReference)] : []),
        ])
      }
    }
    const message = error instanceof Error ? error.message : "The uploaded photo could not be saved."
    await recordOperationalEvent({
      category: "UPLOAD",
      message,
      metadata: { galleryId, referencePath: object.pathname },
      severity: "ERROR",
      source: "/api/storage/upload",
      workspaceId: access.session.user.workspaceId,
    })
    return NextResponse.json({ error: message }, { status: /already been saved/i.test(message) ? 409 : 400 })
  }
}

export async function DELETE(request: Request) {
  const access = await writeAccess()
  if (access.error) return access.error
  const body = await request.json().catch(() => ({})) as DirectPhotoUploadRequest
  const galleryId = body.galleryId?.trim() ?? ""
  const reference = body.reference?.trim() ?? ""
  const previewReference = body.previewReference?.trim() ?? ""
  const gallery = await getPrismaClient().gallery.findUnique({
    select: { id: true },
    where: { workspaceId_slug: { slug: galleryId, workspaceId: access.session.user.workspaceId } },
  })
  if (!gallery) return NextResponse.json({ error: "The selected portfolio could not be found." }, { status: 404 })
  const object = resolveR2ObjectReference(reference)
  const prefix = `portfolio-photo/${access.session.user.workspaceId}/${gallery.id}/original/`
  if (!object || !object.pathname.startsWith(prefix)) return NextResponse.json({ ok: true })
  const retained = await getPrismaClient().photo.findFirst({
    select: { id: true },
    where: { originalUrl: reference, workspaceId: access.session.user.workspaceId },
  })
  if (!retained) await deleteManagedPhotoObject(reference).catch(() => undefined)
  if (previewReference) {
    const preview = resolveR2ObjectReference(previewReference)
    const previewPrefix = `portfolio-photo/${access.session.user.workspaceId}/${gallery.id}/photoshop-preview/`
    if (preview?.pathname.startsWith(previewPrefix)) await deleteManagedPhotoObject(previewReference).catch(() => undefined)
  }
  return NextResponse.json({ ok: true })
}

type PersistUploadedPhotoInput = {
  assetPurpose?: "watermark" | "website"
  contentType: string
  displaySourceBytes?: Uint8Array
  displaySourceContentType?: string
  fileName: string
  gallerySlug: string
  pathname: string
  photoBytes?: Uint8Array
  photoshopVersion?: 1 | 2
  previewReference?: string
  size: number
  storageLimitBytes: number
  storedUrl: string
  title: string
  workspaceId: string
}

type UploadedPhotoVariants = {
  display?: {
    bytes: number
    pathname: string
    url: string
  }
  thumbnail?: {
    bytes: number
    pathname: string
    url: string
  }
}

async function persistUploadedPhoto(input: PersistUploadedPhotoInput) {
  const prisma = getPrismaClient()
  const gallery = await prisma.gallery.findUnique({
    select: {
      coverImageUrl: true,
      coverPhotoId: true,
      id: true,
      slug: true,
      watermarkMode: true,
    },
    where: {
      workspaceId_slug: {
        slug: input.gallerySlug,
        workspaceId: input.workspaceId,
      },
    },
  })

  if (!gallery) {
    throw new Error("The selected gallery could not be found.")
  }

  const displaySourceBytes = input.displaySourceBytes ?? input.photoBytes
  const displaySourceContentType = input.displaySourceContentType ?? input.contentType
  if (!displaySourceBytes) throw new Error("The image display source is missing.")

  const [existingPhotoCount, sortOrder, metadata] = await Promise.all([
    prisma.photo.count({
      where: {
        galleryId: gallery.id,
      },
    }),
    getNextSortOrder(gallery.id),
    readImageMetadata(displaySourceBytes, displaySourceContentType),
  ])
  const variants = input.assetPurpose === "watermark"
    ? {}
    : await generateAndUploadImageVariants({
        contentType: displaySourceContentType,
        originalPathname: input.pathname,
        photoBytes: displaySourceBytes,
      })
  if (input.photoshopVersion && (!variants.display || !variants.thumbnail)) {
    throw new Error("PhotoView could not create display files for this Photoshop document. Save it with Maximize Compatibility enabled, then try again.")
  }
  const kind = "IMAGE"
  const photoTitle = input.title.trim() || input.fileName.replace(/\.[^/.]+$/, "") || input.fileName
  const incomingStoredBytes = input.size + (variants.display?.bytes ?? 0) + (variants.thumbnail?.bytes ?? 0)
  const uploadedReferences = [input.storedUrl, variants.display?.url, variants.thumbnail?.url]
    .filter((reference): reference is string => Boolean(reference))

  const result = await withDatabaseRetry(() => prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.findUnique({
      select: { storageUsedBytes: true },
      where: { id: input.workspaceId },
    })
    if (!workspace) throw new Error("The subscriber workspace could not be found.")
    if (workspace.storageUsedBytes + BigInt(incomingStoredBytes) > BigInt(input.storageLimitBytes)) {
      throw new Error("This upload, including its display files, would exceed the account storage allowance.")
    }

    const photo = await tx.photo.create({
      data: {
        bytes: BigInt(input.size),
        displayBytes: BigInt(variants.display?.bytes ?? 0),
        displayUrl: variants.display?.url,
        downloadUrl: input.storedUrl,
        fileName: input.fileName,
        galleryId: gallery.id,
        height: metadata.height,
        kind,
        metadata: {
          ...(input.assetPurpose ? { assetPurpose: input.assetPurpose } : {}),
          contentType: input.contentType,
          ...(input.photoshopVersion ? {
            photoshopFormat: input.photoshopVersion === 2 ? "PSB" : "PSD",
            previewGenerated: true,
          } : {}),
          originalPathname: input.pathname,
          uploadedAt: new Date().toISOString(),
        },
        originalUrl: input.storedUrl,
        isHidden: Boolean(input.assetPurpose),
        sortOrder,
        sourceUrl: input.storedUrl,
        thumbnailBytes: BigInt(variants.thumbnail?.bytes ?? 0),
        thumbnailUrl: variants.thumbnail?.url,
        title: photoTitle,
        width: metadata.width,
        workspaceId: input.workspaceId,
      },
    })

    if (!input.assetPurpose && (existingPhotoCount === 0 || (!gallery.coverPhotoId && !gallery.coverImageUrl))) {
      await tx.gallery.update({
        data: {
          coverImageUrl: null,
          coverPhotoId: photo.id,
        },
        where: {
          id: gallery.id,
        },
      })
    }

    if (input.assetPurpose === "watermark") {
      await tx.gallery.update({
        data: {
          watermarkEnabled: true,
          watermarkImageUrl: input.storedUrl,
          watermarkMode: gallery.watermarkMode === "TEXT" ? "IMAGE" : gallery.watermarkMode,
        },
        where: {
          id: gallery.id,
        },
      })
    }

    await tx.storageUsageEvent.create({
      data: {
        bytesDelta: BigInt(input.size),
        galleryId: gallery.id,
        pathname: input.pathname,
        photoId: photo.id,
        type: input.assetPurpose === "watermark" ? "WATERMARK_UPLOADED" : "ORIGINAL_UPLOADED",
        workspaceId: input.workspaceId,
      },
    })
    if (variants.display) {
      await tx.storageUsageEvent.create({
        data: {
          bytesDelta: BigInt(variants.display.bytes),
          galleryId: gallery.id,
          pathname: variants.display.pathname,
          photoId: photo.id,
          type: "DISPLAY_GENERATED",
          workspaceId: input.workspaceId,
        },
      })
    }
    if (variants.thumbnail) {
      await tx.storageUsageEvent.create({
        data: {
          bytesDelta: BigInt(variants.thumbnail.bytes),
          galleryId: gallery.id,
          pathname: variants.thumbnail.pathname,
          photoId: photo.id,
          type: "THUMBNAIL_GENERATED",
          workspaceId: input.workspaceId,
        },
      })
    }

    const galleryStorage = await tx.photo.aggregate({
      _sum: {
        bytes: true,
        displayBytes: true,
        thumbnailBytes: true,
      },
      where: {
        galleryId: gallery.id,
      },
    })
    const galleryBytes =
      (galleryStorage._sum.bytes ?? BigInt(0)) +
      (galleryStorage._sum.displayBytes ?? BigInt(0)) +
      (galleryStorage._sum.thumbnailBytes ?? BigInt(0))

    await tx.gallery.update({
      data: {
        storageUsedBytes: galleryBytes,
      },
      where: {
        id: gallery.id,
      },
    })

    const workspaceStorage = await tx.gallery.aggregate({
      _sum: {
        storageUsedBytes: true,
      },
      where: {
        workspaceId: input.workspaceId,
      },
    })

    await tx.workspace.update({
      data: {
        storageUsedBytes: workspaceStorage._sum.storageUsedBytes ?? BigInt(0),
      },
      where: {
        id: input.workspaceId,
      },
    })

    const imageCount = await tx.photo.count({
      where: {
        galleryId: gallery.id,
        isHidden: false,
        kind: "IMAGE",
      },
    })

    return {
      imageCount,
      photo,
      storageUsedBytes: Number(galleryBytes),
    }
  }, { isolationLevel: "Serializable" }), { attempts: 3, baseDelayMs: 100 }).catch(async (error) => {
    await Promise.allSettled([
      ...uploadedReferences.map((reference) => deleteManagedPhotoObject(reference)),
      ...(input.previewReference ? [deleteManagedPhotoObject(input.previewReference)] : []),
    ])
    throw error
  })

  if (input.previewReference) await deleteManagedPhotoObject(input.previewReference).catch(() => undefined)

  return {
    gallery: {
      id: gallery.slug,
      images: result.imageCount,
      storageUsedBytes: result.storageUsedBytes,
    },
    photo: {
      blobUrl: result.photo.originalUrl,
      bytes: Number(result.photo.bytes),
      deliveryUrl: input.assetPurpose === "website"
        ? `/api/website/media/${encodeURIComponent(result.photo.id)}`
        : input.assetPurpose === "watermark"
          ? `/api/media/${encodeURIComponent(gallery.slug)}/asset/watermark`
          : `/api/media/${encodeURIComponent(gallery.id)}/${encodeURIComponent(result.photo.id)}`,
      displayBytes: Number(result.photo.displayBytes),
      displayUrl: result.photo.displayUrl ?? undefined,
      downloadUrl: result.photo.downloadUrl ?? result.photo.originalUrl,
      fileName: result.photo.fileName,
      height: result.photo.height,
      hidden: result.photo.isHidden,
      id: result.photo.id,
      kind: result.photo.kind === "RAW" ? "Raw" : "Image",
      sourceUrl: result.photo.sourceUrl ?? result.photo.originalUrl,
      thumbnailBytes: Number(result.photo.thumbnailBytes),
      thumbnailUrl: result.photo.thumbnailUrl ?? undefined,
      title: result.photo.title,
      width: result.photo.width,
    },
  }
}

async function getNextSortOrder(galleryId: string) {
  const prisma = getPrismaClient()
  const current = await prisma.photo.aggregate({
    _max: {
      sortOrder: true,
    },
    where: {
      galleryId,
    },
  })

  return (current._max.sortOrder ?? -1) + 1
}

async function readImageMetadata(bytes: Uint8Array, contentType: string) {
  if (!contentType.startsWith("image/")) return { height: null, width: null }

  const metadata = await sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata()
  return {
    height: metadata.height ?? null,
    width: metadata.width ?? null,
  }
}

async function generateAndUploadImageVariants({
  contentType,
  originalPathname,
  photoBytes,
}: {
  contentType: string
  originalPathname: string
  photoBytes: Uint8Array
}): Promise<UploadedPhotoVariants> {
  if (!contentType.startsWith("image/")) return {}

  try {
    // Decode large originals one at a time. Parallel Sharp pipelines can
    // multiply peak memory and exhaust a serverless worker on high-MP files.
    const displayBytes = await resizeImageToWebp(photoBytes, 2400, 84)
    const thumbnailBytes = await resizeImageToWebp(photoBytes, 600, 76)
    const displayPathname = getVariantPathname(originalPathname, "display")
    const thumbnailPathname = getVariantPathname(originalPathname, "thumb")
    const uploadedReferences: string[] = []
    try {
      const display = await uploadPhotoObject({
        addRandomSuffix: false,
        body: displayBytes,
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        contentType: "image/webp",
        pathname: displayPathname,
      })
      uploadedReferences.push(display.url)
      const thumbnail = await uploadPhotoObject({
        addRandomSuffix: false,
        body: thumbnailBytes,
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        contentType: "image/webp",
        pathname: thumbnailPathname,
      })
      uploadedReferences.push(thumbnail.url)

      return {
        display: {
          bytes: display.size,
          pathname: display.pathname,
          url: display.url,
        },
        thumbnail: {
          bytes: thumbnail.size,
          pathname: thumbnail.pathname,
          url: thumbnail.url,
        },
      }
    } catch {
      await Promise.allSettled(uploadedReferences.map((reference) => deleteManagedPhotoObject(reference)))
      return {}
    }
  } catch {
    return {}
  }
}

async function resizeImageToWebp(bytes: Uint8Array, maxEdge: number, quality: number) {
  return sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate()
    .resize({
      fit: "inside",
      height: maxEdge,
      withoutEnlargement: true,
      width: maxEdge,
    })
    .webp({ effort: 4, quality })
    .toBuffer()
}

function getVariantPathname(originalPathname: string, variant: "display" | "thumb") {
  const slashIndex = originalPathname.lastIndexOf("/")
  const directory = slashIndex >= 0 ? originalPathname.slice(0, slashIndex) : ""
  const fileName = slashIndex >= 0 ? originalPathname.slice(slashIndex + 1) : originalPathname
  const baseName = fileName.replace(/\.[^.]+$/, "") || "photo"
  const variantFileName = `${baseName}.webp`

  return directory ? `${directory}/${variant}/${variantFileName}` : `${variant}/${variantFileName}`
}

function getFormValue(formData: FormData, key: string, fallback: string): string {
  const value = formData.get(key)
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback
}

function sanitizePathname(value: string): string {
  return value
    .split("/")
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("/")
}

async function validateUploadedFile(bytes: Uint8Array, contentType: string, maxPixels: number) {
  if (bytes.byteLength === 0) throw new Error("The uploaded file is empty.")

  let metadata: Metadata
  try {
    metadata = await sharp(bytes, { limitInputPixels: maxPixels }).metadata()
  } catch {
    throw new Error("The file is not a valid or supported image.")
  }

  const allowedFormats = SHARP_FORMATS_BY_CONTENT_TYPE[contentType]
  if (!metadata.format || !allowedFormats?.has(metadata.format)) {
    throw new Error("The file contents do not match the declared image type.")
  }
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > maxPixels) {
    throw new Error("The image dimensions exceed the safe processing limit.")
  }
}

function assertStorageCapacity(storageUsedBytes: number, storageLimitBytes: number, incomingBytes: number) {
  if (storageUsedBytes + incomingBytes > storageLimitBytes) {
    throw new Error("This upload would exceed the account storage allowance. Upgrade storage before uploading.")
  }
}
