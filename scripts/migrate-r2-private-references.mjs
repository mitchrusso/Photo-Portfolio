import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import pg from "pg"

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
loadEnvFile(path.join(rootDir, ".env"))
loadEnvFile(path.join(rootDir, ".env.local"))

const apply = process.argv.includes("--apply")
const rollbackArgument = process.argv.find((argument) => argument.startsWith("--rollback="))
const databaseUrl = process.env.DATABASE_URL
const bucket = process.env.CLOUDFLARE_R2_BUCKET
const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.replace(/\/+$/, "")

if (!databaseUrl) throw new Error("DATABASE_URL is required.")
if (!bucket) throw new Error("CLOUDFLARE_R2_BUCKET is required.")

const client = new pg.Client({ connectionString: databaseUrl })
await client.connect()

try {
  if (rollbackArgument) {
    await rollbackMigration(path.resolve(rollbackArgument.slice("--rollback=".length)))
  } else {
    if (!publicBaseUrl) {
      throw new Error("CLOUDFLARE_R2_PUBLIC_BASE_URL is required to identify legacy public references.")
    }
    await migrateReferences()
  }
} finally {
  await client.end()
}

async function migrateReferences() {
  const prefix = `${publicBaseUrl}/`
  const [photos, galleries] = await Promise.all([
    client.query(
      `SELECT "id", "originalUrl", "displayUrl", "thumbnailUrl", "downloadUrl", "sourceUrl"
       FROM "Photo"
       WHERE "originalUrl" LIKE $1
          OR "displayUrl" LIKE $1
          OR "thumbnailUrl" LIKE $1
          OR "downloadUrl" LIKE $1
          OR "sourceUrl" LIKE $1`,
      [`${prefix}%`],
    ),
    client.query(
      `SELECT "id", "coverImageUrl", "watermarkImageUrl"
       FROM "Gallery"
       WHERE "coverImageUrl" LIKE $1 OR "watermarkImageUrl" LIKE $1`,
      [`${prefix}%`],
    ),
  ])

  const references = countLegacyReferences(photos.rows, galleries.rows, prefix)
  console.log(`Legacy public R2 references found: ${references}`)
  console.log(`Affected photos: ${photos.rowCount ?? 0}`)
  console.log(`Affected galleries: ${galleries.rowCount ?? 0}`)

  if (!apply || references === 0) {
    console.log(apply ? "No changes were needed." : "Dry run only. Re-run with --apply to convert these references.")
    return
  }

  const backupPath = path.join(rootDir, "exports", "r2-migrations", `r2-reference-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  fs.mkdirSync(path.dirname(backupPath), { recursive: true })
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify({ bucket, createdAt: new Date().toISOString(), galleries: galleries.rows, photos: photos.rows, publicBaseUrl }, null, 2)}\n`,
    { mode: 0o600 },
  )

  await client.query("BEGIN")
  try {
    for (const row of photos.rows) {
      await client.query(
        `UPDATE "Photo"
         SET "originalUrl" = $2,
             "displayUrl" = $3,
             "thumbnailUrl" = $4,
             "downloadUrl" = $5,
             "sourceUrl" = $6
         WHERE "id" = $1`,
        [
          row.id,
          toPrivateReference(row.originalUrl, prefix),
          toPrivateReference(row.displayUrl, prefix),
          toPrivateReference(row.thumbnailUrl, prefix),
          toPrivateReference(row.downloadUrl, prefix),
          toPrivateReference(row.sourceUrl, prefix),
        ],
      )
    }

    for (const row of galleries.rows) {
      await client.query(
        `UPDATE "Gallery"
         SET "coverImageUrl" = $2, "watermarkImageUrl" = $3
         WHERE "id" = $1`,
        [
          row.id,
          toPrivateReference(row.coverImageUrl, prefix),
          toPrivateReference(row.watermarkImageUrl, prefix),
        ],
      )
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  }

  console.log(`Converted ${references} references to private r2:// object references.`)
  console.log(`Rollback backup: ${path.relative(rootDir, backupPath)}`)
  console.log(`Rollback command: npm run r2:migrate-private-references -- --rollback=${backupPath}`)
}

async function rollbackMigration(backupPath) {
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"))
  if (!Array.isArray(backup.photos) || !Array.isArray(backup.galleries)) {
    throw new Error("The rollback file is not a valid R2 reference backup.")
  }

  await client.query("BEGIN")
  try {
    for (const row of backup.photos) {
      await client.query(
        `UPDATE "Photo"
         SET "originalUrl" = $2,
             "displayUrl" = $3,
             "thumbnailUrl" = $4,
             "downloadUrl" = $5,
             "sourceUrl" = $6
         WHERE "id" = $1`,
        [row.id, row.originalUrl, row.displayUrl, row.thumbnailUrl, row.downloadUrl, row.sourceUrl],
      )
    }
    for (const row of backup.galleries) {
      await client.query(
        `UPDATE "Gallery"
         SET "coverImageUrl" = $2, "watermarkImageUrl" = $3
         WHERE "id" = $1`,
        [row.id, row.coverImageUrl, row.watermarkImageUrl],
      )
    }
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  }

  console.log(`Restored ${backup.photos.length} photos and ${backup.galleries.length} galleries from ${backupPath}.`)
}

function toPrivateReference(value, prefix) {
  if (typeof value !== "string" || !value.startsWith(prefix)) return value
  const pathname = value.slice(prefix.length).split("?", 1)[0]
  return `r2://${encodeURIComponent(bucket)}/${pathname}`
}

function countLegacyReferences(photos, galleries, prefix) {
  const photoColumns = ["originalUrl", "displayUrl", "thumbnailUrl", "downloadUrl", "sourceUrl"]
  const galleryColumns = ["coverImageUrl", "watermarkImageUrl"]
  return photos.reduce((total, row) => total + photoColumns.filter((column) => row[column]?.startsWith(prefix)).length, 0)
    + galleries.reduce((total, row) => total + galleryColumns.filter((column) => row[column]?.startsWith(prefix)).length, 0)
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
