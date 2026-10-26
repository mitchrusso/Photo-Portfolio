export function normalizeWebsitePortfolioOrder(
  portfolioOrder: unknown,
  availableGalleryIds: string[],
): string[] {
  const available = new Set(availableGalleryIds)
  const seen = new Set<string>()
  const normalized: string[] = []

  if (Array.isArray(portfolioOrder)) {
    for (const value of portfolioOrder) {
      if (typeof value !== "string" || !available.has(value) || seen.has(value)) continue
      seen.add(value)
      normalized.push(value)
    }
  }

  for (const galleryId of availableGalleryIds) {
    if (seen.has(galleryId)) continue
    seen.add(galleryId)
    normalized.push(galleryId)
  }

  return normalized
}

export function orderWebsitePortfolios<T extends { id: string }>(
  galleries: T[],
  portfolioOrder: unknown,
): T[] {
  const byId = new Map(galleries.map((gallery) => [gallery.id, gallery]))

  return normalizeWebsitePortfolioOrder(portfolioOrder, galleries.map((gallery) => gallery.id))
    .map((galleryId) => byId.get(galleryId))
    .filter((gallery): gallery is T => Boolean(gallery))
}

export function moveWebsitePortfolio(
  portfolioOrder: string[],
  galleryId: string,
  targetGalleryId: string,
): string[] {
  if (galleryId === targetGalleryId) return portfolioOrder

  const sourceIndex = portfolioOrder.indexOf(galleryId)
  const targetIndex = portfolioOrder.indexOf(targetGalleryId)
  if (sourceIndex < 0 || targetIndex < 0) return portfolioOrder

  const next = [...portfolioOrder]
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}
