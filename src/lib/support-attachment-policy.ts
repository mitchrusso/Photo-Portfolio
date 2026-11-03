export const MAX_SUPPORT_ATTACHMENT_BYTES = 3 * 1024 * 1024

const SAFE_SUPPORT_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "text/plain"])

export function supportAttachmentIsSafe(input: { contentType: string; sizeBytes: number }) {
  return input.sizeBytes > 0
    && input.sizeBytes <= MAX_SUPPORT_ATTACHMENT_BYTES
    && SAFE_SUPPORT_ATTACHMENT_TYPES.has(input.contentType.toLowerCase())
}
