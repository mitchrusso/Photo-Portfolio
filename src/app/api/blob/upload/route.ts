import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPhotoStorageProvider } from "@/lib/photo-storage"
import { STANDARD_MAX_UPLOAD_BYTES } from "@/lib/plans"

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
]

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (getPhotoStorageProvider() === "r2") {
    return NextResponse.json(
      {
        error:
          "Direct browser uploads are not enabled for Cloudflare R2 yet. Use Lightroom, desktop import, or switch PHOTO_STORAGE_PROVIDER back to vercel-blob for this upload flow.",
      },
      { status: 501 },
    )
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

  const body = (await request.json()) as HandleUploadBody

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = safeParseClientPayload(clientPayload)

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: STANDARD_MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30,
          tokenPayload: JSON.stringify({
            galleryId: payload.galleryId,
            pathname,
            uploadedBy: session.user.email ?? "dev@example.com",
          }),
          validUntil: Date.now() + 1000 * 60 * 10,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Later: write this blob URL and token payload into Postgres.
        console.info("Blob upload completed", {
          pathname: blob.pathname,
          url: blob.url,
          tokenPayload,
        })
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function safeParseClientPayload(payload: string | null): { galleryId: string } {
  if (!payload) {
    return { galleryId: "unsorted" }
  }

  try {
    const parsed = JSON.parse(payload) as { galleryId?: unknown }
    return {
      galleryId:
        typeof parsed.galleryId === "string" && parsed.galleryId.length > 0
          ? parsed.galleryId
          : "unsorted",
    }
  } catch {
    return { galleryId: "unsorted" }
  }
}
