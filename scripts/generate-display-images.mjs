import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { assertPhotoStorageConfigured, getPhotoObjectReadUrl, uploadPhotoObject } from "./photo-storage.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")
const defaultManifestPath = path.join(rootDir, "exports", "smugmug", "travel-blob-manifest.json")
const defaultDataPath = path.join(rootDir, "src", "data", "migrated-galleries.ts")

loadEnvFile(path.join(rootDir, ".env"))
loadEnvFile(path.join(rootDir, ".env.local"))

const manifestPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultManifestPath
const dataPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultDataPath
const displayMax = Number(process.env.DISPLAY_IMAGE_MAX_WIDTH ?? 2400)
const thumbMax = Number(process.env.THUMB_IMAGE_MAX_WIDTH ?? 520)

assertPhotoStorageConfigured()
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

let generated = 0
let skipped = 0
let failed = 0
let displayBytes = 0
let thumbBytes = 0

for (const album of manifest.albums ?? []) {
  for (const image of album.images ?? []) {
    if (!isDisplayableImage(image)) {
      skipped += 1
      continue
    }

    if (image.displayUrl && image.thumbnailDisplayUrl) {
      skipped += 1
      continue
    }

    try {
      const response = await fetch(await getPhotoObjectReadUrl(image.blobUrl))

      if (!response.ok) {
        throw new Error(`download failed ${response.status}`)
      }

      const source = Buffer.from(await response.arrayBuffer())
      const display = await sharp(source)
        .rotate()
        .resize({ width: displayMax, height: displayMax, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 })
        .toBuffer()
      const thumb = await sharp(source)
        .rotate()
        .resize({ width: thumbMax, height: thumbMax, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 72, effort: 4 })
        .toBuffer()

      const displayBlob = await uploadPhotoObject(getVariantPath(image, "display"), display, {
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
      })
      const thumbBlob = await uploadPhotoObject(getVariantPath(image, "thumb"), thumb, {
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
      })

      image.displayPath = getVariantPath(image, "display")
      image.displayUrl = displayBlob.url
      image.displayBytes = display.byteLength
      image.thumbnailDisplayPath = getVariantPath(image, "thumb")
      image.thumbnailDisplayUrl = thumbBlob.url
      image.thumbnailDisplayBytes = thumb.byteLength
      image.displayGeneratedAt = new Date().toISOString()

      generated += 1
      displayBytes += display.byteLength
      thumbBytes += thumb.byteLength
      writeManifest(manifestPath, manifest)
      console.log(
        `Generated ${generated}: ${album.name} / ${image.fileName} (${formatBytes(source.byteLength)} -> ${formatBytes(display.byteLength)} display, ${formatBytes(thumb.byteLength)} thumb)`,
      )
    } catch (error) {
      failed += 1
      image.displayError = error instanceof Error ? error.message : String(error)
      writeManifest(manifestPath, manifest)
      console.log(`Failed: ${album.name} / ${image.fileName}: ${image.displayError}`)
    }
  }
}

manifest.displayImagesGeneratedAt = new Date().toISOString()
writeManifest(manifestPath, manifest)
writeMigratedGalleries(dataPath, manifest)

console.log("")
console.log(`Generated: ${generated}. Skipped: ${skipped}. Failed: ${failed}.`)
console.log(`Display uploaded: ${formatBytes(displayBytes)}. Thumbnails uploaded: ${formatBytes(thumbBytes)}.`)
console.log(`Updated ${path.relative(rootDir, manifestPath)} and ${path.relative(rootDir, dataPath)}.`)

function isDisplayableImage(image) {
  return Boolean(image.blobUrl) && /\.(jpe?g|png|webp)$/i.test(image.fileName ?? "")
}

function getVariantPath(image, variant) {
  const originalPath = image.blobPath ?? new URL(image.blobUrl).pathname.replace(/^\/+/, "")
  const parsed = path.posix.parse(originalPath)
  return path.posix.join(parsed.dir, variant, `${parsed.name}.webp`)
}

function writeManifest(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

function writeMigratedGalleries(filePath, data) {
  const galleries = (data.albums ?? []).map((album) => {
    const photos = (album.images ?? [])
      .filter((image) => image.blobUrl)
      .map((image) => ({
        id: image.imageKey,
        fileName: image.fileName,
        title: image.title || image.fileName,
        width: image.width ?? null,
        height: image.height ?? null,
        blobUrl: image.blobUrl,
        displayUrl: image.displayUrl ?? image.blobUrl,
        thumbnailUrl: image.thumbnailDisplayUrl ?? image.thumbnailUrl ?? image.displayUrl ?? image.blobUrl,
        downloadUrl: image.blobDownloadUrl ?? `${image.blobUrl}?download=1`,
        sourceUrl: image.webUri,
        bytes: image.uploadedBytes ?? null,
        displayBytes: image.displayBytes ?? null,
        thumbnailBytes: image.thumbnailDisplayBytes ?? null,
        kind: /\.(jpe?g|png|webp|gif)$/i.test(image.fileName ?? "") ? "Image" : "Raw",
      }))

    const cover = photos.find((photo) => photo.kind === "Image")?.displayUrl ?? photos[0]?.blobUrl ?? ""

    return {
      id: slugifyPath(album.name || album.nodeId || "gallery"),
      name: album.name,
      client: "Mitch Russo Travels",
      status: "Delivered",
      privacy: "Public",
      images: photos.filter((photo) => photo.kind === "Image").length,
      favorites: 0,
      revenue: "$0",
      cover,
      description: `${photos.filter((photo) => photo.kind === "Image").length} mobile-optimized display images with full-resolution originals preserved in secure object storage.`,
      url: album.webUri,
      photos,
    }
  })

  const source = `export type MigratedPhoto = {
  id: string
  fileName: string
  title: string
  width: number | null
  height: number | null
  blobUrl: string
  displayUrl?: string
  thumbnailUrl?: string
  downloadUrl: string
  sourceUrl: string
  bytes: number | null
  displayBytes?: number | null
  thumbnailBytes?: number | null
  kind: "Image" | "Raw"
}

export type MigratedGallery = {
  id: string
  name: string
  client: string
  status: "Delivered"
  privacy: "Public"
  images: number
  favorites: number
  revenue: "$0"
  cover: string
  description: string
  url: string
  photos: MigratedPhoto[]
}

export const migratedGalleries: MigratedGallery[] = ${JSON.stringify(galleries, null, 2)}
`

  fs.writeFileSync(filePath, source)
}

function slugifyPath(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item"
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const index = trimmed.indexOf("=")
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}
