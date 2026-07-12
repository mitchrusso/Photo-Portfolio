import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { Readable } from "node:stream"
import { fileURLToPath } from "node:url"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import pg from "pg"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
loadEnvFile(path.join(rootDir, ".env"))
loadEnvFile(path.join(rootDir, ".env.local"))

const apply = process.argv.includes("--apply")
const concurrency = Math.max(1, Math.min(Number(process.env.R2_MIGRATION_CONCURRENCY ?? 4), 8))
const required = [
  "DATABASE_URL",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_ENDPOINT",
]
const missing = required.filter((name) => !process.env[name]?.trim())
if (missing.length) throw new Error(`Missing migration configuration: ${missing.join(", ")}`)

const database = new pg.Client({ connectionString: process.env.DATABASE_URL })
const r2 = new S3Client({
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: "auto",
})
const bucket = process.env.CLOUDFLARE_R2_BUCKET
const vercelBlobPattern = "https://%.public.blob.vercel-storage.com/%"

await database.connect()
try {
  const [photos, galleries] = await Promise.all([
    database.query(
      `SELECT "id", "workspaceId", "originalUrl", "displayUrl", "thumbnailUrl", "downloadUrl", "sourceUrl"
       FROM "Photo"
       WHERE "originalUrl" LIKE $1
          OR "displayUrl" LIKE $1
          OR "thumbnailUrl" LIKE $1
          OR "downloadUrl" LIKE $1
          OR "sourceUrl" LIKE $1
       ORDER BY "createdAt", "id"`,
      [vercelBlobPattern],
    ),
    database.query(
      `SELECT "id", "workspaceId", "coverImageUrl", "watermarkImageUrl"
       FROM "Gallery"
       WHERE "coverImageUrl" LIKE $1 OR "watermarkImageUrl" LIKE $1
       ORDER BY "createdAt", "id"`,
      [vercelBlobPattern],
    ),
  ])

  const referenceCount = countReferences(photos.rows, galleries.rows)
  console.log(`Vercel Blob references found: ${referenceCount}`)
  console.log(`Affected photos: ${photos.rowCount ?? 0}`)
  console.log(`Affected galleries: ${galleries.rowCount ?? 0}`)

  if (!apply || referenceCount === 0) {
    console.log(apply ? "No changes were needed." : "Dry run only. Re-run with --apply to copy objects and update the database.")
    process.exitCode = 0
  } else {
    const backupPath = writeBackup(photos.rows, galleries.rows)
    let completed = 0
    let copiedObjects = 0

    await runConcurrent(photos.rows, concurrency, async (row) => {
      const migrated = await migrateColumns(row, ["originalUrl", "displayUrl", "thumbnailUrl", "downloadUrl", "sourceUrl"], `legacy/${row.workspaceId}/photos/${row.id}`)
      copiedObjects += migrated.copiedObjects
      await database.query(
        `UPDATE "Photo"
         SET "originalUrl" = $2, "displayUrl" = $3, "thumbnailUrl" = $4, "downloadUrl" = $5, "sourceUrl" = $6
         WHERE "id" = $1`,
        [row.id, migrated.values.originalUrl, migrated.values.displayUrl, migrated.values.thumbnailUrl, migrated.values.downloadUrl, migrated.values.sourceUrl],
      )
      completed += 1
      if (completed % 20 === 0 || completed === photos.rows.length) {
        console.log(`Migrated ${completed}/${photos.rows.length} photos (${copiedObjects} unique objects copied).`)
      }
    })

    await runConcurrent(galleries.rows, Math.min(concurrency, 4), async (row) => {
      const migrated = await migrateColumns(row, ["coverImageUrl", "watermarkImageUrl"], `legacy/${row.workspaceId}/galleries/${row.id}`)
      copiedObjects += migrated.copiedObjects
      await database.query(
        `UPDATE "Gallery" SET "coverImageUrl" = $2, "watermarkImageUrl" = $3 WHERE "id" = $1`,
        [row.id, migrated.values.coverImageUrl, migrated.values.watermarkImageUrl],
      )
    })

    console.log(`Migration complete. ${copiedObjects} unique objects copied to private R2 storage.`)
    console.log(`Database backup: ${path.relative(rootDir, backupPath)}`)
    console.log("The Vercel Blob source objects were retained for rollback and should be deleted only after production verification.")
  }
} finally {
  await database.end()
}

async function migrateColumns(row, columns, baseKey) {
  const copied = new Map()
  const values = { ...row }
  let copiedObjects = 0

  for (const column of columns) {
    const source = row[column]
    if (!isVercelBlobUrl(source)) continue
    const normalizedSource = stripDownloadQuery(source)
    let target = copied.get(normalizedSource)
    if (!target) {
      const fileName = safeFileName(new URL(normalizedSource).pathname.split("/").pop() || column)
      const objectKey = `${baseKey}/${column}-${fileName}`
      await copyUrlToR2(source, objectKey)
      target = createR2Reference(objectKey)
      copied.set(normalizedSource, target)
      copiedObjects += 1
    }
    values[column] = target
  }

  return { copiedObjects, values }
}

async function copyUrlToR2(sourceUrl, objectKey) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(sourceUrl)
      if (!response.ok || !response.body) throw new Error(`Source returned HTTP ${response.status}`)
      const contentLength = Number(response.headers.get("content-length") || 0)
      await r2.send(new PutObjectCommand({
        Body: Readable.fromWeb(response.body),
        Bucket: bucket,
        CacheControl: "private, max-age=60",
        ContentLength: contentLength || undefined,
        ContentType: response.headers.get("content-type") || "application/octet-stream",
        Key: objectKey,
      }))
      return
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500))
    }
  }
  throw lastError
}

function writeBackup(photos, galleries) {
  const backupPath = path.join(rootDir, "exports", "r2-migrations", `vercel-blob-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  fs.mkdirSync(path.dirname(backupPath), { recursive: true })
  fs.writeFileSync(backupPath, `${JSON.stringify({ createdAt: new Date().toISOString(), galleries, photos }, null, 2)}\n`, { mode: 0o600 })
  return backupPath
}

function countReferences(photos, galleries) {
  const photoColumns = ["originalUrl", "displayUrl", "thumbnailUrl", "downloadUrl", "sourceUrl"]
  const galleryColumns = ["coverImageUrl", "watermarkImageUrl"]
  return photos.reduce((total, row) => total + photoColumns.filter((column) => isVercelBlobUrl(row[column])).length, 0)
    + galleries.reduce((total, row) => total + galleryColumns.filter((column) => isVercelBlobUrl(row[column])).length, 0)
}

function isVercelBlobUrl(value) {
  if (typeof value !== "string") return false
  try {
    return new URL(value).hostname.endsWith(".public.blob.vercel-storage.com")
  } catch {
    return false
  }
}

function stripDownloadQuery(value) {
  const url = new URL(value)
  url.search = ""
  url.hash = ""
  return url.toString()
}

function createR2Reference(objectKey) {
  return `r2://${encodeURIComponent(bucket)}/${objectKey.split("/").map(encodeURIComponent).join("/")}`
}

function safeFileName(value) {
  try {
    return decodeURIComponent(value).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-180) || "asset"
  } catch {
    return value.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-180) || "asset"
  }
}

async function runConcurrent(items, limit, worker) {
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = items[index]
      index += 1
      await worker(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const separator = trimmed.indexOf("=")
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
}
