import type { MigratedPhoto } from "@/data/migrated-galleries"

export const LOCAL_GALLERY_STORAGE_KEY = "photo-portfolio-galleries-v6"

export type PortfolioPhoto = MigratedPhoto & {
  caption?: string
  hidden?: boolean
}

export type PortfolioGallerySettings = {
  allowDownloads?: boolean
  password?: string
  watermarkEnabled?: boolean
  watermarkImageUrl?: string
  watermarkMode?: "text" | "image" | "both"
  watermarkOpacity?: number
  watermarkPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center"
  watermarkSize?: number
  watermarkText?: string
}

export type PortfolioGallery = {
  id: string
  name: string
  client: string
  status: "Draft" | "Proofing" | "For sale" | "Delivered"
  privacy: "Private link" | "Password" | "Client portal" | "Public"
  images: number
  favorites: number
  revenue: string
  cover: string
  description: string
  url?: string
  photos?: PortfolioPhoto[]
} & PortfolioGallerySettings

export function isRenderableImage(photo: MigratedPhoto) {
  return /\.(jpe?g|png|webp|gif)$/i.test(photo.fileName)
}

export function isVisibleRenderableImage(photo: PortfolioPhoto) {
  return !photo.hidden && isRenderableImage(photo)
}

export function getDisplayUrl(photo?: MigratedPhoto) {
  return photo?.displayUrl ?? photo?.blobUrl
}

export function getPhotoCover(photo?: MigratedPhoto) {
  return photo ? getDisplayUrl(photo) ?? photo.thumbnailUrl ?? photo.blobUrl : undefined
}

export function getThumbnailUrl(photo: MigratedPhoto) {
  return photo.thumbnailUrl ?? photo.displayUrl ?? photo.blobUrl
}

export function normalizeAssetUrl(url?: string) {
  if (!url) return ""

  try {
    const parsedUrl = new URL(url)
    parsedUrl.search = ""
    parsedUrl.hash = ""
    return parsedUrl.toString().toLowerCase()
  } catch {
    return url.split("?")[0].split("#")[0].toLowerCase()
  }
}

function photoDedupeKeys(photo: MigratedPhoto) {
  return [
    normalizeAssetUrl(photo.blobUrl),
    normalizeAssetUrl(photo.displayUrl),
    normalizeAssetUrl(photo.thumbnailUrl),
    normalizeAssetUrl(photo.sourceUrl),
    photo.id ? `id:${photo.id.toLowerCase()}` : "",
    `media:${photo.fileName.toLowerCase()}:${photo.width ?? ""}:${photo.height ?? ""}:${photo.bytes ?? ""}`,
  ].filter(Boolean)
}

export function photoMatchesCover(photo: MigratedPhoto, cover: string) {
  const normalizedCover = normalizeAssetUrl(cover)

  return [
    photo.blobUrl,
    photo.displayUrl,
    photo.thumbnailUrl,
    photo.sourceUrl,
  ].some((url) => normalizeAssetUrl(url) === normalizedCover)
}

export function uniqueGalleryPhotos(photos: PortfolioPhoto[], cover: string) {
  const seen = new Set<string>()

  return photos.filter((photo) => {
    if (!isVisibleRenderableImage(photo) || photoMatchesCover(photo, cover)) return false

    const keys = photoDedupeKeys(photo)
    if (keys.some((key) => seen.has(key))) return false

    keys.forEach((key) => seen.add(key))
    return true
  })
}

export function publicGalleryPath(galleryId: string) {
  return `/g/${galleryId}`
}
