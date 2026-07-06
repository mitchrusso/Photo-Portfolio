import { put as putVercelBlob } from "@vercel/blob"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

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
  publicBaseUrl: string
  endpoint: string
}

let r2Client: S3Client | null = null

export function getPhotoStorageProvider(): PhotoStorageProvider {
  return process.env.PHOTO_STORAGE_PROVIDER === "r2" ? "r2" : "vercel-blob"
}

export function assertPhotoStorageConfigured(): void {
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
      CacheControl: `public, max-age=${cacheControlMaxAge}`,
    }),
  )

  const url = `${config.publicBaseUrl.replace(/\/+$/, "")}/${pathname}`

  return {
    provider: "r2",
    pathname,
    url,
    downloadUrl: url,
    size: body.byteLength,
  }
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
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    publicBaseUrl: publicBaseUrl!,
    endpoint,
  }
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
