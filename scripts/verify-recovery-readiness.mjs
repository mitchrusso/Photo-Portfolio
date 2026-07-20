import { createHash } from "node:crypto"
import {
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3"
import pg from "pg"

const requiredEnvironment = [
  "DATABASE_URL",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_R2_ENDPOINT",
]

for (const name of requiredEnvironment) {
  if (!process.env[name]) throw new Error(`${name} is required.`)
}

const referenceColumns = [
  ["Photo", "originalUrl"],
  ["Photo", "displayUrl"],
  ["Photo", "thumbnailUrl"],
  ["Photo", "downloadUrl"],
  ["Gallery", "coverImageUrl"],
  ["Gallery", "watermarkImageUrl"],
  ["ContentPost", "heroImageUrl"],
  ["GearItem", "imageUrl"],
]

function quoted(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function parseR2Reference(reference) {
  const url = new URL(reference)
  return {
    bucket: decodeURIComponent(url.hostname),
    key: url.pathname.split("/").filter(Boolean).map(decodeURIComponent).join("/"),
  }
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12)
}

async function loadDatabaseInventory() {
  const connectionString = process.env.DATABASE_URL.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/,
    "$1sslmode=verify-full",
  )
  const database = new pg.Client({ connectionString })
  await database.connect()

  try {
    const referenceQuery = referenceColumns
      .map(([table, column]) => (
        `select '${table}.${column}' as source, ${quoted(column)} as reference `
        + `from ${quoted(table)} where ${quoted(column)} like 'r2://%'`
      ))
      .join(" union all ")

    const references = await database.query(referenceQuery)
    const migrations = await database.query(
      'select count(*)::int as count from "_prisma_migrations" where finished_at is not null and rolled_back_at is null',
    )
    const tableCounts = await database.query(`
      select
        (select count(*)::int from "Workspace") as workspaces,
        (select count(*)::int from "Gallery") as portfolios,
        (select count(*)::int from "Photo") as photos
    `)

    return {
      migrations: migrations.rows[0]?.count ?? 0,
      references: references.rows,
      tableCounts: tableCounts.rows[0],
    }
  } finally {
    await database.end()
  }
}

async function loadBucketInventory(client, bucket) {
  await client.send(new HeadBucketCommand({ Bucket: bucket }))

  const objects = []
  let continuationToken
  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }))
    objects.push(...(page.Contents ?? []))
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (continuationToken)

  return objects
}

async function verifyReferencedObjects(client, references) {
  const uniqueObjects = new Map()
  const sourceCounts = {}

  for (const row of references) {
    sourceCounts[row.source] = (sourceCounts[row.source] ?? 0) + 1
    const object = parseR2Reference(row.reference)
    uniqueObjects.set(`${object.bucket}/${object.key}`, object)
  }

  const objects = [...uniqueObjects.values()]
  let cursor = 0
  let missingObjects = 0
  let verificationErrors = 0

  async function worker() {
    while (cursor < objects.length) {
      const object = objects[cursor]
      cursor += 1
      try {
        await client.send(new HeadObjectCommand({ Bucket: object.bucket, Key: object.key }))
      } catch (error) {
        if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
          missingObjects += 1
        } else {
          verificationErrors += 1
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(20, objects.length) }, worker))
  return { missingObjects, sourceCounts, uniqueObjects, verificationErrors }
}

async function main() {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET
  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    region: "auto",
  })

  const database = await loadDatabaseInventory()
  const bucketObjects = await loadBucketInventory(client, bucket)
  const verification = await verifyReferencedObjects(client, database.references)
  const activeKeys = new Set([...verification.uniqueObjects.values()].map((object) => object.key))
  const unreferenced = bucketObjects.filter((object) => !activeKeys.has(object.Key))

  const result = {
    checkedAt: new Date().toISOString(),
    database: {
      migrations: database.migrations,
      ...database.tableCounts,
      r2References: database.references.length,
    },
    storage: {
      bucketObjects: bucketObjects.length,
      bucketBytes: bucketObjects.reduce((total, object) => total + (object.Size ?? 0), 0),
      missingReferencedObjects: verification.missingObjects,
      uniqueReferencedObjects: verification.uniqueObjects.size,
      unreferencedBytes: unreferenced.reduce((total, object) => total + (object.Size ?? 0), 0),
      unreferencedObjectFingerprints: unreferenced.map((object) => fingerprint(object.Key ?? "")),
      unreferencedObjects: unreferenced.length,
      verificationErrors: verification.verificationErrors,
    },
  }

  console.log(JSON.stringify(result, null, 2))

  if (verification.missingObjects > 0 || verification.verificationErrors > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
