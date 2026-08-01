"use client"

import { Star, Upload } from "lucide-react"
import Image from "next/image"

export type WebsiteHeroImageMode = "featured" | "portfolio" | "library" | "upload" | "video"
export type WebsiteHeroImageFit = "contain" | "cover"
export type WebsiteHeroLayout = "overlay" | "split" | "stacked"
export type WebsiteHeroImagePosition = "left" | "center" | "right"

export type WebsiteHeroLibraryItem = {
  gallery: {
    name: string
  }
  key: string
  photo: {
    fileName?: string | null
    title?: string | null
  }
  source: string
}

export type WebsiteHeroControlSettings = {
  heroButtonLabel: string
  heroButtonUrl: string
  heroEyebrow: string
  heroGalleryId: string
  heroImageFit: WebsiteHeroImageFit
  heroImageMode: WebsiteHeroImageMode
  heroImagePosition: WebsiteHeroImagePosition
  heroImageUrl: string
  heroLayout: WebsiteHeroLayout
  heroLibraryPhotoKey: string
  heroOverlayStrength: number
  heroVideoUrl: string
  showCallToAction: boolean
  showHeroEyebrow: boolean
}

type UploadStatus = "idle" | "uploading" | "uploaded" | "error"

type WebsiteHeroControlsProps = {
  fieldClass: string
  filteredLibraryItems: WebsiteHeroLibraryItem[]
  galleries: Array<{ id: string; name: string }>
  heroImageUploadStatus: UploadStatus
  heroVideoConversionProgress: number | null
  heroVideoUploadError: string
  heroVideoUploadStatus: UploadStatus
  isDark: boolean
  isStoryPortfolio: boolean
  libraryItem: WebsiteHeroLibraryItem | undefined
  libraryQuery: string
  mutedTextClass: string
  onLibraryQueryChange: (query: string) => void
  onRemoveHeroVideo: () => void | Promise<void>
  onUpdate: (patch: Partial<WebsiteHeroControlSettings>) => void
  onUploadHeroImage: (file: File) => void | Promise<void>
  onUploadHeroVideo: (file: File) => void | Promise<void>
  settings: WebsiteHeroControlSettings
}

const heroLayoutOptions: Array<{ key: WebsiteHeroLayout; label: string }> = [
  { key: "overlay", label: "Overlay" },
  { key: "split", label: "Split" },
  { key: "stacked", label: "Stacked" },
]

const heroImageFitOptions: Array<{ key: WebsiteHeroImageFit; label: string; note: string }> = [
  { key: "contain", label: "Show full image", note: "No cropping" },
  { key: "cover", label: "Fill frame", note: "May crop edges" },
]

const heroMediaOptions: Array<{ key: WebsiteHeroImageMode; label: string }> = [
  { key: "featured", label: "First featured portfolio cover" },
  { key: "portfolio", label: "Choose a portfolio cover" },
  { key: "library", label: "Pick my Hero Image from my Library" },
  { key: "upload", label: "Upload custom hero image" },
  { key: "video", label: "Upload Hero video" },
]

