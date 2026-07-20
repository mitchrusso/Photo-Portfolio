"use client"

import { ArrowLeft, Camera, Globe2, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ContactForm } from "@/components/contact/contact-form"
import { WebsiteGearGrid } from "@/components/website/website-gear-grid"
import { migratedGalleries } from "@/data/migrated-galleries"
import { getDisplayUrl, getThumbnailUrl, isVisibleRenderableImage, publicGalleryPath, type PortfolioGallery, type PortfolioPhoto } from "@/lib/gallery-utils"
import { formatImageCount } from "@/lib/portfolio-counts"
import { getWebsiteImageFramePresentation, type WebsiteImageFrame } from "@/lib/website-image-frame"
import { getSafeWebsiteActionUrl } from "@/lib/website-url-safety"
import {
  DEFAULT_WEBSITE_HERO_HEADLINE_SIZE,
  getWebsiteHeroHeadlineStyle,
  normalizeWebsiteHeroHeadlineSize,
} from "@/lib/website-hero-typography"
import {
  DEFAULT_WEBSITE_NAVIGATION_PLACEMENT,
  DEFAULT_WEBSITE_SECTION_ORDER,
  DEFAULT_WEBSITE_PAGE_ORDER,
  normalizeWebsiteNavigationPlacement,
  normalizeWebsitePageOrder,
  normalizeWebsiteSectionOrder,
  SUBSCRIBER_WEBSITE_CONTENT_NOTICE,
  type WebsiteBuilderPageKey,
  type WebsiteNavigationPlacement,
  type WebsiteSectionOrderKey,
} from "@/lib/website-builder-rules"
import {
  createDefaultWebsiteGearCategories,
  getCompletedWebsiteGearCategories,
  normalizeWebsiteGearCategories,
  type WebsiteGearCategory,
} from "@/lib/website-gear"

const WEBSITE_BUILDER_UI_STORAGE_KEY = "photoviewpro-website-builder-ui-v1"

type WebsiteTemplate =
  | "article-first"
  | "adventure-map"
  | "about-first"
  | "bold-color"
  | "botanical-soft"
  | "cinematic-home"
  | "clean-grid"
  | "coastal-clean"
  | "creator-studio"
  | "darkroom"
  | "editorial-magazine"
  | "fashion-panel"
  | "fine-art-index"
  | "gallery-wall"
  | "gallery-luxe"
  | "gear-notebook"
  | "landing-portfolios"
  | "panorama-scroll"
  | "minimal-white"
  | "mosaic-board"
  | "museum-wall"
  | "monochrome-zine"
  | "portfolio-index"
  | "portrait-card"
  | "social-hub"
  | "split-hero"
  | "studio-card"
  | "street-poster"
  | "story-journal"
  | "travel-atlas"
  | "wedding-air"

type WebsiteTripEntry = {
  body: string
  galleryId?: string
  id: string
  linkLabel: string
  linkUrl: string
  meta: string
  title: string
}
type WebsiteWorkPhotoItem = {
  id: string
  source: string
  title: string
}
type WebsiteFontStyle = "clean" | "editorial" | "classic" | "mono"
type WebsiteHeroImageMode = "featured" | "portfolio" | "library" | "upload" | "video"
type WebsiteHeroLayout = "overlay" | "split" | "stacked"
type WebsiteHeroImagePosition = "left" | "center" | "right"
type WebsiteImageShape = "square" | "soft" | "pill" | "arch"
type WebsiteHomeSectionKey = "hero" | "textBlock" | "featuredPortfolio" | "portfolioGrid"
type WebsiteWorkDisplayMode = "slideshow" | "thumbnail-grid" | "film-strip" | "cover-cards"
type WebsiteWorkSourceMode = "all" | "featured" | "single"
const websitePlaceholderTripMeta = "Location or date"
const websitePageByHash: Record<string, WebsiteBuilderPageKey> = {
  "#about": "about",
  "#articles": "articles",
  "#contact": "contact",
  "#custom": "custom",
  "#gear": "gear",
  "#home": "home",
  "#trips": "blog",
}

function getSubscriberTripMeta(meta: string) {
  const trimmedMeta = meta.trim()

  return trimmedMeta === websitePlaceholderTripMeta ? "" : trimmedMeta
}

function getWebsitePhotoTitle(photo: PortfolioPhoto, fallback: string) {
  return photo.caption?.trim() || photo.title?.trim() || photo.fileName?.trim() || fallback
}

function getWebsiteGalleryPhotoItems(gallery?: PortfolioGallery): WebsiteWorkPhotoItem[] {
  if (!gallery) return []

  const photoItems = (gallery.photos ?? [])
    .filter(isVisibleRenderableImage)
    .map((photo) => ({
      id: photo.id,
      source: getDisplayUrl(photo) ?? getThumbnailUrl(photo) ?? gallery.cover,
      title: getWebsitePhotoTitle(photo, gallery.name),
    }))
    .filter((photoItem) => Boolean(photoItem.source))

  if (photoItems.length > 0) return photoItems

  return gallery.cover
    ? [
        {
          id: `${gallery.id}:cover`,
          source: gallery.cover,
          title: gallery.name,
        },
      ]
    : []
}

function getWebsiteHeroSources(gallery?: PortfolioGallery) {
  if (!gallery) return []

  return [
    gallery.cover,
    ...getWebsiteGalleryPhotoItems(gallery).map((photo) => photo.source),
  ].filter((source, index, sources): source is string => Boolean(source) && sources.indexOf(source) === index)
}

function WebsiteHeroPreviewImage({
  objectPosition,
  sources,
}: {
  objectPosition: string
  sources: string[]
}) {
  const [sourceIndex, setSourceIndex] = useState(0)

  const source = sources[sourceIndex]
  if (!source) return null

  return (
    <>
      <Image
        alt=""
        aria-hidden="true"
        className="hidden scale-110 object-cover opacity-45 blur-2xl md:block"
        fill
        key={`${source}:backdrop`}
        sizes="(min-width: 1024px) 50vw, 100vw"
        src={source}
        style={{ objectPosition }}
        unoptimized
      />
      <Image
        alt="Website hero preview"
        className="object-contain"
        fill
        key={source}
        onError={() => setSourceIndex((current) => current + 1)}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        src={source}
        style={{ objectPosition }}
        unoptimized
      />
    </>
  )
}

type WebsiteBuilderSettings = {
  aboutImageUrl: string
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
  visiblePages: {
    about: boolean
    articles: boolean
    blog: boolean
    contact: boolean
    custom: boolean
    gear: boolean
  }
  featuredGalleryIds: string[]
  gearCategories: WebsiteGearCategory[]
  heroButtonLabel: string
  heroButtonUrl: string
  heroHeadline: string
  heroHeadlineSize: number
  heroGalleryId: string
  heroImageMode: WebsiteHeroImageMode
  heroImagePosition: WebsiteHeroImagePosition
  heroLayout: WebsiteHeroLayout
  heroOverlayStrength: number
  heroImageUrl: string
  heroVideoPosterUrl: string
  heroVideoUrl: string
  heroLibraryPhotoKey: string
  homeSectionOrder: WebsiteHomeSectionKey[]
  heroSubhead: string
  contactEmail: string
  imageFrame: WebsiteImageFrame
  imageFrameThickness: number
  imageShape: WebsiteImageShape
  pageCopy: {
    aboutBody: string
    aboutButtonLabel: string
    aboutButtonUrl: string
    aboutHeadline: string
    articlesBody: string
    articlesHeadline: string
    blogBody: string
    blogHeadline: string
    contactIntro: string
    contactHeadline: string
    customBody: string
    featuredWorkHeadline: string
    gearBody: string
    gearHeadline: string
    introBody: string
    introHeadline: string
    portfolioGridHeadline: string
  }
  navigationLabels: Record<WebsiteBuilderPageKey, string>
  navigationPlacement: Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement>
  pageOrder: WebsiteBuilderPageKey[]
  sectionOrder: WebsiteSectionOrderKey[]
  selectedGalleryId: string
  siteAccentColor: string
  siteBackgroundColor: string
  siteFontStyle: WebsiteFontStyle
  siteTextColor: string
  showSectionBodies: Record<WebsiteSectionOrderKey, boolean>
  showSectionHeadings: Record<WebsiteSectionOrderKey, boolean>
  subdomain: string
  template: WebsiteTemplate
  tripEntries: WebsiteTripEntry[]
  workDisplayMode: WebsiteWorkDisplayMode
  workSourceMode: WebsiteWorkSourceMode
}

type WebsiteDraftPreviewProps = {
  initialGalleries?: PortfolioGallery[]
  initialSettings?: Record<string, unknown>
  mode?: "preview" | "published"
  publicUrl?: string
}

