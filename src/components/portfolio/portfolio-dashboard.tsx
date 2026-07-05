"use client"

import type { PutBlobResult } from "@vercel/blob"
import { upload } from "@vercel/blob/client"
import {
  BarChart3,
  Camera,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cloud,
  Copy,
  Download,
  Eye,
  EyeOff,
  Folder,
  Globe2,
  Images,
  ImagePlus,
  Lock,
  Mail,
  Moon,
  QrCode,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  Star,
  Sun,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { BlobUpload } from "@/components/uploads/blob-upload"
import { migratedGalleries } from "@/data/migrated-galleries"
import {
  defaultSiteSettings,
  embedGalleryPath,
  getDisplayUrl,
  getPhotoCover,
  getThumbnailUrl,
  isVisibleRenderableImage,
  LOCAL_GALLERY_STORAGE_KEY,
  mergeSiteSettings,
  normalizeAssetUrl,
  photoMatchesCover,
  publicGalleryPath,
  SITE_SETTINGS_STORAGE_KEY,
  siteTemplatePresets,
  type PortfolioGallery,
  type PortfolioPhoto,
  type SiteSettings,
  uniqueGalleryPhotos,
} from "@/lib/gallery-utils"

type Gallery = PortfolioGallery

const seedGalleries: Gallery[] = migratedGalleries

const coverOptions = seedGalleries.map((gallery) => gallery.cover)

const GALLERY_STORAGE_KEY = LOCAL_GALLERY_STORAGE_KEY
const SITE_STORAGE_KEY = SITE_SETTINGS_STORAGE_KEY
const IMAGE_BRIGHTNESS_STORAGE_KEY = "photo-portfolio-image-brightness"
const GALLERY_TILE_SIZE_STORAGE_KEY = "photo-portfolio-gallery-tile-size"

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

function TemplateGalleryPreview({
  gallery,
  photos,
  templateKey,
  template,
}: {
  gallery: Gallery
  photos: PortfolioPhoto[]
  template: typeof siteTemplatePresets[SiteSettings["siteTemplate"]]
  templateKey: SiteSettings["siteTemplate"]
}) {
  const previewImages = [gallery.cover, ...photos.slice(0, 10).map((photo) => getThumbnailUrl(photo))]
  const imageAt = (index: number) => previewImages[index % previewImages.length] ?? gallery.cover
  const isLight = template.publicBackground === "white"
  const frameClass = isLight ? "border-[#d7d0c4] bg-white text-[#1e211d]" : "border-white/10 bg-black text-white"
  const chromeClass = isLight ? "border-black/10 text-black/60" : "border-white/10 text-white/60"
  const labelClass = isLight ? "bg-white/88 text-black" : "bg-black/58 text-white"

  const renderTile = ({
    index,
    label = "Gallery",
    className = "aspect-[16/10]",
  }: {
    className?: string
    index: number
    label?: string
  }) => (
    <div className={`relative overflow-hidden border ${isLight ? "border-black/10" : "border-white/10"} ${template.tileShape === "soft" ? "rounded-md" : ""} ${className}`} key={`${label}-${index}`}>
      <Image alt={`${gallery.name} ${label}`} className="object-cover" fill sizes="360px" src={imageAt(index)} />
      {template.showGalleryLabels && (
        <div className={`absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] font-semibold ${labelClass}`}>{label}</div>
      )}
    </div>
  )

  let previewBody

  if (templateKey === "wedding-story") {
    previewBody = (
      <div className="grid grid-cols-[1.05fr_0.95fr] gap-3 p-3">
        {renderTile({ className: "aspect-[4/5] rounded-lg", index: 0, label: "Ceremony" })}
        <div className="grid gap-3">
          {renderTile({ className: "aspect-[4/3] rounded-lg", index: 1, label: "Portraits" })}
          {renderTile({ className: "aspect-[4/3] rounded-lg", index: 2, label: "Reception" })}
        </div>
      </div>
    )
  } else if (templateKey === "portrait") {
    previewBody = (
      <div className="grid grid-cols-3 gap-3 p-3">
        {[0, 1, 2].map((item) => renderTile({ className: "aspect-[4/5] rounded-lg", index: item, label: "Session" }))}
      </div>
    )
  } else if (templateKey === "commercial") {
    previewBody = (
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1, 2, 3].map((item) => renderTile({ className: "aspect-[5/4]", index: item, label: "Project" }))}
      </div>
    )
  } else if (templateKey === "fine-art") {
    previewBody = (
      <div className="grid grid-cols-3 gap-4 p-4">
        {[0, 1, 2].map((item) => (
          <div className="border border-white/15 bg-[#050505] p-2" key={item}>
            {renderTile({ className: "aspect-[4/5]", index: item, label: "Edition" })}
          </div>
        ))}
      </div>
    )
  } else if (templateKey === "travel-journal") {
    previewBody = (
      <div className="grid gap-3 p-3">
        {renderTile({ className: "aspect-[16/7] rounded-md", index: 0, label: "Destination" })}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => renderTile({ className: "aspect-[4/3] rounded-md", index: item, label: "Place" }))}
        </div>
      </div>
    )
  } else if (templateKey === "sports") {
    previewBody = (
      <div className="grid grid-cols-4 gap-2 p-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => renderTile({ className: "aspect-[4/3]", index: item, label: "Action" }))}
      </div>
    )
  } else if (templateKey === "real-estate") {
    previewBody = (
      <div className="grid gap-3 p-3">
        {renderTile({ className: "aspect-[16/7] rounded-md", index: 0, label: "Property" })}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((item) => renderTile({ className: "aspect-[16/9] rounded-md", index: item, label: "Room" }))}
        </div>
      </div>
    )
  } else if (templateKey === "black-white") {
    previewBody = (
      <div className="grid grid-cols-3 gap-3 p-3 grayscale">
        {[0, 1, 2, 3, 4, 5].map((item) => renderTile({ className: "aspect-[3/2]", index: item, label: "Mono" }))}
      </div>
    )
  } else if (templateKey === "masonry") {
    previewBody = (
      <div className="columns-3 gap-3 p-3">
        {["h-24", "h-36", "h-28", "h-44", "h-24", "h-32"].map((height, item) => (
          <div className={`relative mb-3 break-inside-avoid overflow-hidden rounded-md border ${isLight ? "border-black/10" : "border-white/10"} ${height}`} key={item}>
            <Image alt={`${gallery.name} masonry ${item + 1}`} className="object-cover" fill sizes="240px" src={imageAt(item)} />
          </div>
        ))}
      </div>
    )
  } else if (templateKey === "fullscreen") {
    previewBody = (
      <div className="p-3">
        {renderTile({ className: "aspect-[21/9]", index: 0, label: "Showcase" })}
      </div>
    )
  } else if (templateKey === "embedded") {
    previewBody = (
      <div className="grid grid-cols-[1fr_92px] gap-3 p-3">
        {renderTile({ className: "aspect-[16/9] rounded-md", index: 0, label: "Embed" })}
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => renderTile({ className: "h-12 rounded-md", index: item, label: "" }))}
        </div>
      </div>
    )
  } else if (templateKey === "sidecar") {
    previewBody = (
      <div className="grid grid-cols-[88px_1fr] gap-3 p-3">
        <div className={`rounded-md p-3 ${isLight ? "bg-black/5" : "bg-white/10"}`}>
          <div className="mb-3 h-2 w-12 rounded-full bg-[#d8a84f]" />
          {[0, 1, 2, 3].map((item) => <div className={`mt-2 h-2 rounded-full ${isLight ? "bg-black/15" : "bg-white/20"}`} key={item} />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((item) => renderTile({ className: "aspect-[16/10] rounded-md", index: item, label: "Folder" }))}
        </div>
      </div>
    )
  } else if (templateKey === "editorial") {
    previewBody = (
      <div className="grid grid-cols-3 gap-3 p-3">
        {[0, 1, 2].map((item) => renderTile({ className: "aspect-[4/5] rounded-md", index: item, label: "Series" }))}
      </div>
    )
  } else if (templateKey === "minimal") {
    previewBody = (
      <div className="grid grid-cols-4 gap-2 p-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => renderTile({ className: "aspect-square", index: item, label: "Art" }))}
      </div>
    )
  } else if (templateKey === "event") {
    previewBody = (
      <div className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2, 3, 4, 5].map((item) => renderTile({ className: "aspect-[4/3] rounded-md", index: item, label: "Event" }))}
      </div>
    )
  } else {
    previewBody = (
      <div className="grid grid-cols-2 gap-3 p-3">
        {[0, 1, 2, 3].map((item) => renderTile({ className: "aspect-[16/9]", index: item, label: "Gallery" }))}
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-md border shadow-sm ${frameClass}`}>
      <div className={`flex items-center justify-between border-b px-4 py-3 text-xs ${chromeClass}`}>
        <span className="font-semibold">{template.label}</span>
        <span>{template.pageWidth === "full" ? "Edge-to-edge" : template.pageWidth}</span>
      </div>
      {previewBody}
      <div className={`border-t px-4 py-3 ${chromeClass}`}>
        <p className="text-sm font-semibold">{gallery.name}</p>
        <p className="mt-1 text-xs leading-5 opacity-80">{template.description}</p>
      </div>
    </div>
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
  const [activePhotoIndex, setActivePhotoIndex] = useState(-1)
  const [activePanel, setActivePanel] = useState<ActivePanel>("photos")
  const [areGalleriesOpen, setAreGalleriesOpen] = useState(true)
  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [previewTemplate, setPreviewTemplate] = useState<SiteSettings["siteTemplate"] | null>(null)
  const [imageBrightness, setImageBrightness] = useState(100)
  const [galleryTileSize, setGalleryTileSize] = useState(320)
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false)
  const [showNewGallery, setShowNewGallery] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [siteOrigin, setSiteOrigin] = useState("")
  const [hasLoadedSavedGalleries, setHasLoadedSavedGalleries] = useState(false)
  const [hasLoadedSiteSettings, setHasLoadedSiteSettings] = useState(false)
  const [hasLoadedDisplayPreferences, setHasLoadedDisplayPreferences] = useState(false)
  const [pendingCovers, setPendingCovers] = useState<Record<string, string>>({})
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const [importUrl, setImportUrl] = useState("https://lenstraveler18.smugmug.com/Travel")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [siteSettingsSaveStatus, setSiteSettingsSaveStatus] = useState<"idle" | "saved">("idle")
  const [watermarkUploadStatus, setWatermarkUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const activeGallery = galleries.find((gallery) => gallery.id === activeGalleryId) ?? galleries[0]
  const pendingCover = pendingCovers[activeGallery.id] ?? activeGallery.cover
  const activePhotos = activeGallery.photos ?? []
  const renderablePhotos = uniqueGalleryPhotos(activePhotos, activeGallery.cover)
  const hiddenPhotos = activePhotos.filter((photo) => photo.hidden)
  const activePhoto = renderablePhotos[activePhotoIndex]
  const activeImageSource = getDisplayUrl(activePhoto) ?? activeGallery.cover
  const isActiveImageCover = normalizeAssetUrl(activeImageSource) === normalizeAssetUrl(activeGallery.cover)
  const activeImageStyle = { filter: `brightness(${imageBrightness}%)` }
  const galleryItemCount = renderablePhotos.length + 1
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
      gallerySum + (gallery.photos ?? []).reduce(
        (photoSum, photo) =>
          photoSum + (photo.bytes ?? 0) + (photo.displayBytes ?? 0) + (photo.thumbnailBytes ?? 0),
        0,
      ),
    0,
  )
  const storagePhotoCount = galleries.reduce((sum, gallery) => sum + (gallery.photos?.length ?? 0), 0)
  const storageReferenceBytes = 5 * 1024 ** 3
  const storagePercent = Math.min(Math.round((storageBytes / storageReferenceBytes) * 100), 100)
  const homeCoverOptions = useMemo(
    () => Array.from(new Set(galleries.map((gallery) => gallery.cover).filter(Boolean))),
    [galleries],
  )
  const publicGalleryUrl = `${siteOrigin}${publicGalleryPath(activeGallery.id)}`
  const embedGalleryUrl = `${siteOrigin}${embedGalleryPath(activeGallery.id)}`
  const emailInviteUrl = `mailto:?subject=${encodeURIComponent(`New gallery: ${activeGallery.name}`)}&body=${encodeURIComponent(`I wanted to share this PhotoViewPro gallery with you:\n\n${publicGalleryUrl}`)}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(publicGalleryUrl)}`
  const embedCode = `<iframe src="${embedGalleryUrl}" title="${activeGallery.name} PhotoViewPro gallery" width="100%" height="720" style="border:0;background:#000;" loading="lazy" allowfullscreen></iframe>`
  const activeTemplatePreviewKey = previewTemplate ?? siteSettings.siteTemplate
  const activeTemplatePreview = siteTemplatePresets[activeTemplatePreviewKey]

  const showPreviousPhoto = useCallback(() => {
    setActivePhotoIndex((current) => {
      if (current === -1) return renderablePhotos.length - 1
      if (current === 0) return -1
      return current - 1
    })
  }, [renderablePhotos.length])

  const showNextPhoto = useCallback(() => {
    setActivePhotoIndex((current) => {
      if (current === -1) return renderablePhotos.length > 0 ? 0 : -1
      if (current >= renderablePhotos.length - 1) return -1
      return current + 1
    })
  }, [renderablePhotos.length])

  useEffect(() => {
    setSiteOrigin(window.location.origin)
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
    try {
      const savedSettings = window.localStorage.getItem(SITE_STORAGE_KEY)
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Partial<SiteSettings>
        setSiteSettings(mergeSiteSettings(parsedSettings))
      }
    } catch {
      window.localStorage.removeItem(SITE_STORAGE_KEY)
    }

    setHasLoadedSiteSettings(true)
  }, [])

  useEffect(() => {
    const savedBrightness = Number(window.localStorage.getItem(IMAGE_BRIGHTNESS_STORAGE_KEY))
    const savedTileSize = Number(window.localStorage.getItem(GALLERY_TILE_SIZE_STORAGE_KEY))

    if (Number.isFinite(savedBrightness) && savedBrightness >= 50 && savedBrightness <= 150) {
      setImageBrightness(savedBrightness)
    }

    if (Number.isFinite(savedTileSize) && savedTileSize >= 180 && savedTileSize <= 460) {
      setGalleryTileSize(savedTileSize)
    }

    setHasLoadedDisplayPreferences(true)
  }, [])

  useEffect(() => {
    if (hasLoadedSavedGalleries) {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleries))
    }
  }, [galleries, hasLoadedSavedGalleries])

  useEffect(() => {
    if (hasLoadedSiteSettings) {
      window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(siteSettings))
    }
  }, [hasLoadedSiteSettings, siteSettings])

  useEffect(() => {
    if (hasLoadedDisplayPreferences) {
      window.localStorage.setItem(IMAGE_BRIGHTNESS_STORAGE_KEY, String(imageBrightness))
    }
  }, [imageBrightness, hasLoadedDisplayPreferences])

  useEffect(() => {
    if (hasLoadedDisplayPreferences) {
      window.localStorage.setItem(GALLERY_TILE_SIZE_STORAGE_KEY, String(galleryTileSize))
    }
  }, [galleryTileSize, hasLoadedDisplayPreferences])

  useEffect(() => {
    setActivePhotoIndex(-1)
  }, [activeGallery.id])

  useEffect(() => {
    if (activePhotoIndex < -1) {
      setActivePhotoIndex(-1)
      return
    }

    if (activePhotoIndex >= renderablePhotos.length) {
      setActivePhotoIndex(renderablePhotos.length > 0 ? renderablePhotos.length - 1 : -1)
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

  useEffect(() => {
    if (isShowcaseOpen || activePanel !== "photos" || showNewGallery) return

    function handleGalleryKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable

      if (isTyping) return

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
  }, [activePanel, isShowcaseOpen, showNewGallery, showNextPhoto, showPreviousPhoto])

  const totalImages = useMemo(
    () => galleries.reduce((sum, gallery) => sum + gallery.images, 0).toLocaleString(),
    [galleries],
  )

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
      allowDownloads: true,
      watermarkEnabled: false,
      watermarkMode: "text",
      watermarkOpacity: 55,
      watermarkPosition: "bottom-right",
      watermarkSize: 140,
      watermarkText: client || "Personal",
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

  function saveSiteSettings() {
    window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(siteSettings))
    setSiteSettingsSaveStatus("saved")
    window.setTimeout(() => setSiteSettingsSaveStatus("idle"), 1800)
  }

  function openGallery(galleryId: string) {
    setActiveGalleryId(galleryId)
    setActivePhotoIndex(-1)
    setActivePanel("photos")
    window.requestAnimationFrame(() => {
      document.getElementById("portfolio-view")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  function chooseReplacementCover(photos: PortfolioPhoto[], fallbackCover: string) {
    return getPhotoCover(photos.find(isVisibleRenderableImage)) ?? fallbackCover
  }

  function setCurrentPhotoAsCover() {
    const cover = getPhotoCover(activePhoto)
    if (!cover) return

    setPendingCovers((current) => ({
      ...current,
      [activeGallery.id]: cover,
    }))
    updateActiveGallery({ cover })
    setActivePhotoIndex(-1)
  }

  function hideCurrentPhoto() {
    if (!activePhoto) return

    const hiddenPhotoId = activePhoto.id
    const currentCover = activeGallery.cover

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = (gallery.photos ?? []).map((photo) =>
          photo.id === hiddenPhotoId ? { ...photo, hidden: true } : photo,
        )
        const hiddenCover = getPhotoCover(activePhoto) === currentCover

        return {
          ...gallery,
          cover: hiddenCover ? chooseReplacementCover(photos, gallery.cover) : gallery.cover,
          images: photos.filter(isVisibleRenderableImage).length,
          photos,
        }
      }),
    )
    setActivePhotoIndex((current) => Math.max(0, Math.min(current, renderablePhotos.length - 2)))
  }

  function deleteCurrentPhoto() {
    if (!activePhoto) return

    const deletedPhotoId = activePhoto.id
    const currentCover = activeGallery.cover

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = (gallery.photos ?? []).filter((photo) => photo.id !== deletedPhotoId)
        const deletedCover = getPhotoCover(activePhoto) === currentCover

        return {
          ...gallery,
          cover: deletedCover ? chooseReplacementCover(photos, gallery.cover) : gallery.cover,
          images: photos.filter(isVisibleRenderableImage).length,
          photos,
        }
      }),
    )
    setActivePhotoIndex((current) => Math.max(0, Math.min(current, renderablePhotos.length - 2)))
  }

  function restorePhoto(photoId: string) {
    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = (gallery.photos ?? []).map((photo) =>
          photo.id === photoId ? { ...photo, hidden: false } : photo,
        )

        return {
          ...gallery,
          images: photos.filter(isVisibleRenderableImage).length,
          photos,
        }
      }),
    )
  }

  function updateCurrentPhotoCaption(caption: string) {
    if (!activePhoto) return

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        return {
          ...gallery,
          photos: (gallery.photos ?? []).map((photo) =>
            photo.id === activePhoto.id ? { ...photo, caption } : photo,
          ),
        }
      }),
    )
  }

  function moveCurrentPhoto(direction: -1 | 1) {
    if (!activePhoto) return

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = [...(gallery.photos ?? [])]
        const currentIndex = photos.findIndex((photo) => photo.id === activePhoto.id)
        const nextIndex = currentIndex + direction
        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= photos.length) return gallery

        const [photo] = photos.splice(currentIndex, 1)
        photos.splice(nextIndex, 0, photo)

        return { ...gallery, photos }
      }),
    )

    setActivePhotoIndex((current) => Math.max(0, Math.min(current + direction, renderablePhotos.length - 1)))
  }

  function updateImageBrightness(value: string) {
    setImageBrightness(Number(value))
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

  async function uploadWatermarkImage(file: File) {
    setWatermarkUploadStatus("uploading")

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "png"
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)

      const uploadedBlob: PutBlobResult = await upload(
        `watermarks/${activeGallery.id}/${safeName || "watermark"}.${extension}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          clientPayload: JSON.stringify({ galleryId: activeGallery.id, kind: "watermark" }),
        },
      )

      updateActiveGallery({
        watermarkEnabled: true,
        watermarkImageUrl: uploadedBlob.url,
        watermarkMode: activeGallery.watermarkMode === "text" ? "image" : activeGallery.watermarkMode ?? "image",
      })
      setWatermarkUploadStatus("uploaded")
    } catch {
      setWatermarkUploadStatus("error")
    }
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
        <aside className="border-b border-[#ded8cc] bg-[#151714] px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
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
              {storagePhotoCount.toLocaleString()} originals plus display files
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
                <div className={`rounded-md border shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Galleries</h2>
                      <p className={`mt-1 text-sm ${mutedTextClass}`}>
                        {galleries.length} galleries, {totalImages} images
                      </p>
                    </div>
                    <label
                      className={`flex h-10 items-center gap-3 rounded-md border px-3 text-sm font-medium ${
                        isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                      }`}
                    >
                      <span className="whitespace-nowrap text-xs">Covers</span>
                      <input
                        aria-label="Gallery cover size"
                        className="w-40 accent-[#d8a84f]"
                        max="460"
                        min="180"
                        onChange={(event) => setGalleryTileSize(Number(event.target.value))}
                        type="range"
                        value={galleryTileSize}
                      />
                      <span className="w-12 text-right text-xs">{galleryTileSize}px</span>
                    </label>
                  </div>

                  <div
                    className="grid gap-2 p-3"
                    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${galleryTileSize}px, 1fr))` }}
                  >
                    {galleries.map((gallery) => (
                      <button
                        className={`group relative block aspect-[16/10] overflow-hidden rounded-sm border text-left ${
                          gallery.id === activeGallery.id
                            ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/55"
                            : isDark
                              ? "border-white/10"
                              : "border-white"
                        }`}
                        key={gallery.id}
                        onClick={() => openGallery(gallery.id)}
                        type="button"
                      >
                        <Image
                          alt={`${gallery.name} cover`}
                          className="object-cover transition duration-200 group-hover:scale-[1.02]"
                          fill
                          sizes={`(min-width: 1280px) ${galleryTileSize}px, 90vw`}
                          src={gallery.cover}
                        />
                        <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/55 px-2 py-2 text-sm font-semibold text-white">
                          <Folder className="size-4 shrink-0" />
                          <span className="min-w-0 truncate">{gallery.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
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
                      <label
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                        }`}
                      >
                        <Sun className="size-4" />
                        <input
                          aria-label="Image brightness"
                          className="w-28 accent-[#d8a84f]"
                          max="150"
                          min="50"
                          onChange={(event) => setImageBrightness(Number(event.target.value))}
                          onInput={(event) => updateImageBrightness(event.currentTarget.value)}
                          type="range"
                          value={imageBrightness}
                        />
                        <span className="w-10 text-right text-xs">{imageBrightness}%</span>
                      </label>
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
                        disabled={!activePhoto}
                        onClick={setCurrentPhotoAsCover}
                        type="button"
                      >
                        <ImagePlus className="size-4" />
                        Set cover
                      </button>
                      <button
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                        disabled={!activePhoto}
                        onClick={hideCurrentPhoto}
                        type="button"
                      >
                        <EyeOff className="size-4" />
                        Hide
                      </button>
                      <button
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-red-400/35 bg-red-500/10 text-red-100" : "border-red-200 bg-red-50 text-red-700"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                        disabled={!activePhoto}
                        onClick={deleteCurrentPhoto}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                      <a
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d7d0c4] bg-white"
                        }`}
                        href={publicGalleryPath(activeGallery.id)}
                        target="_blank"
                      >
                        <Share2 className="size-4" />
                        Share
                      </a>
                      {(activeGallery.allowDownloads ?? true) && (
                        <a
                          className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                          href={activePhoto?.blobUrl ?? activeGallery.cover}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Download className="size-4" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>

                  <div className={softSurfaceClass}>
                    <div
                      className="relative flex min-h-[56vh] touch-pan-y items-center justify-center border-b border-current/10 bg-black/[0.04] p-4 md:min-h-[64vh]"
                      onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
                      onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
                    >
                      {galleryItemCount > 1 && (
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
                      <button
                        aria-label="Open lightbox"
                        className="relative h-[52vh] w-full max-w-6xl cursor-zoom-in md:h-[60vh]"
                        onClick={() => setIsShowcaseOpen(true)}
                        type="button"
                      >
                        <Image
                          alt={activePhoto?.title ?? `${activeGallery.name} cover`}
                          className="object-contain"
                          fill
                          priority
                          sizes="(min-width: 1280px) 72vw, 100vw"
                          style={activeImageStyle}
                          src={activeImageSource}
                        />
                        {isActiveImageCover && (
                          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#f4d47e] bg-[#d8a84f] px-3 py-1 text-xs font-semibold text-[#171814] shadow-lg">
                            <Star className="size-3.5 fill-current" />
                            Cover
                          </div>
                        )}
                      </button>
                      {galleryItemCount > 1 && (
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
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold">{activeGallery.client}</p>
                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                          {activePhotoIndex === -1
                            ? `Cover image, ${renderablePhotos.length.toLocaleString()} photos`
                            : renderablePhotos.length > 0
                            ? `${activePhotoIndex + 1} of ${renderablePhotos.length.toLocaleString()} photos`
                            : `${activePhotos.length.toLocaleString()} originals in Vercel Blob`}
                          {hiddenPhotos.length > 0 ? `, ${hiddenPhotos.length.toLocaleString()} hidden` : ""}
                        </p>
                        {activePhoto && (
                          <div className="mt-3 grid gap-2 md:max-w-xl">
                            <input
                              aria-label="Photo caption"
                              className={`h-9 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                              onChange={(event) => updateCurrentPhotoCaption(event.target.value)}
                              placeholder="Caption"
                              value={activePhoto.caption ?? activePhoto.title}
                            />
                            <div className="flex gap-2">
                              <button
                                className={`h-8 rounded-md border px-3 text-xs font-medium ${
                                  isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                                } disabled:opacity-45`}
                                disabled={activePhotoIndex <= 0}
                                onClick={() => moveCurrentPhoto(-1)}
                                type="button"
                              >
                                Move left
                              </button>
                              <button
                                className={`h-8 rounded-md border px-3 text-xs font-medium ${
                                  isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                                } disabled:opacity-45`}
                                disabled={activePhotoIndex >= renderablePhotos.length - 1}
                                onClick={() => moveCurrentPhoto(1)}
                                type="button"
                              >
                                Move right
                              </button>
                            </div>
                          </div>
                        )}
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
                                src={getThumbnailUrl(photo)}
                              />
                              {photoMatchesCover(photo, activeGallery.cover) && (
                                <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border border-[#f4d47e] bg-[#d8a84f] text-[#171814] shadow-md">
                                  <Star className="size-3.5 fill-current" />
                                </span>
                              )}
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
                <div className={`rounded-md border p-4 shadow-sm xl:col-span-2 ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Site settings</h2>
                      <p className={`mt-1 text-xs ${mutedTextClass}`}>Design the public portfolio experience, preview it with the active gallery, then save.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {siteSettingsSaveStatus === "saved" && (
                        <span className="rounded-full bg-[#e9f1dc] px-3 py-1 text-xs font-medium text-[#466026]">Saved</span>
                      )}
                      <button
                        className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                        onClick={saveSiteSettings}
                        type="button"
                      >
                        <Settings2 className="size-4" />
                        Save settings
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md border border-[#e5ded2] bg-[#fbfaf7] p-3">
                    <div className="grid gap-3 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <ImagePlus className="size-4 text-[#99702d]" />
                        Home page cover
                      </div>
                      <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-end">
                        <label className="grid gap-1 text-xs font-medium">
                          Display mode
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                homeCoverMode: event.target.value as SiteSettings["homeCoverMode"],
                              }))
                            }
                            value={siteSettings.homeCoverMode}
                          >
                            <option value="rotate">Rotate cover images</option>
                            <option value="static">Static image</option>
                          </select>
                        </label>
                        {siteSettings.homeCoverMode === "static" ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {homeCoverOptions.slice(0, 10).map((cover, index) => (
                              <button
                                aria-label={`Use home page image ${index + 1}`}
                                className={`relative h-12 w-20 shrink-0 overflow-hidden rounded-md border ${
                                  siteSettings.homeCoverImage === cover ? "border-[#b08336] ring-2 ring-[#ead29b]" : "border-[#ded8cc]"
                                }`}
                                key={cover}
                                onClick={() =>
                                  setSiteSettings((current) => ({
                                    ...current,
                                    homeCoverImage: cover,
                                  }))
                                }
                                type="button"
                              >
                                <Image alt={`Home page image option ${index + 1}`} className="object-cover" fill sizes="80px" src={cover} />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-xs leading-5 ${mutedTextClass}`}>Rotates through portfolio cover images every 2 seconds.</p>
                        )}
                      </div>
                      <div className="grid min-w-[220px] gap-2">
                        <label className="flex items-center justify-between gap-3 text-xs font-medium">
                          <span>Dim image</span>
                          <input
                            checked={siteSettings.homeCoverDimEnabled}
                            className="size-4 accent-[#d8a84f]"
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                homeCoverDimEnabled: event.target.checked,
                              }))
                            }
                            type="checkbox"
                          />
                        </label>
                        {siteSettings.homeCoverDimEnabled && (
                          <div className="flex h-9 items-center gap-3 rounded-md border border-[#e5ded2] bg-white px-3">
                            <input
                              aria-label="Home page image dim amount"
                              className="min-w-0 flex-1 accent-[#d8a84f]"
                              max="90"
                              min="0"
                              onChange={(event) =>
                                setSiteSettings((current) => ({
                                  ...current,
                                  homeCoverDimPercent: Number(event.target.value),
                                }))
                              }
                              type="range"
                              value={siteSettings.homeCoverDimPercent}
                            />
                            <span className={`w-10 text-right text-xs font-normal ${mutedTextClass}`}>{siteSettings.homeCoverDimPercent}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <Images className="size-4 text-[#99702d]" />
                          Gallery templates
                        </div>
                        <span className={`text-xs ${mutedTextClass}`}>{activeTemplatePreview.label}</span>
                      </div>
                      <div className="mt-3 grid max-h-[430px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {(Object.entries(siteTemplatePresets) as Array<[SiteSettings["siteTemplate"], typeof siteTemplatePresets[SiteSettings["siteTemplate"]]]>).map(([templateKey, template]) => (
                          <button
                            className={`rounded-md border p-3 text-left transition ${
                              siteSettings.siteTemplate === templateKey
                                ? "border-[#b08336] bg-[#fff8e8] ring-2 ring-[#ead29b]"
                                : isDark
                                  ? "border-white/15 bg-white/5 hover:bg-white/10"
                                  : "border-[#e5ded2] bg-white hover:bg-[#fbf8f2]"
                            }`}
                            key={templateKey}
                            onBlur={() => setPreviewTemplate(null)}
                            onFocus={() => setPreviewTemplate(templateKey)}
                            onMouseEnter={() => setPreviewTemplate(templateKey)}
                            onMouseLeave={() => setPreviewTemplate(null)}
                            onClick={() =>
                              setSiteSettings((current) => ({
                                ...current,
                                galleryDensity: template.galleryDensity,
                                pageWidth: template.pageWidth,
                                publicBackground: template.publicBackground,
                                showBreadcrumbs: template.showBreadcrumbs,
                                showGalleryImageCounts: template.showGalleryImageCounts,
                                showGalleryLabels: template.showGalleryLabels,
                                showSiteMenu: template.showSiteMenu,
                                siteAccentColor: template.accent,
                                siteTemplate: templateKey,
                                tileShape: template.tileShape,
                              }))
                            }
                            type="button"
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold">{template.label}</span>
                                <span className={`mt-1 block text-xs leading-5 ${siteSettings.siteTemplate === templateKey ? "text-[#735223]" : mutedTextClass}`}>
                                  {template.useCase}
                                </span>
                              </span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                siteSettings.siteTemplate === templateKey ? "bg-[#d8a84f] text-[#171814]" : "bg-black/5 text-[#777064]"
                              }`}>
                                {siteSettings.siteTemplate === templateKey ? "Selected" : "View"}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-[#e5ded2] bg-[#fbfaf7] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Live gallery preview</p>
                          <p className={`mt-1 text-xs ${mutedTextClass}`}>{activeGallery.name}</p>
                        </div>
                        <span className="rounded-full bg-[#1f2a24] px-3 py-1 text-xs font-medium text-white">
                          {previewTemplate ? "Hover preview" : "Selected template"}
                        </span>
                      </div>
                      <TemplateGalleryPreview
                        gallery={activeGallery}
                        photos={renderablePhotos}
                        template={activeTemplatePreview}
                        templateKey={activeTemplatePreviewKey}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Settings2 className="size-4 text-[#99702d]" />
                        Design scope
                      </div>
                      <label className="mt-3 grid gap-1 text-xs font-medium">
                        Apply changes to
                        <select
                          className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                          onChange={(event) =>
                            setSiteSettings((current) => ({
                              ...current,
                              designScope: event.target.value as SiteSettings["designScope"],
                            }))
                          }
                          value={siteSettings.designScope}
                        >
                          <option value="entire-site">Entire site</option>
                          <option value="homepage">Homepage experience</option>
                          <option value="all-galleries">All portfolio galleries</option>
                        </select>
                      </label>
                    </div>

                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Sun className="size-4 text-[#99702d]" />
                        Theme and background
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <label className="grid gap-1 text-xs font-medium">
                          Public background
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                publicBackground: event.target.value as SiteSettings["publicBackground"],
                              }))
                            }
                            value={siteSettings.publicBackground}
                          >
                            <option value="black">Pure black</option>
                            <option value="soft-black">Soft black</option>
                            <option value="white">White gallery</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          Accent color
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                siteAccentColor: event.target.value as SiteSettings["siteAccentColor"],
                              }))
                            }
                            value={siteSettings.siteAccentColor}
                          >
                            <option value="gold">Gallery gold</option>
                            <option value="emerald">Launch green</option>
                            <option value="blue">Cool blue</option>
                            <option value="white">Minimal white</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Folder className="size-4 text-[#99702d]" />
                        Portfolio layout
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <label className="grid gap-1 text-xs font-medium">
                          Density
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                galleryDensity: event.target.value as SiteSettings["galleryDensity"],
                              }))
                            }
                            value={siteSettings.galleryDensity}
                          >
                            <option value="immersive">Immersive covers</option>
                            <option value="balanced">Balanced grid</option>
                            <option value="compact">Compact browsing</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          Width
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                pageWidth: event.target.value as SiteSettings["pageWidth"],
                              }))
                            }
                            value={siteSettings.pageWidth}
                          >
                            <option value="full">Edge-to-edge</option>
                            <option value="wide">Wide contained</option>
                            <option value="contained">Editorial contained</option>
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          Corners
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                tileShape: event.target.value as SiteSettings["tileShape"],
                              }))
                            }
                            value={siteSettings.tileShape}
                          >
                            <option value="square">Sharp</option>
                            <option value="soft">Soft</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Images className="size-4 text-[#99702d]" />
                        Page content
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {[
                          ["productPreview", "Product preview blocks"],
                          ["mobileShowcase", "Mobile showcase section"],
                          ["comparison", "Platform comparison"],
                          ["lightroomWorkflow", "Lightroom workflow"],
                          ["roadmap", "Roadmap / backend section"],
                        ].map(([key, label]) => (
                          <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-[#e5ded2] px-3 py-2 text-sm font-medium" key={key}>
                            <span>{label}</span>
                            <input
                              checked={siteSettings.homeContentBlocks[key as keyof SiteSettings["homeContentBlocks"]]}
                              className="size-4 accent-[#d8a84f]"
                              onChange={(event) =>
                                setSiteSettings((current) => ({
                                  ...current,
                                  homeContentBlocks: {
                                    ...current.homeContentBlocks,
                                    [key]: event.target.checked,
                                  },
                                }))
                              }
                              type="checkbox"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Globe2 className="size-4 text-[#99702d]" />
                        Visitor access
                      </div>
                      <div className="mt-3 grid gap-2">
                        {[
                          ["allowVisitorDownloads", "Allow downloads", Download],
                          ["allowVisitorCopy", "Allow copy links", Copy],
                          ["preferHdrDisplay", "Prefer HDR display", Eye],
                        ].map(([key, label, Icon]) => {
                          const SettingIcon = Icon as typeof Eye
                          return (
                            <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-[#e5ded2] px-3 py-2 text-sm font-medium" key={key as string}>
                              <span className="flex items-center gap-3">
                                <SettingIcon className="size-4 text-[#99702d]" />
                                {label as string}
                              </span>
                              <input
                                checked={Boolean(siteSettings[key as keyof SiteSettings])}
                                className="size-4 accent-[#d8a84f]"
                                onChange={(event) =>
                                  setSiteSettings((current) => ({
                                    ...current,
                                    [key as string]: event.target.checked,
                                  }))
                                }
                                type="checkbox"
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <Eye className="size-4 text-[#99702d]" />
                      Visitor chrome
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      {[
                        ["showSiteMenu", "Site menu"],
                        ["showSocialLinks", "Social sharing"],
                        ["showBreadcrumbs", "Breadcrumb"],
                        ["showGalleryLabels", "Gallery labels"],
                        ["showGalleryImageCounts", "Image counts"],
                      ].map(([key, label]) => (
                        <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-[#e5ded2] px-3 py-2 text-sm font-medium" key={key}>
                          <span>{label}</span>
                          <input
                            checked={Boolean(siteSettings[key as keyof SiteSettings])}
                            className="size-4 accent-[#d8a84f]"
                            onChange={(event) =>
                              setSiteSettings((current) => ({
                                ...current,
                                [key]: event.target.checked,
                              }))
                            }
                            type="checkbox"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

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

                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Share2 className="size-4 text-[#99702d]" />
                      Public gallery link
                    </span>
                    <div className="flex gap-2">
                      <input
                        className={`h-9 min-w-0 flex-1 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                        readOnly
                        value={publicGalleryUrl}
                      />
                      <button
                        className={`flex h-9 w-10 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                        onClick={() => navigator.clipboard?.writeText(publicGalleryUrl)}
                        type="button"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </label>

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <Share2 className="size-4 text-[#99702d]" />
                      Share tools
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <a
                        className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                        href={emailInviteUrl}
                      >
                        <Mail className="size-4" />
                        Email invite
                      </a>
                      <a
                        className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                        }`}
                        href={qrCodeUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <QrCode className="size-4" />
                        QR code
                      </a>
                    </div>
                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                      Use these to send a single gallery without asking a photographer to move their whole website.
                    </p>
                  </div>

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <label className="flex items-center justify-between gap-4 text-sm font-medium">
                      <span className="flex items-center gap-3">
                        <Code2 className="size-4 text-[#99702d]" />
                        Website embed
                      </span>
                      <input
                        checked={activeGallery.embedEnabled ?? true}
                        className="size-4 accent-[#d8a84f]"
                        onChange={(event) => updateActiveGallery({ embedEnabled: event.target.checked })}
                        type="checkbox"
                      />
                    </label>
                    {(activeGallery.embedEnabled ?? true) && (
                      <div className="mt-3 grid gap-2">
                        <textarea
                          className={`min-h-24 rounded-md border p-2 font-mono text-xs font-normal outline-none ${fieldClass}`}
                          readOnly
                          value={embedCode}
                        />
                        <button
                          className="h-9 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                          onClick={() => navigator.clipboard?.writeText(embedCode)}
                          type="button"
                        >
                          Copy embed code
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <Globe2 className="size-4 text-[#99702d]" />
                      Search and social preview
                    </div>
                    <div className="mt-3 grid gap-3">
                      <label className="grid gap-1 text-xs font-medium">
                        SEO title
                        <input
                          className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                          onChange={(event) => updateActiveGallery({ seoTitle: event.target.value })}
                          placeholder={activeGallery.name}
                          value={activeGallery.seoTitle ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-medium">
                        SEO description
                        <textarea
                          className={`min-h-20 rounded-md border p-2 text-sm font-normal outline-none ${fieldClass}`}
                          onChange={(event) => updateActiveGallery({ seoDescription: event.target.value })}
                          placeholder={activeGallery.description}
                          value={activeGallery.seoDescription ?? ""}
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-medium">
                        Social preview image URL
                        <input
                          className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                          onChange={(event) => updateActiveGallery({ socialImageUrl: event.target.value })}
                          placeholder={activeGallery.cover}
                          value={activeGallery.socialImageUrl ?? ""}
                        />
                      </label>
                    </div>
                  </div>

                  {activeGallery.privacy === "Password" && (
                    <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                      <span className="flex items-center gap-3">
                        <Lock className="size-4 text-[#99702d]" />
                        Gallery password
                      </span>
                      <input
                        className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                        onChange={(event) => updateActiveGallery({ password: event.target.value })}
                        placeholder="Set password"
                        type="text"
                        value={activeGallery.password ?? ""}
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between gap-4 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Download className="size-4 text-[#99702d]" />
                      Downloads
                    </span>
                    <input
                      checked={activeGallery.allowDownloads ?? true}
                      className="size-4 accent-[#d8a84f]"
                      onChange={(event) => updateActiveGallery({ allowDownloads: event.target.checked })}
                      type="checkbox"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Star className="size-4 text-[#99702d]" />
                      Let visitors favorite images
                    </span>
                    <input
                      checked={activeGallery.allowFavorites ?? true}
                      className="size-4 accent-[#d8a84f]"
                      onChange={(event) => updateActiveGallery({ allowFavorites: event.target.checked })}
                      type="checkbox"
                    />
                  </label>

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <label className="flex items-center justify-between gap-4 text-sm font-medium">
                      <span className="flex items-center gap-3">
                        <Star className="size-4 text-[#99702d]" />
                        Watermark public view
                      </span>
                      <input
                        checked={activeGallery.watermarkEnabled ?? false}
                        className="size-4 accent-[#d8a84f]"
                        onChange={(event) => updateActiveGallery({ watermarkEnabled: event.target.checked })}
                        type="checkbox"
                      />
                    </label>

                    {activeGallery.watermarkEnabled && (
                      <div className="mt-3 grid gap-3">
                        <label className="grid gap-1 text-xs font-medium">
                          Type
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              updateActiveGallery({ watermarkMode: event.target.value as Gallery["watermarkMode"] })
                            }
                            value={activeGallery.watermarkMode ?? "text"}
                          >
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="both">Text + image</option>
                          </select>
                        </label>

                        {(activeGallery.watermarkMode ?? "text") !== "image" && (
                          <label className="grid gap-1 text-xs font-medium">
                            Watermark text
                            <input
                              className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                              onChange={(event) => updateActiveGallery({ watermarkText: event.target.value })}
                              placeholder={activeGallery.client}
                              value={activeGallery.watermarkText ?? activeGallery.client}
                            />
                          </label>
                        )}

                        {(activeGallery.watermarkMode === "image" || activeGallery.watermarkMode === "both") && (
                          <div className="grid gap-2">
                            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#cfc6b8] px-3 text-sm font-medium">
                              <Upload className="size-4" />
                              {watermarkUploadStatus === "uploading" ? "Uploading..." : "Upload watermark image"}
                              <input
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={watermarkUploadStatus === "uploading"}
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file) void uploadWatermarkImage(file)
                                  event.currentTarget.value = ""
                                }}
                                type="file"
                              />
                            </label>
                            {activeGallery.watermarkImageUrl && (
                              <div className="relative h-20 overflow-hidden rounded-md border border-[#ded8cc] bg-black/5">
                                <Image
                                  alt="Watermark image preview"
                                  className="object-contain p-2"
                                  fill
                                  sizes="160px"
                                  src={activeGallery.watermarkImageUrl}
                                />
                              </div>
                            )}
                            {watermarkUploadStatus === "error" && (
                              <p className="text-xs text-[#a13f2f]">Watermark upload failed.</p>
                            )}
                          </div>
                        )}

                        <label className="grid gap-1 text-xs font-medium">
                          Position
                          <select
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) =>
                              updateActiveGallery({ watermarkPosition: event.target.value as Gallery["watermarkPosition"] })
                            }
                            value={activeGallery.watermarkPosition ?? "bottom-right"}
                          >
                            <option value="bottom-right">Bottom right</option>
                            <option value="bottom-left">Bottom left</option>
                            <option value="top-right">Top right</option>
                            <option value="top-left">Top left</option>
                            <option value="center">Center</option>
                          </select>
                        </label>

                        <label className="grid gap-1 text-xs font-medium">
                          Opacity
                          <input
                            className="accent-[#d8a84f]"
                            max="100"
                            min="10"
                            onChange={(event) => updateActiveGallery({ watermarkOpacity: Number(event.target.value) })}
                            type="range"
                            value={activeGallery.watermarkOpacity ?? 55}
                          />
                        </label>

                        <label className="grid gap-1 text-xs font-medium">
                          Size
                          <input
                            className="accent-[#d8a84f]"
                            max="260"
                            min="80"
                            onChange={(event) => updateActiveGallery({ watermarkSize: Number(event.target.value) })}
                            type="range"
                            value={activeGallery.watermarkSize ?? 140}
                          />
                        </label>
                      </div>
                    )}
                  </div>

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

                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center justify-between gap-3 text-sm font-medium">
                      <span className="flex items-center gap-3">
                        <EyeOff className="size-4 text-[#99702d]" />
                        Hidden photos
                      </span>
                      <span className={`text-xs font-normal ${mutedTextClass}`}>{hiddenPhotos.length}</span>
                    </div>
                    {hiddenPhotos.length > 0 ? (
                      <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {hiddenPhotos.map((photo) => (
                          <div className="overflow-hidden rounded-md border border-[#ded8cc]" key={photo.id}>
                            <div className="relative aspect-[3/2]">
                              <Image
                                alt={photo.title}
                                className="object-contain"
                                fill
                                sizes="120px"
                                src={getThumbnailUrl(photo)}
                              />
                            </div>
                            <button
                              className="flex h-8 w-full items-center justify-center gap-2 border-t border-[#ded8cc] text-xs font-medium"
                              onClick={() => restorePhoto(photo.id)}
                              type="button"
                            >
                              <Undo2 className="size-3.5" />
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`mt-2 text-sm ${mutedTextClass}`}>No hidden photos in this gallery.</p>
                    )}
                  </div>

                  {[
                    [Download, "Downloads", activeGallery.allowDownloads ?? true ? "Enabled" : "Disabled"],
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
        <div
          className="fixed inset-0 z-[60] flex touch-pan-y items-center justify-center bg-black"
          onTouchEnd={(event) => handleViewerTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
        >
          <label className="absolute left-1/2 top-5 z-10 flex h-10 -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-medium text-white shadow-sm">
            <Sun className="size-4" />
            <input
              aria-label="Showcase image brightness"
              className="w-44 accent-[#d8a84f]"
              max="150"
              min="50"
              onChange={(event) => setImageBrightness(Number(event.target.value))}
              onInput={(event) => updateImageBrightness(event.currentTarget.value)}
              type="range"
              value={imageBrightness}
            />
            <span className="w-10 text-right text-xs">{imageBrightness}%</span>
          </label>
          {galleryItemCount > 1 && (
            <button
              aria-label="Previous showcase photo"
              className="absolute left-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-sm"
              onClick={showPreviousPhoto}
              type="button"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <button
            aria-label="Close lightbox"
            className="absolute right-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-sm"
            onClick={() => setIsShowcaseOpen(false)}
            type="button"
          >
            <X className="size-5" />
          </button>
          <div className="relative h-[100dvh] w-screen">
            <Image
              alt={activePhoto?.title ?? `${activeGallery.name} showcase`}
              className="object-contain"
              fill
              priority
              sizes="100vw"
              style={activeImageStyle}
              src={activeImageSource}
            />
          </div>
          {galleryItemCount > 1 && (
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
