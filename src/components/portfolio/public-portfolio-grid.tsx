"use client"

import Image from "next/image"
import Link from "next/link"
import { Lock } from "lucide-react"
import { useEffect, useState } from "react"
import {
  defaultSiteSettings,
  getPublicGalleryCoverUrl,
  getSiteTemplatePreset,
  LOCAL_GALLERY_STORAGE_KEY,
  mergeSiteSettings,
  publicGalleryPath,
  SITE_SETTINGS_STORAGE_KEY,
  type PortfolioGallery,
  type SiteSettings,
} from "@/lib/gallery-utils"
import { cn } from "@/lib/utils"

type PublicPortfolioGridProps = {
  allowLocalOverrides?: boolean
  demoMode?: boolean
  galleries: PortfolioGallery[]
  initialGalleryName?: string
  visibilityMode?: "public" | "shareable"
}

export function PublicPortfolioGrid({
  allowLocalOverrides = true,
  demoMode = false,
  galleries,
  initialGalleryName,
  visibilityMode = "public",
}: PublicPortfolioGridProps) {
  const [visibleGalleries, setVisibleGalleries] = useState(galleries)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)

  useEffect(() => {
    if (demoMode || !allowLocalOverrides) return

    try {
      const saved = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      const savedSettings = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY)

      if (saved) {
        const parsed = JSON.parse(saved) as PortfolioGallery[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => setVisibleGalleries(parsed))
        }
      }

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Partial<SiteSettings>
        queueMicrotask(() => setSiteSettings(mergeSiteSettings(parsedSettings)))
      }
    } catch {
      return
    }
  }, [allowLocalOverrides, demoMode])

  const gridClass = {
    balanced: "mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
    compact: "mt-8 grid gap-2 sm:grid-cols-3 xl:grid-cols-5",
    immersive: "mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
  }[siteSettings.galleryDensity]
  const shapeClass = siteSettings.tileShape === "soft" ? "rounded-md" : "rounded-sm"
  const maxWidthClass = {
    contained: "mx-auto max-w-6xl",
    full: "",
    wide: "mx-auto max-w-[1600px]",
  }[siteSettings.pageWidth]
  const template = getSiteTemplatePreset(siteSettings.siteTemplate)
  const tileAspectClass = {
    "black-white": "aspect-[3/2]",
    cinematic: "aspect-[16/9]",
    commercial: "aspect-[5/4]",
    editorial: "aspect-[4/5] lg:aspect-[3/4]",
    embedded: "aspect-[16/10]",
    event: "aspect-[4/3]",
    "fine-art": "aspect-[4/5]",
    fullscreen: "aspect-[21/9]",
    masonry: "aspect-[5/4] even:aspect-[3/4]",
    minimal: "aspect-square",
    portrait: "aspect-[4/5]",
    "real-estate": "aspect-[16/9]",
    sidecar: "aspect-[16/10]",
    sports: "aspect-[4/3]",
    "travel-journal": "aspect-[16/10]",
    "wedding-story": "aspect-[4/5] lg:aspect-[3/4]",
  }[siteSettings.siteTemplate]
  const imageFitClass = "object-cover"
  const labelClass =
    siteSettings.siteTemplate === "editorial" ||
    siteSettings.siteTemplate === "commercial" ||
    siteSettings.siteTemplate === "real-estate" ||
    siteSettings.siteTemplate === "wedding-story"
      ? "absolute inset-x-0 bottom-0 bg-white/88 px-3 py-2 text-black"
      : siteSettings.siteTemplate === "minimal" ||
          siteSettings.siteTemplate === "embedded" ||
          siteSettings.siteTemplate === "fine-art" ||
          siteSettings.siteTemplate === "fullscreen"
        ? "absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-white"
        : "absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-white"
  const usesLightLabel =
    siteSettings.siteTemplate === "commercial" ||
    siteSettings.siteTemplate === "editorial" ||
    siteSettings.siteTemplate === "real-estate" ||
    siteSettings.siteTemplate === "wedding-story"
  const publicGalleries = visibleGalleries.filter((gallery) =>
    visibilityMode === "shareable"
      ? ["Public", "Private link", "Password"].includes(gallery.privacy)
      : gallery.status !== "Draft" && gallery.privacy === "Public",
  )
  const galleryGroups = Array.from(new Set(publicGalleries.map((gallery) => gallery.galleryName?.trim() || "Other portfolios")))
  const initialGroup = initialGalleryName && galleryGroups.includes(initialGalleryName) ? initialGalleryName : "all"
  const [activeGroup, setActiveGroup] = useState(initialGroup)
  const displayedGroups = activeGroup === "all" ? galleryGroups : galleryGroups.filter((group) => group === activeGroup)

  return (
    <div className={cn("mt-8", maxWidthClass)} data-template={template.label}>
      {galleryGroups.length > 1 ? (
        <nav aria-label="Gallery filters" className="flex flex-wrap gap-2">
          {["all", ...galleryGroups].map((group) => (
            <button
              aria-pressed={activeGroup === group}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                activeGroup === group ? "border-white bg-white text-black" : "border-white/25 text-white hover:border-white/60",
              )}
              key={group}
              onClick={() => setActiveGroup(group)}
              type="button"
            >
              {group === "all" ? "All galleries" : group}
            </button>
          ))}
        </nav>
      ) : null}
      {displayedGroups.map((group) => {
        const groupGalleries = publicGalleries.filter((gallery) => (gallery.galleryName?.trim() || "Other portfolios") === group)
        return (
          <section className="mt-10" key={group}>
            <h2 className="text-lg font-semibold">{group}</h2>
            <div className={gridClass}>
              {groupGalleries.map((gallery, index) => (
        <Link
          className={cn("group relative overflow-hidden border border-white/10", tileAspectClass, shapeClass)}
          href={demoMode ? `/demo/${encodeURIComponent(gallery.id)}` : publicGalleryPath(gallery.id, gallery.workspaceSlug)}
          key={gallery.id}
        >
          {gallery.parentGalleryProtection ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111713] text-center text-white">
              <Lock className="size-7 text-[#d8a84f]" />
              <span className="px-4 text-xs font-semibold uppercase tracking-[0.16em]">
                Protected Gallery
              </span>
            </span>
          ) : (
            <Image
              alt={`${gallery.name} cover`}
              className={cn(imageFitClass, "transition duration-300 group-hover:scale-[1.03]")}
              fill
              loading={index === 0 ? "eager" : "lazy"}
              priority={index === 0}
              sizes="(min-width: 1280px) 25vw, 90vw"
              src={demoMode ? (gallery.photos?.[0]?.thumbnailUrl ?? gallery.cover) : getPublicGalleryCoverUrl(gallery)}
              unoptimized
            />
          )}
          {(siteSettings.showGalleryLabels || siteSettings.showGalleryImageCounts) && (
            <div className={labelClass}>
              {siteSettings.showGalleryLabels && <p className="text-sm font-semibold">{gallery.name}</p>}
              {siteSettings.showGalleryImageCounts && (
                <p className={cn("text-xs", usesLightLabel ? "text-black/55" : "text-white/55")}>{gallery.images} images</p>
              )}
            </div>
          )}
        </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
