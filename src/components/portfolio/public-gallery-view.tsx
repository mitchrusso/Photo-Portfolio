"use client"

import { Calendar, Check, ChevronLeft, ChevronRight, Clock, Copy, Download, Grid2X2, Info, Lock, Mail, MapPin, Maximize2, Play, Printer, QrCode, Share2, Star, StickyNote, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FormEvent, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SafeImage } from "@/components/portfolio/safe-image"
import { formatGalleryPosition } from "@/lib/portfolio-counts"
import {
  defaultSiteSettings,
  galleryAccessPath,
  getPhotoCover,
  getMeteredDisplayUrl,
  getMeteredDownloadUrl,
  getMeteredGalleryCoverUrl,
  getMeteredThumbnailUrl,
  getPreferredDisplayUrl,
  getThumbnailUrl,
  isVisibleRenderableImage,
  isVideoAsset,
  mergeSiteSettings,
  photoMatchesCover,
  SITE_SETTINGS_STORAGE_KEY,
  type PortfolioGallery,
  type SiteSettings,
  uniqueGalleryPhotos,
} from "@/lib/gallery-utils"

type PublicGalleryViewProps = {
  accessPath?: string
  demoMode?: boolean
  gallery: PortfolioGallery
  galleryGridHref?: string
  initiallyUnlocked?: boolean
}

