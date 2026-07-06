import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { put as putVercelBlob } from "@vercel/blob"

let r2Client = null

export function getPhotoStorageProvider() {
  return process.env.PHOTO_STORAGE_PROVIDER === "r2" ? "r2" : "vercel-blob"
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
      CacheControl: `public, max-age=${cacheControlMaxAge}`,
    }),
  )

  const url = `${config.publicBaseUrl.replace(/\/+$/, "")}/${objectPath}`

  return {
    provider: "r2",
    pathname: objectPath,
    url,
    downloadUrl: url,
    size: getBodySize(body),
  }
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
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  const missing = [
    ["CLOUDFLARE_R2_ACCOUNT_ID", accountId],
    ["CLOUDFLARE_R2_ACCESS_KEY_ID", accessKeyId],
    ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["CLOUDFLARE_R2_BUCKET", bucket],
    ["CLOUDFLARE_R2_PUBLIC_BASE_URL", publicBaseUrl],
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
