"use client"

import { ArrowLeft, Camera, Mail, MapPin, PenLine, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PublicPortfolioGrid } from "@/components/portfolio/public-portfolio-grid"
import { migratedGalleries } from "@/data/migrated-galleries"
import { LOCAL_GALLERY_STORAGE_KEY, type PortfolioGallery } from "@/lib/gallery-utils"

const WEBSITE_BUILDER_STORAGE_KEY = "photoviewpro-website-builder-v1"

type WebsiteTemplate =
  | "article-first"
  | "about-first"
  | "cinematic-home"
  | "clean-grid"
  | "creator-studio"
  | "darkroom"
  | "editorial-magazine"
  | "gear-notebook"
  | "landing-portfolios"
  | "panorama-scroll"
  | "minimal-white"
  | "mosaic-board"
  | "museum-wall"
  | "portfolio-index"
  | "social-hub"
  | "split-hero"
  | "story-journal"
  | "travel-atlas"

type WebsiteBuilderSettings = {
  customDomain: string
  customPageTitle: string
  enabledBlocks: {
    articles: boolean
    callToAction: boolean
    featuredPortfolio: boolean
    gear: boolean
    hero: boolean
    portfolioGrid: boolean
    textBlock: boolean
  }
  enabledPages: {
    about: boolean
    articles: boolean
    blog: boolean
    contact: boolean
    custom: boolean
    gear: boolean
    home: boolean
  }
  featuredGalleryIds: string[]
  heroButtonLabel: string
  heroHeadline: string
  heroSubhead: string
  subdomain: string
  template: WebsiteTemplate
}

function createDefaultWebsiteSettings(galleries: PortfolioGallery[]): WebsiteBuilderSettings {
  return {
    customDomain: "",
    customPageTitle: "Trips",
    enabledBlocks: {
      articles: true,
      callToAction: true,
      featuredPortfolio: true,
      gear: false,
      hero: true,
      portfolioGrid: true,
      textBlock: true,
    },
    enabledPages: {
      about: true,
      articles: true,
      blog: true,
      contact: true,
      custom: false,
      gear: true,
      home: true,
    },
    featuredGalleryIds: galleries.slice(0, 4).map((gallery) => gallery.id),
    heroButtonLabel: "View portfolios",
    heroHeadline: "Photography worth slowing down for.",
    heroSubhead: "A curated home for the work, stories, trips, and tools behind the images.",
    subdomain: "yourname",
    template: "cinematic-home",
  }
}

const templateLabels: Record<WebsiteTemplate, string> = {
  "article-first": "Article first",
  "about-first": "About first",
  "cinematic-home": "Cinematic home",
  "clean-grid": "Clean portfolio grid",
  "creator-studio": "Creator studio",
  darkroom: "Darkroom",
  "editorial-magazine": "Editorial magazine",
  "gear-notebook": "Gear notebook",
  "landing-portfolios": "Landing + portfolios",
  "minimal-white": "Minimal white",
  "mosaic-board": "Mosaic board",
  "museum-wall": "Museum wall",
  "panorama-scroll": "Panorama scroll",
  "portfolio-index": "Portfolio index",
  "social-hub": "Social hub",
  "split-hero": "Split hero",
  "story-journal": "Story journal",
  "travel-atlas": "Travel atlas",
}

const lightTemplates: WebsiteTemplate[] = ["minimal-white", "museum-wall", "editorial-magazine", "about-first"]

