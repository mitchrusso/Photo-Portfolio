import { NextResponse } from "next/server"
import sharp, { type Metadata } from "sharp"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import { deleteManagedPhotoObject, uploadPhotoObject } from "@/lib/photo-storage"
import { recordOperationalEvent } from "@/lib/operational-monitoring"
import { STANDARD_MAX_UPLOAD_BYTES } from "@/lib/plans"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"
import { subscriptionWriteBlockResponse } from "@/lib/subscription-api"

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
  "video/mp4",
  "video/quicktime",
])
const MAX_IMAGE_PIXELS = 100_000_000
const SHARP_FORMATS_BY_CONTENT_TYPE: Record<string, Set<string>> = {
  "image/heic": new Set(["heif"]),
  "image/heif": new Set(["heif"]),
  "image/jpeg": new Set(["jpeg"]),
  "image/png": new Set(["png"]),
  "image/tiff": new Set(["tiff"]),
  "image/webp": new Set(["webp"]),
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
  if (entitlement.mode !== "write") return subscriptionWriteBlockResponse(entitlement)

  const formData = await request.formData()
  const file = formData.get("file")
  const pathname = getFormValue(formData, "pathname", "")
  const galleryId = getFormValue(formData, "galleryId", "")
  const title = getFormValue(formData, "title", "")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 })
  }

  if (!pathname) {
    return NextResponse.json({ error: "An upload path is required." }, { status: 400 })
  }

  if (!galleryId) {
    return NextResponse.json({ error: "Choose a portfolio before uploading photos." }, { status: 400 })
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}` }, { status: 415 })
  }

  const maxUploadBytes = entitlement.maxUploadBytes || STANDARD_MAX_UPLOAD_BYTES

  if (file.size > maxUploadBytes) {
    return NextResponse.json({ error: `Uploads are limited to ${formatUploadLimit(maxUploadBytes)} per file.` }, { status: 413 })
  }

  let originalReference: string | null = null
  let uploadCommitted = false

  try {
    const fileBytes = new Uint8Array(await file.arrayBuffer())
    await validateUploadedFile(fileBytes, file.type)
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

type PersistUploadedPhotoInput = {
  contentType: string
  fileName: string
  gallerySlug: string
  pathname: string
  photoBytes: Uint8Array
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

  const [existingPhotoCount, sortOrder, metadata] = await Promise.all([
    prisma.photo.count({
      where: {
        galleryId: gallery.id,
      },
    }),
    getNextSortOrder(gallery.id),
    readImageMetadata(input.photoBytes, input.contentType),
  ])
  const variants = await generateAndUploadImageVariants({
    contentType: input.contentType,
    originalPathname: input.pathname,
    photoBytes: input.photoBytes,
  })
  const kind = input.contentType.startsWith("video/") ? "VIDEO" : "IMAGE"
  const photoTitle = input.title.trim() || input.fileName.replace(/\.[^/.]+$/, "") || input.fileName
  const incomingStoredBytes = input.size + (variants.display?.bytes ?? 0) + (variants.thumbnail?.bytes ?? 0)
  const uploadedReferences = [input.storedUrl, variants.display?.url, variants.thumbnail?.url]
    .filter((reference): reference is string => Boolean(reference))

  const result = await prisma.$transaction(async (tx) => {
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
          contentType: input.contentType,
          originalPathname: input.pathname,
          uploadedAt: new Date().toISOString(),
        },
        originalUrl: input.storedUrl,
        sortOrder,
        sourceUrl: input.storedUrl,
        thumbnailBytes: BigInt(variants.thumbnail?.bytes ?? 0),
        thumbnailUrl: variants.thumbnail?.url,
        title: photoTitle,
        width: metadata.width,
        workspaceId: input.workspaceId,
      },
    })

    if (existingPhotoCount === 0 || (!gallery.coverPhotoId && !gallery.coverImageUrl)) {
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

    await tx.storageUsageEvent.create({
      data: {
        bytesDelta: BigInt(input.size),
        galleryId: gallery.id,
        pathname: input.pathname,
        photoId: photo.id,
        type: "ORIGINAL_UPLOADED",
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
  }, { isolationLevel: "Serializable" }).catch(async (error) => {
    await Promise.allSettled(uploadedReferences.map((reference) => deleteManagedPhotoObject(reference)))
    throw error
  })

  return {
    gallery: {
      id: gallery.slug,
      images: result.imageCount,
      storageUsedBytes: result.storageUsedBytes,
    },
    photo: {
      blobUrl: result.photo.originalUrl,
      bytes: Number(result.photo.bytes),
      deliveryUrl: `/api/media/${encodeURIComponent(gallery.id)}/${encodeURIComponent(result.photo.id)}`,
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
    const [displayBytes, thumbnailBytes] = await Promise.all([
      resizeImageToWebp(photoBytes, 2400, 84),
      resizeImageToWebp(photoBytes, 600, 76),
    ])
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
  return sharp(bytes)
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

function formatUploadLimit(bytes: number) {
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`
  return `${bytes} bytes`
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

async function validateUploadedFile(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength === 0) throw new Error("The uploaded file is empty.")

  if (contentType.startsWith("image/")) {
    let metadata: Metadata
    try {
      metadata = await sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata()
    } catch {
      throw new Error("The file is not a valid or supported image.")
    }

    const allowedFormats = SHARP_FORMATS_BY_CONTENT_TYPE[contentType]
    if (!metadata.format || !allowedFormats?.has(metadata.format)) {
      throw new Error("The file contents do not match the declared image type.")
    }
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      throw new Error("The image dimensions exceed the safe processing limit.")
    }
    return
  }

  const signature = Buffer.from(bytes.slice(4, 12)).toString("ascii")
  if (!signature.startsWith("ftyp")) {
    throw new Error("The file is not a valid MP4 or QuickTime video.")
  }
}

function assertStorageCapacity(storageUsedBytes: number, storageLimitBytes: number, incomingBytes: number) {
  if (storageUsedBytes + incomingBytes > storageLimitBytes) {
    throw new Error("This upload would exceed the account storage allowance. Upgrade storage before uploading.")
  }
}