function createDefaultWebsiteSettings(galleries: PortfolioGallery[]): WebsiteBuilderSettings {
  return {
    aboutImageUrl: "",
    customDomain: "",
    customPageTitle: "Custom page",
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
    visiblePages: {
      about: true,
      articles: true,
      blog: true,
      contact: true,
      custom: false,
      gear: true,
    },
    featuredGalleryIds: galleries.slice(0, 4).map((gallery) => gallery.id),
    gearCategories: createDefaultWebsiteGearCategories(),
    heroButtonLabel: "View portfolios",
    heroButtonUrl: "#portfolios",
    heroHeadline: "Photography worth slowing down for.",
    heroHeadlineSize: DEFAULT_WEBSITE_HERO_HEADLINE_SIZE,
    heroGalleryId: galleries[0]?.id ?? "",
    heroImageMode: "featured",
    heroImagePosition: "center",
    heroLayout: "overlay",
    heroOverlayStrength: 35,
    heroImageUrl: "",
    heroVideoPosterUrl: "",
    heroVideoUrl: "",
    heroLibraryPhotoKey: "",
    homeSectionOrder: ["hero", "textBlock", "featuredPortfolio", "portfolioGrid"],
    heroSubhead: "A curated home for the work, stories, trips, and tools behind the images.",
    contactEmail: "",
    imageFrame: "gold",
    imageFrameThickness: 2,
    imageShape: "soft",
    pageCopy: {
      aboutBody: "Write a short photographer bio, artist statement, or welcome note that helps visitors understand the person behind the work.",
      aboutButtonLabel: "Get in touch",
      aboutButtonUrl: "#contact",
      aboutHeadline: "About the photographer",
      articlesBody: "Create useful articles that help photographers, collectors, friends, or future clients understand the stories, techniques, and places behind the work.",
      articlesHeadline: "Useful articles for people who love photography",
      blogBody: "Share trips, field notes, image stories, and behind-the-scenes updates from recent photography sessions.",
      blogHeadline: "Trips, stories, and field notes",
      contactIntro: "Use this form for print questions, licensing, assignments, or travel and photography conversations.",
      contactHeadline: "Start a conversation.",
      customBody: "Use this page for anything that belongs on the photographer's site: workshops, print information, project notes, licensing details, or a personal introduction.",
      featuredWorkHeadline: "Start with the strongest work.",
      gearBody: "List the cameras, lenses, bags, software, and field tools you recommend. This can later support affiliate links.",
      gearHeadline: "What's in my bag",
      introBody: "Use this short introduction to tell visitors what kind of work they are about to see and why it matters.",
      introHeadline: "Welcome to the collection",
      portfolioGridHeadline: "Browse the full body of work.",
    },
    navigationLabels: {
      about: "About",
      articles: "Articles",
      blog: "Trips",
      contact: "Contact",
      custom: "Custom",
      gear: "What's in My Bag",
      home: "Home",
    },
    navigationPlacement: { ...DEFAULT_WEBSITE_NAVIGATION_PLACEMENT },
    pageOrder: [...DEFAULT_WEBSITE_PAGE_ORDER],
    sectionOrder: [...DEFAULT_WEBSITE_SECTION_ORDER],
    selectedGalleryId: galleries[0]?.id ?? "",
    siteAccentColor: "#d8a84f",
    siteBackgroundColor: "#f4efe6",
    siteFontStyle: "clean",
    siteTextColor: "#171814",
    showSectionBodies: Object.fromEntries(
      DEFAULT_WEBSITE_SECTION_ORDER.map((sectionKey) => [sectionKey, true]),
    ) as Record<WebsiteSectionOrderKey, boolean>,
    showSectionHeadings: Object.fromEntries(
      DEFAULT_WEBSITE_SECTION_ORDER.map((sectionKey) => [sectionKey, true]),
    ) as Record<WebsiteSectionOrderKey, boolean>,
    subdomain: "yourname",
    template: "cinematic-home",
    tripEntries: [
      {
        body: "Add a short field note, story, or travel update that helps visitors understand what they are about to see.",
        galleryId: galleries[0]?.id ?? "",
        id: "trip-1",
        linkLabel: "View portfolio",
        linkUrl: "",
        meta: "",
        title: "Featured trip",
      },
    ],
    workDisplayMode: "thumbnail-grid",
    workSourceMode: "featured",
  }
}

function mergeWebsitePreviewSettings(
  defaults: WebsiteBuilderSettings,
  parsedSettings: Partial<WebsiteBuilderSettings>,
) {
  const isLegacyDefaultCustomTrips = parsedSettings.customPageTitle === "Trips"

  return {
    ...defaults,
    ...parsedSettings,
    customPageTitle: isLegacyDefaultCustomTrips
      ? defaults.customPageTitle
      : parsedSettings.customPageTitle ?? defaults.customPageTitle,
    enabledBlocks: {
      ...defaults.enabledBlocks,
      ...parsedSettings.enabledBlocks,
    },
    enabledPages: {
      ...defaults.enabledPages,
      ...parsedSettings.enabledPages,
      home: true,
      custom: isLegacyDefaultCustomTrips ? false : parsedSettings.enabledPages?.custom ?? defaults.enabledPages.custom,
    },
    visiblePages: {
      ...defaults.visiblePages,
      ...(parsedSettings.visiblePages ?? parsedSettings.enabledPages),
      custom: isLegacyDefaultCustomTrips
        ? false
        : parsedSettings.visiblePages?.custom ?? parsedSettings.enabledPages?.custom ?? defaults.visiblePages.custom,
    },
    pageCopy: {
      ...defaults.pageCopy,
      ...parsedSettings.pageCopy,
    },
    gearCategories: normalizeWebsiteGearCategories(parsedSettings.gearCategories),
    heroHeadlineSize: normalizeWebsiteHeroHeadlineSize(parsedSettings.heroHeadlineSize, defaults.heroHeadlineSize),
    navigationLabels: {
      ...defaults.navigationLabels,
      ...parsedSettings.navigationLabels,
      gear:
        !parsedSettings.navigationLabels?.gear || parsedSettings.navigationLabels.gear === "Gear"
          ? defaults.navigationLabels.gear
          : parsedSettings.navigationLabels.gear,
    },
    navigationPlacement: normalizeWebsiteNavigationPlacement(parsedSettings.navigationPlacement),
    pageOrder: normalizeWebsitePageOrder(parsedSettings.pageOrder),
    sectionOrder: normalizeWebsiteSectionOrder(parsedSettings.sectionOrder),
    showSectionBodies: {
      ...defaults.showSectionBodies,
      ...parsedSettings.showSectionBodies,
    },
    showSectionHeadings: {
      ...defaults.showSectionHeadings,
      ...parsedSettings.showSectionHeadings,
      ...(typeof (parsedSettings as Partial<WebsiteBuilderSettings> & { showFeaturedWorkHeadline?: boolean }).showFeaturedWorkHeadline === "boolean"
        ? {
            "home:featuredPortfolio": (parsedSettings as Partial<WebsiteBuilderSettings> & { showFeaturedWorkHeadline?: boolean })
              .showFeaturedWorkHeadline,
          }
        : {}),
    },
    tripEntries: Array.isArray(parsedSettings.tripEntries) ? parsedSettings.tripEntries : defaults.tripEntries,
  } satisfies WebsiteBuilderSettings
}

const templateLabels: Record<WebsiteTemplate, string> = {
  "adventure-map": "Adventure map",
  "article-first": "Article first",
  "about-first": "About first",
  "bold-color": "Bold color",
  "botanical-soft": "Botanical soft",
  "cinematic-home": "Cinematic home",
  "clean-grid": "Clean portfolio grid",
  "coastal-clean": "Coastal clean",
  "creator-studio": "Creator studio",
  darkroom: "Darkroom",
  "editorial-magazine": "Editorial magazine",
  "fashion-panel": "Fashion panel",
  "fine-art-index": "Fine art index",
  "gallery-wall": "Gallery wall",
  "gallery-luxe": "Gallery luxe",
  "gear-notebook": "Gear notebook",
  "landing-portfolios": "Landing + portfolios",
  "minimal-white": "Minimal white",
  "mosaic-board": "Mosaic board",
  "museum-wall": "Museum wall",
  "monochrome-zine": "Monochrome zine",
  "panorama-scroll": "Panorama scroll",
  "portfolio-index": "Portfolio index",
  "portrait-card": "Portrait card",
  "social-hub": "Social hub",
  "split-hero": "Split hero",
  "studio-card": "Studio card",
  "story-journal": "Story journal",
  "street-poster": "Street poster",
  "travel-atlas": "Travel atlas",
  "wedding-air": "Wedding air",
}

type WebsitePreviewTheme = {
  accentClass: string
  borderClass: string
  cardClass: string
  ctaClass: string
  eyebrowClass: string
  headerClass: string
  headlineClass: string
  heroImageClass: string
  heroLayoutClass: string
  heroOverlayClass: string
  logoClass: string
  mutedClass: string
  pageClass: string
  secondaryButtonClass: string
}

const defaultPreviewTheme: WebsitePreviewTheme = {
  accentClass: "text-[#b9842d]",
  borderClass: "border-white/12",
  cardClass: "bg-white/[0.04] text-white",
  ctaClass: "bg-[#d8a84f] text-[#171814]",
  eyebrowClass: "text-[#b9842d]",
  headerClass: "bg-[#070806]/88",
  headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
  heroImageClass: "aspect-[4/3]",
  heroLayoutClass: "lg:grid-cols-[0.95fr_1.05fr]",
  heroOverlayClass: "bg-gradient-to-t from-black/45 via-transparent to-transparent",
  logoClass: "bg-[#d8a84f] text-[#171814]",
  mutedClass: "text-white/62",
  pageClass: "bg-[#070806] text-white",
  secondaryButtonClass: "border-white/12",
}