export function WebsiteDraftPreview() {
  const seedGalleries = migratedGalleries as PortfolioGallery[]
  const [galleries, setGalleries] = useState(seedGalleries)
  const [settings, setSettings] = useState<WebsiteBuilderSettings>(() => createDefaultWebsiteSettings(seedGalleries))
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    try {
      const savedGalleries = window.localStorage.getItem(LOCAL_GALLERY_STORAGE_KEY)
      const parsedGalleries = savedGalleries ? (JSON.parse(savedGalleries) as PortfolioGallery[]) : null
      const nextGalleries = Array.isArray(parsedGalleries) && parsedGalleries.length > 0 ? parsedGalleries : seedGalleries

      const savedWebsite = window.localStorage.getItem(WEBSITE_BUILDER_STORAGE_KEY)
      let nextSettings = createDefaultWebsiteSettings(nextGalleries)
      let nextHasDraft = false

      if (savedWebsite) {
        const parsedSettings = JSON.parse(savedWebsite) as Partial<WebsiteBuilderSettings>
        nextSettings = { ...nextSettings, ...parsedSettings }
        nextHasDraft = true
      }

      queueMicrotask(() => {
        setGalleries(nextGalleries)
        setSettings(nextSettings)
        setHasDraft(nextHasDraft)
      })
    } catch {
      queueMicrotask(() => setSettings(createDefaultWebsiteSettings(seedGalleries)))
    }
  }, [seedGalleries])

  const featuredGalleries = useMemo(() => {
    const selected = settings.featuredGalleryIds
      .map((galleryId) => galleries.find((gallery) => gallery.id === galleryId))
      .filter(Boolean) as PortfolioGallery[]

    return selected.length > 0 ? selected : galleries.slice(0, 4)
  }, [galleries, settings.featuredGalleryIds])

  const heroCover = featuredGalleries[0]?.cover ?? galleries[0]?.cover
  const isLight = lightTemplates.includes(settings.template)
  const pageClass = isLight ? "bg-[#f6f1e8] text-[#171814]" : "bg-[#070806] text-white"
  const mutedClass = isLight ? "text-[#6f675c]" : "text-white/62"
  const borderClass = isLight ? "border-[#ded4c5]" : "border-white/12"
  const cardClass = isLight ? "bg-white text-[#171814]" : "bg-white/[0.04] text-white"
  const navPages = [
    settings.enabledPages.home ? "Home" : null,
    settings.enabledPages.about ? "About" : null,
    settings.enabledPages.gear ? "What's in My Bag" : null,
    settings.enabledPages.blog ? "Trips / Blog" : null,
    settings.enabledPages.articles ? "Articles" : null,
    settings.enabledPages.contact ? "Contact" : null,
    settings.enabledPages.custom ? settings.customPageTitle || "Custom page" : null,
  ].filter(Boolean)

  return (
    <main className={`min-h-screen ${pageClass}`}>
      <div className={`sticky top-0 z-30 border-b ${borderClass} ${isLight ? "bg-[#f6f1e8]/92" : "bg-[#070806]/88"} backdrop-blur`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link className={`flex items-center gap-2 text-sm font-semibold ${mutedClass} hover:text-[#d8a84f]`} href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to builder
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-[#d8a84f]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b9842d]">
            Draft preview
          </div>
        </div>
      </div>

      <header className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-[#171814]">
            <Camera className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">PhotoViewPro Website</p>
            <p className={`text-xs ${mutedClass}`}>{templateLabels[settings.template]} template</p>
          </div>
        </div>
        <nav className={`flex flex-wrap gap-3 text-sm ${mutedClass}`}>
          {navPages.map((page) => (
            <span className="hover:text-[#d8a84f]" key={page}>
              {page}
            </span>
          ))}
        </nav>
      </header>

      {settings.enabledBlocks.hero && (
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className={settings.template === "split-hero" ? "lg:order-1" : ""}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b9842d]">Portfolio website preview</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">{settings.heroHeadline}</h1>
            <p className={`mt-5 max-w-2xl text-lg leading-8 ${mutedClass}`}>{settings.heroSubhead}</p>
            {settings.enabledBlocks.callToAction && (
              <div className="mt-7 flex flex-wrap gap-3">
                <a className="rounded-md bg-[#d8a84f] px-5 py-3 text-sm font-semibold text-[#171814]" href="#portfolios">
                  {settings.heroButtonLabel || "View portfolios"}
                </a>
                {settings.enabledPages.contact && (
                  <a className={`rounded-md border px-5 py-3 text-sm font-semibold ${borderClass}`} href="#contact">
                    Contact
                  </a>
                )}
              </div>
            )}
          </div>
          <div className={`relative overflow-hidden rounded-md border ${borderClass} ${settings.template === "panorama-scroll" ? "aspect-[21/9] lg:aspect-[16/9]" : "aspect-[4/3]"}`}>
            {heroCover && <Image alt="Website hero preview" className="object-cover" fill priority sizes="(min-width: 1024px) 50vw, 100vw" src={heroCover} unoptimized />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>
        </section>
      )}

      {settings.enabledBlocks.textBlock && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className={`grid gap-5 rounded-md border p-6 md:grid-cols-3 ${borderClass} ${cardClass}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9842d]">About the work</p>
              <h2 className="mt-2 text-2xl font-semibold">Curated portfolios, stories, and field notes in one place.</h2>
            </div>
            <p className={`leading-7 md:col-span-2 ${mutedClass}`}>
              This preview shows how the subscriber&apos;s website can wrap their PhotoViewPro portfolios with a clean homepage, simple navigation, selected pages, and focused calls to action.
            </p>
          </div>
        </section>
      )}

      {settings.enabledBlocks.featuredPortfolio && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9842d]">Featured portfolios</p>
              <h2 className="mt-2 text-3xl font-semibold">Start with the strongest work.</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredGalleries.slice(0, 4).map((gallery) => (
              <Link className={`group overflow-hidden rounded-md border ${borderClass} ${cardClass}`} href={`/g/${gallery.id}`} key={gallery.id}>
                <div className="relative aspect-[4/3] bg-black">
                  <Image alt={gallery.name} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="25vw" src={gallery.cover} unoptimized />
                </div>
                <div className="p-3">
                  <p className="font-semibold">{gallery.name}</p>
                  <p className={`mt-1 text-xs ${mutedClass}`}>{gallery.images} images</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {settings.enabledBlocks.portfolioGrid && (
        <section className="px-5 py-8" id="portfolios">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9842d]">All portfolios</p>
            <h2 className="mt-2 text-3xl font-semibold">Browse the full body of work.</h2>
          </div>
          <PublicPortfolioGrid galleries={galleries} />
        </section>
      )}

      {(settings.enabledBlocks.gear || settings.enabledBlocks.articles || settings.enabledPages.contact) && (
        <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3" id="contact">
          {settings.enabledBlocks.gear && (
            <div className={`rounded-md border p-5 ${borderClass} ${cardClass}`}>
              <ShoppingBag className="size-5 text-[#b9842d]" />
              <h3 className="mt-4 text-xl font-semibold">What&apos;s in my bag</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>Camera gear, travel kit, and affiliate-friendly recommendations.</p>
            </div>
          )}
          {settings.enabledBlocks.articles && (
            <div className={`rounded-md border p-5 ${borderClass} ${cardClass}`}>
              <PenLine className="size-5 text-[#b9842d]" />
              <h3 className="mt-4 text-xl font-semibold">Articles and field notes</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>Useful writing that supports search traffic and gives visitors a reason to return.</p>
            </div>
          )}
          {settings.enabledPages.contact && (
            <div className={`rounded-md border p-5 ${borderClass} ${cardClass}`}>
              <Mail className="size-5 text-[#b9842d]" />
              <h3 className="mt-4 text-xl font-semibold">Contact</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>A clear path for visitors, collaborators, and potential buyers to reach the photographer.</p>
            </div>
          )}
        </section>
      )}

      <footer className={`border-t ${borderClass} px-5 py-8`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between ${mutedClass}`}>
          <p>{hasDraft ? "Previewing saved website draft." : "No saved draft found. Showing the default website preview."}</p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {settings.customDomain || `${settings.subdomain || "yourname"}.photoviewpro.com`}
          </p>
        </div>
      </footer>
    </main>
  )
}
