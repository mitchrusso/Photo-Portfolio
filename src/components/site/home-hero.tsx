"use client"

import { Globe2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  defaultSiteSettings,
  LOCAL_GALLERY_STORAGE_KEY,
  SITE_SETTINGS_STORAGE_KEY,
  type PortfolioGallery,
  type SiteSettings,
} from "@/lib/gallery-utils"

type HomeHeroProps = {
  galleries: PortfolioGallery[]
}

export function HomeHero({ galleries }: HomeHeroProps) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [visibleGalleries, setVisibleGalleries] = useState(galleries)
  const [activeCoverIndex, setActiveCoverIndex] = useState(0)

  useEffect(() => {
    try {
      const savedGalleries = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      const savedSettings = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY)

      if (savedGalleries) {
        const parsedGalleries = JSON.parse(savedGalleries) as PortfolioGallery[]
        if (Array.isArray(parsedGalleries) && parsedGalleries.length > 0) {
          queueMicrotask(() => setVisibleGalleries(parsedGalleries))
        }
      }

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as Partial<SiteSettings>
        queueMicrotask(() => setSiteSettings({ ...defaultSiteSettings, ...parsedSettings }))
      }
    } catch {
      return
    }
  }, [])

  const coverImages = useMemo(
    () => visibleGalleries.map((gallery) => gallery.cover).filter(Boolean),
    [visibleGalleries],
  )

  useEffect(() => {
    if (siteSettings.homeCoverMode !== "rotate" || coverImages.length < 2) return

    const interval = window.setInterval(() => {
      setActiveCoverIndex((current) => (current + 1) % coverImages.length)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [coverImages.length, siteSettings.homeCoverMode])

  const heroCover =
    siteSettings.homeCoverMode === "static" && siteSettings.homeCoverImage
      ? siteSettings.homeCoverImage
      : coverImages[activeCoverIndex % Math.max(coverImages.length, 1)] ?? galleries[0]?.cover

  const heroGallery =
    visibleGalleries.find((gallery) => gallery.cover === heroCover) ?? visibleGalleries[0] ?? galleries[0]
  const dimOpacity = siteSettings.homeCoverDimEnabled
    ? Math.min(Math.max(siteSettings.homeCoverDimPercent, 0), 90) / 100
    : 0

  return (
    <section className="relative min-h-[86vh] overflow-hidden">
      {heroCover && (
        <Image
          alt={`${heroGallery?.name ?? "Portfolio"} landscape`}
          className="object-cover transition-opacity duration-500"
          fill
          priority
          sizes="100vw"
          src={heroCover}
        />
      )}
      <div className="absolute inset-0 bg-black transition-opacity duration-300" style={{ opacity: dimOpacity }} />
      <div className="relative z-10 flex min-h-[86vh] max-w-5xl flex-col justify-end px-6 pb-14 drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] md:px-10">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-white/70">
          <Globe2 className="size-4" />
          Fine art travel photography
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">Mitch Russo Photography</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
          Field-tested images from ice, desert, night skies, ancient cities, and remote roads.
        </p>
      </div>
    </section>
  )
}