const websitePreviewThemes: Partial<Record<WebsiteTemplate, WebsitePreviewTheme>> = {
  "adventure-map": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d9c8a9]",
    cardClass: "bg-[#fff9ed] text-[#1f261f]",
    ctaClass: "bg-[#d87934] text-white",
    eyebrowClass: "text-[#d87934]",
    headerClass: "bg-[#f4efe2]/92",
    headlineClass: "font-mono text-4xl font-bold uppercase leading-[1.02] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.7fr_1.3fr]",
    logoClass: "bg-[#d87934] text-white",
    mutedClass: "text-[#66705a]",
    pageClass: "bg-[#f4efe2] text-[#1f261f]",
    secondaryButtonClass: "border-[#d9c8a9]",
  },
  "article-first": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded4c5]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#0f5f73] text-white",
    eyebrowClass: "text-[#0f5f73]",
    headerClass: "bg-[#f8f5ef]/92",
    headlineClass: "font-serif text-4xl font-semibold leading-[1.02] md:text-7xl",
    logoClass: "bg-[#0f5f73] text-white",
    mutedClass: "text-[#6f675c]",
    pageClass: "bg-[#f8f5ef] text-[#171814]",
    secondaryButtonClass: "border-[#ded4c5]",
  },
  "about-first": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8c6ad]",
    cardClass: "bg-[#fffaf3] text-[#27211b]",
    ctaClass: "bg-[#a87844] text-white",
    eyebrowClass: "text-[#a87844]",
    headerClass: "bg-[#f2e8da]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.05] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.78fr_1.22fr]",
    logoClass: "bg-[#a87844] text-white",
    mutedClass: "text-[#725f4c]",
    pageClass: "bg-[#f2e8da] text-[#27211b]",
    secondaryButtonClass: "border-[#d8c6ad]",
  },
  "gallery-wall": {
    ...defaultPreviewTheme,
    borderClass: "border-white/20",
    cardClass: "bg-black/10 text-white",
    ctaClass: "bg-white text-[#303333]",
    eyebrowClass: "text-white/80",
    headerClass: "bg-[#777a7a]/92",
    headlineClass: "text-4xl font-light leading-tight md:text-5xl",
    logoClass: "bg-white text-[#303333]",
    mutedClass: "text-white/72",
    pageClass: "bg-[#9a9d9d] text-white",
    secondaryButtonClass: "border-white/30",
  },
  "bold-color": {
    ...defaultPreviewTheme,
    borderClass: "border-white/25",
    cardClass: "bg-white text-[#1436d8]",
    ctaClass: "bg-[#ffcf33] text-[#111]",
    eyebrowClass: "text-[#ffcf33]",
    headerClass: "bg-[#1436d8]/92",
    headlineClass: "font-sans text-5xl font-black uppercase leading-[0.92] md:text-7xl",
    logoClass: "bg-[#ffcf33] text-[#111]",
    mutedClass: "text-white/82",
    pageClass: "bg-[#1436d8] text-white",
    secondaryButtonClass: "border-white/35",
  },
  "botanical-soft": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ccd8bd]",
    cardClass: "bg-[#fbfbf3] text-[#25301f]",
    ctaClass: "bg-[#6d8f61] text-white",
    eyebrowClass: "text-[#6d8f61]",
    headerClass: "bg-[#eef2e4]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.08] md:text-6xl",
    logoClass: "bg-[#6d8f61] text-white",
    mutedClass: "text-[#66705c]",
    pageClass: "bg-[#eef2e4] text-[#25301f]",
    secondaryButtonClass: "border-[#ccd8bd]",
  },
  "clean-grid": {
    ...defaultPreviewTheme,
    borderClass: "border-[#dedede]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#171814] text-white",
    eyebrowClass: "text-[#555]",
    headerClass: "bg-white/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-5xl",
    heroLayoutClass: "lg:grid-cols-[1fr_1fr]",
    logoClass: "bg-[#171814] text-white",
    mutedClass: "text-[#666]",
    pageClass: "bg-white text-[#171814]",
    secondaryButtonClass: "border-[#dedede]",
  },
  "coastal-clean": {
    ...defaultPreviewTheme,
    borderClass: "border-[#cce5ee]",
    cardClass: "bg-white text-[#14303f]",
    ctaClass: "bg-[#4795bd] text-white",
    eyebrowClass: "text-[#4795bd]",
    headerClass: "bg-[#edf7fb]/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    heroImageClass: "aspect-[21/9] lg:aspect-[16/9]",
    logoClass: "bg-[#4795bd] text-white",
    mutedClass: "text-[#5d7884]",
    pageClass: "bg-[#edf7fb] text-[#14303f]",
    secondaryButtonClass: "border-[#cce5ee]",
  },
  "cinematic-home": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8a84f]/25",
    cardClass: "bg-[#161814] text-white",
    ctaClass: "bg-[#d8a84f] text-[#171814]",
    eyebrowClass: "text-[#d8a84f]",
    headerClass: "bg-[#070806]/88",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    heroImageClass: "aspect-[16/10]",
    logoClass: "bg-[#d8a84f] text-[#171814]",
    mutedClass: "text-white/62",
    pageClass: "bg-[#070806] text-white",
    secondaryButtonClass: "border-[#d8a84f]/25",
  },
  "creator-studio": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e4d1b2]",
    cardClass: "bg-[#fffaf0] text-[#211b13]",
    ctaClass: "bg-[#211b13] text-white",
    eyebrowClass: "text-[#a1702e]",
    headerClass: "bg-[#f7f1e4]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.76fr_1.24fr]",
    logoClass: "bg-[#d8a84f] text-[#211b13]",
    mutedClass: "text-[#776955]",
    pageClass: "bg-[#f7f1e4] text-[#211b13]",
    secondaryButtonClass: "border-[#e4d1b2]",
  },
  darkroom: {
    ...defaultPreviewTheme,
    borderClass: "border-[#bf8a35]/30",
    cardClass: "bg-[#181410] text-white",
    ctaClass: "bg-[#bf8a35] text-[#111]",
    eyebrowClass: "text-[#bf8a35]",
    headerClass: "bg-black/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.03] md:text-6xl",
    logoClass: "bg-[#bf8a35] text-[#111]",
    mutedClass: "text-white/60",
    pageClass: "bg-black text-white",
    secondaryButtonClass: "border-[#bf8a35]/30",
  },
  "editorial-magazine": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e7d6c5]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#c75f3c] text-white",
    eyebrowClass: "text-[#c75f3c]",
    headerClass: "bg-[#fbf7ef]/92",
    headlineClass: "font-serif text-5xl font-semibold leading-[0.98] md:text-7xl",
    logoClass: "bg-[#c75f3c] text-white",
    mutedClass: "text-[#71685d]",
    pageClass: "bg-[#fbf7ef] text-[#171814]",
    secondaryButtonClass: "border-[#e7d6c5]",
  },
  "fashion-panel": {
    ...defaultPreviewTheme,
    borderClass: "border-[#dfcdbf]",
    cardClass: "bg-[#fffaf6] text-[#17110d]",
    ctaClass: "bg-[#17110d] text-white",
    eyebrowClass: "text-[#a0723f]",
    headerClass: "bg-[#f4eee7]/92",
    headlineClass: "font-serif text-5xl font-semibold leading-[0.96] md:text-7xl",
    heroLayoutClass: "lg:grid-cols-[0.82fr_1.18fr]",
    logoClass: "bg-[#17110d] text-white",
    mutedClass: "text-[#7a6a60]",
    pageClass: "bg-[#f4eee7] text-[#17110d]",
    secondaryButtonClass: "border-[#dfcdbf]",
  },
  "fine-art-index": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded9cf]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#282828] text-white",
    eyebrowClass: "text-[#777]",
    headerClass: "bg-[#faf8f3]/92",
    headlineClass: "font-serif text-4xl font-normal leading-[1.08] md:text-6xl",
    logoClass: "bg-[#282828] text-white",
    mutedClass: "text-[#6d6a63]",
    pageClass: "bg-[#faf8f3] text-[#171814]",
    secondaryButtonClass: "border-[#ded9cf]",
  },
  "gallery-luxe": {
    ...defaultPreviewTheme,
    borderClass: "border-[#caa46a]/35",
    cardClass: "bg-[#241c16] text-[#f7ead8]",
    ctaClass: "bg-[#caa46a] text-[#17130f]",
    eyebrowClass: "text-[#caa46a]",
    headerClass: "bg-[#17130f]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.04] md:text-6xl",
    logoClass: "bg-[#caa46a] text-[#17130f]",
    mutedClass: "text-[#f7ead8]/68",
    pageClass: "bg-[#17130f] text-[#f7ead8]",
    secondaryButtonClass: "border-[#caa46a]/35",
  },
  "gear-notebook": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8c8ab]",
    cardClass: "bg-[#fff8e9] text-[#25211b]",
    ctaClass: "bg-[#2d6e63] text-white",
    eyebrowClass: "text-[#2d6e63]",
    headerClass: "bg-[#f3ead9]/92",
    headlineClass: "font-mono text-3xl font-bold uppercase leading-tight md:text-5xl",
    logoClass: "bg-[#2d6e63] text-white",
    mutedClass: "text-[#6f6552]",
    pageClass: "bg-[#f3ead9] text-[#25211b]",
    secondaryButtonClass: "border-[#d8c8ab]",
  },
  "landing-portfolios": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e3d5bd]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#171814] text-white",
    eyebrowClass: "text-[#9a6e2c]",
    headerClass: "bg-[#f9f6ef]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    logoClass: "bg-[#d8a84f] text-[#171814]",
    mutedClass: "text-[#736b60]",
    pageClass: "bg-[#f9f6ef] text-[#171814]",
    secondaryButtonClass: "border-[#e3d5bd]",
  },
  "minimal-white": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e5e5e5]",
    cardClass: "bg-white text-[#161616]",
    ctaClass: "bg-[#161616] text-white",
    eyebrowClass: "text-[#777]",
    headerClass: "bg-white/92",
    headlineClass: "font-sans text-3xl font-medium leading-tight md:text-5xl",
    logoClass: "bg-[#161616] text-white",
    mutedClass: "text-[#666]",
    pageClass: "bg-white text-[#161616]",
    secondaryButtonClass: "border-[#e5e5e5]",
  },
  "monochrome-zine": {
    ...defaultPreviewTheme,
    borderClass: "border-white/18",
    cardClass: "bg-white text-[#111]",
    ctaClass: "bg-white text-[#111]",
    eyebrowClass: "text-white/78",
    headerClass: "bg-[#111]/92",
    headlineClass: "font-mono text-4xl font-black uppercase leading-[0.96] md:text-6xl",
    logoClass: "bg-white text-[#111]",
    mutedClass: "text-white/62",
    pageClass: "bg-[#111] text-white",
    secondaryButtonClass: "border-white/25",
  },
  "museum-wall": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded4c5]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#8c785c] text-white",
    eyebrowClass: "text-[#8c785c]",
    headerClass: "bg-[#f8f4ec]/92",
    headlineClass: "font-serif text-4xl font-normal leading-[1.08] md:text-6xl",
    logoClass: "bg-[#8c785c] text-white",
    mutedClass: "text-[#70675b]",
    pageClass: "bg-[#f8f4ec] text-[#171814]",
    secondaryButtonClass: "border-[#ded4c5]",
  },
  "mosaic-board": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ddd1bf]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#d8a84f] text-[#171814]",
    eyebrowClass: "text-[#a77425]",
    headerClass: "bg-[#f4f0e8]/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    logoClass: "bg-[#d8a84f] text-[#171814]",
    mutedClass: "text-[#716a60]",
    pageClass: "bg-[#f4f0e8] text-[#171814]",
    secondaryButtonClass: "border-[#ddd1bf]",
  },
  "panorama-scroll": {
    ...defaultPreviewTheme,
    borderClass: "border-[#c8d8de]",
    cardClass: "bg-white text-[#1d2e35]",
    ctaClass: "bg-[#5c7e92] text-white",
    eyebrowClass: "text-[#5c7e92]",
    headerClass: "bg-[#eef3f4]/92",
    headlineClass: "font-sans text-4xl font-semibold leading-tight md:text-6xl",
    heroImageClass: "aspect-[21/9] lg:aspect-[21/9]",
    heroLayoutClass: "lg:grid-cols-1",
    logoClass: "bg-[#5c7e92] text-white",
    mutedClass: "text-[#607580]",
    pageClass: "bg-[#eef3f4] text-[#1d2e35]",
    secondaryButtonClass: "border-[#c8d8de]",
  },
  "portrait-card": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d9c4b7]",
    cardClass: "bg-[#fffaf6] text-[#211713]",
    ctaClass: "bg-[#211713] text-white",
    eyebrowClass: "text-[#a87855]",
    headerClass: "bg-[#efe2d7]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.04] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.72fr_1.28fr]",
    logoClass: "bg-[#211713] text-white",
    mutedClass: "text-[#7b6255]",
    pageClass: "bg-[#efe2d7] text-[#211713]",
    secondaryButtonClass: "border-[#d9c4b7]",
  },
  "portfolio-index": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ddd4c8]",
    cardClass: "bg-white text-[#171814]",
    ctaClass: "bg-[#171814] text-white",
    eyebrowClass: "text-[#987233]",
    headerClass: "bg-[#f7f4ee]/92",
    headlineClass: "font-sans text-3xl font-semibold leading-tight md:text-5xl",
    heroLayoutClass: "lg:grid-cols-[0.68fr_1.32fr]",
    logoClass: "bg-[#171814] text-white",
    mutedClass: "text-[#6d675e]",
    pageClass: "bg-[#f7f4ee] text-[#171814]",
    secondaryButtonClass: "border-[#ddd4c8]",
  },
  "social-hub": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d9defc]",
    cardClass: "bg-white text-[#11152f]",
    ctaClass: "bg-[#5377ff] text-white",
    eyebrowClass: "text-[#5377ff]",
    headerClass: "bg-[#f2f4ff]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    logoClass: "bg-[#5377ff] text-white",
    mutedClass: "text-[#636b8d]",
    pageClass: "bg-[#f2f4ff] text-[#11152f]",
    secondaryButtonClass: "border-[#d9defc]",
  },
  "split-hero": {
    ...defaultPreviewTheme,
    borderClass: "border-[#ded2c0]",
    cardClass: "bg-white text-[#191715]",
    ctaClass: "bg-[#b4864e] text-white",
    eyebrowClass: "text-[#b4864e]",
    headerClass: "bg-[#f3eee6]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.85fr_1.15fr]",
    logoClass: "bg-[#b4864e] text-white",
    mutedClass: "text-[#6f675d]",
    pageClass: "bg-[#f3eee6] text-[#191715]",
    secondaryButtonClass: "border-[#ded2c0]",
  },
  "studio-card": {
    ...defaultPreviewTheme,
    borderClass: "border-[#e0d3bd]",
    cardClass: "bg-white text-[#161713]",
    ctaClass: "bg-[#161713] text-white",
    eyebrowClass: "text-[#a97827]",
    headerClass: "bg-[#f7f2ea]/92",
    headlineClass: "font-sans text-4xl font-bold leading-tight md:text-5xl",
    heroLayoutClass: "lg:grid-cols-[0.9fr_1.1fr]",
    logoClass: "bg-[#d8a84f] text-[#161713]",
    mutedClass: "text-[#736a5d]",
    pageClass: "bg-[#f7f2ea] text-[#161713]",
    secondaryButtonClass: "border-[#e0d3bd]",
  },
  "story-journal": {
    ...defaultPreviewTheme,
    borderClass: "border-[#dec9b1]",
    cardClass: "bg-[#fff8ed] text-[#211a14]",
    ctaClass: "bg-[#9b6a45] text-white",
    eyebrowClass: "text-[#9b6a45]",
    headerClass: "bg-[#f5eadc]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.05] md:text-6xl",
    logoClass: "bg-[#9b6a45] text-white",
    mutedClass: "text-[#786554]",
    pageClass: "bg-[#f5eadc] text-[#211a14]",
    secondaryButtonClass: "border-[#dec9b1]",
  },
  "street-poster": {
    ...defaultPreviewTheme,
    borderClass: "border-white/18",
    cardClass: "bg-white text-[#111]",
    ctaClass: "bg-[#f2d15a] text-[#111]",
    eyebrowClass: "text-[#f2d15a]",
    headerClass: "bg-[#111]/92",
    headlineClass: "font-sans text-5xl font-black uppercase leading-[0.9] md:text-7xl",
    logoClass: "bg-[#f2d15a] text-[#111]",
    mutedClass: "text-white/66",
    pageClass: "bg-[#111] text-white",
    secondaryButtonClass: "border-white/25",
  },
  "travel-atlas": {
    ...defaultPreviewTheme,
    borderClass: "border-[#d8c8ae]",
    cardClass: "bg-[#fff9ed] text-[#1d251e]",
    ctaClass: "bg-[#d87934] text-white",
    eyebrowClass: "text-[#d87934]",
    headerClass: "bg-[#efe8da]/92",
    headlineClass: "font-mono text-4xl font-bold uppercase leading-[1.02] md:text-6xl",
    heroLayoutClass: "lg:grid-cols-[0.72fr_1.28fr]",
    logoClass: "bg-[#d87934] text-white",
    mutedClass: "text-[#686e5e]",
    pageClass: "bg-[#efe8da] text-[#1d251e]",
    secondaryButtonClass: "border-[#d8c8ae]",
  },
  "wedding-air": {
    ...defaultPreviewTheme,
    borderClass: "border-[#f0d8d2]",
    cardClass: "bg-white text-[#2b2020]",
    ctaClass: "bg-[#b77b73] text-white",
    eyebrowClass: "text-[#b77b73]",
    headerClass: "bg-[#fff7f4]/92",
    headlineClass: "font-serif text-4xl font-medium leading-[1.05] md:text-6xl",
    logoClass: "bg-[#b77b73] text-white",
    mutedClass: "text-[#7f6864]",
    pageClass: "bg-[#fff7f4] text-[#2b2020]",
    secondaryButtonClass: "border-[#f0d8d2]",
  },
}

