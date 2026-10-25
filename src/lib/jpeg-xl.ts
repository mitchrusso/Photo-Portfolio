export const JPEG_XL_CONTENT_TYPE = "image/jxl"

const JPEG_XL_CONTAINER_SIGNATURE = [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a]

export function isJpegXlContentType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === JPEG_XL_CONTENT_TYPE
}

export function isJpegXlFileName(value: string | null | undefined) {
  return /\.jxl$/i.test(value?.trim() ?? "")
}

export function hasJpegXlSignature(bytes: Uint8Array) {
  if (bytes.byteLength >= 2 && bytes[0] === 0xff && bytes[1] === 0x0a) return true
  return bytes.byteLength >= JPEG_XL_CONTAINER_SIGNATURE.length
    && JPEG_XL_CONTAINER_SIGNATURE.every((byte, index) => bytes[index] === byte)
}
