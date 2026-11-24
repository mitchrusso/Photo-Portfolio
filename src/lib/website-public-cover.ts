function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function publishedWebsiteIncludesGallery(body: string | null, galleryRefs: string[]) {
  if (!body) return false

  try {
    const settings = asRecord(JSON.parse(body))
    const enabledBlocks = asRecord(settings.enabledBlocks)
    if (enabledBlocks.portfolioGrid === false && enabledBlocks.featuredPortfolio === false) return false

    const refs = new Set(galleryRefs.map((value) => value.trim()).filter(Boolean))
    const sourceMode = settings.workSourceMode
    if (sourceMode === "all") return true
    if (sourceMode === "single") {
      return typeof settings.selectedGalleryId === "string" && refs.has(settings.selectedGalleryId)
    }

    const featured = Array.isArray(settings.featuredGalleryIds)
      ? settings.featuredGalleryIds.filter((value): value is string => typeof value === "string")
      : []
    return featured.length === 0 || featured.some((value) => refs.has(value))
  } catch {
    return false
  }
}

export function publishedWebsiteIncludesBlogPhoto(
  body: string | null,
  galleryRefs: string[],
  photoRefs: string[],
) {
  if (!body) return false

  try {
    const settings = asRecord(JSON.parse(body))
    const enabledPages = asRecord(settings.enabledPages)
    const visiblePages = asRecord(settings.visiblePages)
    if (enabledPages.blog !== true && visiblePages.blog !== true) return false
    const entries = Array.isArray(settings.tripEntries) ? settings.tripEntries : []
    const galleries = new Set(galleryRefs.map((value) => value.trim()).filter(Boolean))
    const photos = new Set(photoRefs.map((value) => value.trim()).filter(Boolean))

    return entries.some((candidate) => {
      const entry = asRecord(candidate)
      return typeof entry.imageGalleryId === "string"
        && typeof entry.imagePhotoId === "string"
        && galleries.has(entry.imageGalleryId)
        && photos.has(entry.imagePhotoId)
    })
  } catch {
    return false
  }
}
