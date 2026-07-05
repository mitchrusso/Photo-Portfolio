"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  defaultSiteSettings,
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
  galleries: PortfolioGallery[]
}

export function PublicPortfolioGrid({ galleries }: PublicPortfolioGridProps) {
  const [visibleGalleries, setVisibleGalleries] = useState(galleries)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)

  useEffect(() => {
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
  }, [])

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
    cinematic: "aspect-[16/9]",
    editorial: "aspect-[4/5] lg:aspect-[3/4]",
    event: "aspect-[4/3]",
    minimal: "aspect-square",
    sidecar: "aspect-[16/10]",
  }[siteSettings.siteTemplate]
  const imageFitClass = siteSettings.siteTemplate === "editorial" || siteSettings.siteTemplate === "minimal" ? "object-cover" : "object-cover"
  const labelClass =
    siteSettings.siteTemplate === "editorial"
      ? "absolute inset-x-0 bottom-0 bg-white/88 px-3 py-2 text-black"
      : siteSettings.siteTemplate === "minimal"
        ? "absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-white"
        : "absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-white"

  return (
    <div className={cn(gridClass, maxWidthClass)} data-template={template.label}>
      {visibleGalleries.map((gallery) => (
        <Link
          className={cn("group relative overflow-hidden border border-white/10", tileAspectClass, shapeClass)}
          href={publicGalleryPath(gallery.id)}
          key={gallery.id}
        >
          <Image
            alt={`${gallery.name} cover`}
            className={cn(imageFitClass, "transition duration-300 group-hover:scale-[1.03]")}
            fill
            sizes="(min-width: 1280px) 25vw, 90vw"
            src={gallery.cover}
          />
          {(siteSettings.showGalleryLabels || siteSettings.showGalleryImageCounts) && (
            <div className={labelClass}>
              {siteSettings.showGalleryLabels && <p className="text-sm font-semibold">{gallery.name}</p>}
              {siteSettings.showGalleryImageCounts && (
                <p className={cn("text-xs", siteSettings.siteTemplate === "editorial" ? "text-black/55" : "text-white/55")}>{gallery.images} images</p>
              )}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
