import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadPhotoObject } from "@/lib/photo-storage"

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/tiff",
  "video/mp4",
  "video/quicktime",
])

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  const pathname = getFormValue(formData, "pathname", "")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 })
  }

  if (!pathname) {
    return NextResponse.json({ error: "An upload path is required." }, { status: 400 })
  }

  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}` }, { status: 415 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Uploads are limited to 200 MB per file." }, { status: 413 })
  }

  try {
    const storedFile = await uploadPhotoObject({
      pathname: sanitizePathname(pathname),
      body: file,
      contentType: file.type,
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    })

    return NextResponse.json({
      ok: true,
      provider: storedFile.provider,
      pathname: storedFile.pathname,
      url: storedFile.url,
      downloadUrl: storedFile.downloadUrl,
      size: storedFile.size,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    )
  }
}

function getFormValue(formData: FormData, key: string, fallback: string): string {
  const value = formData.get(key)
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback
}

function sanitizePathname(value: string): string {
  return value
    .split("/")
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("/")
}
