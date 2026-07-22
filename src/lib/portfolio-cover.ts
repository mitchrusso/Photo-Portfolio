type StoredCoverPhoto = {
  id: string
  metadata: unknown
}

type StoredCoverPhotoUrls = StoredCoverPhoto & {
  displayUrl?: string | null
  originalUrl?: string | null
  sourceUrl?: string | null
  thumbnailUrl?: string | null
}

function asStringRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function findStoredCoverPhotoId(photos: StoredCoverPhoto[], publicPhotoId?: string | null) {
  if (!publicPhotoId) return null

  return photos.find((photo) => {
    const metadata = asStringRecord(photo.metadata)
    return photo.id === publicPhotoId || metadata.externalId === publicPhotoId
  })?.id ?? null
}

function normalizeCoverUrl(value?: string | null) {
  if (!value) return ""

  try {
    const url = new URL(value)
    url.hash = ""
    url.search = ""
    return url.toString().toLowerCase()
  } catch {
    return value.split("?")[0].split("#")[0].toLowerCase()
  }
}

export function findStoredCoverPhotoIdByUrl(photos: StoredCoverPhotoUrls[], coverUrl?: string | null) {
  const normalizedCoverUrl = normalizeCoverUrl(coverUrl)
  if (!normalizedCoverUrl) return null

  return photos.find((photo) =>
    [photo.displayUrl, photo.originalUrl, photo.sourceUrl, photo.thumbnailUrl]
      .some((candidate) => normalizeCoverUrl(candidate) === normalizedCoverUrl),
  )?.id ?? null
}
