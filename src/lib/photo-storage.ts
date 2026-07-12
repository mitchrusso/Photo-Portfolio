import { put as putVercelBlob } from "@vercel/blob"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export type PhotoStorageProvider = "vercel-blob" | "r2"

type UploadBody = ArrayBuffer | Blob | Buffer | Uint8Array

type UploadPhotoObjectInput = {
  pathname: string
  body: UploadBody
  contentType?: string
  cacheControlMaxAge?: number
  addRandomSuffix?: boolean
}

export type UploadPhotoObjectResult = {
  provider: PhotoStorageProvider
  pathname: string
  url: string
  downloadUrl: string
  size: number
}

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl?: string
  endpoint: string
}

let r2Client: S3Client | null = null
const R2_SIGNED_URL_TTL_SECONDS = 60

export function getPhotoStorageProvider(): PhotoStorageProvider {
  const provider = process.env.PHOTO_STORAGE_PROVIDER?.trim().toLowerCase()
  if (provider === "vercel-blob") return "vercel-blob"
  return "r2"
}

export function assertPhotoStorageConfigured(): void {
  if (getPhotoStorageProvider() === "r2") {
    getR2Config()
    return
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new Error(
      "Vercel Blob storage is not configured. Set PHOTO_STORAGE_PROVIDER=r2 for Cloudflare R2, or add BLOB_READ_WRITE_TOKEN for the legacy Blob provider.",
    )
  }
}

export async function uploadPhotoObject(input: UploadPhotoObjectInput): Promise<UploadPhotoObjectResult> {
  assertPhotoStorageConfigured()

  if (getPhotoStorageProvider() === "r2") {
    return uploadToR2(input)
  }

  const blob = await putVercelBlob(input.pathname, await toVercelPutBody(input.body), {
    access: "public",
    addRandomSuffix: input.addRandomSuffix ?? true,
    cacheControlMaxAge: input.cacheControlMaxAge,
    contentType: input.contentType,
  })

  return {
    provider: "vercel-blob",
    pathname: blob.pathname,
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    size: await getBodySize(input.body),
  }
}

async function uploadToR2(input: UploadPhotoObjectInput): Promise<UploadPhotoObjectResult> {
  const config = getR2Config()
  const pathname = input.addRandomSuffix === false ? input.pathname : addObjectSuffix(input.pathname)
  const body = await toUint8Array(input.body)
  const cacheControlMaxAge = input.cacheControlMaxAge ?? 60 * 60 * 24 * 30

  await getR2Client(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: pathname,
      Body: body,
      ContentType: input.contentType,
      CacheControl: `private, max-age=${Math.min(cacheControlMaxAge, R2_SIGNED_URL_TTL_SECONDS)}`,
    }),
  )

  const url = createR2ObjectReference(config.bucket, pathname)

  return {
    provider: "r2",
    pathname,
    url,
    downloadUrl: url,
    size: body.byteLength,
  }
}

export async function getPhotoDeliveryUrl(
  reference: string,
  options: { download?: boolean; fileName?: string; expiresIn?: number } = {},
) {
  const object = resolveR2ObjectReference(reference)
  if (!object) return reference

  const config = getR2Config()
  if (object.bucket !== config.bucket) throw new Error("The photo belongs to an unexpected R2 bucket.")
  const expiresIn = Math.max(1, Math.min(options.expiresIn ?? R2_SIGNED_URL_TTL_SECONDS, 5 * 60))
  const fileName = sanitizeDownloadFileName(options.fileName || object.pathname.split("/").pop() || "photo")

  return getSignedUrl(
    getR2Client(config),
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: object.pathname,
      ...(options.download ? { ResponseContentDisposition: `attachment; filename="${fileName}"` } : {}),
    }),
    { expiresIn },
  )
}

export function createR2ObjectReference(bucket: string, pathname: string) {
  const encodedPath = pathname.split("/").map(encodeURIComponent).join("/")
  return `r2://${encodeURIComponent(bucket)}/${encodedPath}`
}

export function resolveR2ObjectReference(reference: string): { bucket: string; pathname: string } | null {
  let url: URL
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

  const config = getR2ConfigIfAvailable()
  if (!config || (url.protocol !== "https:" && url.protocol !== "http:")) return null

  if (config.publicBaseUrl) {
    try {
      const base = new URL(`${config.publicBaseUrl.replace(/\/+$/, "")}/`)
      if (url.origin === base.origin && url.pathname.startsWith(base.pathname)) {
        const pathname = decodeURIComponent(url.pathname.slice(base.pathname.length))
        if (pathname) return { bucket: config.bucket, pathname }
      }
    } catch {
      // Ignore malformed legacy base URLs and continue checking S3 endpoint forms.
    }
  }

  const endpoint = new URL(config.endpoint)
  if (url.hostname === `${config.bucket}.${endpoint.hostname}`) {
    const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ""))
    return pathname ? { bucket: config.bucket, pathname } : null
  }
  if (url.origin === endpoint.origin && url.pathname.startsWith(`/${config.bucket}/`)) {
    const pathname = decodeURIComponent(url.pathname.slice(config.bucket.length + 2))
    return pathname ? { bucket: config.bucket, pathname } : null
  }

  return null
}

function getR2Client(config: R2Config): S3Client {
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

function getR2Config(): R2Config {
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
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    publicBaseUrl,
    endpoint,
  }
}

function getR2ConfigIfAvailable() {
  try {
    return getR2Config()
  } catch {
    return null
  }
}

function sanitizeDownloadFileName(value: string) {
  return value.replace(/["\\\r\n]/g, "_").slice(0, 180) || "photo"
}

async function toUint8Array(body: UploadBody): Promise<Uint8Array> {
  if (body instanceof Uint8Array) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  return new Uint8Array(await body.arrayBuffer())
}

async function toVercelPutBody(body: UploadBody): Promise<Blob | Buffer> {
  if (body instanceof Blob || Buffer.isBuffer(body)) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body)
  }

  return Buffer.from(body)
}

async function getBodySize(body: UploadBody): Promise<number> {
  if (body instanceof Uint8Array) {
    return body.byteLength
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength
  }

  return body.size
}

function addObjectSuffix(pathname: string): string {
  const suffix = crypto.randomUUID().slice(0, 8)
  const lastDot = pathname.lastIndexOf(".")

  if (lastDot <= pathname.lastIndexOf("/")) {
    return `${pathname}-${suffix}`
  }

  return `${pathname.slice(0, lastDot)}-${suffix}${pathname.slice(lastDot)}`
}