export function WebsiteDraftPreview({
  initialGalleries,
  initialSettings,
  mode = "preview",
  publicUrl,
}: WebsiteDraftPreviewProps = {}) {
  const seedGalleries = initialGalleries ?? migratedGalleries as PortfolioGallery[]
  const [galleries, setGalleries] = useState(seedGalleries)
  const [settings, setSettings] = useState<WebsiteBuilderSettings>(() => {
    const defaults = createDefaultWebsiteSettings(seedGalleries)

    return mode === "published"
      ? mergeWebsitePreviewSettings(defaults, (initialSettings ?? {}) as Partial<WebsiteBuilderSettings>)
      : defaults
  })
  const [hasDraft, setHasDraft] = useState(mode === "published")
  const [activePage, setActivePage] = useState<WebsiteBuilderPageKey>("home")
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published" | "error">("idle")
  const [publishMessage, setPublishMessage] = useState("")
  const [publishedUrl, setPublishedUrl] = useState(publicUrl ?? "")
  const [resetStatus, setResetStatus] = useState<"idle" | "confirm" | "resetting" | "error">("idle")
  const [failedHeroVideoUrl, setFailedHeroVideoUrl] = useState("")

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = "manual"
    window.scrollTo(0, 0)

    return () => {
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useEffect(() => {
    let isActive = true

    if (mode === "published") {
      const nextSettings = mergeWebsitePreviewSettings(
        createDefaultWebsiteSettings(seedGalleries),
        (initialSettings ?? {}) as Partial<WebsiteBuilderSettings>,
      )
      queueMicrotask(() => {
        if (!isActive) return
        setGalleries(seedGalleries)
        setSettings(nextSettings)
        setHasDraft(true)
      })
      return () => {
        isActive = false
      }
    }

    void Promise.all([
      fetch("/api/portfolio/galleries", { credentials: "same-origin" }),
      fetch("/api/website/draft", { credentials: "same-origin" }),
    ])
      .then(async ([galleriesResponse, websiteResponse]) => {
        if (!galleriesResponse.ok || !websiteResponse.ok) throw new Error("Could not load website preview")
        const galleriesPayload = await galleriesResponse.json() as { galleries?: PortfolioGallery[] }
        const websitePayload = await websiteResponse.json() as { settings?: Partial<WebsiteBuilderSettings> | null }
        if (!isActive) return

        const nextGalleries = Array.isArray(galleriesPayload.galleries) ? galleriesPayload.galleries : []
        const defaults = createDefaultWebsiteSettings(nextGalleries)
        const nextSettings = websitePayload.settings
          ? mergeWebsitePreviewSettings(defaults, websitePayload.settings)
          : defaults

        setGalleries(nextGalleries)
        setSettings(nextSettings)
        setHasDraft(Boolean(websitePayload.settings))
      })
      .catch(() => {
        if (!isActive) return
        setGalleries(seedGalleries)
        setSettings(createDefaultWebsiteSettings(seedGalleries))
        setHasDraft(false)
      })

    return () => {
      isActive = false
    }
  }, [initialSettings, mode, seedGalleries])

  async function publishWebsite() {
    setPublishStatus("publishing")
    setPublishMessage("")

    try {
      const response = await fetch("/api/website/publish", {
        credentials: "same-origin",
        method: "POST",
      })
      const payload = await response.json() as { error?: string; issues?: string[]; url?: string }
      if (!response.ok || !payload.url) {
        const details = Array.isArray(payload.issues) ? payload.issues.join(" ") : ""
        throw new Error([payload.error || "Could not publish website", details].filter(Boolean).join(" "))
      }
      setPublishedUrl(payload.url)
      setPublishStatus("published")
    } catch (error) {
      setPublishStatus("error")
      setPublishMessage(error instanceof Error ? error.message : "Could not publish website")
    }
  }

  async function resetWebsiteDraft() {
    if (resetStatus !== "confirm") {
      setResetStatus("confirm")
      return
    }

    setResetStatus("resetting")
    try {
      const response = await fetch("/api/website/draft", {
        credentials: "same-origin",
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Could not reset website draft")
      window.location.assign("/dashboard?panel=website")
    } catch {
      setResetStatus("error")
    }
  }

  useEffect(() => {
    const syncPageFromHash = () => setActivePage(websitePageByHash[window.location.hash] ?? "home")
    syncPageFromHash()
    window.addEventListener("hashchange", syncPageFromHash)
    return () => window.removeEventListener("hashchange", syncPageFromHash)
  }, [])

  const featuredGalleries = useMemo(() => {
    const selected = settings.featuredGalleryIds
      .map((galleryId) => galleries.find((gallery) => gallery.id === galleryId))
      .filter(Boolean) as PortfolioGallery[]

    return selected.length > 0 ? selected : galleries.slice(0, 4)
  }, [galleries, settings.featuredGalleryIds])
  const completedGearCategories = useMemo(
    () => getCompletedWebsiteGearCategories(settings.gearCategories),
    [settings.gearCategories],
  )

  const selectedGallery = galleries.find((gallery) => gallery.id === settings.selectedGalleryId) ?? galleries[0]
  const heroGallery = galleries.find((gallery) => gallery.id === settings.heroGalleryId) ?? featuredGalleries[0] ?? galleries[0]
  const workGalleries =
    settings.workSourceMode === "all"
      ? galleries
      : settings.workSourceMode === "single"
        ? selectedGallery
          ? [selectedGallery]
          : galleries.slice(0, 1)
        : featuredGalleries
  const selectedPortfolioPhotos = getWebsiteGalleryPhotoItems(selectedGallery)
  const primaryWorkImage =
    settings.workSourceMode === "single"
      ? selectedPortfolioPhotos[0]
      : workGalleries[0]
        ? {
            id: workGalleries[0].id,
            source: workGalleries[0].cover,
            title: workGalleries[0].name,
          }
        : galleries[0]
          ? {
              id: galleries[0].id,
              source: galleries[0].cover,
              title: galleries[0].name,
            }
          : undefined
  const primaryWorkGallery = settings.workSourceMode === "single"
    ? selectedGallery ?? galleries[0]
    : workGalleries[0] ?? galleries[0]
  const primaryWorkHref = primaryWorkGallery
    ? publicGalleryPath(primaryWorkGallery.id, primaryWorkGallery.workspaceSlug)
    : "/portfolio"
  const fontClass =
    settings.siteFontStyle === "editorial"
      ? "font-serif"
      : settings.siteFontStyle === "classic"
        ? "font-serif"
        : settings.siteFontStyle === "mono"
          ? "font-mono"
          : "font-sans"
  const shapeClass =
    settings.imageShape === "square"
      ? "rounded-none"
      : settings.imageShape === "pill"
        ? "rounded-[2.5rem]"
        : settings.imageShape === "arch"
          ? "rounded-t-[999px] rounded-b-xl"
          : "rounded-xl"
  const framePresentation = getWebsiteImageFramePresentation(settings.imageFrame, settings.imageFrameThickness)
  const frameClass = framePresentation.className
  const frameStyle = framePresentation.style
  const defaultHeroSources = getWebsiteHeroSources(featuredGalleries[0] ?? galleries[0])
  const heroLibraryItems = useMemo(
    () =>
      galleries.flatMap((gallery) =>
        (gallery.photos ?? [])
          .filter(isVisibleRenderableImage)
          .map((photo) => ({
            key: `${gallery.id}:${photo.id}`,
            source: getDisplayUrl(photo) ?? getThumbnailUrl(photo) ?? gallery.cover,
          })),
      ),
    [galleries],
  )
  const heroLibraryCover = heroLibraryItems.find((item) => item.key === settings.heroLibraryPhotoKey)?.source
  const heroCoverSources =
    settings.heroImageMode === "video"
      ? [settings.heroVideoPosterUrl, ...defaultHeroSources]
      : settings.heroImageMode === "upload"
      ? [settings.heroImageUrl, ...defaultHeroSources]
      : settings.heroImageMode === "library"
        ? [heroLibraryCover, ...defaultHeroSources]
      : settings.heroImageMode === "portfolio"
        ? [...getWebsiteHeroSources(heroGallery), ...defaultHeroSources]
        : defaultHeroSources
  const normalizedHeroCoverSources = heroCoverSources
    .filter((source, index, sources): source is string => Boolean(source) && sources.indexOf(source) === index)
  const showHeroVideo = settings.heroImageMode === "video"
    && Boolean(settings.heroVideoUrl)
    && failedHeroVideoUrl !== settings.heroVideoUrl
  const theme = websitePreviewThemes[settings.template] ?? defaultPreviewTheme
  const isTravelAtlasWebsite = settings.template === "travel-atlas"
  const isEditorialMagazineWebsite = settings.template === "editorial-magazine"
  const isGalleryWallWebsite = settings.template === "gallery-wall"
  const isOverlayHero = settings.heroLayout === "overlay"
  const isStackedHero = settings.heroLayout === "stacked"
  const heroObjectPosition = settings.heroImagePosition === "left" ? "left center" : settings.heroImagePosition === "right" ? "right center" : "center"
  const portfolioGridGalleries = settings.workSourceMode === "featured" ? workGalleries : galleries
  const pageClass = theme.pageClass
  const mutedClass = "opacity-70"
  const borderClass = theme.borderClass
  const cardClass = theme.cardClass
  const pageOrder = normalizeWebsitePageOrder(settings.pageOrder)
  const sectionOrder = normalizeWebsiteSectionOrder(settings.sectionOrder)
  const pageMeta: Record<WebsiteBuilderPageKey, { href: string; key: WebsiteBuilderPageKey; label: string }> = {
    about: { href: "#about", key: "about", label: settings.navigationLabels.about || "About" },
    articles: { href: "#articles", key: "articles", label: settings.navigationLabels.articles || "Articles" },
    blog: { href: "#trips", key: "blog", label: settings.navigationLabels.blog || "Trips" },
    contact: { href: "#contact", key: "contact", label: settings.navigationLabels.contact || "Contact" },
    custom: { href: "#custom", key: "custom", label: settings.navigationLabels.custom || settings.customPageTitle || "Custom page" },
    gear: { href: "#gear", key: "gear", label: settings.navigationLabels.gear || "What's in My Bag" },
    home: { href: "#home", key: "home", label: settings.navigationLabels.home || "Home" },
  }
  const navPages = pageOrder
    .filter((pageKey) => settings.enabledPages[pageKey] && !(mode === "published" && pageKey === "contact" && !settings.contactEmail))
    .map((pageKey) => pageMeta[pageKey])
  const sectionOrderIndex = (sectionKey: WebsiteSectionOrderKey) => {
    const index = sectionOrder.indexOf(sectionKey)

    return index === -1 ? 99 : index
  }
  const navItems = navPages.filter((page) => settings.navigationPlacement[page.key] !== "bottom")
  const footerNavItems = navPages.filter((page) => settings.navigationPlacement[page.key] === "bottom")
  const contactPageAvailable = mode !== "published" || Boolean(settings.contactEmail)
  const heroButtonUrl = getSafeWebsiteActionUrl(settings.heroButtonUrl, "#portfolios")
  const aboutButtonUrl = getSafeWebsiteActionUrl(settings.pageCopy.aboutButtonUrl, "#contact")
  const showPageOnHome = (page: Exclude<WebsiteBuilderPageKey, "home">) => activePage === "home" && settings.visiblePages[page]
  const showStandalonePage = (page: Exclude<WebsiteBuilderPageKey, "home">) => activePage === page
  const openPreviewPage = (page: WebsiteBuilderPageKey) => {
    setActivePage(page)
    window.history.replaceState(null, "", pageMeta[page].href)
    window.scrollTo({ behavior: "smooth", top: 0 })
  }

  return (
    <main className={`min-h-screen ${pageClass} ${fontClass}`} style={{ backgroundColor: settings.siteBackgroundColor, color: settings.siteTextColor }}>
      {mode === "preview" && (
      <div
        className="sticky top-0 z-50 isolate border-b border-white/10 bg-[#1f2a24] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
        data-testid="website-preview-toolbar"
      >
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-5 py-3">
          <button
            className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-[#d8a84f]"
            onClick={() => {
              try {
                const savedUi = window.localStorage.getItem(WEBSITE_BUILDER_UI_STORAGE_KEY)
                const parsedUi = savedUi ? JSON.parse(savedUi) as Record<string, unknown> : {}
                window.localStorage.setItem(
                  WEBSITE_BUILDER_UI_STORAGE_KEY,
                  JSON.stringify({
                    ...parsedUi,
                    returnToBuilder: true,
                  }),
                )
              } catch {
                window.localStorage.setItem(WEBSITE_BUILDER_UI_STORAGE_KEY, JSON.stringify({ returnToBuilder: true }))
              }

              window.location.assign("/dashboard?panel=website")
            }}
            type="button"
          >
            <ArrowLeft className="size-4" />
            Back to builder
          </button>
          <div className="flex items-center gap-2">
            {publishStatus === "error" && <span className="max-w-sm text-xs font-semibold text-red-400">{publishMessage || "Publish failed"}</span>}
            {resetStatus === "error" && <span className="text-xs font-semibold text-red-600">Reset failed</span>}
            <button
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${resetStatus === "confirm" ? "border-red-500 text-red-600" : borderClass}`}
              disabled={resetStatus === "resetting"}
              onClick={() => void resetWebsiteDraft()}
              title="This will delete your website draft and give you a clean slate. To start again, return to My Website, choose a template from the filmstrip, then use Template controls and the page cards to rebuild your site."
              type="button"
            >
              {resetStatus === "confirm" ? "Confirm Start Over" : resetStatus === "resetting" ? "Starting over…" : "Start Over"}
            </button>
            {publishedUrl && (
              <a
                className={`rounded-md border px-3 py-2 text-xs font-semibold ${borderClass}`}
                href={publishedUrl}
                rel="noreferrer"
                target="_blank"
              >
                View live site
              </a>
            )}
            <button
              className="flex items-center gap-2 rounded-md bg-[#1f2a24] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              disabled={!hasDraft || publishStatus === "publishing"}
              onClick={() => void publishWebsite()}
              type="button"
            >
              <Globe2 className="size-4" />
              {publishStatus === "publishing" ? "Publishing…" : publishStatus === "published" ? "Published" : "Publish website"}
            </button>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${borderClass} ${theme.accentClass}`}>
              Draft preview
            </div>
          </div>
        </div>
      </div>
      )}

      <header
        className="mx-auto flex max-w-[1120px] flex-col gap-4 border-b border-current/10 px-6 py-4 md:flex-row md:items-center md:justify-between"
        style={{ backgroundColor: settings.siteBackgroundColor, color: settings.siteTextColor }}
      >
          <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-md ${theme.logoClass}`}>
            <Camera className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">PhotoView.io Website</p>
            <p className={`text-xs ${mutedClass}`}>{templateLabels[settings.template]} template</p>
          </div>
        </div>
        <nav className={`flex flex-wrap gap-3 text-sm ${mutedClass}`}>
          {navItems.map((page) => (
            <a
              aria-current={activePage === page.key ? "page" : undefined}
              className={`${activePage === page.key ? "font-semibold text-[#b27a1f]" : ""} hover:text-[#d8a84f]`}
              href={page.href}
              key={page.href}
              onClick={(event) => {
                event.preventDefault()
                openPreviewPage(page.key)
              }}
            >
              {page.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="flex flex-col">
      {activePage === "home" && settings.enabledBlocks.hero && (
        <section
          id="home"
          className={`relative mx-auto w-full max-w-[1120px] border-b border-current/10 ${
            isOverlayHero
              ? "flex flex-col overflow-hidden md:block md:min-h-[560px]"
              : `grid gap-6 p-6 lg:items-center ${isStackedHero ? "lg:grid-cols-1" : "lg:grid-cols-[0.9fr_1.1fr]"}`
          }`}
          style={{ containerType: "inline-size", order: sectionOrderIndex("home:hero") }}
        >
          <div className={isOverlayHero ? "order-2 relative z-20 bg-black p-6 text-white md:absolute md:inset-x-0 md:bottom-0 md:max-w-2xl md:bg-transparent md:p-8" : ""}>
            {settings.showSectionHeadings["home:hero"] && settings.heroHeadline && (
              <h1
                className={`max-w-3xl font-semibold leading-tight ${
                  isTravelAtlasWebsite
                    ? "font-mono uppercase tracking-[-0.01em]"
                    : isEditorialMagazineWebsite
                      ? "font-serif leading-[0.98]"
                      : theme.headlineClass
                }`}
                style={getWebsiteHeroHeadlineStyle(settings.heroHeadlineSize)}
              >
                {settings.heroHeadline}
              </h1>
            )}
            {(settings.showSectionBodies["home:hero"] ?? true) && settings.heroSubhead && (
              <p className={`mt-5 max-w-2xl text-lg leading-8 ${isOverlayHero ? "text-white/85" : mutedClass}`}>{settings.heroSubhead}</p>
            )}
            {settings.enabledBlocks.callToAction && (
              <div className="mt-7 flex flex-wrap gap-3">
                {(contactPageAvailable || heroButtonUrl !== "#contact") && (
                  <a className={`rounded-md px-5 py-3 text-sm font-semibold ${theme.ctaClass}`} href={heroButtonUrl}>
                    {settings.heroButtonLabel || "View portfolios"}
                  </a>
                )}
                {settings.enabledPages.contact && settings.visiblePages.contact && contactPageAvailable && (
                  <a className={`rounded-md border px-5 py-3 text-sm font-semibold ${theme.secondaryButtonClass}`} href="#contact">
                    Contact
                  </a>
                )}
              </div>
            )}
          </div>
          <div className={`${isOverlayHero ? "relative order-1 aspect-[16/10] w-full md:!absolute md:inset-0 md:aspect-auto" : "relative aspect-[16/10] md:aspect-auto"} overflow-hidden bg-black ${shapeClass} ${frameClass} ${
            isOverlayHero ? "" : isStackedHero ? "md:min-h-[420px]" : "md:min-h-[390px]"
          }`} style={frameStyle}>
            {showHeroVideo ? (
              <video
                aria-label="Website Hero video"
                autoPlay
                className="absolute inset-0 size-full bg-black object-contain"
                loop
                muted
                onError={() => setFailedHeroVideoUrl(settings.heroVideoUrl)}
                playsInline
                preload="metadata"
                src={settings.heroVideoUrl}
                style={{ objectPosition: heroObjectPosition }}
              />
            ) : (
              <WebsiteHeroPreviewImage key={normalizedHeroCoverSources.join("|")} objectPosition={heroObjectPosition} sources={normalizedHeroCoverSources} />
            )}
            {settings.heroOverlayStrength > 0 && (
              <div className="absolute inset-0 hidden bg-black md:block" style={{ opacity: Math.max(0, Math.min(80, settings.heroOverlayStrength)) / 100 }} />
            )}
            {!isOverlayHero && isTravelAtlasWebsite && (
              <div className="absolute inset-x-5 bottom-5 rounded-md bg-black/55 p-4 text-white backdrop-blur">
                <p className="mt-1 text-sm font-semibold">Locations, dates, and portfolios arranged like field notes.</p>
              </div>
            )}
            {!isOverlayHero && isEditorialMagazineWebsite && (
              <div className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#171814] shadow">Cover story</div>
            )}
          </div>
          {!isOverlayHero && isTravelAtlasWebsite && (
            <div className="grid gap-3 rounded-md border border-current/10 bg-black/5 p-4 font-mono text-xs uppercase tracking-[0.12em] lg:col-span-2 md:grid-cols-3">
              <span>01 Featured route</span>
              <span>02 Portfolio stops</span>
              <span>03 Field notes</span>
            </div>
          )}
          {!isOverlayHero && isEditorialMagazineWebsite && (
            <div className="grid gap-3 border-t border-current/10 pt-4 lg:order-0 lg:col-span-2 md:grid-cols-3">
              {["Cover story", "Recent essay", "Selected gallery"].map((item) => (
                <div className={`rounded-md border p-4 ${borderClass} ${cardClass}`} key={item}>
                  <p className="font-serif text-lg font-semibold">{item}</p>
                  <p className={`mt-1 text-xs ${mutedClass}`}>Magazine-style entry point</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activePage === "home" && settings.enabledBlocks.textBlock && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 border-b border-current/10 p-6" id="intro" style={{ order: sectionOrderIndex("home:textBlock") }}>
          {settings.showSectionHeadings["home:textBlock"] && settings.pageCopy.introHeadline && (
            <h2 className="text-2xl font-semibold">{settings.pageCopy.introHeadline}</h2>
          )}
          {(settings.showSectionBodies["home:textBlock"] ?? true) && settings.pageCopy.introBody && (
            <p className={`mt-3 text-base leading-7 ${mutedClass}`}>{settings.pageCopy.introBody}</p>
          )}
        </section>
      )}

        {activePage === "home" && settings.enabledBlocks.featuredPortfolio && (
          <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 border-b border-current/10 p-6" style={{ order: sectionOrderIndex("home:featuredPortfolio") }}>
            {settings.showSectionHeadings["home:featuredPortfolio"] && settings.pageCopy.featuredWorkHeadline.trim() && (
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="mt-2 text-3xl font-semibold">{settings.pageCopy.featuredWorkHeadline}</h2>
                </div>
              </div>
            )}
            {settings.workDisplayMode === "slideshow" && (
            <Link className={`group block overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={primaryWorkHref} style={frameStyle}>
              <div className="relative aspect-[16/9]">
                {primaryWorkImage?.source && <Image alt={primaryWorkImage.title} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="100vw" src={primaryWorkImage.source} unoptimized />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] opacity-75">Slideshow</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {settings.workSourceMode === "single" ? selectedGallery?.name ?? "Selected portfolio" : primaryWorkImage?.title ?? "Featured portfolio"}
                  </p>
                </div>
              </div>
            </Link>
          )}
          {settings.workDisplayMode === "thumbnail-grid" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {settings.workSourceMode === "single"
                ? selectedPortfolioPhotos.slice(0, 12).map((photo) => (
                    <Link className={`group overflow-hidden ${shapeClass} ${frameClass} ${cardClass}`} href={primaryWorkHref} key={photo.id} style={frameStyle}>
                      <div className="relative aspect-[4/3] bg-black">
                        <Image alt={photo.title} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="25vw" src={photo.source} unoptimized />
                      </div>
                      <div className="p-3">
                        <p className="font-semibold">{photo.title}</p>
                      </div>
                    </Link>
                  ))
                : workGalleries.slice(0, 8).map((gallery) => (
                    <Link className={`group overflow-hidden ${shapeClass} ${frameClass} ${cardClass}`} href={publicGalleryPath(gallery.id, gallery.workspaceSlug)} key={gallery.id} style={frameStyle}>
                      <div className="relative aspect-[4/3] bg-black">
                        <Image alt={gallery.name} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="25vw" src={gallery.cover} unoptimized />
                      </div>
                      <div className="p-3">
                        <p className="font-semibold">{gallery.name}</p>
                        <p className={`mt-1 text-xs ${mutedClass}`}>{formatImageCount(gallery.images)}</p>
                      </div>
                    </Link>
                  ))}
            </div>
          )}
          {settings.workDisplayMode === "film-strip" && (
            <div className="space-y-4">
              <Link className={`relative block aspect-[16/8] overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={primaryWorkHref} style={frameStyle}>
                {primaryWorkImage?.source && <Image alt={primaryWorkImage.title} className="object-cover" fill sizes="100vw" src={primaryWorkImage.source} unoptimized />}
              </Link>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {settings.workSourceMode === "single"
                  ? selectedPortfolioPhotos.slice(0, 12).map((photo) => (
                      <Link className={`relative h-20 w-32 shrink-0 overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={primaryWorkHref} key={photo.id} style={frameStyle}>
                        <Image alt={photo.title} className="object-cover" fill sizes="128px" src={photo.source} unoptimized />
                      </Link>
                    ))
                  : workGalleries.slice(0, 10).map((gallery) => (
                      <Link className={`relative h-20 w-32 shrink-0 overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={publicGalleryPath(gallery.id, gallery.workspaceSlug)} key={gallery.id} style={frameStyle}>
                        <Image alt={gallery.name} className="object-cover" fill sizes="128px" src={gallery.cover} unoptimized />
                      </Link>
                    ))}
              </div>
            </div>
          )}
          {settings.workDisplayMode === "cover-cards" && (
            <div className="grid gap-5 md:grid-cols-3">
              {settings.workSourceMode === "single"
                ? selectedPortfolioPhotos.slice(0, 6).map((photo) => (
                    <Link className={`relative aspect-[4/5] overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={primaryWorkHref} key={photo.id} style={frameStyle}>
                      <Image alt={photo.title} className="object-cover transition duration-300 hover:scale-[1.03]" fill sizes="33vw" src={photo.source} unoptimized />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                        <p className="text-lg font-semibold">{photo.title}</p>
                      </div>
                    </Link>
                  ))
                : workGalleries.slice(0, 6).map((gallery) => (
                    <Link className={`relative aspect-[4/5] overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={publicGalleryPath(gallery.id, gallery.workspaceSlug)} key={gallery.id} style={frameStyle}>
                      <Image alt={gallery.name} className="object-cover transition duration-300 hover:scale-[1.03]" fill sizes="33vw" src={gallery.cover} unoptimized />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                        <p className="text-lg font-semibold">{gallery.name}</p>
                        <p className="text-xs opacity-75">{formatImageCount(gallery.images)}</p>
                      </div>
                    </Link>
                  ))}
            </div>
          )}
        </section>
      )}

      {activePage === "home" && settings.enabledBlocks.portfolioGrid && (
        <section className={`scroll-mt-28 ${isGalleryWallWebsite ? "px-0 py-8" : "mx-auto w-full max-w-[1120px] p-6"}`} id="portfolios" style={{ order: sectionOrderIndex("home:portfolioGrid") }}>
          <div className={isGalleryWallWebsite ? "px-7" : ""}>
            {settings.showSectionHeadings["home:portfolioGrid"] && settings.pageCopy.portfolioGridHeadline && (
              <h2 className={isGalleryWallWebsite ? "mt-2 text-2xl font-light" : "mt-2 text-3xl font-semibold"}>{settings.pageCopy.portfolioGridHeadline}</h2>
            )}
          </div>
          {isGalleryWallWebsite ? (
            <div className="mt-5 grid gap-2 px-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {portfolioGridGalleries.map((gallery) => (
                <Link className="group relative aspect-[16/10] overflow-hidden bg-black" href={publicGalleryPath(gallery.id, gallery.workspaceSlug)} key={gallery.id}>
                  <Image alt={gallery.name} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="25vw" src={gallery.cover} unoptimized />
                  <div className="absolute inset-x-0 bottom-0 bg-black/45 px-4 py-3 text-white">
                    <p className="font-semibold">{gallery.name}</p>
                    <p className="text-xs opacity-75">{formatImageCount(gallery.images)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {portfolioGridGalleries.map((gallery) => (
                <Link className={`group overflow-hidden bg-black ${shapeClass} ${frameClass}`} href={publicGalleryPath(gallery.id, gallery.workspaceSlug)} key={gallery.id} style={frameStyle}>
                  <div className="relative aspect-[4/3]">
                    <Image alt={`${gallery.name} cover`} className="object-cover transition duration-300 group-hover:scale-[1.03]" fill sizes="33vw" src={gallery.cover} unoptimized />
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-sm font-semibold text-white">{gallery.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
      {(showPageOnHome("about") || showStandalonePage("about")) && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 p-8" id="about" style={{ order: sectionOrderIndex("page:about") }}>
          <div className={`grid gap-7 ${settings.aboutImageUrl ? "md:grid-cols-[0.72fr_1.28fr] md:items-start" : ""}`}>
            {settings.aboutImageUrl && (
              <div className={`relative aspect-[4/5] overflow-hidden bg-black ${shapeClass} ${frameClass}`} style={frameStyle}>
                <Image alt="About the photographer" className="object-cover" fill sizes="360px" src={settings.aboutImageUrl} unoptimized />
              </div>
            )}
            <div>
              {settings.showSectionHeadings["page:about"] && settings.pageCopy.aboutHeadline && (
                <h2 className="text-4xl font-semibold">{settings.pageCopy.aboutHeadline}</h2>
              )}
              {(settings.showSectionBodies["page:about"] ?? true) && settings.pageCopy.aboutBody && (
                <p className={`mt-5 text-lg leading-8 ${mutedClass}`}>{settings.pageCopy.aboutBody}</p>
              )}
              {settings.pageCopy.aboutButtonLabel && (contactPageAvailable || aboutButtonUrl !== "#contact") && (
                <Link className={`mt-4 inline-flex rounded-md px-5 py-3 text-sm font-semibold ${theme.ctaClass}`} href={aboutButtonUrl}>
                  {settings.pageCopy.aboutButtonLabel}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {(showPageOnHome("blog") || showStandalonePage("blog")) && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 p-8" id="trips" style={{ order: sectionOrderIndex("page:blog") }}>
          <div>
            {settings.showSectionHeadings["page:blog"] && settings.pageCopy.blogHeadline && (
              <h2 className="text-4xl font-semibold">{settings.pageCopy.blogHeadline}</h2>
            )}
            {(settings.showSectionBodies["page:blog"] ?? true) && settings.pageCopy.blogBody && <p className={`mt-5 text-lg leading-8 ${mutedClass}`}>{settings.pageCopy.blogBody}</p>}
          </div>
          <div className="mt-8 grid gap-4">
            {settings.tripEntries.map((trip) => {
              const linkedGallery = galleries.find((gallery) => gallery.id === trip.galleryId)
              const tripLinkUrl = linkedGallery
                ? publicGalleryPath(linkedGallery.id, linkedGallery.workspaceSlug)
                : getSafeWebsiteActionUrl(trip.linkUrl)

              return (
                <article className="rounded-md border border-current/15 bg-black/[0.03] p-4" key={trip.id}>
                  <h3 className="text-2xl font-semibold">{trip.title}</h3>
                  {getSubscriberTripMeta(trip.meta) && (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{getSubscriberTripMeta(trip.meta)}</p>
                  )}
                  <p className={`mt-4 text-base leading-7 ${mutedClass}`}>{trip.body}</p>
                  {tripLinkUrl && trip.linkLabel ? (
                    <Link className="mt-4 inline-flex text-sm font-semibold underline" href={tripLinkUrl}>
                      {trip.linkLabel}
                    </Link>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      )}

      {(showPageOnHome("gear") || showStandalonePage("gear")) && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 p-8" id="gear" style={{ order: sectionOrderIndex("page:gear") }}>
          {settings.showSectionHeadings["page:gear"] && settings.pageCopy.gearHeadline && (
            <h2 className="text-4xl font-semibold">{settings.pageCopy.gearHeadline}</h2>
          )}
          {(settings.showSectionBodies["page:gear"] ?? true) && settings.pageCopy.gearBody && <p className={`mt-5 text-lg leading-8 ${mutedClass}`}>{settings.pageCopy.gearBody}</p>}
          {completedGearCategories.length > 0 && (
            <WebsiteGearGrid categories={settings.gearCategories} mutedClass={mutedClass} />
          )}
        </section>
      )}

      {(showPageOnHome("articles") || showStandalonePage("articles")) && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 p-8" id="articles" style={{ order: sectionOrderIndex("page:articles") }}>
          {settings.showSectionHeadings["page:articles"] && settings.pageCopy.articlesHeadline && (
            <h2 className="text-4xl font-semibold">{settings.pageCopy.articlesHeadline}</h2>
          )}
          {(settings.showSectionBodies["page:articles"] ?? true) && settings.pageCopy.articlesBody && <p className={`mt-5 text-lg leading-8 ${mutedClass}`}>{settings.pageCopy.articlesBody}</p>}
        </section>
      )}

      {(showPageOnHome("contact") || showStandalonePage("contact")) && !(mode === "published" && !settings.contactEmail) && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 p-8" id="contact" style={{ order: sectionOrderIndex("page:contact") }}>
          {settings.showSectionHeadings["page:contact"] && settings.pageCopy.contactHeadline && (
            <h2 className="text-4xl font-semibold">{settings.pageCopy.contactHeadline}</h2>
          )}
          {(settings.showSectionBodies["page:contact"] ?? true) && settings.pageCopy.contactIntro && <p className={`mt-5 text-lg leading-8 ${mutedClass}`}>{settings.pageCopy.contactIntro}</p>}
            <ContactForm
              buttonClassName={`rounded-md px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${theme.ctaClass}`}
              className="mt-6 grid gap-3 md:grid-cols-2"
              disabled={mode !== "published" || !settings.contactEmail}
              disabledLabel={settings.contactEmail ? "Available on the published website" : "Add a contact email to enable this form"}
              fieldClassName={`h-11 rounded-md border bg-transparent px-3 text-sm font-normal outline-none ${borderClass}`}
              workspaceSlug={settings.subdomain}
            />
        </section>
      )}

      {(showPageOnHome("custom") || showStandalonePage("custom")) && (
        <section className="mx-auto w-full max-w-[1120px] scroll-mt-28 p-8" id="custom" style={{ order: sectionOrderIndex("page:custom") }}>
          {settings.showSectionHeadings["page:custom"] && settings.customPageTitle && (
            <h2 className="text-4xl font-semibold">{settings.customPageTitle}</h2>
          )}
          {(settings.showSectionBodies["page:custom"] ?? true) && settings.pageCopy.customBody && <p className={`mt-5 text-lg leading-8 ${mutedClass}`}>{settings.pageCopy.customBody}</p>}
        </section>
      )}
      </div>

      <footer className={`border-t ${borderClass} px-5 py-8`}>
        <div className={`mx-auto max-w-[1120px] text-sm ${mutedClass}`}>
          {footerNavItems.length > 0 ? (
            <nav aria-label="Subscriber footer navigation" className="mb-5 flex flex-wrap gap-x-5 gap-y-3 border-b border-current/10 pb-5">
              {footerNavItems.map((page) => (
                <a
                  aria-current={activePage === page.key ? "page" : undefined}
                  className={`${activePage === page.key ? "font-semibold" : ""} hover:underline`}
                  href={page.href}
                  key={page.href}
                  onClick={(event) => {
                    event.preventDefault()
                    openPreviewPage(page.key)
                  }}
                >
                  {page.label}
                </a>
              ))}
            </nav>
          ) : null}
          <p className="mb-5 max-w-3xl text-xs leading-5 opacity-80">{SUBSCRIBER_WEBSITE_CONTENT_NOTICE}</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>{mode === "published" ? "Published with PhotoView.io." : hasDraft ? "Previewing saved website draft." : "No saved draft found. Showing the default website preview."}</p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              {mode === "published" && publicUrl ? publicUrl : `${settings.subdomain || "yourname"}.photoview.io`}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a className="hover:underline" href="https://photoview.io/terms" rel="noreferrer" target="_blank">PhotoView.io Terms</a>
              <a className="hover:underline" href="https://photoview.io/privacy" rel="noreferrer" target="_blank">PhotoView.io Privacy</a>
              <a className="hover:underline" href="https://photoview.io/copyright" rel="noreferrer" target="_blank">PhotoView.io Copyright &amp; DMCA</a>
              <a className="font-semibold underline-offset-4 hover:underline" href="https://photoview.io" rel="noreferrer" target="_blank">Powered by PhotoView.io</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
