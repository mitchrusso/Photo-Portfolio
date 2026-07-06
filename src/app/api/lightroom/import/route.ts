import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

const MAX_LIGHTROOM_UPLOAD_BYTES = 200 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])

export async function POST(request: Request): Promise<NextResponse> {
  const authError = validateImportKey(request)

  if (authError) {
    return authError
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN locally or connect a Blob store to this Vercel project.",
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

  if (file.size > MAX_LIGHTROOM_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Lightroom imports are limited to 200 MB per rendered file." },
      { status: 413 },
    )
  }

  const galleryName = getFormValue(formData, "galleryName", "Lightroom Portfolio")
  const gallerySlug = slugify(getFormValue(formData, "gallerySlug", galleryName))
  const clientName = getFormValue(formData, "clientName", "")
  const makePublic = getFormValue(formData, "makePublic", "false") === "true"
  const originalFileName = getFormValue(formData, "originalFileName", file.name)
  const safeFileName = sanitizeFileName(originalFileName || file.name || "lightroom-export.jpg")
  const pathname = `lightroom/${gallerySlug}/${Date.now()}-${safeFileName}`

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })

    const payload = {
      ok: true,
      gallery: {
        name: galleryName,
        slug: gallerySlug,
        clientName,
        public: makePublic,
      },
      photo: {
        url: blob.url,
        pathname: blob.pathname,
        fileName: safeFileName,
        bytes: file.size,
        contentType: file.type,
        title: getFormValue(formData, "photoTitle", ""),
        caption: getFormValue(formData, "caption", ""),
        captureTime: getFormValue(formData, "captureTime", ""),
      },
    }

    // Later: persist the gallery/photo/storage records once subscriber tenancy is wired.
    console.info("Lightroom import completed", payload)

    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lightroom import failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function validateImportKey(request: Request): NextResponse | null {
  const requiredKey = process.env.PHOTOVIEWPRO_IMPORT_API_KEY

  if (!requiredKey) {
    return null
  }

  const providedKey = request.headers.get("x-photoviewpro-key")

  if (providedKey !== requiredKey) {
    return NextResponse.json({ error: "Invalid PhotoViewPro import API key." }, { status: 401 })
  }

  return null
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

  return slug || "lightroom-portfolio"
}

function sanitizeFileName(value: string): string {
  const parts = value.split(".")
  const extension = parts.length > 1 ? parts.pop() : "jpg"
  const baseName = parts.join(".") || "lightroom-export"
  const safeBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "") || "lightroom-export"

  return `${safeBaseName}.${(extension || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"}`
}
