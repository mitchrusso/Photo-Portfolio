"use client"

import { Play, Upload } from "lucide-react"
import Image from "next/image"

export type WebsiteAboutControlSettings = {
  aboutButtonLabel: string
  aboutButtonUrl: string
  aboutImageUrl: string
  aboutVideoUrl: string
}

type UploadStatus = "idle" | "uploading" | "uploaded" | "error"

type WebsiteAboutControlsProps = {
  fieldClass: string
  imageUploadError: string
  imageUploadStatus: UploadStatus
  isDark: boolean
  mutedTextClass: string
  onRemoveVideo: () => void | Promise<void>
  onUpdate: (patch: Partial<WebsiteAboutControlSettings>) => void
  onUploadImage: (file: File) => void | Promise<void>
  onUploadVideo: (file: File) => void | Promise<void>
  settings: WebsiteAboutControlSettings
  videoConversionProgress: number | null
  videoUploadError: string
  videoUploadStatus: UploadStatus
}

export function WebsiteAboutControls({
  fieldClass,
  imageUploadError,
  imageUploadStatus,
  isDark,
  mutedTextClass,
  onRemoveVideo,
  onUpdate,
  onUploadImage,
  onUploadVideo,
  settings,
  videoConversionProgress,
  videoUploadError,
  videoUploadStatus,
}: WebsiteAboutControlsProps) {
  return (
    <>
      <div
        className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}
        data-website-editor-field="media"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">About photo or video</p>
        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
          Optional. Add a portrait, studio image, or short introduction video beside the About text. An uploaded video is shown instead of the photo and includes visitor playback controls.
        </p>

        {settings.aboutVideoUrl ? (
          <div className="mt-3 grid aspect-video place-items-center rounded-md bg-black px-4 text-center text-white">
            <div>
              <Play className="mx-auto size-7 fill-current" />
              <p className="mt-2 text-xs font-semibold">About video uploaded</p>
              <p className="mt-1 text-[11px] text-white/70">Playback is paused while editing. Use Preview to watch it.</p>
            </div>
          </div>
        ) : settings.aboutImageUrl ? (
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-md bg-black">
            <Image alt="Current About page photo" className="object-cover" fill sizes="260px" src={settings.aboutImageUrl} />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
            <Play className="size-4" />
            {videoUploadStatus === "uploading" ? "Preparing video..." : settings.aboutVideoUrl ? "Replace video" : "Upload video"}
            <input
              accept="video/mp4,video/quicktime,.mp4,.mov"
              className="sr-only"
              disabled={videoUploadStatus === "uploading"}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) void onUploadVideo(file)
              }}
              type="file"
            />
          </label>

          <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
            <Upload className="size-4" />
            {imageUploadStatus === "uploading" ? "Uploading..." : settings.aboutImageUrl ? "Replace photo" : "Upload photo"}
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={imageUploadStatus === "uploading"}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) void onUploadImage(file)
              }}
              type="file"
            />
          </label>

          {settings.aboutVideoUrl ? (
            <button
              className={`h-10 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
              disabled={videoUploadStatus === "uploading"}
              onClick={() => void onRemoveVideo()}
              type="button"
            >
              Remove video
            </button>
          ) : null}

          {settings.aboutImageUrl ? (
            <button
              className={`h-10 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
              onClick={() => onUpdate({ aboutImageUrl: "" })}
              type="button"
            >
              Remove photo
            </button>
          ) : null}
        </div>

        {videoUploadStatus === "uploading" ? (
          <div aria-live="polite" className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span>{videoConversionProgress !== null ? "Preparing MOV for the web" : "Uploading About video"}</span>
              <span>{videoConversionProgress !== null ? `${Math.round(videoConversionProgress * 100)}%` : "Uploading"}</span>
            </div>
            <div
              aria-label={videoConversionProgress !== null ? "About MOV preparation progress" : "About video upload in progress"}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={videoConversionProgress !== null ? Math.round(videoConversionProgress * 100) : undefined}
              className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-[#e7dfd0]"}`}
              role="progressbar"
            >
              <div
                className={`h-full rounded-full bg-[#d8a84f] transition-[width] duration-200 ${videoConversionProgress === null ? "animate-pulse" : ""}`}
                style={{ width: videoConversionProgress !== null ? `${Math.max(3, videoConversionProgress * 100)}%` : "100%" }}
              />
            </div>
          </div>
        ) : null}

        {videoUploadStatus === "error" ? (
          <p className="mt-2 text-xs font-semibold text-[#b42318]">{videoUploadError}</p>
        ) : null}
        {imageUploadStatus === "error" ? (
          <p className="mt-2 text-xs font-semibold text-[#b42318]">{imageUploadError}</p>
        ) : null}
      </div>

      <label className="grid gap-1 text-xs font-medium">
        About button text
        <input
          className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
          onChange={(event) => onUpdate({ aboutButtonLabel: event.target.value })}
          value={settings.aboutButtonLabel}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        About button link
        <input
          className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
          onChange={(event) => onUpdate({ aboutButtonUrl: event.target.value })}
          placeholder="#contact or https://..."
          value={settings.aboutButtonUrl}
        />
      </label>
    </>
  )
}
