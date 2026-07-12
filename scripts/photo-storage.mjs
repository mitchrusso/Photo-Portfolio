import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { put as putVercelBlob } from "@vercel/blob"

let r2Client = null

export function getPhotoStorageProvider() {
  return process.env.PHOTO_STORAGE_PROVIDER === "vercel-blob" ? "vercel-blob" : "r2"
}

export function assertPhotoStorageConfigured() {
  if (getPhotoStorageProvider() === "r2") {
    getR2Config()
    return
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new Error(
      "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN locally or connect a Blob store to this Vercel project.",
    )
  }
}

export async function uploadPhotoObject(pathname, body, options = {}) {
  assertPhotoStorageConfigured()

  if (getPhotoStorageProvider() === "r2") {
    return uploadToR2(pathname, body, options)
  }

  const blob = await putVercelBlob(pathname, body, {
    access: "public",
    addRandomSuffix: options.addRandomSuffix ?? true,
    allowOverwrite: options.allowOverwrite,
    cacheControlMaxAge: options.cacheControlMaxAge,
    contentType: options.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return {
    provider: "vercel-blob",
    pathname: blob.pathname,
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    size: getBodySize(body),
  }
}

async function uploadToR2(pathname, body, options) {
  const config = getR2Config()
  const objectPath = options.addRandomSuffix === false ? pathname : addObjectSuffix(pathname)
  const cacheControlMaxAge = options.cacheControlMaxAge ?? 60 * 60 * 24 * 30

  await getR2Client(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectPath,
      Body: body,
      ContentType: options.contentType,
      CacheControl: `private, max-age=${Math.min(cacheControlMaxAge, 60)}`,
    }),
  )

  const url = createR2ObjectReference(config.bucket, objectPath)

  return {
    provider: "r2",
    pathname: objectPath,
    url,
    downloadUrl: url,
    size: getBodySize(body),
  }
}

export async function getPhotoObjectReadUrl(reference, expiresIn = 60) {
  const object = resolveR2ObjectReference(reference)
  if (!object) return reference
  const config = getR2Config()
  if (object.bucket !== config.bucket) throw new Error("Unexpected R2 bucket in object reference.")
  return getSignedUrl(
    getR2Client(config),
    new GetObjectCommand({ Bucket: config.bucket, Key: object.pathname }),
    { expiresIn: Math.max(1, Math.min(expiresIn, 300)) },
  )
}

function createR2ObjectReference(bucket, pathname) {
  return `r2://${encodeURIComponent(bucket)}/${pathname.split("/").map(encodeURIComponent).join("/")}`
}

function resolveR2ObjectReference(reference) {
  let url
  try {
    url = new URL(reference)
  } catch {
    return null
  }
  if (url.protocol === "r2:") {
    const bucket = decodeURIComponent(url.hostname)
    const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ""))
    return bucket && pathname ? { bucket, pathname } : null
  }

  const config = getR2Config()
  if (config.publicBaseUrl) {
    const base = new URL(`${config.publicBaseUrl.replace(/\/+$/, "")}/`)
    if (url.origin === base.origin && url.pathname.startsWith(base.pathname)) {
      const pathname = decodeURIComponent(url.pathname.slice(base.pathname.length))
      return pathname ? { bucket: config.bucket, pathname } : null
    }
  }
  return null
}

function getR2Client(config) {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  return r2Client
}

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucket = process.env.CLOUDFLARE_R2_BUCKET
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim() || undefined
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  const missing = [
    ["CLOUDFLARE_R2_ACCOUNT_ID", accountId],
    ["CLOUDFLARE_R2_ACCESS_KEY_ID", accessKeyId],
    ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["CLOUDFLARE_R2_BUCKET", bucket],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(`Cloudflare R2 storage is not configured. Missing: ${missing.join(", ")}.`)
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
    endpoint,
  }
}

function getBodySize(body) {
  return body.byteLength ?? body.size ?? 0
}

function addObjectSuffix(pathname) {
  const suffix = crypto.randomUUID().slice(0, 8)
  const lastSlash = pathname.lastIndexOf("/")
  const lastDot = pathname.lastIndexOf(".")

  if (lastDot <= lastSlash) {
    return `${pathname}-${suffix}`
  }

  return `${pathname.slice(0, lastDot)}-${suffix}${pathname.slice(lastDot)}`
}
