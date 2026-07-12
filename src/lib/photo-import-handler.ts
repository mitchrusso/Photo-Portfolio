import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import sharp from "sharp"
import { assertPhotoStorageConfigured, uploadPhotoObject } from "@/lib/photo-storage"
import { STANDARD_MAX_UPLOAD_BYTES } from "@/lib/plans"
import { verifyImportToken } from "@/lib/import-token"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
])

type ImportSource = "desktop" | "lightroom"

export async function handlePhotoImport(request: Request, source: ImportSource): Promise<NextResponse> {
  const credential = validateImportKey(request)

  if (credential instanceof NextResponse) {
    return credential
  }

  const limit = checkRequestRateLimit(`photo-import:${credential.workspaceId}:${requestClientKey(request)}`, 60, 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Import rate limit reached. Please retry shortly." },
      { headers: { "Retry-After": String(limit.retryAfterSeconds) }, status: 429 },
    )
  }

  try {
    assertPhotoStorageConfigured()
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Photo storage is not configured.",
      },
      { status: 500 },
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A rendered photo file is required." }, { status: 400 })
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type || "unknown"}` },
      { status: 415 },
    )
  }

  if (file.size > STANDARD_MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Photo imports are limited to 100 MB per rendered file." },
      { status: 413 },
    )
  }

  const galleryName = getFormValue(formData, "galleryName", source === "lightroom" ? "Lightroom Portfolio" : "Desktop Uploads")
  const gallerySlug = slugify(getFormValue(formData, "gallerySlug", galleryName))
  const clientName = getFormValue(formData, "clientName", "")
  const makePublic = getFormValue(formData, "makePublic", "false") === "true"
  const originalFileName = getFormValue(formData, "originalFileName", file.name)
  const safeFileName = sanitizeFileName(originalFileName || file.name || "photo-import.jpg")
  const pathname = `imports/${credential.workspaceId}/${source}/${gallerySlug}/${Date.now()}-${safeFileName}`

  try {
    const fileBytes = new Uint8Array(await file.arrayBuffer())
    await validateImportedImage(fileBytes, file.type)
    const storedPhoto = await uploadPhotoObject({
      pathname,
      body: fileBytes,
      contentType: file.type,
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })

    const payload = {
      ok: true,
      source,
      gallery: {
        name: galleryName,
        slug: gallerySlug,
        clientName,
        public: makePublic,
      },
      photo: {
        url: storedPhoto.url,
        downloadUrl: storedPhoto.downloadUrl,
        pathname: storedPhoto.pathname,
        provider: storedPhoto.provider,
        fileName: safeFileName,
        bytes: storedPhoto.size,
        contentType: file.type,
        title: getFormValue(formData, "photoTitle", ""),
        caption: getFormValue(formData, "caption", ""),
        captureTime: getFormValue(formData, "captureTime", ""),
      },
    }

    // Later: persist gallery/photo/storage records once subscriber tenancy is wired.
    console.info("Photo import completed", payload)

    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo import failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function validateImportKey(request: Request): NextResponse | { workspaceId: string } {
  const requiredKey = process.env.PHOTOVIEWPRO_IMPORT_API_KEY
  const providedKey = request.headers.get("x-photoviewpro-key")
  const tokenClaims = verifyImportToken(providedKey ?? undefined)
  if (tokenClaims) return { workspaceId: tokenClaims.workspaceId }

  if (!requiredKey) return NextResponse.json({ error: "Invalid or expired PhotoViewPro import key." }, { status: 401 })

  const providedBuffer = Buffer.from(providedKey ?? "")
  const requiredBuffer = Buffer.from(requiredKey)
  if (providedBuffer.length !== requiredBuffer.length || !timingSafeEqual(providedBuffer, requiredBuffer)) {
    return NextResponse.json({ error: "Invalid PhotoViewPro import API key." }, { status: 401 })
  }

  return { workspaceId: "legacy" }
}

async function validateImportedImage(bytes: Uint8Array, contentType: string) {
  if (bytes.byteLength === 0) throw new Error("The imported file is empty.")
  let format: string | undefined
  try {
    format = (await sharp(bytes, { limitInputPixels: 100_000_000 }).metadata()).format
  } catch {
    throw new Error("The imported file is not a valid image.")
  }

  const expectedFormats: Record<string, string[]> = {
    "image/heic": ["heif"],
    "image/heif": ["heif"],
    "image/jpeg": ["jpeg"],
    "image/png": ["png"],
    "image/tiff": ["tiff"],
    "image/webp": ["webp"],
  }
  if (!format || !expectedFormats[contentType]?.includes(format)) {
    throw new Error("The imported file contents do not match its declared type.")
  }
}

function getFormValue(formData: FormData, key: string, fallback: string): string {
  const value = formData.get(key)
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")

  return slug || "photo-import"
}

function sanitizeFileName(value: string): string {
  const parts = value.split(".")
  const extension = parts.length > 1 ? parts.pop() : "jpg"
  const baseName = parts.join(".") || "photo-import"
  const safeBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "") || "photo-import"

  return `${safeBaseName}.${(extension || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"}`
}
