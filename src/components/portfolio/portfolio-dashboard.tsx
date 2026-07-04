"use client"

import {
  BarChart3,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  Folder,
  Globe2,
  Heart,
  ImagePlus,
  Lock,
  Moon,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  Sun,
  X,
} from "lucide-react"
import Image from "next/image"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { BlobUpload } from "@/components/uploads/blob-upload"
import { migratedGalleries, type MigratedPhoto } from "@/data/migrated-galleries"

type Gallery = {
  id: string
  name: string
  client: string
  status: "Draft" | "Proofing" | "For sale" | "Delivered"
  privacy: "Private link" | "Password" | "Client portal" | "Public"
  images: number
  favorites: number
  revenue: string
  cover: string
  description: string
  url?: string
  photos?: MigratedPhoto[]
}

const seedGalleries: Gallery[] = migratedGalleries

const coverOptions = seedGalleries.map((gallery) => gallery.cover)

const GALLERY_STORAGE_KEY = "photo-portfolio-galleries-v5"

type ImportResult = {
  source: string
  found: number
  added: number
  skipped: number
}

type ActivePanel = "photos" | "settings"

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeGalleryUrl(url?: string) {
  if (!url) return ""

  try {
    const parsedUrl = new URL(url)
    parsedUrl.hash = ""
    parsedUrl.search = ""
    return parsedUrl.toString().replace(/\/$/, "")
  } catch {
    return url.replace(/\/$/, "")
  }
}

