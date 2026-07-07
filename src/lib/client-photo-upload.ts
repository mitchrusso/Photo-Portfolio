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
    displayUrl?: string
    downloadUrl: string
    fileName: string
    height: number | null
    hidden: boolean
    id: string
    kind: "Image" | "Raw"
    sourceUrl: string
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

export async function uploadPhotoFromClient(
  pathname: string,
  file: File,
  options: { galleryId?: string; title?: string } = {},
): Promise<ClientPhotoUploadResult> {
  const formData = new FormData()
  formData.set("pathname", pathname)
  formData.set("file", file)
  if (options.galleryId) formData.set("galleryId", options.galleryId)
  if (options.title) formData.set("title", options.title)

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as ClientPhotoUploadResult | { error?: string }

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Upload failed")
  }

  return payload as ClientPhotoUploadResult
}
