"use client"

import { Calendar, ChevronLeft, ChevronRight, Clock, Copy, Download, Grid2X2, Info, Lock, Mail, MapPin, Maximize2, Share2, Star, StickyNote, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  defaultSiteSettings,
  getPhotoCover,
  getMeteredDisplayUrl,
  getMeteredDownloadUrl,
  getMeteredGalleryCoverUrl,
  getMeteredThumbnailUrl,
  isVisibleRenderableImage,
  LOCAL_GALLERY_STORAGE_KEY,
  mergeSiteSettings,
  photoMatchesCover,
  SITE_SETTINGS_STORAGE_KEY,
  type PortfolioGallery,
  type SiteSettings,
  uniqueGalleryPhotos,
} from "@/lib/gallery-utils"

type PublicGalleryViewProps = {
  gallery: PortfolioGallery
}

export function PublicGalleryView({ gallery }: PublicGalleryViewProps) {
  const [localGallery, setLocalGallery] = useState(gallery)
  const [activePhotoIndex, setActivePhotoIndex] = useState(-1)
  const [passwordInput, setPasswordInput] = useState("")
  const [unlockedGalleryId, setUnlockedGalleryId] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [favoritePhotoIds, setFavoritePhotoIds] = useState<string[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const activeGallery = localGallery
  const visibleCoverPhoto = useMemo(() => {
    const galleryPhotos = activeGallery.photos ?? []
    return (
      galleryPhotos.find((photo) => isVisibleRenderableImage(photo) && photoMatchesCover(photo, activeGallery.cover)) ??
      galleryPhotos.find(isVisibleRenderableImage)
    )
  }, [activeGallery.cover, activeGallery.photos])
  const effectiveCover = getPhotoCover(visibleCoverPhoto) ?? activeGallery.cover
  const photos = useMemo(() => uniqueGalleryPhotos(activeGallery.photos ?? [], effectiveCover), [activeGallery.photos, effectiveCover])
  const activePhoto = activePhotoIndex === -1 ? visibleCoverPhoto : photos[activePhotoIndex]
  const activeFavoriteId = activePhoto?.id ?? `cover:${activeGallery.id}`
  const activeImageSource = getMeteredDisplayUrl(activeGallery.id, activePhoto, siteSettings.preferHdrDisplay) ?? effectiveCover ?? getMeteredGalleryCoverUrl(activeGallery)
  const photoLabelMode = activeGallery.photoLabelMode ?? (activeGallery.showFileNames === false ? "none" : "file-name")
  const activePhotoLabel =
    photoLabelMode === "caption"
      ? activePhoto?.caption?.trim() || ""
      : photoLabelMode === "file-name"
        ? activePhoto?.title || ""
        : ""
  const isCover = activePhotoIndex === -1 || Boolean(activePhoto && photoMatchesCover(activePhoto, activeGallery.cover))
  const itemCount = photos.length + (visibleCoverPhoto ? 1 : 0)
  const allowDownloads = Boolean(siteSettings.allowVisitorDownloads && (activeGallery.allowDownloads ?? true))
  const allowCopy = Boolean(siteSettings.allowVisitorCopy)
  const allowFavorites = activeGallery.allowFavorites ?? true
  const isFavorite = favoritePhotoIds.includes(activeFavoriteId)
  const watermarkEnabled = activeGallery.watermarkEnabled ?? false
  const watermarkMode = activeGallery.watermarkMode ?? "text"
  const watermarkOpacity = (activeGallery.watermarkOpacity ?? 55) / 100
  const watermarkPosition = activeGallery.watermarkPosition ?? "bottom-right"
  const watermarkSize = activeGallery.watermarkSize ?? 140
  const watermarkText = activeGallery.watermarkText?.trim() || activeGallery.client
  const isUnlocked = activeGallery.privacy !== "Password" || unlockedGalleryId === activeGallery.id
  const pageClass = {
    black: "bg-black text-white",
    "soft-black": "bg-[#070707] text-white",
    white: "bg-white text-black",
  }[siteSettings.publicBackground]
  const headerClass = siteSettings.publicBackground === "white" ? "border-black/10" : "border-white/10"
  const mutedClass = siteSettings.publicBackground === "white" ? "text-black/55" : "text-white/60"
  const sectionBorderClass = siteSettings.publicBackground === "white" ? "border-black/10" : "border-white/10"
  const chromeButtonClass =
    siteSettings.publicBackground === "white"
      ? "border-black/15 text-black"
      : "border-white/15 text-white"
  const watermarkPositionClass = {
    "bottom-left": "bottom-5 left-5",
    "bottom-right": "bottom-5 right-5",
    center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-left": "left-5 top-5",
    "top-right": "right-5 top-5",
  }[watermarkPosition]

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved) as PortfolioGallery[]
      const savedGallery = Array.isArray(parsed) ? parsed.find((item) => item.id === gallery.id) : undefined
      if (savedGallery) {
        queueMicrotask(() => setLocalGallery(savedGallery))
      }
    } catch {
      return
    }
  }, [gallery.id])

  useEffect(() => {
    try {
      const savedSettings = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY)
      if (!savedSettings) return

      const parsedSettings = JSON.parse(savedSettings) as Partial<SiteSettings>
      queueMicrotask(() => setSiteSettings(mergeSiteSettings(parsedSettings)))
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => setShareUrl(window.location.href))
  }, [])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`photoviewpro-favorites-${activeGallery.id}`)
      if (!saved) return

      const parsed = JSON.parse(saved) as string[]
      if (Array.isArray(parsed)) queueMicrotask(() => setFavoritePhotoIds(parsed))
    } catch {
      return
    }
  }, [activeGallery.id])

  useEffect(() => {
    try {
      window.localStorage.setItem(`photoviewpro-favorites-${activeGallery.id}`, JSON.stringify(favoritePhotoIds))
    } catch {
      return
    }
  }, [activeGallery.id, favoritePhotoIds])

  const showPreviousPhoto = useCallback(() => {
    setActivePhotoIndex((current) => {
      if (current === -1) return photos.length - 1
      if (current === 0) return -1
      return current - 1
    })
  }, [photos.length])

  const showNextPhoto = useCallback(() => {
    setActivePhotoIndex((current) => {
      if (current === -1) return photos.length > 0 ? 0 : -1
      if (current >= photos.length - 1) return -1
      return current + 1
    })
  }, [photos.length])

  useEffect(() => {
    if (!isUnlocked) return

    function handleGalleryKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable

      if (isTyping) return

      if (event.key === "Escape" && isLightboxOpen) {
        event.preventDefault()
        setIsLightboxOpen(false)
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        showPreviousPhoto()
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        showNextPhoto()
      }
    }

    window.addEventListener("keydown", handleGalleryKeydown)
    return () => window.removeEventListener("keydown", handleGalleryKeydown)
  }, [isLightboxOpen, isUnlocked, showNextPhoto, showPreviousPhoto])

  function unlockGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const expectedPassword = activeGallery.password?.trim()

    if (!expectedPassword || passwordInput.trim() === expectedPassword) {
      setUnlockedGalleryId(activeGallery.id)
      setPasswordError(false)
      return
    }

    setPasswordError(true)
  }

  function handleViewerTouchEnd(endX: number) {
    if (touchStartX === null) return

    const distance = endX - touchStartX
    setTouchStartX(null)

    if (Math.abs(distance) < 45) return
    if (distance > 0) {
      showPreviousPhoto()
    } else {
      showNextPhoto()
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return
    await navigator.clipboard?.writeText(shareUrl)
  }

  function toggleFavorite() {
    setFavoritePhotoIds((current) =>
      current.includes(activeFavoriteId)
        ? current.filter((photoId) => photoId !== activeFavoriteId)
        : [...current, activeFavoriteId],
    )
  }

  if (activeGallery.status === "Draft" || activeGallery.privacy === "Client portal") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md text-center">
          <Lock className="mx-auto size-9 text-[#d8a84f]" />
          <h1 className="mt-4 text-2xl font-semibold">Gallery unavailable</h1>
          <p className="mt-2 text-sm text-white/60">This gallery is not published for public viewing.</p>
        </div>
      </main>
    )
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <form className="w-full max-w-sm rounded-md border border-white/15 bg-white/5 p-5" onSubmit={unlockGallery}>
          <Lock className="size-7 text-[#d8a84f]" />
          <h1 className="mt-4 text-xl font-semibold">{activeGallery.name}</h1>
          <p className="mt-1 text-sm text-white/60">Enter the gallery password.</p>
          <input
            className="mt-4 h-11 w-full rounded-md border border-white/15 bg-black px-3 text-sm text-white outline-none focus:border-[#d8a84f]"
            onChange={(event) => setPasswordInput(event.target.value)}
            type="password"
            value={passwordInput}
          />
          {passwordError && <p className="mt-2 text-xs text-red-300">That password did not match.</p>}
          <button className="mt-4 h-10 w-full rounded-md bg-[#d8a84f] text-sm font-semibold text-[#171814]" type="submit">
            Open gallery
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className={`min-h-screen ${pageClass}`}>
      <header className={`border-b px-5 py-4 md:px-8 ${headerClass}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{activeGallery.name}</h1>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${chromeButtonClass}`}>{activeGallery.privacy}</span>
            </div>
            <p className={`mt-1 text-sm ${mutedClass}`}>{activeGallery.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
              href="/portfolio"
            >
              <Grid2X2 className="size-4" />
              Gallery grid
            </Link>
            {shareUrl && (
              <>
                <a className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`} data-analytics-event="SHARE_CLICK" data-analytics-label="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">
                  <Share2 className="size-4" />
                  Facebook
                </a>
                <a className={`flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`} data-analytics-event="SHARE_CLICK" data-analytics-label="X" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(activeGallery.name)}`} rel="noreferrer" target="_blank">
                  X
                </a>
                <a className={`flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`} data-analytics-event="SHARE_CLICK" data-analytics-label="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">
                  LinkedIn
                </a>
                <a className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`} data-analytics-event="SHARE_CLICK" data-analytics-label="Email" href={`mailto:?subject=${encodeURIComponent(activeGallery.name)}&body=${encodeURIComponent(shareUrl)}`}>
                  <Mail className="size-4" />
                  Email
                </a>
                <a
                  className={`flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(shareUrl)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  QR
                </a>
                {allowCopy && (
                  <button className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`} data-analytics-event="SHARE_CLICK" data-analytics-label="Copy" onClick={copyShareLink} type="button">
                    <Copy className="size-4" />
                    Copy
                  </button>
                )}
              </>
            )}
            <button
              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
              onClick={() => setIsLightboxOpen(true)}
              type="button"
            >
              <Maximize2 className="size-4" />
              Full screen
            </button>
            {allowFavorites && (
              <button
                className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${
                  isFavorite ? "border-[#f4d47e] bg-[#d8a84f] text-[#171814]" : "border-white/15 text-white"
                }`}
                onClick={toggleFavorite}
                type="button"
              >
                <Star className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Selected" : "Favorite"}
              </button>
            )}
            {allowDownloads && (
              <a
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black"
                data-analytics-event="DOWNLOAD_CLICK"
                data-analytics-label={activeGallery.name}
                href={getMeteredDownloadUrl(activeGallery.id, activePhoto) ?? getMeteredGalleryCoverUrl(activeGallery)}
                rel="noreferrer"
                target="_blank"
              >
                <Download className="size-4" />
                Download
              </a>
            )}
          </div>
        </div>
      </header>

      <section
        className={`relative flex min-h-[68vh] touch-pan-y items-center justify-center border-b px-4 py-5 ${sectionBorderClass}`}
        onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
      >
        {itemCount > 1 && (
          <button
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white"
            onClick={showPreviousPhoto}
            type="button"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <button
          aria-label="Open lightbox"
          className="relative h-[62vh] w-full max-w-6xl cursor-zoom-in"
          onClick={() => setIsLightboxOpen(true)}
          type="button"
        >
          <Image
            alt={activePhoto?.title ?? `${activeGallery.name} cover`}
            className="object-contain"
            fill
            priority
            sizes="100vw"
            src={activeImageSource}
            unoptimized
          />
          {isCover && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#f4d47e] bg-[#d8a84f] px-3 py-1 text-xs font-semibold text-[#171814] shadow-lg">
              <Star className="size-3.5 fill-current" />
              Cover
            </div>
          )}
          {watermarkEnabled && (
            <div
              className={`pointer-events-none absolute flex flex-col items-center gap-2 ${watermarkPositionClass}`}
              style={{ opacity: watermarkOpacity }}
            >
              {(watermarkMode === "image" || watermarkMode === "both") && activeGallery.watermarkImageUrl && (
                <Image
                  alt=""
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                  height={watermarkSize}
                  src={activeGallery.watermarkImageUrl}
                  unoptimized
                  width={watermarkSize}
                />
              )}
              {(watermarkMode === "text" || watermarkMode === "both") && (
                <div
                  className="rounded-sm bg-black/35 px-3 py-2 font-semibold tracking-wide text-white"
                  style={{ fontSize: Math.max(12, Math.round(watermarkSize / 10)) }}
                >
                  {watermarkText}
                </div>
              )}
            </div>
          )}
        </button>
        {itemCount > 1 && (
          <button
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white"
            onClick={showNextPhoto}
            type="button"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </section>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[80] flex touch-pan-y items-center justify-center bg-black"
          onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
        >
          <Link
            className="absolute left-4 top-4 z-20 hidden h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-semibold text-white md:flex"
            href="/portfolio"
          >
            <Grid2X2 className="size-4" />
            Gallery grid
          </Link>
          <button
            aria-label="Close lightbox"
            className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white md:right-4 md:top-4 md:size-11 md:bg-black/55"
            onClick={() => setIsLightboxOpen(false)}
            type="button"
          >
            <X className="size-5" />
          </button>
          {itemCount > 1 && (
            <button
              aria-label="Previous lightbox photo"
              className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white md:left-4 md:size-12 md:bg-black/55"
              onClick={showPreviousPhoto}
              type="button"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <div className="relative h-[100svh] w-screen md:h-[100dvh]">
            <Image
              alt={activePhoto?.title ?? `${activeGallery.name} lightbox`}
              className="object-contain"
              fill
              priority
              sizes="100vw"
              src={activeImageSource}
              unoptimized
            />
          </div>
          {itemCount > 1 && (
            <button
              aria-label="Next lightbox photo"
              className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white md:right-4 md:size-12 md:bg-black/55"
              onClick={showNextPhoto}
              type="button"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}

      <section className="px-5 py-4 md:px-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold">{activeGallery.client}</p>
            <p className={`text-sm ${mutedClass}`}>
              {activePhotoIndex === -1 ? `Cover image, ${photos.length.toLocaleString()} photos` : `${activePhotoIndex + 1} of ${photos.length.toLocaleString()} photos`}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            {activePhotoLabel && <p className={`text-sm ${mutedClass}`}>{activePhotoLabel}</p>}
            {activeGallery.infoPaneEnabled && (
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/15 px-3 text-xs font-semibold"
                onClick={() => setIsInfoOpen((current) => !current)}
                type="button"
              >
                <Info className="size-3.5" />
                {isInfoOpen ? "Hide info" : "Show info"}
              </button>
            )}
          </div>
        </div>
        {activeGallery.infoPaneEnabled && isInfoOpen && (
          <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 text-sm md:grid-cols-3">
            {activeGallery.infoLocation && (
              <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{activeGallery.infoLocation}</p>
            )}
            {activeGallery.infoDate && (
              <p className="flex gap-2"><Calendar className="mt-0.5 size-4 shrink-0" />{activeGallery.infoDate}</p>
            )}
            {activeGallery.infoTime && (
              <p className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0" />{activeGallery.infoTime}</p>
            )}
            {activeGallery.infoNotes && (
              <p className={`flex gap-2 leading-6 md:col-span-3 ${mutedClass}`}><StickyNote className="mt-1 size-4 shrink-0" />{activeGallery.infoNotes}</p>
            )}
          </div>
        )}
        {photos.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                aria-label={`Show ${photo.title}`}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-md border ${
                  index === activePhotoIndex ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/45" : "border-white/10"
                }`}
                key={photo.id}
                onClick={() => setActivePhotoIndex(index)}
                type="button"
              >
                <Image alt={photo.title} className="object-contain" fill sizes="112px" src={getMeteredThumbnailUrl(activeGallery.id, photo)} unoptimized />
                {photoMatchesCover(photo, activeGallery.cover) && (
                  <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border border-[#f4d47e] bg-[#d8a84f] text-[#171814] shadow-md">
                    <Star className="size-3.5 fill-current" />
                  </span>
                )}
                {favoritePhotoIds.includes(photo.id) && !photoMatchesCover(photo, activeGallery.cover) && (
                  <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border border-[#f4d47e] bg-black/70 text-[#f4d47e] shadow-md">
                    <Star className="size-3.5 fill-current" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