export function PublicGalleryView({
  accessPath,
  demoMode = false,
  gallery,
  galleryGridHref = "/portfolio",
  initiallyUnlocked = false,
}: PublicGalleryViewProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(-1)
  const [passwordInput, setPasswordInput] = useState("")
  const [unlockedGalleryId, setUnlockedGalleryId] = useState<string | null>(initiallyUnlocked ? gallery.id : null)
  const [passwordError, setPasswordError] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareDialogMode, setShareDialogMode] = useState<"share" | "qr">("share")
  const [shareCopyStatus, setShareCopyStatus] = useState<"idle" | "copied">("idle")
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [favoritePhotoIds, setFavoritePhotoIds] = useState<string[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const lightboxDialogRef = useRef<HTMLDivElement>(null)
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null)
  const lightboxCloseRef = useRef<HTMLButtonElement>(null)
  const shareDialogRef = useRef<HTMLElement>(null)
  const shareDialogTriggerRef = useRef<HTMLButtonElement | null>(null)
  const shareDialogCloseRef = useRef<HTMLButtonElement>(null)
  const activeGallery = gallery
  const visibleCoverPhoto = useMemo(() => {
    const galleryPhotos = activeGallery.photos ?? []
    return (
      galleryPhotos.find((photo) => isVisibleRenderableImage(photo) && photo.id === activeGallery.coverPhotoId) ??
      galleryPhotos.find((photo) => isVisibleRenderableImage(photo) && photoMatchesCover(photo, activeGallery.cover)) ??
      galleryPhotos.find(isVisibleRenderableImage)
    )
  }, [activeGallery.cover, activeGallery.coverPhotoId, activeGallery.photos])
  const effectiveCover = getPhotoCover(visibleCoverPhoto) ?? activeGallery.cover
  const photos = useMemo(
    () => uniqueGalleryPhotos(activeGallery.photos ?? [], effectiveCover, activeGallery.coverPhotoId),
    [activeGallery.coverPhotoId, activeGallery.photos, effectiveCover],
  )
  const activePhoto = activePhotoIndex === -1 ? visibleCoverPhoto : photos[activePhotoIndex]
  const activeIsVideo = Boolean(activePhoto && isVideoAsset(activePhoto) && activePhotoIndex !== -1)
  const activeFavoriteId = activePhoto?.id ?? `cover:${activeGallery.id}`
  const activeImageSource = demoMode
    ? getPreferredDisplayUrl(activePhoto, siteSettings.preferHdrDisplay) ?? effectiveCover
    : getMeteredDisplayUrl(activeGallery.id, activePhoto, siteSettings.preferHdrDisplay) ?? effectiveCover ?? getMeteredGalleryCoverUrl(activeGallery)
  const photoLabelMode = activeGallery.photoLabelMode ?? (activeGallery.showFileNames === false ? "none" : "file-name")
  const activePhotoLabel =
    photoLabelMode === "caption"
      ? activePhoto?.caption?.trim() || ""
      : photoLabelMode === "file-name"
        ? activePhoto?.title || ""
        : ""
  const isCover = activePhotoIndex === -1 || Boolean(activePhoto && photoMatchesCover(activePhoto, activeGallery.cover))
  const itemCount = photos.length + (effectiveCover ? 1 : 0)
  const socialPreviewImage = activeGallery.socialImageUrl?.trim() || effectiveCover
  const qrCodeUrl = shareUrl
    ? `/api/qr-code?target=${encodeURIComponent(shareUrl)}`
    : ""
  const allowDownloads = Boolean(siteSettings.allowVisitorDownloads && (activeGallery.allowDownloads ?? true))
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
    if (activeGallery.privacy !== "Password" || initiallyUnlocked) return
    let active = true
    fetch(accessPath ?? galleryAccessPath(activeGallery.id, activeGallery.workspaceSlug), { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((body) => {
        if (active && body?.unlocked) {
          setUnlockedGalleryId(activeGallery.id)
          if (accessPath) window.location.reload()
        }
      })
      .catch(() => null)
    return () => { active = false }
  }, [accessPath, activeGallery.id, activeGallery.privacy, activeGallery.workspaceSlug, initiallyUnlocked])

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

  const openLightbox = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    lightboxTriggerRef.current = event.currentTarget
    setIsLightboxOpen(true)
  }, [])

  useEffect(() => {
    if (!isLightboxOpen) return

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    lightboxCloseRef.current?.focus()

    return () => {
      document.body.style.overflow = previousBodyOverflow
      lightboxTriggerRef.current?.focus()
    }
  }, [isLightboxOpen])

  useEffect(() => {
    if (!isShareDialogOpen) return

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    shareDialogCloseRef.current?.focus()

    function handleShareDialogKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setIsShareDialogOpen(false)
        return
      }

      if (event.key !== "Tab") return
      const focusableElements = Array.from(
        shareDialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener("keydown", handleShareDialogKeydown)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener("keydown", handleShareDialogKeydown)
      shareDialogTriggerRef.current?.focus()
    }
  }, [isShareDialogOpen])

  useEffect(() => {
    if (!isUnlocked) return

    function handleGalleryKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable

      if (isTyping || isShareDialogOpen) return

      if (event.key === "Escape" && isLightboxOpen) {
        event.preventDefault()
        setIsLightboxOpen(false)
        return
      }

      if (event.key === "Tab" && isLightboxOpen) {
        const focusableElements = Array.from(
          lightboxDialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter((element) => element.getClientRects().length > 0)
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
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
  }, [isLightboxOpen, isShareDialogOpen, isUnlocked, showNextPhoto, showPreviousPhoto])

  async function unlockGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(false)
    const response = await fetch(accessPath ?? galleryAccessPath(activeGallery.id, activeGallery.workspaceSlug), {
      body: JSON.stringify({ password: passwordInput }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    if (response.ok) {
      setUnlockedGalleryId(activeGallery.id)
      if (accessPath) window.location.reload()
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
    setShareCopyStatus("copied")
    window.setTimeout(() => setShareCopyStatus("idle"), 1800)
  }

  function openShareDialog(event: MouseEvent<HTMLButtonElement>, mode: "share" | "qr") {
    shareDialogTriggerRef.current = event.currentTarget
    setShareDialogMode(mode)
    setShareCopyStatus("idle")
    setIsShareDialogOpen(true)
  }

  function printQrCode() {
    if (!qrCodeUrl) return
    const printWindow = window.open("", "_blank", "width=560,height=680")
    if (!printWindow) return

    printWindow.document.write(`<!doctype html><html><head><title>PhotoView.io gallery QR code</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:32px;color:#1f211e}img{width:420px;max-width:100%;height:auto}p{font-size:16px}</style></head><body><h1>Open this PhotoView.io gallery</h1><img alt="Gallery QR code" src="${qrCodeUrl}" onload="window.print()"><p>Scan with a phone camera to open the gallery.</p></body></html>`)
    printWindow.document.close()
  }

  async function downloadQrCode() {
    if (!qrCodeUrl) return
    const response = await fetch(qrCodeUrl)
    if (!response.ok) return

    const objectUrl = URL.createObjectURL(await response.blob())
    const downloadLink = document.createElement("a")
    downloadLink.download = `${activeGallery.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`
    downloadLink.href = objectUrl
    downloadLink.click()
    URL.revokeObjectURL(objectUrl)
  }

  function toggleFavorite() {
    setFavoritePhotoIds((current) =>
      current.includes(activeFavoriteId)
        ? current.filter((photoId) => photoId !== activeFavoriteId)
        : [...current, activeFavoriteId],
    )
  }

  if (activeGallery.privacy === "Client portal") {
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
            aria-label="Gallery password"
            className="mt-4 h-11 w-full rounded-md border border-white/15 bg-black px-3 text-sm text-white outline-none focus:border-[#d8a84f]"
            onChange={(event) => setPasswordInput(event.target.value)}
            type="password"
            value={passwordInput}
          />
          {passwordError && <p className="mt-2 text-xs text-red-300" role="alert">That password did not match.</p>}
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
          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex flex-wrap gap-2">
            <Link
              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
              href={galleryGridHref}
            >
              <Grid2X2 className="size-4" />
              Gallery grid
            </Link>
            {shareUrl && (
              <>
                <button
                  className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
                  onClick={(event) => openShareDialog(event, "share")}
                  type="button"
                >
                  <Share2 className="size-4" />
                  Share gallery
                </button>
                <button
                  className={`flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
                  onClick={(event) => openShareDialog(event, "qr")}
                  type="button"
                >
                  <QrCode className="size-4" />
                  QR code
                </button>
              </>
            )}
            <button
              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${chromeButtonClass}`}
              onClick={openLightbox}
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
                href={demoMode
                  ? activePhoto?.downloadUrl ?? activeImageSource
                  : getMeteredDownloadUrl(activeGallery.id, activePhoto) ?? getMeteredGalleryCoverUrl(activeGallery)}
                rel="noreferrer"
                target="_blank"
              >
                <Download className="size-4" />
                Download
              </a>
            )}
            </div>
            {shareUrl && (
              <p className={`max-w-xl text-xs leading-5 ${mutedClass}`}>
                Sharing shows one cover preview and links viewers to all {itemCount.toLocaleString()} {itemCount === 1 ? "image" : "images"} in this gallery.
              </p>
            )}
          </div>
        </div>
      </header>

      {isShareDialogOpen && shareUrl && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/75 p-4 md:items-center" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsShareDialogOpen(false)
        }}>
          <section
            aria-labelledby="gallery-share-title"
            aria-modal="true"
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/15 bg-[#10110f] text-white shadow-2xl"
            ref={shareDialogRef}
            role="dialog"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8a84f]">{shareDialogMode === "qr" ? "Gallery QR code" : "Share gallery"}</p>
                <h2 className="mt-1 text-xl font-semibold" id="gallery-share-title">{activeGallery.name}</h2>
                <p className="mt-1 text-sm leading-5 text-white/60">These controls share this gallery link, not an individual photo file.</p>
              </div>
              <button
                aria-label="Close sharing dialog"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white"
                onClick={() => setIsShareDialogOpen(false)}
                ref={shareDialogCloseRef}
                type="button"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-5">
                {shareDialogMode === "share" && (
                <section>
                  <h3 className="text-sm font-semibold">What social media receives</h3>
                  <div className="mt-3 overflow-hidden rounded-md border border-white/15 bg-black">
                    {socialPreviewImage && (
                      <div className="relative aspect-[1.91/1] w-full bg-black">
                        <Image alt={`${activeGallery.name} social preview`} className="object-cover" fill sizes="(max-width: 768px) 100vw, 720px" src={socialPreviewImage} unoptimized />
                      </div>
                    )}
                    <div className="border-t border-white/10 bg-[#1b1c19] p-4">
                      <p className="text-xs uppercase tracking-wide text-white/50">PhotoView.io</p>
                      <p className="mt-1 font-semibold">{activeGallery.seoTitle || `${activeGallery.name} | PhotoView.io`}</p>
                      <p className="mt-1 truncate text-xs text-white/50">{shareUrl}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md border border-[#d8a84f]/35 bg-[#d8a84f]/10 px-3 py-2 text-sm">
                      <span className="font-semibold">In the post:</span> one cover preview
                    </div>
                    <div className="rounded-md border border-[#d8a84f]/35 bg-[#d8a84f]/10 px-3 py-2 text-sm">
                      <span className="font-semibold">After clicking:</span> all {itemCount.toLocaleString()} {itemCount === 1 ? "image" : "images"}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">Facebook, LinkedIn, and X build a link preview from this information. They do not receive the gallery as a multi-image album.</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <a className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#d8a84f] px-3 text-sm font-semibold text-[#171814]" data-analytics-event="SHARE_CLICK" data-analytics-label="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">
                      <Share2 className="size-4" /> Facebook
                    </a>
                    <a className="flex h-11 items-center justify-center rounded-md border border-white/15 px-3 text-sm font-semibold" data-analytics-event="SHARE_CLICK" data-analytics-label="X" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(activeGallery.name)}`} rel="noreferrer" target="_blank">X</a>
                    <a className="flex h-11 items-center justify-center rounded-md border border-white/15 px-3 text-sm font-semibold" data-analytics-event="SHARE_CLICK" data-analytics-label="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} rel="noreferrer" target="_blank">LinkedIn</a>
                    <a className="flex h-11 items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold" data-analytics-event="SHARE_CLICK" data-analytics-label="Email" href={`mailto:?subject=${encodeURIComponent(activeGallery.name)}&body=${encodeURIComponent(`View the complete ${activeGallery.name} gallery (${itemCount} ${itemCount === 1 ? "image" : "images"}):\n\n${shareUrl}`)}`}>
                      <Mail className="size-4" /> Email
                    </a>
                  </div>
                </section>
                )}

                <section className="rounded-md border border-white/15 bg-white/[0.04] p-4">
                  <div className="grid gap-5 sm:grid-cols-[220px_1fr] sm:items-center">
                    <div className="rounded-md bg-white p-3">
                      <Image alt={`QR code for the ${activeGallery.name} gallery`} className="h-auto w-full" height={640} src={qrCodeUrl} unoptimized width={640} />
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8a84f]"><QrCode className="size-4" /> Gallery QR code</p>
                      <h3 className="mt-2 text-lg font-semibold">Scan to open this complete gallery</h3>
                      <p className="mt-2 text-sm leading-6 text-white/65">Display or print this code on another screen, sign, handout, or business card. A visitor points their phone camera at it and taps the link to open all {itemCount.toLocaleString()} {itemCount === 1 ? "image" : "images"}. On this same phone, use Copy link instead.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold" onClick={() => void downloadQrCode()} type="button">
                          <Download className="size-4" /> Download PNG
                        </button>
                        <button className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold" onClick={printQrCode} type="button">
                          <Printer className="size-4" /> Print
                        </button>
                        <button className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold" onClick={() => void copyShareLink()} type="button">
                          {shareCopyStatus === "copied" ? <Check className="size-4 text-[#d8a84f]" /> : <Copy className="size-4" />}
                          {shareCopyStatus === "copied" ? "Link copied" : "Copy link"}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      )}

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
        <div className="relative h-[62vh] w-full max-w-6xl">
          {activeIsVideo ? (
            <video
              aria-label={activePhoto?.title ?? `${activeGallery.name} video`}
              className="size-full bg-black object-contain"
              controls
              playsInline
              poster={activePhoto?.thumbnailUrl ? (demoMode ? getThumbnailUrl(activePhoto) : getMeteredThumbnailUrl(activeGallery.id, activePhoto)) : undefined}
              preload="metadata"
              src={activeImageSource}
            />
          ) : (
            <button aria-label="Open lightbox" className="relative size-full cursor-zoom-in" onClick={openLightbox} type="button">
              <Image
                alt={activePhoto?.title ?? `${activeGallery.name} cover`}
                className="object-contain"
                fill
                priority
                sizes="100vw"
                src={activeImageSource}
                unoptimized
              />
            </button>
          )}
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
                <SafeImage
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
        </div>
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
          aria-label={`${activeGallery.name} photo viewer`}
          aria-modal="true"
          className="fixed inset-0 z-[80] flex touch-pan-y items-center justify-center bg-black"
          onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
          ref={lightboxDialogRef}
          role="dialog"
        >
          <Link
            className="absolute left-4 top-4 z-20 hidden h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-semibold text-white md:flex"
            href={galleryGridHref}
          >
            <Grid2X2 className="size-4" />
            Gallery grid
          </Link>
          <button
            aria-label="Close lightbox"
            className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white md:right-4 md:top-4 md:bg-black/55"
            onClick={() => setIsLightboxOpen(false)}
            ref={lightboxCloseRef}
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
            {activeIsVideo ? (
              <video aria-label={activePhoto?.title ?? `${activeGallery.name} video`} className="size-full object-contain" controls playsInline poster={activePhoto?.thumbnailUrl ? getMeteredThumbnailUrl(activeGallery.id, activePhoto) : undefined} preload="metadata" src={activeImageSource} />
            ) : (
              <Image alt={activePhoto?.title ?? `${activeGallery.name} lightbox`} className="object-contain" fill priority sizes="100vw" src={activeImageSource} unoptimized />
            )}
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
              {formatGalleryPosition(activePhotoIndex, itemCount)}
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
                {isVideoAsset(photo) && !photo.thumbnailUrl ? (
                  <span className="absolute inset-0 grid place-items-center bg-[#151915] text-white"><Play className="size-7 fill-current" /></span>
                ) : (
                  <Image alt={photo.title} className="object-contain" fill sizes="112px" src={demoMode ? getThumbnailUrl(photo) : getMeteredThumbnailUrl(activeGallery.id, photo)} unoptimized />
                )}
                {isVideoAsset(photo) && <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white"><Play className="size-3 fill-current" />Video</span>}
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
