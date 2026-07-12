type StoredCoverPhoto = {
  id: string
  metadata: unknown
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
