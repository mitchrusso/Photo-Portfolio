import { isPhotoshopContentType } from "./photoshop-upload.ts"

export const PORTFOLIO_IMAGE_ACCEPT = "image/avif,image/jpeg,image/jxl,image/png,image/webp,image/heic,image/heif,image/tiff,image/vnd.adobe.photoshop,.avif,.jpg,.jpeg,.jxl,.png,.webp,.heic,.heif,.tif,.tiff,.psd,.psb"

export const PORTFOLIO_IMAGE_FORMATS_LABEL = "AVIF, JPEG, JPEG XL, PNG, WebP, HEIC, TIFF, PSD, or PSB. JPEG XL and Photoshop originals are preserved while PhotoView prepares browser-compatible display copies. Photoshop originals up to 500 MB count toward storage."

const PORTFOLIO_IMAGE_CONTENT_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/jxl",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
])

export function isAllowedPortfolioImageContentType(contentType: string) {
  return PORTFOLIO_IMAGE_CONTENT_TYPES.has(contentType.trim().toLowerCase()) || isPhotoshopContentType(contentType)
}
