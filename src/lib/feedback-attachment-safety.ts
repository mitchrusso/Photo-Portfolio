const allowedExtensions: Record<string, Set<string>> = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "text/plain": new Set(["txt"]),
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value)
}

export function validateFeedbackAttachment(input: { base64: string; contentType: string; filename: string }) {
  const contentType = input.contentType.trim().toLowerCase()
  const extension = input.filename.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ""
  if (!allowedExtensions[contentType]?.has(extension)) return false

  let bytes: Uint8Array
  try {
    const decoded = Buffer.from(input.base64, "base64")
    if (!decoded.length || decoded.toString("base64").replace(/=+$/, "") !== input.base64.replace(/=+$/, "")) return false
    bytes = decoded
  } catch {
    return false
  }

  if (contentType === "image/jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff])
  if (contentType === "image/png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (contentType === "image/webp") {
    return startsWith(bytes, [0x52, 0x49, 0x46, 0x46])
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)
  } catch {
    return false
  }
}
