import { isPhotoshopContentType } from "./photoshop-upload.ts"

export const PORTFOLIO_IMAGE_ACCEPT = "image/avif,image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/vnd.adobe.photoshop,.avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff,.psd,.psb"

export const PORTFOLIO_IMAGE_FORMATS_LABEL = "AVIF, JPEG, PNG, WebP, HEIC, TIFF, PSD, or PSB. Photoshop originals up to 500 MB are preserved and count toward storage."

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
  return PORTFOLIO_IMAGE_CONTENT_TYPES.has(contentType.trim().toLowerCase()) || isPhotoshopContentType(contentType)
}
