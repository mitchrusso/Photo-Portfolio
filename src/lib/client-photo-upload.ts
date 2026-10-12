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

type DirectPhotoUploadSlot = {
  contentType: string
  reference: string
  uploadUrl: string
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
}

function photoContentType(file: File) {
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
  options: { assetPurpose?: "watermark" | "website"; galleryId?: string; title?: string } = {},
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
    throw new Error(slot?.error || "The photo upload could not be started.")
  }

  try {
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
        reference: slot.reference,
        title: options.title,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    })
    const result = await jsonPayload<ClientPhotoUploadResult>(complete)
    if (!complete.ok || !result) throw new Error(result?.error || "The uploaded photo could not be saved.")

    return result
  } catch (error) {
    void fetch("/api/storage/upload", {
      body: JSON.stringify({ galleryId: options.galleryId, reference: slot.reference }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    })
    throw error
  }
}