function isRenderableImage(photo: MigratedPhoto) {
  return /\.(jpe?g|png|webp|gif)$/i.test(photo.fileName)
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 2)} ${units[index]}`
}

function PrivacyBadge({ privacy }: { privacy: Gallery["privacy"] }) {
  const Icon = privacy === "Public" ? Globe2 : Lock

  return (
    <span className="flex items-center gap-1 text-[11px] text-[#6f685d]">
      <Icon className="size-3.5" />
      {privacy}
    </span>
  )
}

function dedupeImportedGalleries(incoming: Gallery[], current: Gallery[]) {
  const existingUrls = new Set(current.map((gallery) => normalizeGalleryUrl(gallery.url)).filter(Boolean))
  const existingIds = new Set(current.map((gallery) => gallery.id))
  const added: Gallery[] = []
  let skipped = 0

  for (const gallery of incoming) {
    const galleryUrl = normalizeGalleryUrl(gallery.url)

    if (galleryUrl && existingUrls.has(galleryUrl)) {
      skipped += 1
      continue
    }

    let id = gallery.id
    if (existingIds.has(id)) {
      id = `${id}-${Date.now()}-${added.length + 1}`
    }

    existingIds.add(id)
    if (galleryUrl) existingUrls.add(galleryUrl)
    added.push({ ...gallery, id })
  }

  return { galleries: [...added, ...current], added, skipped }
}

export function PortfolioDashboard() {
  const [galleries, setGalleries] = useState(seedGalleries)
  const [activeGalleryId, setActiveGalleryId] = useState(seedGalleries[0].id)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [activePanel, setActivePanel] = useState<ActivePanel>("photos")
  const [areGalleriesOpen, setAreGalleriesOpen] = useState(true)
  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false)
  const [showNewGallery, setShowNewGallery] = useState(false)
  const [hasLoadedSavedGalleries, setHasLoadedSavedGalleries] = useState(false)
  const [pendingCovers, setPendingCovers] = useState<Record<string, string>>({})
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const [importUrl, setImportUrl] = useState("https://lenstraveler18.smugmug.com/Travel")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const activeGallery = galleries.find((gallery) => gallery.id === activeGalleryId) ?? galleries[0]
  const pendingCover = pendingCovers[activeGallery.id] ?? activeGallery.cover
  const activePhotos = activeGallery.photos ?? []
  const renderablePhotos = activePhotos.filter(isRenderableImage)
  const activePhoto = renderablePhotos[activePhotoIndex]
  const activeImageSource = activePhoto?.blobUrl ?? activeGallery.cover
  const isDark = theme === "dark"
  const pageClass = isDark ? "bg-black text-white" : "bg-white text-[#1e211d]"
  const headerClass = isDark
    ? "border-white/10 bg-black/90"
    : "border-[#ded8cc] bg-white/90"
  const surfaceClass = isDark
    ? "border-white/10 bg-black text-white"
    : "border-[#ded8cc] bg-white text-[#1e211d]"
  const softSurfaceClass = isDark ? "bg-black" : "bg-white"
  const mutedTextClass = isDark ? "text-white/60" : "text-[#777064]"
  const fieldClass = isDark
    ? "border-white/15 bg-black text-white placeholder:text-white/35 focus:border-[#d8a84f]"
    : "border-[#d7d0c4] bg-white text-[#1e211d] placeholder:text-[#9a9287] focus:border-[#b08336]"
  const storageBytes = galleries.reduce(
    (gallerySum, gallery) =>
      gallerySum + (gallery.photos ?? []).reduce((photoSum, photo) => photoSum + (photo.bytes ?? 0), 0),
    0,
  )
  const storagePhotoCount = galleries.reduce((sum, gallery) => sum + (gallery.photos?.length ?? 0), 0)
  const storageReferenceBytes = 5 * 1024 ** 3
  const storagePercent = Math.min(Math.round((storageBytes / storageReferenceBytes) * 100), 100)

  const showPreviousPhoto = useCallback(() => {
    if (renderablePhotos.length === 0) return
    setActivePhotoIndex((current) => (current === 0 ? renderablePhotos.length - 1 : current - 1))
  }, [renderablePhotos.length])

  const showNextPhoto = useCallback(() => {
    if (renderablePhotos.length === 0) return
    setActivePhotoIndex((current) => (current + 1) % renderablePhotos.length)
  }, [renderablePhotos.length])

  useEffect(() => {
    queueMicrotask(() => {
      const saved = window.localStorage.getItem(GALLERY_STORAGE_KEY)

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Gallery[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGalleries(parsed)
            setActiveGalleryId(parsed[0].id)
          }
        } catch {
          window.localStorage.removeItem(GALLERY_STORAGE_KEY)
        }
      }

      setHasLoadedSavedGalleries(true)
    })
  }, [])

  useEffect(() => {
    if (hasLoadedSavedGalleries) {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleries))
    }
  }, [galleries, hasLoadedSavedGalleries])

  useEffect(() => {
    setActivePhotoIndex(0)
  }, [activeGallery.id])

  useEffect(() => {
    if (activePhotoIndex >= renderablePhotos.length) {
      setActivePhotoIndex(Math.max(renderablePhotos.length - 1, 0))
    }
  }, [activePhotoIndex, renderablePhotos.length])

  useEffect(() => {
    if (!isShowcaseOpen) return

    function handleShowcaseKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsShowcaseOpen(false)
      }

      if (event.key === "ArrowLeft") {
        showPreviousPhoto()
      }

      if (event.key === "ArrowRight") {
        showNextPhoto()
      }
    }

    window.addEventListener("keydown", handleShowcaseKeydown)
    return () => window.removeEventListener("keydown", handleShowcaseKeydown)
  }, [isShowcaseOpen, showNextPhoto, showPreviousPhoto])

  const metrics = useMemo(() => {
    const images = galleries.reduce((sum, gallery) => sum + gallery.images, 0)
    const favorites = galleries.reduce((sum, gallery) => sum + gallery.favorites, 0)
    const publicShares = galleries.filter((gallery) => gallery.privacy !== "Client portal").length
    return [
      ["Active galleries", String(galleries.length), Folder],
      ["Total images", images.toLocaleString(), Camera],
      ["Client favorites", favorites.toLocaleString(), Heart],
      ["Public shares", String(publicShares), Share2],
    ] as const
  }, [galleries])

  function addGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const client = String(formData.get("client") ?? "").trim()
    const status = String(formData.get("status") ?? "Draft") as Gallery["status"]

    if (!name) return

    const idBase = slugify(name) || `gallery-${Date.now()}`
    const id = galleries.some((gallery) => gallery.id === idBase) ? `${idBase}-${Date.now()}` : idBase
    const gallery: Gallery = {
      id,
      name,
      client: client || "Personal",
      status,
      privacy: "Private link",
      images: 0,
      favorites: 0,
      revenue: "$0",
      cover: activeGallery.cover,
      description: "New portfolio gallery ready for uploads, proofing, and sharing.",
    }

    setGalleries((current) => [gallery, ...current])
    setActiveGalleryId(id)
    setShowNewGallery(false)
    event.currentTarget.reset()
  }

  function updateActiveGallery(updates: Partial<Gallery>) {
    setGalleries((current) =>
      current.map((gallery) =>
        gallery.id === activeGallery.id ? { ...gallery, ...updates } : gallery,
      ),
    )
  }

  function openGallery(galleryId: string) {
    setActiveGalleryId(galleryId)
    setActivePhotoIndex(0)
    setActivePanel("photos")
    window.requestAnimationFrame(() => {
      document.getElementById("portfolio-view")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  async function syncSmugMug(sourceUrl?: string, signal?: AbortSignal, shouldShowResult = false) {
    setSyncStatus("syncing")
    if (shouldShowResult) {
      setImportResult(null)
    }

    try {
      const cleanSourceUrl = sourceUrl?.trim()
      const params = cleanSourceUrl ? `?url=${encodeURIComponent(cleanSourceUrl)}` : ""
      const response = await fetch(`/api/galleries/smugmug${params}`, {
        cache: "no-store",
        signal,
      })

      if (!response.ok) {
        throw new Error("SmugMug sync failed")
      }

      const payload = (await response.json()) as {
        galleries?: Gallery[]
        source?: string
        syncedAt?: string
      }

      if (!Array.isArray(payload.galleries) || payload.galleries.length === 0) {
        throw new Error("No public SmugMug galleries found")
      }

      const incoming = payload.galleries
      const merged = dedupeImportedGalleries(incoming, galleries)

      setGalleries(merged.galleries)
      setActiveGalleryId(merged.added[0]?.id ?? incoming[0].id)
      if (shouldShowResult) {
        setImportResult({
          source: payload.source ?? cleanSourceUrl ?? "SmugMug",
          found: incoming.length,
          added: merged.added.length,
          skipped: merged.skipped,
        })
      }
      setLastSyncedAt(payload.syncedAt ?? new Date().toISOString())
      setSyncStatus("synced")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      setSyncStatus("error")
    }
  }

  return (
    <main className={`min-h-screen ${pageClass}`}>
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#ded8cc] bg-[#151714] px-5 py-5 text-white lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-[#161713]">
                <Camera className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Photo-Portfolio</p>
                <p className="text-xs text-white/55">Personal studio OS</p>
              </div>
            </div>
            <button className="rounded-md border border-white/15 p-2 text-white/80 lg:hidden">
              <Search className="size-4" />
            </button>
          </div>

          <nav className="mt-7 space-y-2">
            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm ${
                activePanel === "photos"
                  ? "bg-white text-[#171814]"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setActivePanel("photos")}
              type="button"
            >
              <BarChart3 className="size-4" />
              <span>Dashboard</span>
            </button>

            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm ${
                activePanel === "photos"
                  ? "bg-white/12 text-white"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => {
                setActivePanel("photos")
                setAreGalleriesOpen((current) => !current)
              }}
              type="button"
            >
              <Folder className="size-4" />
              <span className="flex-1 text-left">Galleries</span>
              <ChevronRight className={`size-4 transition ${areGalleriesOpen ? "rotate-90" : ""}`} />
            </button>

            {areGalleriesOpen && (
              <div className="max-h-[42vh] space-y-1 overflow-y-auto rounded-md border border-white/10 bg-black/10 p-1">
                {galleries.map((gallery) => (
                  <button
                    className={`flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-xs ${
                      gallery.id === activeGallery.id
                        ? "bg-[#d8a84f] text-[#151714]"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                    key={gallery.id}
                    onClick={() => openGallery(gallery.id)}
                    type="button"
                  >
                    <span className="min-w-0 truncate">{gallery.name}</span>
                    <span className="shrink-0 text-[11px] opacity-70">{gallery.images}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm ${
                activePanel === "settings"
                  ? "bg-white text-[#171814]"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setActivePanel("settings")}
              type="button"
            >
              <Settings2 className="size-4" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-7 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-medium uppercase text-white/45">Storage</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-2xl font-semibold">{formatBytes(storageBytes)}</span>
              <Cloud className="size-5 text-[#d8a84f]" />
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#d8a84f]"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-white/55">
              {storagePhotoCount.toLocaleString()} originals in Vercel Blob
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className={`flex flex-col gap-4 border-b px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-7 ${headerClass}`}>
            <div>
              <p className={`text-sm ${mutedTextClass}`}>
                {syncStatus === "syncing"
                  ? "Syncing SmugMug..."
                  : lastSyncedAt
                    ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : activePanel === "settings"
                      ? "Settings"
                      : `${activeGallery.images.toLocaleString()} photos`}
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                {activePanel === "settings" ? "Portfolio settings" : activeGallery.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                  isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"
                }`}
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                type="button"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {isDark ? "Light" : "Dark"}
              </button>
              <button
                className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                  isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"
                }`}
                onClick={() => setShowNewGallery(true)}
                type="button"
              >
                <ImagePlus className="size-4" />
                New gallery
              </button>
            </div>
          </header>

          <div className="px-5 py-5 lg:px-7">
            {activePanel === "photos" ? (
              <section className="space-y-5">
                <div className="grid gap-3 md:grid-cols-4">
                  {metrics.map(([label, value, Icon]) => (
                    <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`} key={label}>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-medium uppercase ${mutedTextClass}`}>{label}</p>
                        <Icon className="size-4 text-[#b08336]" />
                      </div>
                      <p className="mt-4 text-2xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className={`scroll-mt-5 overflow-hidden rounded-md border shadow-sm ${surfaceClass}`} id="portfolio-view">
                  <div className="flex flex-col gap-3 border-b border-current/10 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{activeGallery.name}</h2>
                        <PrivacyBadge privacy={activeGallery.privacy} />
                      </div>
                      <p className={`mt-1 text-sm ${mutedTextClass}`}>{activeGallery.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeGallery.url && (
                        <a
                          className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                            isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                          }`}
                          href={activeGallery.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Globe2 className="size-4" />
                          Source
                        </a>
                      )}
                      <button
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                        }`}
                        onClick={() => setIsShowcaseOpen(true)}
                        type="button"
                      >
                        <Eye className="size-4" />
                        Showcase
                      </button>
                      <button
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                        }`}
                        type="button"
                      >
                        <Share2 className="size-4" />
                        Share
                      </button>
                      <a
                        className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                        href={activePhoto?.blobUrl ?? activeGallery.cover}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Download className="size-4" />
                        Download
                      </a>
                    </div>
                  </div>

                  <div className={softSurfaceClass}>
                    <div className="relative flex min-h-[56vh] items-center justify-center border-b border-current/10 bg-black/[0.04] p-4 md:min-h-[64vh]">
                      {renderablePhotos.length > 1 && (
                        <button
                          aria-label="Previous photo"
                          className={`absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm ${
                            isDark ? "border-white/15 bg-black/55 text-white" : "border-[#d7d0c4] bg-white/90 text-[#1e211d]"
                          }`}
                          onClick={showPreviousPhoto}
                          type="button"
                        >
                          <ChevronLeft className="size-5" />
                        </button>
                      )}
                      <div className="relative h-[52vh] w-full max-w-6xl md:h-[60vh]">
                        <Image
                          alt={activePhoto?.title ?? `${activeGallery.name} cover`}
                          className="object-contain"
                          fill
                          priority
                          sizes="(min-width: 1280px) 72vw, 100vw"
                          src={activeImageSource}
                        />
                      </div>
                      {renderablePhotos.length > 1 && (
                        <button
                          aria-label="Next photo"
                          className={`absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm ${
                            isDark ? "border-white/15 bg-black/55 text-white" : "border-[#d7d0c4] bg-white/90 text-[#1e211d]"
                          }`}
                          onClick={showNextPhoto}
                          type="button"
                        >
                          <ChevronRight className="size-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold">{activeGallery.client}</p>
                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                          {renderablePhotos.length > 0
                            ? `${activePhotoIndex + 1} of ${renderablePhotos.length.toLocaleString()} photos`
                            : `${activePhotos.length.toLocaleString()} originals in Vercel Blob`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-[#e9f1dc] px-3 py-1 font-medium text-[#466026]">{activeGallery.status}</span>
                        <span className={`rounded-full px-3 py-1 ${isDark ? "bg-white/10 text-white/70" : "bg-[#f3f4f6] text-[#5f6368]"}`}>
                          {activeGallery.revenue}
                        </span>
                      </div>
                    </div>

                    {renderablePhotos.length > 0 && (
                      <div className="border-t border-current/10 p-3">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {renderablePhotos.map((photo, index) => (
                            <button
                              aria-label={`Show ${photo.title}`}
                              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-md border ${
                                index === activePhotoIndex
                                  ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/45"
                                  : isDark
                                    ? "border-white/10"
                                    : "border-[#e5ded2]"
                              }`}
                              key={photo.id}
                              onClick={() => setActivePhotoIndex(index)}
                              type="button"
                            >
                              <Image
                                alt={photo.title}
                                className="object-contain"
                                fill
                                sizes="112px"
                                src={photo.blobUrl}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {galleries.map((gallery) => (
                            <button
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                                gallery.id === activeGallery.id
                                  ? "bg-[#d8a84f] text-[#151714]"
                                  : isDark
                                    ? "bg-white/10 text-white/70 hover:bg-white/15"
                                    : "bg-[#f3f4f6] text-[#5f6368] hover:bg-[#e5e7eb]"
                              }`}
                              key={gallery.id}
                              onClick={() => openGallery(gallery.id)}
                              type="button"
                            >
                              {gallery.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="grid gap-5 xl:grid-cols-2">
              <form
                className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}
                onSubmit={(event) => {
                  event.preventDefault()
                  void syncSmugMug(importUrl, undefined, true)
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Import SmugMug</h2>
                  <Cloud className="size-4 text-[#b08336]" />
                </div>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  Paste a public SmugMug folder or gallery URL.
                </p>
                <label className="mt-4 grid gap-2 text-sm font-medium">
                  SmugMug URL
                  <input
                    className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                    onChange={(event) => setImportUrl(event.target.value)}
                    placeholder="https://name.smugmug.com/Folder"
                    type="url"
                    value={importUrl}
                  />
                </label>
                <button
                  className="mt-3 h-10 w-full rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white disabled:opacity-55"
                  disabled={syncStatus === "syncing" || importUrl.trim().length === 0}
                  type="submit"
                >
                  {syncStatus === "syncing" ? "Importing..." : "Import galleries"}
                </button>
                {syncStatus === "synced" && importResult && (
                  <p className="mt-2 text-xs text-[#466026]">
                    Found {importResult.found} galleries. Added {importResult.added}
                    {importResult.skipped > 0 ? `, skipped ${importResult.skipped} already imported` : ""}.
                  </p>
                )}
                {syncStatus === "error" && (
                  <p className="mt-2 text-xs text-[#a13f2f]">
                    Could not import that public SmugMug page.
                  </p>
                )}
              </form>

              <BlobUpload galleryId={activeGallery.id} />

              <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Today&apos;s focus</h2>
                  <Eye className="size-4 text-[#b08336]" />
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    `Upload originals to ${activeGallery.name}`,
                    `Review ${activeGallery.name} portfolio details`,
                    `Confirm ${activeGallery.privacy.toLowerCase()} access`,
                  ].map((task, index) => (
                    <div className={`flex items-center gap-3 rounded-md p-3 ${softSurfaceClass}`} key={task}>
                      <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isDark ? "bg-white/10 text-[#d8a84f]" : "bg-white text-[#735223]"
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                <h2 className="text-lg font-semibold">Gallery controls</h2>
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      {activeGallery.privacy === "Public" ? (
                        <Globe2 className="size-4 text-[#99702d]" />
                      ) : (
                        <Lock className="size-4 text-[#99702d]" />
                      )}
                      Access
                    </span>
                    <select
                      className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                      onChange={(event) => updateActiveGallery({ privacy: event.target.value as Gallery["privacy"] })}
                      value={activeGallery.privacy}
                    >
                      <option>Private link</option>
                      <option>Password</option>
                      <option>Client portal</option>
                      <option>Public</option>
                    </select>
                  </label>

                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Globe2 className="size-4 text-[#99702d]" />
                      Visibility
                    </span>
                    <span className={`text-sm font-normal ${mutedTextClass}`}>
                      {activeGallery.privacy === "Public" ? "Public" : "Unlisted"}
                    </span>
                  </label>

                  {activeGallery.privacy !== "Public" && (
                    <button
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                      onClick={() => updateActiveGallery({ privacy: "Public" })}
                      type="button"
                    >
                      <Globe2 className="size-4" />
                      Make public
                    </button>
                  )}

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <ImagePlus className="size-4 text-[#99702d]" />
                      Cover photo
                    </div>
                    <div className="mt-3 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
                      {coverOptions.map((cover, index) => (
                        <button
                          aria-label={`Assign cover ${index + 1}`}
                          className={`relative aspect-[3/2] overflow-hidden rounded-md border ${
                            pendingCover === cover ? "border-[#b08336] ring-2 ring-[#ead29b]" : "border-[#ded8cc]"
                          }`}
                          key={cover}
                          onClick={() =>
                            setPendingCovers((current) => ({
                              ...current,
                              [activeGallery.id]: cover,
                            }))
                          }
                          type="button"
                        >
                          <Image
                            alt={`Cover option ${index + 1}`}
                            className="object-cover"
                            fill
                            sizes="90px"
                            src={cover}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      className="mt-3 h-9 w-full rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                      onClick={() => updateActiveGallery({ cover: pendingCover })}
                      type="button"
                    >
                      Assign cover photo
                    </button>
                  </div>

                  {[
                    [Download, "Downloads", "Finals only"],
                    [ShoppingBag, "Sales", activeGallery.status === "For sale" ? "Prints + digital" : "Hidden"],
                  ].map(([Icon, label, value]) => (
                    <div className="flex items-center justify-between rounded-md border border-[#e5ded2] p-3" key={label as string}>
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-[#99702d]" />
                        <span className="text-sm font-medium">{label as string}</span>
                      </div>
                      <span className={`text-sm ${mutedTextClass}`}>{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                <h2 className="text-lg font-semibold">Mobile companion</h2>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  Keep the mobile app focused on uploads, quick organizing, offline showing, and share links.
                </p>
                <div className="mt-4 rounded-md bg-[#f4f4f5] p-4">
                  <div className="mx-auto h-52 w-28 rounded-[1.6rem] border-4 border-[#1f2a24] bg-[#1f2a24] p-2">
                    <div className="h-full rounded-[1.1rem] bg-cover bg-center" style={{ backgroundImage: `url(${activeGallery.cover})` }} />
                  </div>
                </div>
              </div>
              </section>
            )}
          </div>
        </section>
      </div>

      {isShowcaseOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
          {renderablePhotos.length > 1 && (
            <button
              aria-label="Previous showcase photo"
              className="absolute left-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-sm"
              onClick={showPreviousPhoto}
              type="button"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <div className="relative h-screen w-screen">
            <Image
              alt={activePhoto?.title ?? `${activeGallery.name} showcase`}
              className="object-contain"
              fill
              priority
              sizes="100vw"
              src={activeImageSource}
            />
          </div>
          {renderablePhotos.length > 1 && (
            <button
              aria-label="Next showcase photo"
              className="absolute right-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-sm"
              onClick={showNextPhoto}
              type="button"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}

      {showNewGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <form className="w-full max-w-xl rounded-md bg-white p-5 shadow-xl" onSubmit={addGallery}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">New gallery</h2>
                <p className="mt-1 text-sm text-[#777064]">Create a portfolio gallery and start uploading into it.</p>
              </div>
              <button
                aria-label="Close new gallery"
                className="rounded-md border border-[#d7d0c4] p-2"
                onClick={() => setShowNewGallery(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Gallery name
                <input
                  className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
                  name="name"
                  placeholder="Downtown portrait session"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Client
                <input
                  className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
                  name="client"
                  placeholder="Client or organization"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Status
                <select className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]" name="status">
                  <option>Draft</option>
                  <option>Proofing</option>
                  <option>For sale</option>
                  <option>Delivered</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-10 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-medium"
                onClick={() => setShowNewGallery(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="h-10 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white" type="submit">
                Add gallery
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
