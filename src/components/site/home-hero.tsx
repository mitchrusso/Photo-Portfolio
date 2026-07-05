"use client"

import { ChevronRight, Globe2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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

  return (
    <section className="relative min-h-[86vh] overflow-hidden">
      {heroCover && (
        <Image
          alt={`${heroGallery?.name ?? "Portfolio"} landscape`}
          className="object-cover opacity-75 transition-opacity duration-500"
          fill
          priority
          sizes="100vw"
          src={heroCover}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/20" />
      <div className="relative z-10 flex min-h-[86vh] max-w-5xl flex-col justify-end px-6 pb-14 md:px-10">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-white/70">
          <Globe2 className="size-4" />
          Fine art travel photography
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">Mitch Russo Photography</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
          Field-tested images from ice, desert, night skies, ancient cities, and remote roads.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="flex h-11 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black" href="/portfolio">
            View portfolio
            <ChevronRight className="size-4" />
          </Link>
          <Link className="flex h-11 items-center gap-2 rounded-md border border-white/20 bg-black/30 px-4 text-sm font-semibold text-white" href="/whats-in-my-bag">
            What&apos;s in my bag
          </Link>
        </div>
      </div>
    </section>
  )
}
