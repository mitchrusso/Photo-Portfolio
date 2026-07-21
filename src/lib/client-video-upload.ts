import type { ClientPhotoUploadResult } from "@/lib/client-photo-upload"
import { isMovVideo, isSupportedHeroVideo, prepareHeroVideoForUpload } from "@/lib/client-video-conversion"

export const PORTFOLIO_VIDEO_ACCEPT = ".mp4,.mov,video/mp4,video/quicktime"
export const PORTFOLIO_VIDEO_MAX_BYTES = 5 * 1024 ** 3
const PORTFOLIO_MOV_CONVERSION_MAX_BYTES = 750 * 1024 ** 2

type UploadSlot = {
  contentType: string
  reference: string
  uploadUrl: string
}

type InitiateResponse = {
  original: UploadSlot
  playback?: UploadSlot
  poster?: UploadSlot
}

async function putDirect(slot: UploadSlot, file: Blob) {
  const response = await fetch(slot.uploadUrl, {
    body: file,
    headers: { "Content-Type": slot.contentType },
    method: "PUT",
  })
  if (!response.ok) throw new Error("The video could not be transferred to secure storage.")
}

async function createPoster(videoFile: File) {
  const source = URL.createObjectURL(videoFile)
  try {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.preload = "metadata"
    video.src = source
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error("Video preview unavailable"))
    })
    if (Number.isFinite(video.duration) && video.duration > 0.2) {
      video.currentTime = Math.min(1, video.duration * 0.1)
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error("Video preview unavailable"))
      })
    }
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const scale = Math.min(1, 1280 / width)
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82))
    return blob ? new File([blob], "video-poster.jpg", { type: "image/jpeg" }) : null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(source)
  }
}

export async function uploadPortfolioVideo(
  galleryId: string,
  file: File,
  onProgress?: (message: string) => void,
): Promise<ClientPhotoUploadResult> {
  if (!isSupportedHeroVideo(file)) throw new Error("Choose an MP4 or MOV video.")
  if (file.size <= 0 || file.size > PORTFOLIO_VIDEO_MAX_BYTES) {
    throw new Error("Portfolio videos must be smaller than 5 GB and fit within the account storage allowance.")
  }

  const needsPlaybackCopy = isMovVideo(file)
  if (needsPlaybackCopy && file.size > PORTFOLIO_MOV_CONVERSION_MAX_BYTES) {
    throw new Error("MOV files larger than 750 MB should be exported as H.264 MP4 before upload. MP4 uploads can be up to 5 GB.")
  }
  onProgress?.(needsPlaybackCopy ? "Preparing a web-compatible MP4…" : "Preparing video…")
  const playback = await prepareHeroVideoForUpload(file, (progress) => {
    onProgress?.(`Converting MOV for web playback… ${Math.round(progress * 100)}%`)
  })
  const poster = await createPoster(playback)
  if (!poster) {
    throw new Error("This video could not be previewed in your browser. Export it as an H.264 MP4 and try again.")
  }

  const initiate = await fetch("/api/portfolio/videos", {
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      fileType: needsPlaybackCopy ? "video/quicktime" : "video/mp4",
      galleryId,
      playbackFileName: needsPlaybackCopy ? playback.name : undefined,
      playbackSize: needsPlaybackCopy ? playback.size : undefined,
      posterSize: poster.size,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  const slots = await initiate.json().catch(() => null) as InitiateResponse & { error?: string } | null
  if (!initiate.ok || !slots) throw new Error(slots?.error || "The video upload could not be started.")

  const references = [slots.original.reference, slots.playback?.reference, slots.poster?.reference].filter((value): value is string => Boolean(value))
  try {
    onProgress?.("Uploading original video…")
    await putDirect(slots.original, file)
    if (slots.playback) {
      onProgress?.("Uploading playback copy…")
      await putDirect(slots.playback, playback)
    }
    if (slots.poster) {
      onProgress?.("Uploading video poster…")
      await putDirect(slots.poster, poster)
    }

    onProgress?.("Saving video to portfolio…")
    const complete = await fetch("/api/portfolio/videos", {
      body: JSON.stringify({
        fileName: file.name,
        galleryId,
        originalReference: slots.original.reference,
        playbackReference: slots.playback?.reference,
        posterReference: slots.poster?.reference,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    })
    const result = await complete.json().catch(() => null) as ClientPhotoUploadResult & { error?: string } | null
    if (!complete.ok || !result) throw new Error(result?.error || "The uploaded video could not be saved.")
    return result
  } catch (error) {
    void fetch("/api/portfolio/videos", {
      body: JSON.stringify({ galleryId, references }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    })
    throw error
  }
}
