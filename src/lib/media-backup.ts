import {
  CopyObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  S3Client,
  type _Object,
} from "@aws-sdk/client-s3"

type MediaBackupObject = Pick<_Object, "ETag" | "Key" | "Size">

export type MediaBackupPlan = {
  conflicts: Array<{ backupSize: number; key: string; sourceSize: number }>
  copies: Array<{ key: string; size: number }>
  skipped: number
}

export type MediaBackupResult = {
  backupBytes: number
  backupObjects: number
  complete: boolean
  copiedBytes: number
  copiedObjects: number
  pendingObjects: number
  skippedObjects: number
  sourceBytes: number
  sourceObjects: number
}

const DEFAULT_COPY_LIMIT = 1000
const MAX_COPY_LIMIT = 2000
const COPY_CONCURRENCY = 12

export function planMediaBackup(sourceObjects: MediaBackupObject[], backupObjects: MediaBackupObject[]): MediaBackupPlan {
  const backupByKey = new Map(
    backupObjects
      .filter((object): object is MediaBackupObject & { Key: string } => Boolean(object.Key))
      .map((object) => [object.Key, object]),
  )
  const copies: MediaBackupPlan["copies"] = []
  const conflicts: MediaBackupPlan["conflicts"] = []
  let skipped = 0

  for (const sourceObject of sourceObjects) {
    if (!sourceObject.Key) continue
    const sourceSize = sourceObject.Size ?? 0
    const backupObject = backupByKey.get(sourceObject.Key)
    if (!backupObject) {
      copies.push({ key: sourceObject.Key, size: sourceSize })
      continue
    }
    const backupSize = backupObject.Size ?? 0
    if (backupSize !== sourceSize) {
      conflicts.push({ backupSize, key: sourceObject.Key, sourceSize })
      continue
    }
    skipped += 1
  }

  return { conflicts, copies, skipped }
}

export async function syncMediaBackup(): Promise<MediaBackupResult> {
  const config = getMediaBackupConfig()
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    region: "auto",
  })

  await Promise.all([
    client.send(new HeadBucketCommand({ Bucket: config.sourceBucket })),
    client.send(new HeadBucketCommand({ Bucket: config.backupBucket })),
  ])

  const [sourceObjects, backupObjects] = await Promise.all([
    listBucketObjects(client, config.sourceBucket),
    listBucketObjects(client, config.backupBucket),
  ])
  const plan = planMediaBackup(sourceObjects, backupObjects)
  if (plan.conflicts.length > 0) {
    throw new Error(`Media backup found ${plan.conflicts.length} object size conflict(s); no conflicting object was overwritten.`)
  }

  const copyLimit = boundedCopyLimit(process.env.MEDIA_BACKUP_COPY_LIMIT)
  const scheduledCopies = plan.copies.slice(0, copyLimit)
  let copiedObjects = 0
  let copiedBytes = 0
  let cursor = 0

  async function worker() {
    while (cursor < scheduledCopies.length) {
      const copy = scheduledCopies[cursor]
      cursor += 1
      await client.send(new CopyObjectCommand({
        Bucket: config.backupBucket,
        CopySource: encodeCopySource(config.sourceBucket, copy.key),
        Key: copy.key,
        MetadataDirective: "COPY",
      }))
      copiedObjects += 1
      copiedBytes += copy.size
    }
  }

  await Promise.all(Array.from({ length: Math.min(COPY_CONCURRENCY, scheduledCopies.length) }, worker))
  const pendingObjects = plan.copies.length - copiedObjects

  return {
    backupBytes: backupObjects.reduce((total, object) => total + (object.Size ?? 0), 0) + copiedBytes,
    backupObjects: backupObjects.length + copiedObjects,
    complete: pendingObjects === 0,
    copiedBytes,
    copiedObjects,
    pendingObjects,
    skippedObjects: plan.skipped,
    sourceBytes: sourceObjects.reduce((total, object) => total + (object.Size ?? 0), 0),
    sourceObjects: sourceObjects.length,
  }
}

async function listBucketObjects(client: S3Client, bucket: string) {
  const objects: _Object[] = []
  let continuationToken: string | undefined

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

function boundedCopyLimit(value: string | undefined) {
  const parsed = Number(value ?? DEFAULT_COPY_LIMIT)
  if (!Number.isFinite(parsed)) return DEFAULT_COPY_LIMIT
  return Math.max(1, Math.min(Math.floor(parsed), MAX_COPY_LIMIT))
}

function encodeCopySource(bucket: string, key: string) {
  return `${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`
}

function getMediaBackupConfig() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.CLOUDFLARE_R2_BACKUP_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.CLOUDFLARE_R2_BACKUP_SECRET_ACCESS_KEY?.trim()
  const sourceBucket = process.env.CLOUDFLARE_R2_BUCKET?.trim()
  const backupBucket = process.env.CLOUDFLARE_R2_BACKUP_BUCKET?.trim()
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.trim()
    || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  const missing = [
    ["CLOUDFLARE_R2_ACCOUNT_ID", accountId],
    ["CLOUDFLARE_R2_BACKUP_ACCESS_KEY_ID", accessKeyId],
    ["CLOUDFLARE_R2_BACKUP_SECRET_ACCESS_KEY", secretAccessKey],
    ["CLOUDFLARE_R2_BUCKET", sourceBucket],
    ["CLOUDFLARE_R2_BACKUP_BUCKET", backupBucket],
    ["CLOUDFLARE_R2_ENDPOINT", endpoint],
  ].filter(([, value]) => !value).map(([name]) => name)

  if (missing.length > 0) throw new Error(`Media backup is not configured. Missing: ${missing.join(", ")}.`)
  if (sourceBucket === backupBucket) throw new Error("The media backup bucket must be different from the active media bucket.")

  return {
    accessKeyId: accessKeyId!,
    backupBucket: backupBucket!,
    endpoint,
    secretAccessKey: secretAccessKey!,
    sourceBucket: sourceBucket!,
  }
}
