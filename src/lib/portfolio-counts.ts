export function formatImageCount(count: number) {
  const normalizedCount = Math.max(0, Math.trunc(count))
  return `${normalizedCount.toLocaleString()} ${normalizedCount === 1 ? "image" : "images"}`
}

export function formatGalleryPosition(activePhotoIndex: number, totalImages: number) {
  const normalizedTotal = Math.max(0, Math.trunc(totalImages))
  if (normalizedTotal === 0) return "No images"
  if (activePhotoIndex < 0) return `Cover image · ${formatImageCount(normalizedTotal)} total`

  const position = Math.min(normalizedTotal, activePhotoIndex + 2)
  return `${position.toLocaleString()} of ${formatImageCount(normalizedTotal)}`
}