export function WebsiteHeroControls({
  fieldClass,
  filteredLibraryItems,
  galleries,
  heroImageUploadStatus,
  heroVideoConversionProgress,
  heroVideoUploadError,
  heroVideoUploadStatus,
  isDark,
  isStoryPortfolio,
  libraryItem,
  libraryQuery,
  mutedTextClass,
  onLibraryQueryChange,
  onRemoveHeroVideo,
  onUpdate,
  onUploadHeroImage,
  onUploadHeroVideo,
  settings,
}: WebsiteHeroControlsProps) {
  return (
    <>
      {isStoryPortfolio ? (
        <div className="grid gap-3">
          <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
            <span>
              <span className="block font-semibold">Show story label</span>
              <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Turn off the small label above the Hero heading.</span>
            </span>
            <input
              checked={settings.showHeroEyebrow}
              className="size-4 shrink-0 accent-[#d8a84f]"
              onChange={(event) => onUpdate({ showHeroEyebrow: event.target.checked })}
              type="checkbox"
            />
          </label>
          {settings.showHeroEyebrow ? (
            <label className="grid gap-1 text-xs font-medium">
              Story label
              <input
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => onUpdate({ heroEyebrow: event.target.value })}
                placeholder="Optional label"
                value={settings.heroEyebrow}
              />
              <span className={`text-[11px] font-normal leading-4 ${mutedTextClass}`}>
                This is the small label above the Hero heading. It no longer uses the portfolio name.
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Hero layout</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {heroLayoutOptions.map((option) => (
            <button
              aria-pressed={settings.heroLayout === option.key}
              className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                settings.heroLayout === option.key
                  ? "border-[#b08336] bg-[#d8a84f] text-[#171814]"
                  : isDark
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-[#ded8cc] bg-white"
              }`}
              key={option.key}
              onClick={() => onUpdate({ heroLayout: option.key })}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {isStoryPortfolio ? (
          <div className="mt-3 grid gap-2">
            <span className="text-xs font-medium">Image fit</span>
            <div className="grid grid-cols-2 gap-2">
              {heroImageFitOptions.map((option) => (
                <button
                  aria-pressed={settings.heroImageFit === option.key}
                  className={`rounded-md border px-3 py-2 text-left text-xs ${
                    settings.heroImageFit === option.key
                      ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                      : isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"
                  }`}
                  key={option.key}
                  onClick={() => onUpdate({ heroImageFit: option.key })}
                  type="button"
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-1 block opacity-60">{option.note}</span>
                </button>
              ))}
            </div>
            <span className={`text-[11px] leading-4 ${mutedTextClass}`}>
              Show full image keeps the entire photograph visible and uses the current website background around it.
            </span>
          </div>
        ) : null}

        {!isStoryPortfolio || settings.heroImageFit === "cover" ? (
          <label className="mt-3 grid gap-1 text-xs font-medium">
            Image focal point
            <select
              className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
              onChange={(event) => onUpdate({ heroImagePosition: event.target.value as WebsiteHeroImagePosition })}
              value={settings.heroImagePosition}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        ) : null}

        {settings.heroLayout === "overlay" ? (
          <label className="mt-3 grid gap-2 text-xs font-medium">
            <span className="flex items-center justify-between">
              <span>Overlay strength</span>
              <span>{settings.heroOverlayStrength}%</span>
            </span>
            <input
              aria-label="Hero overlay strength"
              className="accent-[#d8a84f]"
              max="80"
              min="0"
              onChange={(event) => {
                const heroOverlayStrength = Number(event.currentTarget.value)
                onUpdate({ heroOverlayStrength })
              }}
              type="range"
              value={settings.heroOverlayStrength}
            />
          </label>
        ) : null}
      </div>

      <div
        className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}
        data-website-editor-field="media"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Hero media</p>
        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
          Choose the main image or video visitors see at the top of the website.
        </p>
        <div className="mt-3 grid gap-2">
          {heroMediaOptions.map((option) => (
            <button
              aria-pressed={settings.heroImageMode === option.key}
              className={`rounded-md border px-3 py-2 text-left text-xs ${
                settings.heroImageMode === option.key
                  ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                  : isDark
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-[#ded8cc] bg-white"
              }`}
              key={option.key}
              onClick={() => onUpdate({ heroImageMode: option.key })}
              type="button"
            >
              <span className="font-semibold">{option.label}</span>
            </button>
          ))}
        </div>

        {settings.heroImageMode === "portfolio" ? (
          <label className="mt-3 grid gap-1 text-xs font-medium">
            Portfolio cover
            <select
              className={`h-10 w-full min-w-0 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
              onChange={(event) => onUpdate({ heroGalleryId: event.target.value })}
              value={settings.heroGalleryId}
            >
              {galleries.map((gallery) => (
                <option key={gallery.id} value={gallery.id}>
                  {gallery.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {settings.heroImageMode === "library" ? (
          <div className="mt-3 space-y-3">
            {libraryItem ? (
              <div className={`rounded-md border p-2 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-black">
                  <Image
                    alt={libraryItem.photo.title || libraryItem.gallery.name}
                    className="object-cover"
                    fill
                    sizes="260px"
                    src={libraryItem.source}
                  />
                </div>
                <p className="mt-2 truncate text-xs font-semibold">
                  {libraryItem.photo.title || libraryItem.photo.fileName || libraryItem.gallery.name}
                </p>
                <p className={`truncate text-[11px] ${mutedTextClass}`}>{libraryItem.gallery.name}</p>
              </div>
            ) : null}

            <label className="grid gap-1 text-xs font-medium">
              Search Library photos
              <input
                className={`h-10 w-full min-w-0 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => onLibraryQueryChange(event.target.value)}
                placeholder="Search title, caption, tag, or portfolio"
                value={libraryQuery}
              />
            </label>

            <div className="grid max-h-[34rem] grid-cols-2 gap-3 overflow-y-auto pr-1">
              {filteredLibraryItems.map((item) => {
                const isSelected = settings.heroLibraryPhotoKey === item.key
                const itemLabel = item.photo.title || item.photo.fileName || item.gallery.name

                return (
                  <button
                    aria-label={`Use ${itemLabel} as website hero`}
                    aria-pressed={isSelected}
                    className={`group relative aspect-[4/3] overflow-hidden rounded-md border bg-black ${
                      isSelected ? "border-[#d8a84f] ring-2 ring-[#d8a84f]" : isDark ? "border-white/10" : "border-[#ded8cc]"
                    }`}
                    key={item.key}
                    onClick={() => onUpdate({
                      heroImageMode: "library",
                      heroLibraryPhotoKey: item.key,
                    })}
                    type="button"
                  >
                    <Image alt={item.photo.title || item.gallery.name} className="object-cover" fill sizes="150px" src={item.source} />
                    {isSelected ? (
                      <span className="absolute right-1 top-1 rounded-full bg-[#d8a84f] p-1 text-[#171814]">
                        <Star className="size-3 fill-current" />
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1.5 text-left text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      {item.gallery.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {filteredLibraryItems.length === 0 ? (
              <p className={`rounded-md border px-3 py-2 text-xs leading-5 ${isDark ? "border-white/10" : "border-[#ded8cc]"} ${mutedTextClass}`}>
                No visible Library photos match that search.
              </p>
            ) : (
              <p className={`text-[11px] leading-5 ${mutedTextClass}`}>
                Showing {filteredLibraryItems.length} visible Library photos. Search to narrow the list.
              </p>
            )}
          </div>
        ) : null}

        {settings.heroImageMode === "upload" ? (
          <div className="mt-3 space-y-3">
            {settings.heroImageUrl ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-black">
                <Image alt="Current hero image" className="object-cover" fill sizes="260px" src={settings.heroImageUrl} />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                <Upload className="size-4" />
                {heroImageUploadStatus === "uploading" ? "Uploading..." : settings.heroImageUrl ? "Replace image" : "Upload image"}
                <input
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={heroImageUploadStatus === "uploading"}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    event.currentTarget.value = ""
                    if (file) void onUploadHeroImage(file)
                  }}
                  type="file"
                />
              </label>
              {settings.heroImageUrl ? (
                <button
                  className={`h-10 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
                  onClick={() => onUpdate({ heroImageUrl: "" })}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>
            {heroImageUploadStatus === "error" ? (
              <p className="text-xs font-semibold text-[#b42318]">Upload failed. Try a JPG, PNG, WebP, or AVIF image.</p>
            ) : null}
          </div>
        ) : null}

        {settings.heroImageMode === "video" ? (
          <div className="mt-3 space-y-3">
            {settings.heroVideoUrl ? (
              <div className="grid aspect-video w-full place-items-center rounded-md bg-black p-4 text-center text-white">
                <span className="text-xs font-semibold">Hero video uploaded.<br />Playback is paused in the builder; use Preview to watch it.</span>
              </div>
            ) : null}
            <p className={`text-xs leading-5 ${mutedTextClass}`}>
              One MP4 or MOV video, up to 200 MB and 90 seconds. MOV files are converted privately in your browser for reliable playback. The video plays silently on a loop and counts toward your storage.
            </p>
            <div className="flex flex-wrap gap-2">
              <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                <Upload className="size-4" />
                {heroVideoUploadStatus === "uploading"
                  ? heroVideoConversionProgress !== null
                    ? `Preparing MOV ${Math.round(heroVideoConversionProgress * 100)}%`
                    : "Uploading..."
                  : settings.heroVideoUrl ? "Replace video" : "Upload video"}
                <input
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  className="sr-only"
                  disabled={heroVideoUploadStatus === "uploading"}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    event.currentTarget.value = ""
                    if (file) void onUploadHeroVideo(file)
                  }}
                  type="file"
                />
              </label>
              {settings.heroVideoUrl ? (
                <button
                  className={`h-10 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
                  disabled={heroVideoUploadStatus === "uploading"}
                  onClick={() => void onRemoveHeroVideo()}
                  type="button"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {heroVideoUploadStatus === "uploading" ? (
              <div
                aria-live="polite"
                className={`grid gap-2 rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fffaf0]"}`}
                role="status"
              >
                <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                  <span>
                    {heroVideoConversionProgress !== null
                      ? "Preparing your MOV for reliable web playback. Keep this tab open."
                      : "Your video is prepared. Uploading it securely to PhotoView."}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {heroVideoConversionProgress !== null
                      ? `${Math.round(heroVideoConversionProgress * 100)}%`
                      : "Uploading"}
                  </span>
                </div>
                <div
                  aria-label={heroVideoConversionProgress !== null ? "MOV preparation progress" : "Video upload in progress"}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={heroVideoConversionProgress !== null ? Math.round(heroVideoConversionProgress * 100) : undefined}
                  className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-[#e7dfd0]"}`}
                  role="progressbar"
                >
                  <div
                    className={`h-full rounded-full bg-[#d8a84f] transition-[width] duration-200 ${heroVideoConversionProgress === null ? "animate-pulse" : ""}`}
                    style={{ width: heroVideoConversionProgress !== null ? `${Math.max(3, heroVideoConversionProgress * 100)}%` : "100%" }}
                  />
                </div>
              </div>
            ) : null}

            {heroVideoUploadStatus === "error" ? (
              <p className="text-xs font-semibold text-[#b42318]">{heroVideoUploadError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <label className={`flex items-center gap-2 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
        <input
          checked={settings.showCallToAction}
          className="size-4 accent-[#d8a84f]"
          onChange={(event) => onUpdate({ showCallToAction: event.target.checked })}
          type="checkbox"
        />
        Show button on hero
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Button text
        <input
          className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
          onChange={(event) => onUpdate({ heroButtonLabel: event.target.value })}
          value={settings.heroButtonLabel}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Button link
        <input
          className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
          onChange={(event) => onUpdate({ heroButtonUrl: event.target.value })}
          placeholder="#portfolios or https://..."
          value={settings.heroButtonUrl}
        />
      </label>
    </>
  )
}
