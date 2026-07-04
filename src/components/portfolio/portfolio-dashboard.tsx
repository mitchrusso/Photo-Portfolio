"use client"

import {
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  Cloud,
  Download,
  Eye,
  Folder,
  Globe2,
  Heart,
  ImagePlus,
  Link2,
  Lock,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  Smartphone,
  Upload,
  Users,
  X,
} from "lucide-react"
import Image from "next/image"
import { FormEvent, useEffect, useMemo, useState } from "react"
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

const navItems = [
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "Galleries", icon: Folder },
  { label: "Uploads", icon: Upload },
  { label: "Clients", icon: Users },
  { label: "Store", icon: ShoppingBag },
  { label: "Mobile", icon: Smartphone },
  { label: "Settings", icon: Settings2 },
]

const GALLERY_STORAGE_KEY = "photo-portfolio-galleries-v5"

type ImportResult = {
  source: string
  found: number
  added: number
  skipped: number
}

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
  const [search, setSearch] = useState("")
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
  const previewPhotos = activePhotos.filter(isRenderableImage).slice(0, 12)
  const storageBytes = galleries.reduce(
    (gallerySum, gallery) =>
      gallerySum + (gallery.photos ?? []).reduce((photoSum, photo) => photoSum + (photo.bytes ?? 0), 0),
    0,
  )
  const storagePhotoCount = galleries.reduce((sum, gallery) => sum + (gallery.photos?.length ?? 0), 0)
  const storageReferenceBytes = 5 * 1024 ** 3
  const storagePercent = Math.min(Math.round((storageBytes / storageReferenceBytes) * 100), 100)

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

  const filteredGalleries = galleries.filter((gallery) => {
    const value = `${gallery.name} ${gallery.client} ${gallery.status}`.toLowerCase()
    return value.includes(search.toLowerCase())
  })

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
      setSearch("")
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
    <main className="min-h-screen bg-[#f5f2ec] text-[#1e211d]">
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

          <nav className="mt-7 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navItems.map((item) => (
              <button
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                  item.active
                    ? "bg-white text-[#171814]"
                    : "text-white/68 hover:bg-white/10 hover:text-white"
                }`}
                key={item.label}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </button>
            ))}
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
          <header className="flex flex-col gap-4 border-b border-[#ded8cc] bg-[#f9f7f2]/85 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-7">
            <div>
              <p className="text-sm text-[#777064]">
                {syncStatus === "syncing"
                  ? "Syncing SmugMug..."
                  : lastSyncedAt
                    ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : "Friday pipeline"}
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                Galleries, clients, and delivery in one place
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex h-10 items-center gap-2 rounded-md border border-[#d4cdc0] bg-white px-3 text-sm font-medium disabled:opacity-55"
                disabled={syncStatus === "syncing"}
                onClick={() => void syncSmugMug()}
                type="button"
              >
                <Cloud className="size-4" />
                {syncStatus === "syncing" ? "Syncing" : "Sync SmugMug"}
              </button>
              <button
                className="flex h-10 items-center gap-2 rounded-md border border-[#d4cdc0] bg-white px-3 text-sm font-medium"
                onClick={() => setShowNewGallery(true)}
                type="button"
              >
                <ImagePlus className="size-4" />
                New gallery
              </button>
              <BlobUpload galleryId={activeGallery.id} mode="button" />
            </div>
          </header>

          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_340px] lg:px-7">
            <section className="min-w-0 space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                {metrics.map(([label, value, Icon]) => (
                  <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm" key={label}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase text-[#777064]">{label}</p>
                      <Icon className="size-4 text-[#b08336]" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#e8e1d5] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Portfolio galleries</h2>
                    <p className="text-sm text-[#777064]">Gallery cards, portfolio preview, proofing, and delivery controls.</p>
                  </div>
                  <label className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-[#faf8f4] px-3 text-sm text-[#6f685d]">
                    <Search className="size-4" />
                    <input
                      className="w-40 bg-transparent outline-none placeholder:text-[#9a9287]"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search galleries"
                      type="search"
                      value={search}
                    />
                  </label>
                </div>

                <div className="grid gap-4 p-4 xl:grid-cols-3">
                  {filteredGalleries.map((gallery) => (
                    <article
                      className={`overflow-hidden rounded-md border bg-[#fbfaf7] ${
                        gallery.id === activeGallery.id ? "border-[#b08336] ring-2 ring-[#ead29b]" : "border-[#e2dbcf]"
                      }`}
                      key={gallery.id}
                    >
                      <button
                        aria-label={`Open ${gallery.name}`}
                        className="relative block aspect-[3/2] w-full bg-[#f1eee8]"
                        onClick={() => setActiveGalleryId(gallery.id)}
                        type="button"
                      >
                        <Image
                          alt={`${gallery.name} cover`}
                          className="object-contain"
                          fill
                          sizes="(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 90vw"
                          src={gallery.cover}
                        />
                      </button>
                      <div className="space-y-2 p-3">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold">{gallery.name}</h3>
                            <span className="rounded-full bg-[#e9f1dc] px-2 py-0.5 text-[11px] font-medium text-[#466026]">
                              {gallery.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#777064]">{gallery.client}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#827a70]">Images</p>
                            <p className="font-semibold">{gallery.images}</p>
                          </div>
                          <div>
                            <p className="text-[#827a70]">Picks</p>
                            <p className="font-semibold">{gallery.favorites}</p>
                          </div>
                          <div>
                            <p className="text-[#827a70]">Sales</p>
                            <p className="font-semibold">{gallery.revenue}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#e7dfd3] pt-2">
                          <span className="flex items-center gap-1 text-[11px] text-[#6f685d]">
                            <Lock className="size-3.5" />
                            {gallery.privacy}
                          </span>
                          <button
                            className="flex items-center gap-1 text-xs font-medium text-[#735223]"
                            onClick={() => setActiveGalleryId(gallery.id)}
                            type="button"
                          >
                            Open
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
                <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Portfolio view</h2>
                      <p className="text-sm text-[#777064]">{activeGallery.description}</p>
                    </div>
                    <button className="rounded-md border border-[#d7d0c4] p-2">
                      <Eye className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-md border border-[#e5ded2] bg-[#fbfaf7]">
                    <div className="relative aspect-[16/10] max-h-[520px] min-h-72 bg-[#f1eee8]">
                      <Image
                        alt={`${activeGallery.name} cover`}
                        className="object-contain"
                        fill
                        sizes="(min-width: 1280px) 55vw, 90vw"
                        src={activeGallery.cover}
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{activeGallery.name}</h3>
                        <p className="mt-1 text-sm text-[#777064]">
                          {activeGallery.client}
                          {activePhotos.length > 0 ? ` - ${activePhotos.length} originals in Vercel Blob` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeGallery.url && (
                          <a
                            className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-medium"
                            href={activeGallery.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Globe2 className="size-4" />
                            Source
                          </a>
                        )}
                        <button className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-medium">
                          <Share2 className="size-4" />
                          Share
                        </button>
                        <button className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white">
                          <Download className="size-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    {previewPhotos.length > 0 && (
                      <div className="border-t border-[#e5ded2] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold">Migrated originals</h4>
                          <span className="text-xs text-[#777064]">{activePhotos.length} files</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
                          {previewPhotos.map((photo) => (
                            <a
                              aria-label={`Open ${photo.title}`}
                              className="group block"
                              href={photo.blobUrl}
                              key={photo.id}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <span className="relative block aspect-square overflow-hidden rounded-md border border-[#e5ded2] bg-[#f1eee8]">
                                <Image
                                  alt={photo.title}
                                  className="object-contain transition group-hover:scale-[1.02]"
                                  fill
                                  sizes="(min-width: 1280px) 8vw, (min-width: 768px) 14vw, 28vw"
                                  src={photo.blobUrl}
                                />
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#ded8cc] bg-[#1f2a24] p-4 text-white shadow-sm">
                  <p className="text-xs font-medium uppercase text-white/55">Share package</p>
                  <h2 className="mt-3 text-lg font-semibold">{activeGallery.name}</h2>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      {activeGallery.privacy} enabled
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Downloads limited to finals
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="size-4 text-[#d8a84f]" />
                      Portfolio preview ready
                    </p>
                  </div>
                  <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-[#1f2a24]">
                    <Link2 className="size-4" />
                    Copy link
                  </button>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <form
                className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault()
                  void syncSmugMug(importUrl, undefined, true)
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Import SmugMug</h2>
                  <Cloud className="size-4 text-[#b08336]" />
                </div>
                <p className="mt-2 text-sm text-[#777064]">
                  Paste a public SmugMug folder or gallery URL.
                </p>
                <label className="mt-4 grid gap-2 text-sm font-medium">
                  SmugMug URL
                  <input
                    className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
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

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
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
                    <div className="flex items-center gap-3 rounded-md bg-[#f6f2ea] p-3" key={task}>
                      <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#735223]">
                        {index + 1}
                      </span>
                      <span className="text-sm">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold">Gallery controls</h2>
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Lock className="size-4 text-[#99702d]" />
                      Access
                    </span>
                    <select
                      className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2 text-sm font-normal outline-none focus:border-[#b08336]"
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
                    <span className="text-sm font-normal text-[#777064]">
                      {activeGallery.privacy === "Public" ? "Public" : "Unlisted"}
                    </span>
                  </label>

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <ImagePlus className="size-4 text-[#99702d]" />
                      Cover photo
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
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
                      <span className="text-sm text-[#777064]">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[#ded8cc] bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold">Mobile companion</h2>
                <p className="mt-2 text-sm text-[#777064]">
                  Keep the mobile app focused on uploads, quick organizing, offline showing, and share links.
                </p>
                <div className="mt-4 rounded-md bg-[#f3ead9] p-4">
                  <div className="mx-auto h-52 w-28 rounded-[1.6rem] border-4 border-[#1f2a24] bg-[#1f2a24] p-2">
                    <div className="h-full rounded-[1.1rem] bg-cover bg-center" style={{ backgroundImage: `url(${activeGallery.cover})` }} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

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
