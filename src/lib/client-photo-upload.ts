import { createPhotoshopPreview } from "./client-photoshop-preview.ts"
import { createJpegXlPreview } from "./client-jpeg-xl-preview.ts"
import { isJpegXlContentType, isJpegXlFileName, JPEG_XL_CONTENT_TYPE } from "./jpeg-xl.ts"
import { isPhotoshopFileName, PHOTOSHOP_CONTENT_TYPE } from "./photoshop-upload.ts"

export type ClientPhotoUploadResult = {
  gallery?: {
    id: string
    images: number
    storageUsedBytes: number
  }
  ok: boolean
  photo?: {
    blobUrl: string
    bytes: number | null
    deliveryUrl?: string
    displayBytes?: number | null
    displayUrl?: string
    downloadUrl: string
    fileName: string
    height: number | null
    hidden: boolean
    id: string
    kind: "Image" | "Raw" | "Video"
    sourceUrl: string
    thumbnailBytes?: number | null
    thumbnailUrl?: string
    title: string
    width: number | null
  }
  provider: string
  pathname: string
  url: string
  downloadUrl: string
  size: number
}

export const SESSION_EXPIRED_UPLOAD_MESSAGE = "Your PhotoView.io session has expired. This upload was not saved."

type DirectPhotoUploadSlot = {
  contentType: string
  previewContentType?: string
  previewReference?: string
  previewUploadUrl?: string
  reference: string
  uploadUrl: string
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jxl: JPEG_XL_CONTENT_TYPE,
  jpg: "image/jpeg",
  png: "image/png",
  psb: PHOTOSHOP_CONTENT_TYPE,
  psd: PHOTOSHOP_CONTENT_TYPE,
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
}

function photoContentType(file: File) {
  if (isPhotoshopFileName(file.name)) return PHOTOSHOP_CONTENT_TYPE
  const declared = file.type.trim().toLowerCase()
  if (declared) return declared
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? ""
}

async function jsonPayload<T>(response: Response): Promise<(T & { error?: string }) | null> {
  return response.json().catch(() => null) as Promise<(T & { error?: string }) | null>
}

export async function uploadPhotoFromClient(
  pathname: string,
  file: File,
  options: {
    assetPurpose?: "watermark" | "website"
    galleryId?: string
    onStatus?: (message: string) => void
    title?: string
  } = {},
): Promise<ClientPhotoUploadResult> {
  const contentType = photoContentType(file)
  const initiate = await fetch("/api/storage/upload", {
    body: JSON.stringify({
      assetPurpose: options.assetPurpose,
      fileName: file.name,
      fileSize: file.size,
      fileType: contentType,
      galleryId: options.galleryId,
      pathname,
      title: options.title,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  const slot = await jsonPayload<DirectPhotoUploadSlot>(initiate)
  if (!initiate.ok || !slot?.reference || !slot.uploadUrl || !slot.contentType) {
    throw new Error(initiate.status === 401 ? SESSION_EXPIRED_UPLOAD_MESSAGE : slot?.error || "The photo upload could not be started.")
  }

  try {
    let previewReference: string | undefined
    const isJpegXl = isJpegXlFileName(file.name) || isJpegXlContentType(contentType)
    if (isPhotoshopFileName(file.name) || isJpegXl) {
      if (!slot.previewReference || !slot.previewUploadUrl || !slot.previewContentType) {
        throw new Error("The display-copy upload could not be started.")
      }
      options.onStatus?.(`Preparing a browser-compatible display copy for ${file.name}`)
      const preview = isJpegXl ? await createJpegXlPreview(file) : await createPhotoshopPreview(file)
      options.onStatus?.(`Uploading ${file.name} and its display copy`)
      const previewTransferred = await fetch(slot.previewUploadUrl, {
        body: preview,
        headers: { "Content-Type": slot.previewContentType },
        method: "PUT",
      })
      if (!previewTransferred.ok) throw new Error("The display copy could not be transferred to secure storage.")
      previewReference = slot.previewReference
    }

    const transferred = await fetch(slot.uploadUrl, {
      body: file,
      headers: { "Content-Type": slot.contentType },
      method: "PUT",
    })
    if (!transferred.ok) throw new Error("The photo could not be transferred to secure storage.")

    const complete = await fetch("/api/storage/upload", {
      body: JSON.stringify({
        assetPurpose: options.assetPurpose,
        fileName: file.name,
        fileSize: file.size,
        galleryId: options.galleryId,
        previewReference,
        reference: slot.reference,
        title: options.title,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    })
    const result = await jsonPayload<ClientPhotoUploadResult>(complete)
    if (!complete.ok || !result) {
      throw new Error(complete.status === 401 ? SESSION_EXPIRED_UPLOAD_MESSAGE : result?.error || "The uploaded photo could not be saved.")
    }

    return result
  } catch (error) {
    void fetch("/api/storage/upload", {
      body: JSON.stringify({ galleryId: options.galleryId, previewReference: slot.previewReference, reference: slot.reference }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    })
    throw error
  }
}
