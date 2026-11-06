export const SMUGMUG_ZIP_MAX_ENTRIES = 10_000
export const SMUGMUG_ZIP_MAX_PHOTOS = 3_000
export const SMUGMUG_ZIP_MAX_PHOTO_BYTES = 100 * 1024 * 1024
export const SMUGMUG_ZIP_MAX_EXPANDED_BYTES = 100 * 1024 * 1024 * 1024
export const SMUGMUG_ZIP_MAX_COMPRESSION_RATIO = 1_000

const PHOTO_CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
}

const VIDEO_EXTENSIONS = new Set(["3gp", "avi", "m4v", "mkv", "mov", "mp4", "mpeg", "mpg", "webm"])

export type SmugMugZipEntryKind = "photo" | "video" | "ignored"

export type SmugMugZipEntryInfo = {
  compressedSize: number
  directory: boolean
  encrypted: boolean
  filename: string
  symlink: boolean
  uncompressedSize: number
}

export function portfolioNameFromSmugMugZip(filename: string) {
  const withoutExtension = filename.replace(/\.zip$/i, "")
  const withoutDownloadSuffix = withoutExtension
    .replace(/[-_ ](?:smugmug[-_ ]?)?(?:download|photos?|gallery)(?:[-_ ]\d+)?$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return (withoutDownloadSuffix || withoutExtension || "SmugMug portfolio").slice(0, 120)
}

export function isSafeZipEntryPath(filename: string) {
  if (!filename || filename.includes("\0") || filename.includes("\\")) return false
  if (filename.startsWith("/") || /^[a-z]:\//i.test(filename)) return false
  return filename.split("/").every((segment) => segment !== "..")
}

export function smugMugZipEntryKind(filename: string): SmugMugZipEntryKind {
  const normalized = filename.replace(/\\/g, "/")
  const parts = normalized.split("/")
  const basename = parts.at(-1) ?? ""
  if (
    !basename ||
    basename.startsWith(".") ||
    parts.some((part) => part === "__MACOSX" || part.startsWith("."))
  ) return "ignored"

  const extension = basename.split(".").pop()?.toLowerCase() ?? ""
  if (extension in PHOTO_CONTENT_TYPE_BY_EXTENSION) return "photo"
  if (VIDEO_EXTENSIONS.has(extension)) return "video"
  return "ignored"
}

export function smugMugZipPhotoContentType(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? ""
  return PHOTO_CONTENT_TYPE_BY_EXTENSION[extension] ?? ""
}

export function validateSmugMugZipEntries(entries: SmugMugZipEntryInfo[]) {
  if (entries.length === 0) throw new Error("This ZIP file is empty.")
  if (entries.length > SMUGMUG_ZIP_MAX_ENTRIES) {
    throw new Error(`This ZIP contains more than ${SMUGMUG_ZIP_MAX_ENTRIES.toLocaleString()} entries. Split the SmugMug download into smaller galleries and try again.`)
  }

  let expandedBytes = 0
  let photoCount = 0
  let skippedVideos = 0
  let skippedFiles = 0

  for (const entry of entries) {
    if (!isSafeZipEntryPath(entry.filename)) throw new Error("This ZIP contains an unsafe file path and cannot be imported.")
    if (entry.symlink) throw new Error("This ZIP contains a symbolic link and cannot be imported safely.")
    if (entry.encrypted) throw new Error("Password-protected ZIP files cannot be imported. Download an unencrypted gallery ZIP from SmugMug.")
    if (entry.directory) continue
    if (!Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0) {
      throw new Error("This ZIP contains an invalid file size.")
    }

    expandedBytes += entry.uncompressedSize
    if (expandedBytes > SMUGMUG_ZIP_MAX_EXPANDED_BYTES) {
      throw new Error("This ZIP expands beyond PhotoView's 100 GB safety limit. Split the gallery into smaller ZIP files.")
    }

    const kind = smugMugZipEntryKind(entry.filename)
    if (kind === "photo") {
      photoCount += 1
      if (photoCount > SMUGMUG_ZIP_MAX_PHOTOS) {
        throw new Error(`This ZIP contains more than ${SMUGMUG_ZIP_MAX_PHOTOS.toLocaleString()} photos. Split the gallery into smaller ZIP files.`)
      }
      if (entry.uncompressedSize <= 0 || entry.uncompressedSize > SMUGMUG_ZIP_MAX_PHOTO_BYTES) {
        throw new Error(`“${entry.filename}” is empty or larger than PhotoView's 100 MB per-photo limit.`)
      }
      if (entry.compressedSize <= 0 || entry.uncompressedSize / entry.compressedSize > SMUGMUG_ZIP_MAX_COMPRESSION_RATIO) {
        throw new Error(`“${entry.filename}” has an unsafe compression ratio and cannot be imported.`)
      }
    } else if (kind === "video") {
      skippedVideos += 1
    } else {
      skippedFiles += 1
    }
  }

  if (photoCount === 0) {
    throw new Error("No supported photos were found. PhotoView imports JPEG, PNG, WebP, HEIC, HEIF, and TIFF files from SmugMug ZIP downloads.")
  }

  return { expandedBytes, photoCount, skippedFiles, skippedVideos }
}
