export const PHOTOSHOP_CONTENT_TYPE = "image/vnd.adobe.photoshop"
export const PHOTOSHOP_UPLOAD_SAFETY_BYTES = 500 * 1024 * 1024
export const PHOTOSHOP_PREVIEW_SAFETY_BYTES = 20 * 1024 * 1024

const PHOTOSHOP_CONTENT_TYPES = new Set([
  PHOTOSHOP_CONTENT_TYPE,
  "application/vnd.adobe.photoshop",
  "application/x-photoshop",
  "image/x-photoshop",
])

export function isPhotoshopFileName(fileName: string) {
  return /\.(?:psd|psb)$/i.test(fileName.trim())
}

export function isPhotoshopContentType(contentType: string) {
  return PHOTOSHOP_CONTENT_TYPES.has(contentType.trim().toLowerCase())
}

export function photoshopFileVersion(bytes: Uint8Array): 1 | 2 | null {
  if (
    bytes.byteLength < 6 ||
    bytes[0] !== 0x38 ||
    bytes[1] !== 0x42 ||
    bytes[2] !== 0x50 ||
    bytes[3] !== 0x53
  ) return null

  const version = (bytes[4] << 8) | bytes[5]
  return version === 1 || version === 2 ? version : null
}

export function photoshopUploadLimitFor(fileName: string, contentType: string) {
  return isPhotoshopFileName(fileName) || isPhotoshopContentType(contentType)
    ? PHOTOSHOP_UPLOAD_SAFETY_BYTES
    : null
}
