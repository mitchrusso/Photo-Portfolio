export const PORTFOLIO_IMAGE_ACCEPT = "image/avif,image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,.avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff"

export const PORTFOLIO_IMAGE_FORMATS_LABEL = "AVIF, JPEG, PNG, WebP, HEIC, or TIFF"

const PORTFOLIO_IMAGE_CONTENT_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
])

export function isAllowedPortfolioImageContentType(contentType: string) {
  return PORTFOLIO_IMAGE_CONTENT_TYPES.has(contentType.trim().toLowerCase())
}
