"use client"

import type { PutBlobResult } from "@vercel/blob"
import { upload } from "@vercel/blob/client"
import { ImagePlus, Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"

type UploadState = "idle" | "uploading" | "uploaded" | "error"

type BlobUploadProps = {
  galleryId?: string
  mode?: "button" | "panel"
}

export function BlobUpload({ galleryId = "hudson-family-session", mode = "panel" }: BlobUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>("idle")
  const [message, setMessage] = useState("JPEG, PNG, WebP, HEIC, or video up to 200 MB")
  const [blob, setBlob] = useState<PutBlobResult | null>(null)

  async function handleUpload(file: File) {
    setState("uploading")
    setMessage(`Uploading ${file.name}`)
    setBlob(null)

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "upload"
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)

      const uploadedBlob = await upload(
        `galleries/${galleryId}/${safeName || "photo"}.${extension}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          clientPayload: JSON.stringify({ galleryId }),
        },
      )

      setBlob(uploadedBlob)
      setState("uploaded")
      setMessage("Uploaded to Vercel Blob")
    } catch (error) {
      setState("error")
      setMessage(error instanceof Error ? error.message : "Upload failed")
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  if (mode === "button") {
    return (
      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white">
        {state === "uploading" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Upload photos
        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleUpload(file)
          }}
          type="file"
        />
      </label>
    )
  }

  return (
    <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Blob upload</h2>
          <p className="mt-1 text-sm text-[#777064]">Send originals straight to Vercel Blob.</p>
        </div>
        <ImagePlus className="size-4 text-[#b08336]" />
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#cfc6b8] bg-[#faf8f4] px-4 py-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-md bg-[#1f2a24] text-white">
          {state === "uploading" ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
        </span>
        <span className="mt-3 text-sm font-semibold">
          {state === "uploading" ? "Uploading..." : "Choose a photo or video"}
        </span>
        <span className={`mt-1 text-xs ${state === "error" ? "text-[#a13f2f]" : "text-[#777064]"}`}>
          {message}
        </span>
        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
          className="sr-only"
          disabled={state === "uploading"}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleUpload(file)
          }}
          type="file"
        />
      </label>

      {blob && (
        <a
          className="mt-3 block truncate rounded-md bg-[#eef4e6] px-3 py-2 text-sm font-medium text-[#466026]"
          href={blob.url}
          rel="noreferrer"
          target="_blank"
        >
          View uploaded file
        </a>
      )}
    </div>
  )
}
