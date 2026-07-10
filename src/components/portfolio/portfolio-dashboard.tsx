"use client"

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cloud,
  Clock,
  CreditCard,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Folder,
  Gift,
  Globe2,
  GripVertical,
  Info,
  Images,
  ImagePlus,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Palette,
  PanelRightClose,
  Plus,
  ReceiptText,
  QrCode,
  Search,
  Settings2,
  Share2,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  StickyNote,
  Sun,
  Tag,
  User,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AskAiHelp } from "@/components/ai/ask-ai-help"
import { SafeImage } from "@/components/portfolio/safe-image"
import { BlobUpload } from "@/components/uploads/blob-upload"
import { migratedGalleries } from "@/data/migrated-galleries"
import { type ClientPhotoUploadResult, uploadPhotoFromClient } from "@/lib/client-photo-upload"
import {
  defaultSiteSettings,
  embedPortfolioPath,
  embedGalleryPath,
  getDisplayUrl,
  getPhotoCover,
  getThumbnailUrl,
  isRenderableImage,
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
import {
  SHOWCASE_SUBMISSIONS_STORAGE_KEY,
  type ShowcaseCategory,
  type ShowcasePhoto,
} from "@/lib/showcase-utils"
import {
  DEFAULT_WEBSITE_HOME_SECTION_ORDER,
  DEFAULT_WEBSITE_PAGE_ORDER,
  DEFAULT_WEBSITE_SECTION_ORDER,
  getWebsiteTemplateEnabledBlocks,
  getWebsiteTemplateHomeSectionOrder,
  getWebsiteTemplateSectionOrder,
  normalizeWebsitePageOrder,
  normalizeWebsiteSectionOrder,
  type WebsiteBuilderPageKey,
  type WebsiteHomeSectionKey,
  type WebsiteSectionOrderKey,
  type WebsiteTemplate,
} from "@/lib/website-builder-rules"

type Gallery = PortfolioGallery

const seedGalleries: Gallery[] = migratedGalleries

const GALLERY_STORAGE_KEY = LOCAL_GALLERY_STORAGE_KEY
const SITE_STORAGE_KEY = SITE_SETTINGS_STORAGE_KEY
const IMAGE_BRIGHTNESS_STORAGE_KEY = "photo-portfolio-image-brightness"
const GALLERY_TILE_SIZE_STORAGE_KEY = "photo-portfolio-gallery-tile-size"
const WEBSITE_BUILDER_STORAGE_KEY = "photoviewpro-website-builder-v1"
const WEBSITE_BUILDER_UI_STORAGE_KEY = "photoviewpro-website-builder-ui-v1"
const MOBILE_IMPORT_PAGE_SIZE = 50
const showcaseCategoryByGalleryKeyword: Array<[string, ShowcaseCategory]> = [
  ["sloss", "Architecture"],
  ["chicago", "Architecture"],
  ["slovenia", "Architecture"],
  ["greenland", "Landscape"],
  ["lofoten", "Landscape"],
  ["moab", "Fine Art"],
  ["brazil", "Black & White"],
  ["egypt", "Travel"],
  ["jordan", "Travel"],
  ["myanmar", "Travel"],
  ["bhutan", "Travel"],
]

type ImportResult = {
  source: string
  found: number
  added: number
  skipped: number
}

type ActivePanel = "photos" | "library" | "settings" | "website"
type SettingsTab = "setup" | "account" | "design" | "sharing" | "gallery" | "imports" | "mobile" | "storage"
type ShowcaseSubmitStatus = "idle" | "submitted" | "duplicate" | "removed"
type LibraryFilter = "all" | "visible" | "hidden" | "untagged" | "uncaptioned"
type LibraryPhotoItem = {
  gallery: Gallery
  key: string
  photo: PortfolioPhoto
}
type AiPortfolioSuggestion = {
  captionUpdates: Array<{
    caption: string
    photoId: string
    tags: string[]
  }>
  coverPhotoId: string
  coverReason: string
  duplicateGroups: Array<{
    photoIds: string[]
    reason: string
  }>
  intro: string
  orderReason: string
  orderedPhotoIds: string[]
  socialPosts: {
    email: string
    facebook: string
    instagram: string
    linkedin: string
    pinterest: string
    x: string
  }
  titleIdeas: string[]
}
type AiPortfolioAction = "curate" | "social"
type MobileImportPreview = {
  file: File
  id: string
  selected: boolean
  url: string
}
type WebsiteWorkPhotoItem = {
  id: string
  source: string
  title: string
}
type WebsiteTripEntry = {
  body: string
  id: string
  linkLabel: string
  linkUrl: string
  meta: string
  title: string
}
type WebsiteFontStyle = "clean" | "editorial" | "classic" | "mono"
type WebsiteHeroImageMode = "featured" | "portfolio" | "library" | "upload"
type WebsiteHeroLayout = "overlay" | "split" | "stacked"
type WebsiteHeroImagePosition = "left" | "center" | "right"
type WebsiteImageFrame = "none" | "thin" | "gold" | "shadow" | "print"
type WebsiteImageShape = "square" | "soft" | "pill" | "arch"
type WebsiteWorkDisplayMode = "slideshow" | "thumbnail-grid" | "film-strip" | "cover-cards"
type WebsiteWorkSourceMode = "all" | "featured" | "single"
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
  heroButtonLabel: string
  heroButtonUrl: string
  heroHeadline: string
  heroGalleryId: string
  heroImageMode: WebsiteHeroImageMode
  heroImagePosition: WebsiteHeroImagePosition
  heroLayout: WebsiteHeroLayout
  heroOverlayStrength: number
  heroImageUrl: string
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
type WebsiteBuilderSectionKey =
  | "about"
  | "articles"
  | "contact"
  | "featuredPortfolio"
  | "gear"
  | "hero"
  | "portfolioGrid"
  | "textBlock"
type WebsiteBuilderTool = "add" | "pages" | "sections" | "style"
type WebsitePreviewDevice = "desktop" | "mobile"

const websiteTemplates: Array<{ id: WebsiteTemplate; label: string; description: string; bestFor: string }> = [
  {
    id: "cinematic-home",
    label: "Cinematic home",
    description: "Full-screen lead image, strong portfolio grid, and minimal navigation.",
    bestFor: "Travel, landscape, fine art",
  },
  {
    id: "story-journal",
    label: "Story journal",
    description: "Homepage copy, trip/blog emphasis, and selected portfolios woven into the page.",
    bestFor: "Trips, essays, long-form stories",
  },
  {
    id: "clean-grid",
    label: "Clean portfolio grid",
    description: "Fast scanning, clear gallery cards, and a simple About and Contact path.",
    bestFor: "Prosumer portfolios and collections",
  },
  {
    id: "creator-studio",
    label: "Creator studio",
    description: "Adds gear, articles, social links, and a stronger creator/publisher layout.",
    bestFor: "Photography creators",
  },
  {
    id: "museum-wall",
    label: "Museum wall",
    description: "Quiet white space, framed featured images, and a refined gallery entrance.",
    bestFor: "Fine art and black-and-white work",
  },
  {
    id: "travel-atlas",
    label: "Travel atlas",
    description: "A destination-led homepage with trip sections, map-like pacing, and portfolio links.",
    bestFor: "Travel portfolios and location stories",
  },
  {
    id: "editorial-magazine",
    label: "Editorial magazine",
    description: "Large headline, layered image moments, and article-forward homepage rhythm.",
    bestFor: "Storytelling and essays",
  },
  {
    id: "minimal-white",
    label: "Minimal white",
    description: "Bright, sparse, typography-led pages where the photographs do most of the work.",
    bestFor: "Clean personal portfolios",
  },
  {
    id: "darkroom",
    label: "Darkroom",
    description: "Deep black presentation with a single dramatic lead image and restrained navigation.",
    bestFor: "Night, landscape, and cinematic images",
  },
  {
    id: "mosaic-board",
    label: "Mosaic board",
    description: "Mixed-size tiles for portfolios with portrait, landscape, square, and panoramic work.",
    bestFor: "Mixed-orientation collections",
  },
  {
    id: "landing-portfolios",
    label: "Landing + portfolios",
    description: "A simple sales-style introduction followed quickly by selected portfolio cards.",
    bestFor: "Photographers who want a clear welcome page",
  },
  {
    id: "portfolio-index",
    label: "Portfolio index",
    description: "Structured browsing with a left-side portfolio list and a clean cover grid.",
    bestFor: "Large collections and many galleries",
  },
  {
    id: "article-first",
    label: "Article first",
    description: "Prioritizes useful articles, recent posts, and SEO content around the portfolio.",
    bestFor: "Photographers building search traffic",
  },
  {
    id: "split-hero",
    label: "Split hero",
    description: "A balanced opening with a strong statement beside a featured image and quick portfolio links.",
    bestFor: "Personal brands and polished intros",
  },
  {
    id: "panorama-scroll",
    label: "Panorama scroll",
    description: "Wide image bands and horizontal-feeling sections built for landscapes and big travel work.",
    bestFor: "Panoramas and destination work",
  },
  {
    id: "about-first",
    label: "About first",
    description: "Leads with the photographer's story, then moves visitors into featured portfolios.",
    bestFor: "Relationship-driven photographers",
  },
  {
    id: "gear-notebook",
    label: "Gear notebook",
    description: "Blends portfolios with gear notes, field stories, and useful recommendations.",
    bestFor: "Creators with gear and article content",
  },
  {
    id: "social-hub",
    label: "Social hub",
    description: "A compact homepage that routes visitors to portfolios, articles, social profiles, and contact.",
    bestFor: "Photographers sharing across platforms",
  },
  {
    id: "wedding-air",
    label: "Wedding air",
    description: "Soft whites, gentle serif headlines, and romantic image placement without becoming a proofing site.",
    bestFor: "Romantic, people, and event-adjacent portfolios",
  },
  {
    id: "fashion-panel",
    label: "Fashion panel",
    description: "A stylish editorial split with oversized type, image panels, and a confident photographer mark.",
    bestFor: "Portrait, fashion, and personal brand work",
  },
  {
    id: "street-poster",
    label: "Street poster",
    description: "Bold high-contrast typography over a gritty image stage with a strong call to view work.",
    bestFor: "Street, black-and-white, and urban collections",
  },
  {
    id: "portrait-card",
    label: "Portrait card",
    description: "Centered identity card, clean portrait lead, and simple pathways into portfolios and contact.",
    bestFor: "Portrait photographers and creators",
  },
  {
    id: "coastal-clean",
    label: "Coastal clean",
    description: "Cool blue-white palette, wide imagery, and relaxed spacing for bright scenic portfolios.",
    bestFor: "Coastal, nature, and travel work",
  },
  {
    id: "monochrome-zine",
    label: "Monochrome zine",
    description: "Black-and-white editorial blocks, small caps, and a printed-magazine browsing feel.",
    bestFor: "Documentary and black-and-white series",
  },
  {
    id: "botanical-soft",
    label: "Botanical soft",
    description: "Warm green notes, cream backgrounds, and calmer story sections around the photography.",
    bestFor: "Nature, gardens, macro, and quiet travel",
  },
  {
    id: "bold-color",
    label: "Bold color",
    description: "Confident color blocking, punchy headline scale, and graphic cards for vivid portfolios.",
    bestFor: "Color-forward creative work",
  },
  {
    id: "fine-art-index",
    label: "Fine art index",
    description: "Gallery catalog pacing with generous white space, labels, and collection-first browsing.",
    bestFor: "Fine art portfolios and print-ready collections",
  },
  {
    id: "gallery-wall",
    label: "Gallery wall",
    description: "A clean title bar above a full-screen wall of selected portfolio cover images.",
    bestFor: "Portfolio cover grids and visual indexes",
  },
  {
    id: "adventure-map",
    label: "Adventure map",
    description: "Location-led hero, route-inspired navigation, and featured trips arranged like field notes.",
    bestFor: "Travel, expedition, and location portfolios",
  },
  {
    id: "gallery-luxe",
    label: "Gallery luxe",
    description: "Elegant dark champagne tones, premium spacing, and a polished gallery presentation.",
    bestFor: "Collectors, premium portfolios, and showcase sites",
  },
  {
    id: "studio-card",
    label: "Studio card",
    description: "A compact studio homepage with a strong business card feel and quick portfolio access.",
    bestFor: "Simple professional photographer websites",
  },
]

const websiteTemplateOptionIds: WebsiteTemplate[] = [
  "cinematic-home",
  "split-hero",
  "gallery-wall",
  "clean-grid",
  "editorial-magazine",
  "story-journal",
  "travel-atlas",
  "panorama-scroll",
  "museum-wall",
  "portrait-card",
  "gear-notebook",
  "bold-color",
]
const websiteTemplateOptions = websiteTemplateOptionIds
  .map((templateId) => websiteTemplates.find((template) => template.id === templateId))
  .filter((template): template is (typeof websiteTemplates)[number] => Boolean(template))

const websiteBlockOptions: Array<{ key: keyof WebsiteBuilderSettings["enabledBlocks"]; label: string; note: string }> = [
  { key: "hero", label: "Hero", note: "The first screen visitors see, using a selected image or rotating portfolio covers." },
  { key: "textBlock", label: "Intro text", note: "A short welcome, artist statement, or positioning paragraph." },
  { key: "callToAction", label: "Hero button", note: "Add calls to view portfolios, contact you, or read articles." },
  { key: "portfolioGrid", label: "All portfolios", note: "Show public portfolios as gallery cards." },
  { key: "featuredPortfolio", label: "Featured work", note: "Highlight selected portfolios near the top of the homepage." },
  { key: "gear", label: "What's in My Bag", note: "Show gear and affiliate links when that page is enabled." },
  { key: "articles", label: "Articles", note: "Surface fresh writing for SEO and reader engagement." },
]

const websitePageOptions: Array<{ key: keyof WebsiteBuilderSettings["enabledPages"]; label: string; note: string }> = [
  { key: "home", label: "Home", note: "The website landing page built from the blocks below." },
  { key: "about", label: "About me", note: "Photographer bio, story, portraits, and contact context." },
  { key: "gear", label: "What's in My Bag", note: "Camera gear, recommendations, and affiliate links." },
  { key: "blog", label: "Trips / Blog", note: "Travel notes, shoots, stories, and updates." },
  { key: "articles", label: "Useful Articles", note: "SEO-friendly educational content for prospects and visitors." },
  { key: "contact", label: "Contact", note: "A simple way for visitors to reach the photographer." },
  { key: "custom", label: "Custom page", note: "One extra subscriber-defined page to start." },
]
const websiteFontOptions: Array<{ key: WebsiteFontStyle; label: string; note: string }> = [
  { key: "clean", label: "Clean", note: "Modern, simple, easy to scan" },
  { key: "editorial", label: "Editorial", note: "Magazine-like headlines" },
  { key: "classic", label: "Classic", note: "Warmer serif photography feel" },
  { key: "mono", label: "Field notes", note: "Travel journal and archive style" },
]
const websiteFrameOptions: Array<{ key: WebsiteImageFrame; label: string; note: string }> = [
  { key: "none", label: "None", note: "Images sit directly on the page" },
  { key: "thin", label: "Thin", note: "A quiet gallery border" },
  { key: "gold", label: "Gold", note: "A warm premium frame" },
  { key: "shadow", label: "Shadow", note: "Lifted card presentation" },
  { key: "print", label: "Print", note: "White mat around images" },
]
const websiteShapeOptions: Array<{ key: WebsiteImageShape; label: string; note: string }> = [
  { key: "square", label: "Square", note: "Sharp editorial edges" },
  { key: "soft", label: "Soft", note: "Small rounded corners" },
  { key: "pill", label: "Rounded", note: "Larger rounded corners" },
  { key: "arch", label: "Arch", note: "Portrait-forward arch shape" },
]
const websiteWorkDisplayOptions: Array<{ key: WebsiteWorkDisplayMode; label: string; note: string }> = [
  { key: "slideshow", label: "Slideshow", note: "One strong image at a time" },
  { key: "thumbnail-grid", label: "Thumbnail grid", note: "Fast visual scanning" },
  { key: "film-strip", label: "Film strip", note: "Large image plus small previews" },
  { key: "cover-cards", label: "Cover cards", note: "Portfolio covers with titles" },
]
const websiteWorkSourceOptions: Array<{ key: WebsiteWorkSourceMode; label: string; note: string }> = [
  { key: "featured", label: "Featured", note: "Only portfolios you choose" },
  { key: "single", label: "One selected portfolio", note: "Show photos from one portfolio" },
  { key: "all", label: "All portfolios", note: "Show everything visible" },
]
type WebsiteTemplateStylePreset = Pick<
  WebsiteBuilderSettings,
  "imageFrame" | "imageFrameThickness" | "imageShape" | "siteAccentColor" | "siteBackgroundColor" | "siteFontStyle" | "siteTextColor" | "workDisplayMode"
> & Partial<Pick<WebsiteBuilderSettings, "homeSectionOrder" | "sectionOrder" | "workSourceMode">>

const websiteTemplateStylePresets: Record<WebsiteTemplate, WebsiteTemplateStylePreset> = {
  "adventure-map": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#d87934", siteBackgroundColor: "#f4efe2", siteFontStyle: "mono", siteTextColor: "#1f261f", workDisplayMode: "film-strip" },
  "article-first": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#0f5f73", siteBackgroundColor: "#f8f5ef", siteFontStyle: "editorial", siteTextColor: "#141414", workDisplayMode: "cover-cards" },
  "about-first": { imageFrame: "print", imageFrameThickness: 8, imageShape: "arch", siteAccentColor: "#a87844", siteBackgroundColor: "#f2e8da", siteFontStyle: "classic", siteTextColor: "#27211b", workDisplayMode: "cover-cards" },
  "bold-color": { imageFrame: "none", imageFrameThickness: 1, imageShape: "pill", siteAccentColor: "#ffcf33", siteBackgroundColor: "#1436d8", siteFontStyle: "clean", siteTextColor: "#ffffff", workDisplayMode: "slideshow", homeSectionOrder: ["hero", "portfolioGrid", "textBlock", "featuredPortfolio"] },
  "botanical-soft": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "pill", siteAccentColor: "#6d8f61", siteBackgroundColor: "#eef2e4", siteFontStyle: "classic", siteTextColor: "#25301f", workDisplayMode: "thumbnail-grid" },
  "cinematic-home": { imageFrame: "gold", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#d8a84f", siteBackgroundColor: "#101210", siteFontStyle: "clean", siteTextColor: "#ffffff", workDisplayMode: "film-strip" },
  "clean-grid": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#222222", siteBackgroundColor: "#ffffff", siteFontStyle: "clean", siteTextColor: "#171814", workDisplayMode: "thumbnail-grid", homeSectionOrder: ["portfolioGrid", "hero", "featuredPortfolio", "textBlock"] },
  "coastal-clean": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "soft", siteAccentColor: "#4795bd", siteBackgroundColor: "#edf7fb", siteFontStyle: "clean", siteTextColor: "#14303f", workDisplayMode: "slideshow" },
  "creator-studio": { imageFrame: "gold", imageFrameThickness: 3, imageShape: "soft", siteAccentColor: "#d8a84f", siteBackgroundColor: "#f7f1e4", siteFontStyle: "clean", siteTextColor: "#211b13", workDisplayMode: "cover-cards" },
  darkroom: { imageFrame: "gold", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#bf8a35", siteBackgroundColor: "#000000", siteFontStyle: "classic", siteTextColor: "#ffffff", workDisplayMode: "film-strip" },
  "editorial-magazine": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#c75f3c", siteBackgroundColor: "#fbf7ef", siteFontStyle: "editorial", siteTextColor: "#171814", workDisplayMode: "cover-cards", homeSectionOrder: ["textBlock", "hero", "featuredPortfolio", "portfolioGrid"] },
  "fashion-panel": { imageFrame: "none", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#c99a5a", siteBackgroundColor: "#f4eee7", siteFontStyle: "editorial", siteTextColor: "#17110d", workDisplayMode: "slideshow" },
  "fine-art-index": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#282828", siteBackgroundColor: "#faf8f3", siteFontStyle: "classic", siteTextColor: "#171814", workDisplayMode: "thumbnail-grid" },
  "gallery-wall": { imageFrame: "none", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#ffffff", siteBackgroundColor: "#9a9d9d", siteFontStyle: "clean", siteTextColor: "#ffffff", workDisplayMode: "thumbnail-grid", workSourceMode: "featured", homeSectionOrder: ["portfolioGrid", "featuredPortfolio", "hero", "textBlock"] },
  "gallery-luxe": { imageFrame: "gold", imageFrameThickness: 4, imageShape: "soft", siteAccentColor: "#caa46a", siteBackgroundColor: "#17130f", siteFontStyle: "classic", siteTextColor: "#f7ead8", workDisplayMode: "cover-cards" },
  "gear-notebook": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#2d6e63", siteBackgroundColor: "#f3ead9", siteFontStyle: "mono", siteTextColor: "#25211b", workDisplayMode: "thumbnail-grid", homeSectionOrder: ["textBlock", "portfolioGrid", "hero", "featuredPortfolio"] },
  "landing-portfolios": { imageFrame: "gold", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#d8a84f", siteBackgroundColor: "#f9f6ef", siteFontStyle: "clean", siteTextColor: "#171814", workDisplayMode: "thumbnail-grid" },
  "minimal-white": { imageFrame: "none", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#111111", siteBackgroundColor: "#ffffff", siteFontStyle: "clean", siteTextColor: "#161616", workDisplayMode: "thumbnail-grid" },
  "monochrome-zine": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "square", siteAccentColor: "#ffffff", siteBackgroundColor: "#111111", siteFontStyle: "mono", siteTextColor: "#ffffff", workDisplayMode: "cover-cards" },
  "mosaic-board": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#d8a84f", siteBackgroundColor: "#f4f0e8", siteFontStyle: "clean", siteTextColor: "#171814", workDisplayMode: "thumbnail-grid" },
  "museum-wall": { imageFrame: "print", imageFrameThickness: 10, imageShape: "square", siteAccentColor: "#8c785c", siteBackgroundColor: "#f8f4ec", siteFontStyle: "classic", siteTextColor: "#171814", workDisplayMode: "thumbnail-grid", homeSectionOrder: ["featuredPortfolio", "portfolioGrid", "hero", "textBlock"] },
  "panorama-scroll": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "soft", siteAccentColor: "#5c7e92", siteBackgroundColor: "#eef3f4", siteFontStyle: "clean", siteTextColor: "#1d2e35", workDisplayMode: "slideshow", homeSectionOrder: ["hero", "featuredPortfolio", "portfolioGrid", "textBlock"] },
  "portfolio-index": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#6c6c5f", siteBackgroundColor: "#f6f3ec", siteFontStyle: "clean", siteTextColor: "#1f1f1d", workDisplayMode: "thumbnail-grid" },
  "portrait-card": { imageFrame: "print", imageFrameThickness: 8, imageShape: "arch", siteAccentColor: "#a87855", siteBackgroundColor: "#efe2d7", siteFontStyle: "classic", siteTextColor: "#211713", workDisplayMode: "cover-cards", homeSectionOrder: ["textBlock", "featuredPortfolio", "hero", "portfolioGrid"] },
  "social-hub": { imageFrame: "gold", imageFrameThickness: 2, imageShape: "pill", siteAccentColor: "#d8a84f", siteBackgroundColor: "#101210", siteFontStyle: "clean", siteTextColor: "#ffffff", workDisplayMode: "film-strip" },
  "split-hero": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#a97945", siteBackgroundColor: "#f3eadf", siteFontStyle: "clean", siteTextColor: "#1e1a16", workDisplayMode: "slideshow", homeSectionOrder: ["hero", "textBlock", "portfolioGrid", "featuredPortfolio"] },
  "studio-card": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "pill", siteAccentColor: "#d8a84f", siteBackgroundColor: "#f7f2e8", siteFontStyle: "clean", siteTextColor: "#1e211d", workDisplayMode: "cover-cards" },
  "street-poster": { imageFrame: "none", imageFrameThickness: 1, imageShape: "square", siteAccentColor: "#f4cc55", siteBackgroundColor: "#111111", siteFontStyle: "mono", siteTextColor: "#ffffff", workDisplayMode: "slideshow" },
  "story-journal": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "soft", siteAccentColor: "#a87645", siteBackgroundColor: "#f5eadb", siteFontStyle: "classic", siteTextColor: "#251f18", workDisplayMode: "cover-cards", homeSectionOrder: ["textBlock", "featuredPortfolio", "hero", "portfolioGrid"] },
  "travel-atlas": { imageFrame: "thin", imageFrameThickness: 2, imageShape: "soft", siteAccentColor: "#d87934", siteBackgroundColor: "#efe8da", siteFontStyle: "mono", siteTextColor: "#1d251e", workDisplayMode: "film-strip", homeSectionOrder: ["hero", "portfolioGrid", "textBlock", "featuredPortfolio"] },
  "wedding-air": { imageFrame: "thin", imageFrameThickness: 1, imageShape: "pill", siteAccentColor: "#d7a7a1", siteBackgroundColor: "#fff7f4", siteFontStyle: "classic", siteTextColor: "#2b2020", workDisplayMode: "cover-cards" },
}
const websitePageLabels: Record<WebsiteBuilderPageKey, string> = {
  about: "About me",
  articles: "Useful Articles",
  blog: "Trips / Blog",
  contact: "Contact",
  custom: "Custom page",
  gear: "What's in My Bag",
  home: "Home",
}
const websiteSectionLabels: Record<WebsiteBuilderSectionKey, string> = {
  about: "About page",
  articles: "Useful Articles",
  contact: "Contact form",
  featuredPortfolio: "Featured work",
  gear: "What's in My Bag",
  hero: "Hero",
  portfolioGrid: "All portfolios",
  textBlock: "Intro text",
}
const websitePreviewNavLabels: Record<WebsiteBuilderPageKey, string> = {
  about: "About",
  articles: "Articles",
  blog: "Trips",
  contact: "Contact",
  custom: "Custom",
  gear: "What's in My Bag",
  home: "Home",
}
const websiteBuilderPageKeys = Object.keys(websitePageLabels) as WebsiteBuilderPageKey[]
const websiteBuilderSectionKeys = Object.keys(websiteSectionLabels) as WebsiteBuilderSectionKey[]
const websitePlaceholderTripMeta = "Location or date"

function getSubscriberTripMeta(meta: string) {
  const trimmedMeta = meta.trim()

  return trimmedMeta === websitePlaceholderTripMeta ? "" : trimmedMeta
}

function getWebsitePhotoTitle(photo: PortfolioPhoto, fallback: string) {
  return photo.caption?.trim() || photo.title?.trim() || photo.fileName?.trim() || fallback
}

function getWebsiteGalleryPhotoItems(gallery?: Gallery): WebsiteWorkPhotoItem[] {
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

function getHomeBlockFromSectionKey(sectionKey: WebsiteSectionOrderKey): WebsiteHomeSectionKey | null {
  if (!sectionKey.startsWith("home:")) return null

  return sectionKey.replace("home:", "") as WebsiteHomeSectionKey
}

function getPageFromSectionKey(sectionKey: WebsiteSectionOrderKey): Exclude<WebsiteBuilderPageKey, "home"> | null {
  if (!sectionKey.startsWith("page:")) return null

  return sectionKey.replace("page:", "") as Exclude<WebsiteBuilderPageKey, "home">
}

function getWebsiteBuilderSectionForPage(pageKey: WebsiteBuilderPageKey): WebsiteBuilderSectionKey {
  if (pageKey === "home") return "hero"
  if (pageKey === "about") return "about"
  if (pageKey === "gear") return "gear"
  if (pageKey === "contact") return "contact"

  return "articles"
}

function createDefaultWebsiteSettings(galleries: Gallery[]): WebsiteBuilderSettings {
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
    heroButtonLabel: "View portfolios",
    heroButtonUrl: "#portfolios",
    heroHeadline: "Photography worth slowing down for.",
    heroGalleryId: galleries[0]?.id ?? "",
    heroImageMode: "featured",
    heroImagePosition: "center",
    heroLayout: "overlay",
    heroOverlayStrength: 35,
    heroImageUrl: "",
    heroLibraryPhotoKey: "",
    homeSectionOrder: [...DEFAULT_WEBSITE_HOME_SECTION_ORDER],
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
        id: "trip-1",
        linkLabel: "View portfolio",
        linkUrl: "#portfolios",
        meta: "",
        title: "Featured trip",
      },
    ],
    workDisplayMode: "thumbnail-grid",
    workSourceMode: "featured",
  }
}

type WebsiteTemplatePreviewLayout = "center" | "gallery" | "magazine" | "panorama" | "portrait" | "poster" | "sidecar" | "split"

const websiteTemplatePreviewDesigns: Record<WebsiteTemplate, {
  accent: string
  background: string
  image: string
  layout: WebsiteTemplatePreviewLayout
  muted: string
  text: string
  title: string
}> = {
  "adventure-map": {
    accent: "bg-[#d87934]",
    background: "bg-[#f4efe2] text-[#1f261f]",
    image: "bg-gradient-to-br from-[#49736d] via-[#d4a151] to-[#293f35]",
    layout: "sidecar",
    muted: "bg-[#1f261f]/25",
    text: "font-mono uppercase",
    title: "tracking-[0.14em]",
  },
  "article-first": {
    accent: "bg-[#0f5f73]",
    background: "bg-[#f8f5ef] text-[#141414]",
    image: "bg-gradient-to-br from-[#d7e4e8] via-[#9fb6bd] to-[#29373d]",
    layout: "magazine",
    muted: "bg-black/18",
    text: "font-serif",
    title: "text-[18px]",
  },
  "about-first": {
    accent: "bg-[#a87844]",
    background: "bg-[#f2e8da] text-[#27211b]",
    image: "bg-gradient-to-br from-[#b88b62] via-[#e1c9aa] to-[#71533f]",
    layout: "portrait",
    muted: "bg-[#27211b]/22",
    text: "font-serif",
    title: "text-[15px]",
  },
  "bold-color": {
    accent: "bg-[#ffcf33]",
    background: "bg-[#1436d8] text-white",
    image: "bg-gradient-to-br from-[#ff6a3d] via-[#ffd33d] to-[#1bd1a5]",
    layout: "poster",
    muted: "bg-white/28",
    text: "font-sans uppercase",
    title: "text-[20px] font-black",
  },
  "botanical-soft": {
    accent: "bg-[#6d8f61]",
    background: "bg-[#eef2e4] text-[#25301f]",
    image: "bg-gradient-to-br from-[#dfe8c7] via-[#8fa66f] to-[#36472f]",
    layout: "split",
    muted: "bg-[#25301f]/22",
    text: "font-serif",
    title: "text-[16px]",
  },
  "cinematic-home": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#101210] text-white",
    image: "bg-gradient-to-br from-[#e0b45a] via-[#476b75] to-[#101312]",
    layout: "poster",
    muted: "bg-white/24",
    text: "font-sans",
    title: "text-[18px]",
  },
  "clean-grid": {
    accent: "bg-[#222]",
    background: "bg-white text-[#171814]",
    image: "bg-gradient-to-br from-[#edf2f5] via-[#b7c4c8] to-[#354044]",
    layout: "gallery",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[13px]",
  },
  "coastal-clean": {
    accent: "bg-[#4795bd]",
    background: "bg-[#edf7fb] text-[#14303f]",
    image: "bg-gradient-to-br from-[#e8fbff] via-[#6fb7d2] to-[#11445a]",
    layout: "panorama",
    muted: "bg-[#14303f]/20",
    text: "font-sans",
    title: "text-[14px]",
  },
  "creator-studio": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f7f1e4] text-[#211b13]",
    image: "bg-gradient-to-br from-[#d8a84f] via-[#8d6e44] to-[#252018]",
    layout: "portrait",
    muted: "bg-[#211b13]/24",
    text: "font-sans",
    title: "text-[15px]",
  },
  darkroom: {
    accent: "bg-[#bf8a35]",
    background: "bg-black text-white",
    image: "bg-gradient-to-br from-[#1b2730] via-[#73431f] to-black",
    layout: "sidecar",
    muted: "bg-white/22",
    text: "font-serif",
    title: "text-[17px]",
  },
  "editorial-magazine": {
    accent: "bg-[#c75f3c]",
    background: "bg-[#fbf7ef] text-[#171814]",
    image: "bg-gradient-to-br from-[#efd8c5] via-[#9eb0bb] to-[#2c3440]",
    layout: "magazine",
    muted: "bg-black/18",
    text: "font-serif",
    title: "text-[19px]",
  },
  "fashion-panel": {
    accent: "bg-[#c99a5a]",
    background: "bg-[#f4eee7] text-[#17110d]",
    image: "bg-gradient-to-br from-[#dac0a7] via-[#8f6d5e] to-[#2b211d]",
    layout: "split",
    muted: "bg-[#17110d]/20",
    text: "font-serif",
    title: "text-[20px]",
  },
  "fine-art-index": {
    accent: "bg-[#282828]",
    background: "bg-[#faf8f3] text-[#171814]",
    image: "bg-gradient-to-br from-[#f7f7f4] via-[#b5b1a8] to-[#2d2d2b]",
    layout: "gallery",
    muted: "bg-black/16",
    text: "font-serif",
    title: "text-[13px]",
  },
  "gallery-wall": {
    accent: "bg-white",
    background: "bg-[#9a9d9d] text-white",
    image: "bg-gradient-to-br from-[#171717] via-[#5f747a] to-[#d5a04a]",
    layout: "gallery",
    muted: "bg-white/26",
    text: "font-sans",
    title: "text-[13px]",
  },
  "gallery-luxe": {
    accent: "bg-[#caa46a]",
    background: "bg-[#17130f] text-[#f7ead8]",
    image: "bg-gradient-to-br from-[#ecd3a3] via-[#5e4030] to-[#130f0d]",
    layout: "center",
    muted: "bg-[#f7ead8]/24",
    text: "font-serif",
    title: "text-[18px]",
  },
  "gear-notebook": {
    accent: "bg-[#2d6e63]",
    background: "bg-[#f3ead9] text-[#25211b]",
    image: "bg-gradient-to-br from-[#c2b192] via-[#6c7c67] to-[#25211b]",
    layout: "sidecar",
    muted: "bg-[#25211b]/22",
    text: "font-mono",
    title: "text-[12px] uppercase",
  },
  "landing-portfolios": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f9f6ef] text-[#171814]",
    image: "bg-gradient-to-br from-[#e2d0ad] via-[#7b8c8e] to-[#2b312d]",
    layout: "split",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[17px]",
  },
  "minimal-white": {
    accent: "bg-[#111]",
    background: "bg-white text-[#161616]",
    image: "bg-gradient-to-br from-[#f1f1ef] via-[#c7c7c4] to-[#7b7c78]",
    layout: "center",
    muted: "bg-black/14",
    text: "font-sans",
    title: "text-[12px]",
  },
  "monochrome-zine": {
    accent: "bg-white",
    background: "bg-[#111] text-white",
    image: "bg-gradient-to-br from-[#f6f6f6] via-[#8c8c8c] to-[#111]",
    layout: "magazine",
    muted: "bg-white/20",
    text: "font-mono uppercase",
    title: "text-[16px] font-black",
  },
  "mosaic-board": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f4f0e8] text-[#171814]",
    image: "bg-gradient-to-br from-[#c4964e] via-[#6a8991] to-[#222]",
    layout: "gallery",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[14px]",
  },
  "museum-wall": {
    accent: "bg-[#8c785c]",
    background: "bg-[#f8f4ec] text-[#171814]",
    image: "bg-gradient-to-br from-[#ece7da] via-[#9c9488] to-[#2d2c28]",
    layout: "gallery",
    muted: "bg-black/16",
    text: "font-serif",
    title: "text-[14px]",
  },
  "panorama-scroll": {
    accent: "bg-[#5c7e92]",
    background: "bg-[#eef3f4] text-[#1d2e35]",
    image: "bg-gradient-to-br from-[#dbeff2] via-[#6191a6] to-[#203d4a]",
    layout: "panorama",
    muted: "bg-[#1d2e35]/22",
    text: "font-sans",
    title: "text-[15px]",
  },
  "portfolio-index": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f7f4ee] text-[#171814]",
    image: "bg-gradient-to-br from-[#ede2cf] via-[#7b8790] to-[#202426]",
    layout: "sidecar",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[13px]",
  },
  "portrait-card": {
    accent: "bg-[#d7a46d]",
    background: "bg-[#efe2d7] text-[#211713]",
    image: "bg-gradient-to-br from-[#eac0a0] via-[#9f6b58] to-[#2b1a16]",
    layout: "portrait",
    muted: "bg-[#211713]/20",
    text: "font-serif",
    title: "text-[17px]",
  },
  "social-hub": {
    accent: "bg-[#5377ff]",
    background: "bg-[#f2f4ff] text-[#11152f]",
    image: "bg-gradient-to-br from-[#c8d4ff] via-[#6f83e8] to-[#171d52]",
    layout: "center",
    muted: "bg-[#11152f]/18",
    text: "font-sans",
    title: "text-[16px]",
  },
  "studio-card": {
    accent: "bg-[#d8a84f]",
    background: "bg-[#f7f2ea] text-[#161713]",
    image: "bg-gradient-to-br from-[#d8a84f] via-[#8c7350] to-[#161713]",
    layout: "center",
    muted: "bg-[#161713]/20",
    text: "font-sans",
    title: "text-[15px]",
  },
  "split-hero": {
    accent: "bg-[#b4864e]",
    background: "bg-[#f3eee6] text-[#191715]",
    image: "bg-gradient-to-br from-[#d9bc95] via-[#667c82] to-[#242423]",
    layout: "split",
    muted: "bg-black/18",
    text: "font-sans",
    title: "text-[18px]",
  },
  "story-journal": {
    accent: "bg-[#9b6a45]",
    background: "bg-[#f5eadc] text-[#211a14]",
    image: "bg-gradient-to-br from-[#e5c8a7] via-[#5d756e] to-[#221a14]",
    layout: "magazine",
    muted: "bg-[#211a14]/20",
    text: "font-serif",
    title: "text-[17px]",
  },
  "street-poster": {
    accent: "bg-[#f2d15a]",
    background: "bg-[#111] text-white",
    image: "bg-gradient-to-br from-[#f2f2f2] via-[#4b4b4b] to-[#090909]",
    layout: "poster",
    muted: "bg-white/24",
    text: "font-sans uppercase",
    title: "text-[20px] font-black",
  },
  "travel-atlas": {
    accent: "bg-[#d87934]",
    background: "bg-[#efe8da] text-[#1d251e]",
    image: "bg-gradient-to-br from-[#dbb16f] via-[#6c9284] to-[#29352f]",
    layout: "sidecar",
    muted: "bg-[#1d251e]/20",
    text: "font-mono",
    title: "text-[13px]",
  },
  "wedding-air": {
    accent: "bg-[#d7a7a1]",
    background: "bg-[#fff7f4] text-[#2b2020]",
    image: "bg-gradient-to-br from-[#ffe7e0] via-[#ddb7b1] to-[#7f655f]",
    layout: "split",
    muted: "bg-[#2b2020]/16",
    text: "font-serif",
    title: "text-[18px]",
  },
}

function WebsiteTemplateMiniPreview({ isSelected, templateId }: { isSelected: boolean; templateId: WebsiteTemplate }) {
  const design = websiteTemplatePreviewDesigns[templateId]

  if (design) {
    const selectedClass = isSelected ? "ring-2 ring-[#d8a84f] ring-offset-2 ring-offset-transparent" : ""
    const imageClass = `rounded-sm ${design.image}`
    const mutedClass = `rounded-full ${design.muted}`

    return (
      <div className={`mb-3 h-28 overflow-hidden rounded-md border border-current/10 p-2 shadow-sm ${design.background} ${selectedClass}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className={`h-1.5 w-12 rounded-full ${design.accent}`} />
          <div className="flex gap-1">
            <div className={mutedClass + " h-1.5 w-5"} />
            <div className={mutedClass + " h-1.5 w-5"} />
            <div className={mutedClass + " h-1.5 w-5"} />
          </div>
        </div>
        {design.layout === "center" && (
          <div className={`flex h-[82px] flex-col items-center justify-center text-center ${design.text}`}>
            <div className={`${design.title} h-3 w-24 rounded-sm ${design.muted}`} />
            <div className={`mt-2 h-2 w-16 rounded-sm ${design.accent}`} />
            <div className="mt-3 grid w-full grid-cols-3 gap-1.5">
              <div className={imageClass + " h-7"} />
              <div className={imageClass + " h-7"} />
              <div className={imageClass + " h-7"} />
            </div>
          </div>
        )}
        {design.layout === "gallery" && (
          <div className="grid h-[82px] grid-cols-3 gap-1.5">
            <div className={imageClass + " row-span-2"} />
            <div className={imageClass} />
            <div className={imageClass} />
            <div className={imageClass} />
            <div className={imageClass} />
          </div>
        )}
        {design.layout === "magazine" && (
          <div className="grid h-[82px] grid-cols-[0.8fr_1.2fr] gap-2">
            <div className={`${design.text} flex flex-col justify-center`}>
              <div className={`${design.title} h-4 w-20 rounded-sm ${design.muted}`} />
              <div className={`mt-1 h-4 w-14 rounded-sm ${design.muted}`} />
              <div className={`mt-3 h-2 w-12 rounded-full ${design.accent}`} />
            </div>
            <div className="grid grid-rows-[1fr_0.55fr] gap-1.5">
              <div className={imageClass} />
              <div className="grid grid-cols-2 gap-1.5">
                <div className={imageClass} />
                <div className={imageClass} />
              </div>
            </div>
          </div>
        )}
        {design.layout === "panorama" && (
          <div className="h-[82px]">
            <div className={imageClass + " h-12"} />
            <div className="mt-2 flex items-center justify-between">
              <div className={`${design.title} h-3 w-24 rounded-sm ${design.muted}`} />
              <div className={`h-3 w-12 rounded-sm ${design.accent}`} />
            </div>
          </div>
        )}
        {design.layout === "portrait" && (
          <div className="grid h-[82px] grid-cols-[0.75fr_1fr] gap-2">
            <div className={imageClass + " rounded-t-full"} />
            <div className={`${design.text} flex flex-col justify-center`}>
              <div className={`${design.title} h-4 w-20 rounded-sm ${design.muted}`} />
              <div className={`mt-2 h-2 w-14 rounded-full ${design.muted}`} />
              <div className={`mt-3 h-4 w-16 rounded-sm ${design.accent}`} />
            </div>
          </div>
        )}
        {design.layout === "poster" && (
          <div className={`relative h-[82px] overflow-hidden rounded-sm ${design.image}`}>
            <div className="absolute inset-0 bg-black/25" />
            <div className={`absolute left-3 top-4 ${design.text}`}>
              <div className={`${design.title} h-5 w-24 rounded-sm bg-white/85`} />
              <div className="mt-1 h-5 w-16 rounded-sm bg-white/70" />
              <div className={`mt-3 h-3 w-12 rounded-sm ${design.accent}`} />
            </div>
          </div>
        )}
        {design.layout === "sidecar" && (
          <div className="grid h-[82px] grid-cols-[0.65fr_1.35fr] gap-2">
            <div className={`flex flex-col justify-center border-r border-current/15 pr-2 ${design.text}`}>
              <div className={`${design.title} h-3 w-16 rounded-sm ${design.muted}`} />
              <div className={`mt-2 h-2 w-12 rounded-full ${design.muted}`} />
              <div className={`mt-3 h-4 w-14 rounded-sm ${design.accent}`} />
            </div>
            <div className={imageClass} />
          </div>
        )}
        {design.layout === "split" && (
          <div className="grid h-[82px] grid-cols-2 gap-2">
            <div className={`${design.text} flex flex-col justify-center`}>
              <div className={`${design.title} h-4 w-24 rounded-sm ${design.muted}`} />
              <div className={`mt-2 h-2 w-16 rounded-full ${design.muted}`} />
              <div className={`mt-3 h-4 w-14 rounded-sm ${design.accent}`} />
            </div>
            <div className={imageClass} />
          </div>
        )}
      </div>
    )
  }

  const frameClass = isSelected ? "border-[#d8a84f]/70 bg-[#20170b]" : "border-current/10 bg-[#151714]"
  const photoClass = "rounded-sm bg-gradient-to-br from-[#e0b45a] via-[#476b75] to-[#101312]"
  const mutedBlockClass = "rounded-sm bg-white/18"

  if (templateId === "story-journal") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.9fr_1.1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2">
          <div className="h-2 w-14 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-20 rounded-full bg-white/55" />
          <div className="h-2 w-12 rounded-full bg-white/30" />
          <div className="mt-3 h-5 w-16 rounded-sm border border-white/25" />
        </div>
        <div className={`${photoClass}`} />
      </div>
    )
  }

  if (templateId === "clean-grid") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="mb-2 flex justify-between">
          <div className="h-2 w-20 rounded-full bg-white/50" />
          <div className="h-2 w-10 rounded-full bg-[#d8a84f]" />
        </div>
        <div className="grid h-[70px] grid-cols-3 gap-1.5">
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "creator-studio") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.7fr_1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-1.5">
          <div className="size-8 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-14 rounded-full bg-white/45" />
          <div className="h-2 w-10 rounded-full bg-white/25" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className={photoClass} />
          <div className={mutedBlockClass} />
          <div className={mutedBlockClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "museum-wall") {
    return (
      <div className={`mb-3 h-24 rounded-md border bg-[#f8f4ec] p-2 text-[#171814] ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div className="mx-auto h-2 w-24 rounded-full bg-black/45" />
        <div className="mt-3 grid h-14 grid-cols-3 gap-3 px-2">
          <div className="rounded-sm border-4 border-white bg-[#476b75] shadow-sm" />
          <div className="rounded-sm border-4 border-white bg-[#a66a3a] shadow-sm" />
          <div className="rounded-sm border-4 border-white bg-[#1f2a24] shadow-sm" />
        </div>
      </div>
    )
  }

  if (templateId === "travel-atlas") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[1fr_0.8fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="relative rounded-sm bg-[#20343b]">
          <div className="absolute left-3 top-3 size-2 rounded-full bg-[#d8a84f]" />
          <div className="absolute left-8 top-8 size-2 rounded-full bg-white/70" />
          <div className="absolute bottom-4 left-5 h-px w-16 -rotate-12 bg-white/35" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-12 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-20 rounded-full bg-white/45" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
          <div className={`${photoClass} h-8`} />
        </div>
      </div>
    )
  }

  if (templateId === "editorial-magazine") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[1fr_0.8fr] gap-2 rounded-md border bg-[#fbf7ef] p-2 text-[#171814] ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div>
          <div className="h-4 w-24 rounded-sm bg-black/80" />
          <div className="mt-1 h-4 w-16 rounded-sm bg-black/70" />
          <div className="mt-4 h-2 w-20 rounded-full bg-black/30" />
          <div className="mt-1 h-2 w-12 rounded-full bg-black/20" />
        </div>
        <div className="grid grid-rows-[1fr_0.6fr] gap-1.5">
          <div className={photoClass} />
          <div className="grid grid-cols-2 gap-1.5">
            <div className={photoClass} />
            <div className={photoClass} />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === "minimal-white") {
    return (
      <div className={`mb-3 h-24 rounded-md border bg-white p-2 text-[#171814] ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div className="mb-4 flex justify-between">
          <div className="h-2 w-16 rounded-full bg-black/60" />
          <div className="h-2 w-20 rounded-full bg-black/20" />
        </div>
        <div className="grid h-12 grid-cols-4 gap-2">
          <div className="rounded-sm bg-black/10" />
          <div className="rounded-sm bg-black/20" />
          <div className="rounded-sm bg-black/10" />
          <div className="rounded-sm bg-black/20" />
        </div>
      </div>
    )
  }

  if (templateId === "darkroom") {
    return (
      <div className={`mb-3 h-24 overflow-hidden rounded-md border bg-black p-2 ${isSelected ? "border-[#d8a84f]" : "border-current/10"}`}>
        <div className="relative h-full rounded-sm bg-gradient-to-br from-[#1b2730] via-[#73431f] to-black">
          <div className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-white/70" />
          <div className="absolute inset-x-3 bottom-7 h-3 rounded-sm bg-[#d8a84f]/80" />
        </div>
      </div>
    )
  }

  if (templateId === "mosaic-board") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-4 grid-rows-3 gap-1.5 rounded-md border p-2 ${frameClass}`}>
        <div className={`${photoClass} col-span-2 row-span-2`} />
        <div className={`${photoClass} row-span-1`} />
        <div className={`${photoClass} row-span-2`} />
        <div className={`${photoClass} row-span-1`} />
        <div className={`${photoClass} col-span-2`} />
        <div className={`${photoClass}`} />
      </div>
    )
  }

  if (templateId === "landing-portfolios") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="grid h-9 grid-cols-[1fr_56px] gap-2">
          <div>
            <div className="h-2 w-20 rounded-full bg-[#d8a84f]" />
            <div className="mt-2 h-2 w-28 rounded-full bg-white/40" />
          </div>
          <div className="rounded-sm border border-white/20" />
        </div>
        <div className="mt-2 grid h-9 grid-cols-3 gap-1.5">
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "portfolio-index") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.65fr_1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2 border-r border-white/15 pr-2">
          <div className="h-2 w-14 rounded-full bg-[#d8a84f]" />
          <div className="h-2 w-16 rounded-full bg-white/35" />
          <div className="h-2 w-12 rounded-full bg-white/25" />
          <div className="h-2 w-14 rounded-full bg-white/25" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "article-first") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="grid h-full grid-cols-[1fr_0.7fr] gap-2">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-sm bg-white/65" />
            <div className="h-2 w-20 rounded-full bg-white/30" />
            <div className="grid grid-cols-2 gap-1.5">
              <div className={mutedBlockClass} />
              <div className={mutedBlockClass} />
            </div>
          </div>
          <div className={photoClass} />
        </div>
      </div>
    )
  }

  if (templateId === "split-hero") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-2 gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2 self-center">
          <div className="h-3 w-24 rounded-sm bg-white/70" />
          <div className="h-2 w-20 rounded-full bg-white/35" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
          <div className="mt-2 h-5 w-20 rounded-sm bg-[#d8a84f]" />
        </div>
        <div className={photoClass} />
      </div>
    )
  }

  if (templateId === "panorama-scroll") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className={`${photoClass} h-10`} />
        <div className="mt-2 grid h-8 grid-cols-[1.4fr_0.8fr_1fr] gap-1.5">
          <div className={photoClass} />
          <div className={mutedBlockClass} />
          <div className={photoClass} />
        </div>
        <div className="mt-2 h-2 w-24 rounded-full bg-[#d8a84f]" />
      </div>
    )
  }

  if (templateId === "about-first") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[0.75fr_1fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-2">
          <div className="size-10 rounded-full bg-gradient-to-br from-[#d8a84f] to-[#6f4e22]" />
          <div className="h-2 w-14 rounded-full bg-white/45" />
          <div className="h-2 w-10 rounded-full bg-white/25" />
        </div>
        <div>
          <div className="h-2 w-24 rounded-full bg-white/60" />
          <div className="mt-2 h-2 w-20 rounded-full bg-white/30" />
          <div className="mt-3 grid h-9 grid-cols-2 gap-1.5">
            <div className={photoClass} />
            <div className={photoClass} />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === "gear-notebook") {
    return (
      <div className={`mb-3 grid h-24 grid-cols-[1fr_0.85fr] gap-2 rounded-md border p-2 ${frameClass}`}>
        <div className="space-y-1.5">
          <div className={`${photoClass} h-9`} />
          <div className="h-2 w-24 rounded-full bg-white/55" />
          <div className="h-2 w-16 rounded-full bg-white/25" />
        </div>
        <div className="space-y-1.5 rounded-sm border border-white/15 p-1.5">
          <div className="h-2 w-12 rounded-full bg-[#d8a84f]" />
          <div className={mutedBlockClass + " h-3"} />
          <div className={mutedBlockClass + " h-3"} />
          <div className={mutedBlockClass + " h-3"} />
        </div>
      </div>
    )
  }

  if (templateId === "social-hub") {
    return (
      <div className={`mb-3 h-24 rounded-md border p-2 ${frameClass}`}>
        <div className="mx-auto size-9 rounded-full bg-[#d8a84f]" />
        <div className="mx-auto mt-2 h-2 w-24 rounded-full bg-white/55" />
        <div className="mx-auto mt-1 h-2 w-16 rounded-full bg-white/25" />
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <div className="h-5 rounded-sm border border-white/20" />
          <div className="h-5 rounded-sm border border-white/20" />
          <div className="h-5 rounded-sm border border-white/20" />
          <div className="h-5 rounded-sm border border-white/20" />
        </div>
      </div>
    )
  }

  return (
    <div className={`mb-3 h-24 overflow-hidden rounded-md border p-2 ${frameClass}`}>
      <div className={`${photoClass} h-full`}>
        <div className="flex h-full flex-col justify-end p-3">
          <div className="h-2 w-24 rounded-full bg-white/70" />
          <div className="mt-2 h-2 w-16 rounded-full bg-[#d8a84f]" />
        </div>
      </div>
    </div>
  )
}

const settingsTabs: Array<{ id: SettingsTab; label: string; description: string }> = [
  { id: "setup", label: "Setup", description: "Photographer profile and social accounts" },
  { id: "account", label: "My Account", description: "Plan, usage, billing" },
  { id: "design", label: "Design", description: "Homepage, templates, layout" },
  { id: "sharing", label: "Sharing", description: "Links, embeds, social previews" },
  { id: "gallery", label: "Gallery", description: "Access, covers, watermarking" },
  { id: "imports", label: "Imports", description: "SmugMug and direct uploads" },
  { id: "mobile", label: "Mobile", description: "Companion link and install guide" },
  { id: "storage", label: "Storage", description: "Usage and metering context" },
]

const libraryFilterOptions: Array<{ id: LibraryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "visible", label: "Visible" },
  { id: "hidden", label: "Hidden" },
  { id: "untagged", label: "Untagged" },
  { id: "uncaptioned", label: "No caption" },
]

type AccountSummary = {
  bandwidthLimitBytes: number
  bandwidthPercent: number
  bandwidthPeriodEndsAt: string | null
  bandwidthUsedBytes: number
  billingCycle: "MONTHLY" | "ANNUAL" | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  planName: string
  planSlug: string
  referral: {
    convertedCount: number
    earnedMonths: number
    earnedStorageBytes: number
    pendingCount: number
    referralCode: string
    referralUrl: string
    rewardDescription: string
  }
  status: string
  storageLimitBytes: number
  storagePercent: number
  storageUsedBytes: number
  stripeCustomerId: string | null
  trialEndsAt: string | null
  workspaceName: string
}

const socialAccountFields: Array<{
  brandColor: string
  key: keyof SiteSettings["socialAccounts"]
  label: string
  placeholder: string
  shareStyle: "direct" | "copy-open"
}> = [
  {
    brandColor: "#1877f2",
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/your-page",
    shareStyle: "direct",
  },
  {
    brandColor: "#e4405f",
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/your-handle",
    shareStyle: "copy-open",
  },
  {
    brandColor: "#0a66c2",
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/your-profile",
    shareStyle: "direct",
  },
  {
    brandColor: "#bd081c",
    key: "pinterest",
    label: "Pinterest",
    placeholder: "https://pinterest.com/your-profile",
    shareStyle: "direct",
  },
  {
    brandColor: "#111111",
    key: "x",
    label: "X",
    placeholder: "https://x.com/your-handle",
    shareStyle: "direct",
  },
  {
    brandColor: "#111111",
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@your-handle",
    shareStyle: "copy-open",
  },
  {
    brandColor: "#ff0000",
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@your-channel",
    shareStyle: "copy-open",
  },
]

function SocialIcon({ platform }: { platform: keyof SiteSettings["socialAccounts"] }) {
  const commonClass = "size-4 fill-current"

  switch (platform) {
    case "facebook":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.25c-1.24 0-1.62.77-1.62 1.56v1.9h2.76l-.44 2.91h-2.32V22C18.34 21.24 22 17.08 22 12.06z" />
        </svg>
      )
    case "instagram":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.32 7.44a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.01H3.54V9H7.1v11.45z" />
        </svg>
      )
    case "pinterest":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M12.04 2C6.52 2 3 5.82 3 10.15c0 2.01 1.08 4.52 2.81 5.32.26.12.4.07.46-.18.04-.19.28-1.11.39-1.54.03-.14.02-.26-.1-.4-.57-.68-1.03-1.93-1.03-3.1 0-3.02 2.29-5.94 6.18-5.94 3.36 0 5.72 2.29 5.72 5.56 0 3.69-1.86 6.24-4.28 6.24-1.34 0-2.34-1.1-2.02-2.46.38-1.62 1.12-3.37 1.12-4.54 0-1.05-.56-1.92-1.72-1.92-1.37 0-2.47 1.42-2.47 3.32 0 1.21.41 2.03.41 2.03s-1.35 5.72-1.6 6.79c-.28 1.2-.17 2.88-.05 3.97.04.35.47.47.65.16.55-.95 1.45-2.58 1.76-3.74.17-.63.87-3.2.87-3.2.46.86 1.78 1.58 3.19 1.58 4.2 0 7.23-3.86 7.23-8.65C20.53 5.36 17.2 2 12.04 2z" />
        </svg>
      )
    case "x":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M18.9 2.5h3.02l-6.6 7.55 7.76 10.27h-6.08l-4.76-6.23-5.45 6.23H3.76l7.06-8.07L3.38 2.5h6.23l4.3 5.69 4.99-5.69zm-1.06 16.01h1.67L8.71 4.21H6.92l10.92 14.3z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M16.6 2c.34 2.5 1.75 4 4.24 4.16v3.02a7.18 7.18 0 0 1-4.16-1.32v6.58c0 4.15-2.72 6.84-6.7 6.84-3.45 0-6.82-2.28-6.82-6.2 0-4.09 3.52-6.35 7.06-6.02v3.16c-1.77-.28-3.85.78-3.85 2.77 0 1.8 1.55 2.95 3.33 2.95 2.12 0 3.52-1.22 3.52-3.68V2h3.38z" />
        </svg>
      )
    case "youtube":
      return (
        <svg aria-hidden="true" className={commonClass} viewBox="0 0 24 24">
          <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.95C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.46a2.75 2.75 0 0 0-1.94 1.95A28.65 28.65 0 0 0 2 12a28.65 28.65 0 0 0 .42 4.81 2.75 2.75 0 0 0 1.94 1.95c1.71.46 7.64.46 7.64.46s5.93 0 7.64-.46a2.75 2.75 0 0 0 1.94-1.95A28.65 28.65 0 0 0 22 12a28.65 28.65 0 0 0-.42-4.81zM10 15.27V8.73L15.45 12 10 15.27z" />
        </svg>
      )
  }
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

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 2)} ${units[index]}`
}

function formatAccountDate(value?: string | null) {
  if (!value) return "Not scheduled"

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatAccountStatus(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return "Canceling at period end"

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    CANCELED: "Canceled",
    INCOMPLETE: "Incomplete",
    PAST_DUE: "Past due",
    TRIALING: "Trialing",
  }

  return statusLabels[status] ?? status.replaceAll("_", " ").toLowerCase()
}

function AccountUsageMeter({
  label,
  limit,
  mutedTextClass,
  percent,
  used,
}: {
  label: string
  limit: number
  mutedTextClass: string
  percent: number
  used: number
}) {
  return (
    <div className="rounded-md border border-[#e5ded2] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="rounded-full bg-[#fff8e8] px-2.5 py-1 text-xs font-semibold text-[#735223]">
          {Math.min(percent, 100)}%
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[#d8a84f]" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <p className={`mt-2 text-xs ${mutedTextClass}`}>
        {formatBytes(used)} used of {formatBytes(limit)}
      </p>
    </div>
  )
}

function AccountPortalButton({
  children,
  icon,
  primary = false,
}: {
  children: ReactNode
  icon: ReactNode
  primary?: boolean
}) {
  return (
    <form action="/api/stripe/customer-portal" method="post">
      <button
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${
          primary
            ? "border-[#1f2a24] bg-[#1f2a24] text-white"
            : "border-[#d7d0c4] bg-white text-[#1e211d]"
        }`}
        type="submit"
      >
        {icon}
        {children}
      </button>
    </form>
  )
}

function inferShowcaseCategory(gallery: Gallery): ShowcaseCategory {
  const haystack = `${gallery.id} ${gallery.name}`.toLowerCase()
  const match = showcaseCategoryByGalleryKeyword.find(([keyword]) => haystack.includes(keyword))
  return match?.[1] ?? "Travel"
}

function buildShowcaseTags(galleryName: string, category: ShowcaseCategory, title: string) {
  const words = `${galleryName} ${title}`
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 4)
    .slice(0, 3)
    .map((word) => word.toLowerCase())

  return Array.from(new Set([category.toLowerCase(), galleryName.toLowerCase(), ...words])).slice(0, 5)
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
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("setup")
  const [areGalleriesOpen, setAreGalleriesOpen] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteBuilderSettings>(() => createDefaultWebsiteSettings(seedGalleries))
  const [previewTemplate, setPreviewTemplate] = useState<SiteSettings["siteTemplate"] | null>(null)
  const [imageBrightness, setImageBrightness] = useState(100)
  const [galleryTileSize, setGalleryTileSize] = useState(320)
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false)
  const [showNewGallery, setShowNewGallery] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [siteOrigin, setSiteOrigin] = useState("")
  const [hasLoadedSavedGalleries, setHasLoadedSavedGalleries] = useState(false)
  const [isRemotePortfolioEnabled, setIsRemotePortfolioEnabled] = useState(false)
  const [portfolioSaveStatus, setPortfolioSaveStatus] = useState<"local" | "saving" | "saved" | "error">("local")
  const [hasLoadedSiteSettings, setHasLoadedSiteSettings] = useState(false)
  const [hasLoadedWebsiteSettings, setHasLoadedWebsiteSettings] = useState(false)
  const [hasLoadedDisplayPreferences, setHasLoadedDisplayPreferences] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle")
  const [importUrl, setImportUrl] = useState("https://lenstraveler18.smugmug.com/Travel")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all")
  const [libraryQuery, setLibraryQuery] = useState("")
  const [librarySelectedKeys, setLibrarySelectedKeys] = useState<string[]>([])
  const [libraryBulkTags, setLibraryBulkTags] = useState("")
  const [shareTargetId, setShareTargetId] = useState<string>("all")
  const [mobileIncludedGalleryIds, setMobileIncludedGalleryIds] = useState<string[]>(() => seedGalleries.map((gallery) => gallery.id))
  const [siteSettingsSaveStatus, setSiteSettingsSaveStatus] = useState<"idle" | "saved">("idle")
  const [websiteSaveStatus, setWebsiteSaveStatus] = useState<"idle" | "saved">("idle")
  const [websiteBuilderPage, setWebsiteBuilderPage] = useState<WebsiteBuilderPageKey>("home")
  const [websiteBuilderSection, setWebsiteBuilderSection] = useState<WebsiteBuilderSectionKey>("hero")
  const [websiteBuilderTool, setWebsiteBuilderTool] = useState<WebsiteBuilderTool>("sections")
  const [websiteInspectorOpen, setWebsiteInspectorOpen] = useState(true)
  const [websitePreviewDevice, setWebsitePreviewDevice] = useState<WebsitePreviewDevice>("desktop")
  const [websitePublishOpen, setWebsitePublishOpen] = useState(false)
  const [draggedWebsiteSection, setDraggedWebsiteSection] = useState<WebsiteSectionOrderKey | null>(null)
  const [watermarkUploadStatus, setWatermarkUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [aboutImageUploadStatus, setAboutImageUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [heroImageUploadStatus, setHeroImageUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle")
  const [heroLibraryQuery, setHeroLibraryQuery] = useState("")
  const [showcaseSubmitStatus, setShowcaseSubmitStatus] = useState<ShowcaseSubmitStatus>("idle")
  const [showcaseSubmittedIds, setShowcaseSubmittedIds] = useState<string[]>([])
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null)
  const [accountSummaryStatus, setAccountSummaryStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [portfolioViewMode, setPortfolioViewMode] = useState<"grid" | "viewer">("grid")
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [aiAssistantStatus, setAiAssistantStatus] = useState<"idle" | "asking" | "error">("idle")
  const [aiAssistantMode, setAiAssistantMode] = useState<"ai" | "local" | null>(null)
  const [aiAssistantNote, setAiAssistantNote] = useState("")
  const [aiAssistantSuggestion, setAiAssistantSuggestion] = useState<AiPortfolioSuggestion | null>(null)
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null)
  const [mobileImportName, setMobileImportName] = useState("Phone Portfolio")
  const [mobileImportClient, setMobileImportClient] = useState("")
  const [mobileImportPreviews, setMobileImportPreviews] = useState<MobileImportPreview[]>([])
  const [mobileImportPage, setMobileImportPage] = useState(0)
  const [mobileImportStatus, setMobileImportStatus] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [mobileImportProgress, setMobileImportProgress] = useState({ completed: 0, failed: 0, total: 0 })
  const mobileImportPreviewUrlsRef = useRef<string[]>([])
  const websitePreviewScrollRef = useRef<HTMLDivElement>(null)
  const activeGallery = galleries.find((gallery) => gallery.id === activeGalleryId) ?? galleries[0]
  const activeWebsiteTemplate = websiteTemplates.find((template) => template.id === websiteSettings.template) ?? websiteTemplates[0]
  const websiteFeaturedGalleries = websiteSettings.featuredGalleryIds
    .map((galleryId) => galleries.find((gallery) => gallery.id === galleryId))
    .filter((gallery): gallery is Gallery => Boolean(gallery))
  const websiteSelectedGallery = galleries.find((gallery) => gallery.id === websiteSettings.selectedGalleryId) ?? galleries[0]
  const websiteHeroGallery = galleries.find((gallery) => gallery.id === websiteSettings.heroGalleryId) ?? websiteFeaturedGalleries[0] ?? galleries[0]
  const websiteWorkGalleries =
    websiteSettings.workSourceMode === "all"
      ? galleries
      : websiteSettings.workSourceMode === "single"
        ? websiteSelectedGallery
          ? [websiteSelectedGallery]
          : galleries.slice(0, 1)
        : websiteFeaturedGalleries.length > 0
          ? websiteFeaturedGalleries
          : galleries.slice(0, 4)
  const websiteSelectedPortfolioPhotos = getWebsiteGalleryPhotoItems(websiteSelectedGallery)
  const websitePrimaryWorkImage =
    websiteSettings.workSourceMode === "single"
      ? websiteSelectedPortfolioPhotos[0]
      : websiteWorkGalleries[0]
        ? {
            id: websiteWorkGalleries[0].id,
            source: websiteWorkGalleries[0].cover,
            title: websiteWorkGalleries[0].name,
          }
        : {
            id: activeGallery.id,
            source: activeGallery.cover,
            title: activeGallery.name,
          }
  const websiteFontClass =
    websiteSettings.siteFontStyle === "editorial"
      ? "font-serif"
      : websiteSettings.siteFontStyle === "classic"
        ? "font-serif"
        : websiteSettings.siteFontStyle === "mono"
          ? "font-mono"
          : "font-sans"
  const websiteHeadingClass =
    websiteSettings.siteFontStyle === "mono"
      ? "font-mono uppercase tracking-[0.08em]"
      : websiteSettings.siteFontStyle === "editorial"
        ? "font-serif tracking-normal"
        : websiteSettings.siteFontStyle === "classic"
          ? "font-serif"
          : "font-sans"
  const websiteShapeClass =
    websiteSettings.imageShape === "square"
      ? "rounded-none"
      : websiteSettings.imageShape === "pill"
        ? "rounded-3xl"
        : websiteSettings.imageShape === "arch"
          ? "rounded-t-full rounded-b-md"
          : "rounded-md"
  const websiteFrameClass =
    websiteSettings.imageFrame === "none"
      ? "border-transparent"
      : websiteSettings.imageFrame === "gold"
        ? "border-[#d8a84f] shadow-[0_10px_28px_rgba(96,66,23,0.22)]"
        : websiteSettings.imageFrame === "shadow"
          ? "border-black/10 shadow-xl"
          : websiteSettings.imageFrame === "print"
            ? "border-white shadow-lg"
            : "border-current/15"
  const websiteFrameThickness = websiteSettings.imageFrame === "none" ? 0 : Math.max(1, Math.min(16, websiteSettings.imageFrameThickness ?? 2))
  const websiteFrameStyle = { borderStyle: "solid", borderWidth: websiteFrameThickness }
  const websiteDefaultHeroSource = websiteFeaturedGalleries[0]?.cover ?? activeGallery.cover
  const websiteHeroLibraryItems = useMemo(
    () =>
      galleries.flatMap((gallery) =>
        (gallery.photos ?? [])
          .filter(isVisibleRenderableImage)
          .map((photo) => ({
            gallery,
            key: `${gallery.id}:${photo.id}`,
            photo,
            source: getDisplayUrl(photo) ?? getThumbnailUrl(photo) ?? gallery.cover,
          })),
      ),
    [galleries],
  )
  const filteredWebsiteHeroLibraryItems = useMemo(() => {
    const query = heroLibraryQuery.trim().toLowerCase()
    if (!query) return websiteHeroLibraryItems.slice(0, 60)

    return websiteHeroLibraryItems
      .filter(({ gallery, photo }) =>
        [
          gallery.name,
          gallery.client,
          photo.title,
          photo.fileName,
          photo.caption,
          photo.location,
          photo.trip,
          ...(photo.tags ?? []),
        ].some((value) => value?.toLowerCase().includes(query)),
      )
      .slice(0, 60)
  }, [heroLibraryQuery, websiteHeroLibraryItems])
  const websiteHeroLibraryItem = websiteHeroLibraryItems.find((item) => item.key === websiteSettings.heroLibraryPhotoKey)
  const websiteHeroImageSource =
    websiteSettings.heroImageMode === "upload"
      ? websiteSettings.heroImageUrl || websiteDefaultHeroSource
      : websiteSettings.heroImageMode === "library"
        ? websiteHeroLibraryItem?.source ?? websiteDefaultHeroSource
      : websiteSettings.heroImageMode === "portfolio"
        ? websiteHeroGallery?.cover ?? websiteDefaultHeroSource
        : websiteDefaultHeroSource
  const orderedWebsiteSectionKeys = normalizeWebsiteSectionOrder(websiteSettings.sectionOrder)
  const websiteSectionOrderIndex = (sectionKey: WebsiteSectionOrderKey) => {
    const index = orderedWebsiteSectionKeys.indexOf(sectionKey)

    return index === -1 ? 99 : index
  }
  const orderedWebsiteNavPageOptions = [
    websitePageOptions.find((pageOption) => pageOption.key === "home"),
    ...orderedWebsiteSectionKeys
      .map((sectionKey) => getPageFromSectionKey(sectionKey))
      .filter((pageKey): pageKey is Exclude<WebsiteBuilderPageKey, "home"> => Boolean(pageKey))
      .map((pageKey) => websitePageOptions.find((pageOption) => pageOption.key === pageKey)),
  ].filter((pageOption): pageOption is (typeof websitePageOptions)[number] => Boolean(pageOption))
  const getWebsiteSectionLabel = (sectionKey: WebsiteSectionOrderKey) => {
    const homeBlock = getHomeBlockFromSectionKey(sectionKey)
    if (homeBlock) return websiteBlockOptions.find((block) => block.key === homeBlock)?.label ?? homeBlock

    const pageKey = getPageFromSectionKey(sectionKey)
    if (!pageKey) return sectionKey

    if (pageKey === "custom" && websiteSettings.customPageTitle) return websiteSettings.customPageTitle

    return websitePageOptions.find((pageOption) => pageOption.key === pageKey)?.label ?? pageKey
  }
  const isWebsiteSectionVisible = (sectionKey: WebsiteSectionOrderKey) => {
    const homeBlock = getHomeBlockFromSectionKey(sectionKey)
    if (homeBlock) return websiteSettings.enabledBlocks[homeBlock]

    const pageKey = getPageFromSectionKey(sectionKey)
    if (!pageKey) return false

    return websiteSettings.visiblePages[pageKey]
  }
  const selectWebsiteSection = (sectionKey: WebsiteSectionOrderKey) => {
    setWebsiteBuilderTool("sections")
    setWebsiteInspectorOpen(true)
    const homeBlock = getHomeBlockFromSectionKey(sectionKey)
    if (homeBlock) {
      setWebsiteBuilderPage("home")
      setWebsiteBuilderSection(homeBlock)
      return
    }

    const pageKey = getPageFromSectionKey(sectionKey)
    if (pageKey) {
      setWebsiteBuilderPage(pageKey)
      setWebsiteBuilderSection(getWebsiteBuilderSectionForPage(pageKey))
    }
  }
  const selectWebsiteBuilderPage = (pageKey: WebsiteBuilderPageKey) => {
    setWebsiteBuilderTool("sections")
    setWebsiteInspectorOpen(true)
    setWebsiteBuilderPage(pageKey)
    setWebsiteBuilderSection(getWebsiteBuilderSectionForPage(pageKey))
  }
  const applyWebsiteTemplate = (templateId: WebsiteTemplate) => {
    setWebsiteSettings((current) => {
      const preset = websiteTemplateStylePresets[templateId]

      return {
        ...current,
        ...preset,
        enabledBlocks: getWebsiteTemplateEnabledBlocks(templateId, current.enabledBlocks),
        homeSectionOrder: getWebsiteTemplateHomeSectionOrder(templateId, preset.homeSectionOrder),
        sectionOrder: getWebsiteTemplateSectionOrder(templateId, preset.homeSectionOrder, current.sectionOrder),
        template: templateId,
      }
    })
  }
  const addWebsiteSection = (sectionKey: WebsiteSectionOrderKey) => {
    toggleWebsiteSectionVisibility(sectionKey, true)
    selectWebsiteSection(sectionKey)
    setWebsiteBuilderTool("sections")
  }
  const handleWebsitePreviewSectionKeyDown = (
    event: ReactKeyboardEvent<HTMLElement>,
    pageKey: WebsiteBuilderPageKey,
    sectionKey: WebsiteBuilderSectionKey,
  ) => {
    if (event.currentTarget !== event.target || (event.key !== "Enter" && event.key !== " ")) return

    event.preventDefault()
    setWebsiteBuilderTool("sections")
    setWebsiteInspectorOpen(true)
    setWebsiteBuilderPage(pageKey)
    setWebsiteBuilderSection(sectionKey)
  }
  const syncPageOrderFromSections = (sectionOrder: WebsiteSectionOrderKey[]) => [
    "home" as WebsiteBuilderPageKey,
    ...sectionOrder
      .map((sectionKey) => getPageFromSectionKey(sectionKey))
      .filter((pageKey): pageKey is Exclude<WebsiteBuilderPageKey, "home"> => Boolean(pageKey)),
  ]
  const syncHomeOrderFromSections = (sectionOrder: WebsiteSectionOrderKey[]) =>
    sectionOrder
      .map((sectionKey) => getHomeBlockFromSectionKey(sectionKey))
      .filter((sectionKey): sectionKey is WebsiteHomeSectionKey => Boolean(sectionKey))
  const moveWebsiteSection = (draggedKey: WebsiteSectionOrderKey, targetKey: WebsiteSectionOrderKey) => {
    if (draggedKey === targetKey) return

    setWebsiteSettings((current) => {
      const currentOrder = normalizeWebsiteSectionOrder(current.sectionOrder)
      const draggedIndex = currentOrder.indexOf(draggedKey)
      const targetIndex = currentOrder.indexOf(targetKey)

      if (draggedIndex === -1 || targetIndex === -1) return current

      const nextOrder = [...currentOrder]
      const [movedSection] = nextOrder.splice(draggedIndex, 1)
      nextOrder.splice(targetIndex, 0, movedSection)

      return {
        ...current,
        homeSectionOrder: syncHomeOrderFromSections(nextOrder),
        pageOrder: syncPageOrderFromSections(nextOrder),
        sectionOrder: nextOrder,
      }
    })
  }
  const moveWebsiteSectionByOffset = (sectionKey: WebsiteSectionOrderKey, offset: -1 | 1) => {
    const currentOrder = normalizeWebsiteSectionOrder(websiteSettings.sectionOrder)
    const currentIndex = currentOrder.indexOf(sectionKey)
    const targetKey = currentOrder[currentIndex + offset]

    if (targetKey) moveWebsiteSection(sectionKey, targetKey)
  }
  const toggleWebsiteSectionVisibility = (sectionKey: WebsiteSectionOrderKey, isVisible: boolean) => {
    const homeBlock = getHomeBlockFromSectionKey(sectionKey)
    if (homeBlock) {
      setWebsiteSettings((current) => ({
        ...current,
        enabledBlocks: {
          ...current.enabledBlocks,
          [homeBlock]: isVisible,
        },
      }))
      return
    }

    const pageKey = getPageFromSectionKey(sectionKey)
    if (!pageKey) return

    setWebsiteSettings((current) => ({
      ...current,
      visiblePages: {
        ...current.visiblePages,
        [pageKey]: isVisible,
      },
    }))
  }
  const toggleWebsiteSectionNavigation = (pageKey: Exclude<WebsiteBuilderPageKey, "home">, isVisible: boolean) => {
    setWebsiteSettings((current) => ({
      ...current,
      enabledPages: {
        ...current.enabledPages,
        [pageKey]: isVisible,
      },
    }))
  }
  const activeWebsiteSectionKey = (
    websiteBuilderPage === "home" ? `home:${websiteBuilderSection}` : `page:${websiteBuilderPage}`
  ) as WebsiteSectionOrderKey
  const activeWebsiteHomeBlock = getHomeBlockFromSectionKey(activeWebsiteSectionKey)
  const activeWebsitePageSection = getPageFromSectionKey(activeWebsiteSectionKey)
  useEffect(() => {
    const preview = websitePreviewScrollRef.current
    const section = preview?.querySelector<HTMLElement>(`[data-website-section="${activeWebsiteSectionKey}"]`)
    if (!preview || !section) return

    const frame = window.requestAnimationFrame(() => {
      preview.scrollTo({
        behavior: "smooth",
        top: Math.max(0, section.offsetTop - preview.clientHeight / 4),
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeWebsiteSectionKey])
  const activeWebsiteSectionHeading = (() => {
    switch (activeWebsiteSectionKey) {
      case "home:hero":
        return websiteSettings.heroHeadline
      case "home:textBlock":
        return websiteSettings.pageCopy.introHeadline
      case "home:featuredPortfolio":
        return websiteSettings.pageCopy.featuredWorkHeadline
      case "home:portfolioGrid":
        return websiteSettings.pageCopy.portfolioGridHeadline
      case "page:about":
        return websiteSettings.pageCopy.aboutHeadline
      case "page:gear":
        return websiteSettings.pageCopy.gearHeadline
      case "page:blog":
        return websiteSettings.pageCopy.blogHeadline
      case "page:articles":
        return websiteSettings.pageCopy.articlesHeadline
      case "page:contact":
        return websiteSettings.pageCopy.contactHeadline
      case "page:custom":
        return websiteSettings.customPageTitle
      default:
        return ""
    }
  })()
  const activeWebsiteSectionBody = (() => {
    switch (activeWebsiteSectionKey) {
      case "home:hero":
        return websiteSettings.heroSubhead
      case "home:textBlock":
        return websiteSettings.pageCopy.introBody
      case "page:about":
        return websiteSettings.pageCopy.aboutBody
      case "page:gear":
        return websiteSettings.pageCopy.gearBody
      case "page:blog":
        return websiteSettings.pageCopy.blogBody
      case "page:articles":
        return websiteSettings.pageCopy.articlesBody
      case "page:contact":
        return websiteSettings.pageCopy.contactIntro
      case "page:custom":
        return websiteSettings.pageCopy.customBody
      default:
        return null
    }
  })()
  const updateWebsiteSectionHeading = (sectionKey: WebsiteSectionOrderKey, value: string) => {
    setWebsiteSettings((current) => {
      switch (sectionKey) {
        case "home:hero":
          return { ...current, heroHeadline: value }
        case "home:textBlock":
          return { ...current, pageCopy: { ...current.pageCopy, introHeadline: value } }
        case "home:featuredPortfolio":
          return { ...current, pageCopy: { ...current.pageCopy, featuredWorkHeadline: value } }
        case "home:portfolioGrid":
          return { ...current, pageCopy: { ...current.pageCopy, portfolioGridHeadline: value } }
        case "page:about":
          return { ...current, pageCopy: { ...current.pageCopy, aboutHeadline: value } }
        case "page:gear":
          return { ...current, pageCopy: { ...current.pageCopy, gearHeadline: value } }
        case "page:blog":
          return { ...current, pageCopy: { ...current.pageCopy, blogHeadline: value } }
        case "page:articles":
          return { ...current, pageCopy: { ...current.pageCopy, articlesHeadline: value } }
        case "page:contact":
          return { ...current, pageCopy: { ...current.pageCopy, contactHeadline: value } }
        case "page:custom":
          return { ...current, customPageTitle: value }
        default:
          return current
      }
    })
  }
  const updateWebsiteSectionBody = (sectionKey: WebsiteSectionOrderKey, value: string) => {
    setWebsiteSettings((current) => {
      switch (sectionKey) {
        case "home:hero":
          return { ...current, heroSubhead: value }
        case "home:textBlock":
          return { ...current, pageCopy: { ...current.pageCopy, introBody: value } }
        case "page:about":
          return { ...current, pageCopy: { ...current.pageCopy, aboutBody: value } }
        case "page:gear":
          return { ...current, pageCopy: { ...current.pageCopy, gearBody: value } }
        case "page:blog":
          return { ...current, pageCopy: { ...current.pageCopy, blogBody: value } }
        case "page:articles":
          return { ...current, pageCopy: { ...current.pageCopy, articlesBody: value } }
        case "page:contact":
          return { ...current, pageCopy: { ...current.pageCopy, contactIntro: value } }
        case "page:custom":
          return { ...current, pageCopy: { ...current.pageCopy, customBody: value } }
        default:
          return current
      }
    })
  }
  const isTravelAtlasWebsite = websiteSettings.template === "travel-atlas"
  const isEditorialMagazineWebsite = websiteSettings.template === "editorial-magazine"
  const isGalleryWallWebsite = websiteSettings.template === "gallery-wall"
  const activeWebsiteLayout = websiteTemplatePreviewDesigns[websiteSettings.template]?.layout ?? "split"
  const isCenteredWebsite = activeWebsiteLayout === "center"
  const isPosterWebsite = activeWebsiteLayout === "poster"
  const isOverlayHero = websiteSettings.heroLayout === "overlay"
  const isStackedHero = websiteSettings.heroLayout === "stacked"
  const websiteHeroObjectPosition = websiteSettings.heroImagePosition === "left" ? "left center" : websiteSettings.heroImagePosition === "right" ? "right center" : "center"
  const activePhotos = activeGallery.photos ?? []
  const portfolioPhotos = activePhotos.filter(isRenderableImage)
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
  const storageReferenceBytes = 75 * 1024 ** 3
  const storagePercent = Math.min(Math.round((storageBytes / storageReferenceBytes) * 100), 100)
  const homeCoverOptions = useMemo(
    () => Array.from(new Set(galleries.map((gallery) => gallery.cover).filter(Boolean))),
    [galleries],
  )
  const shareTargetGallery = shareTargetId === "all" ? null : galleries.find((gallery) => gallery.id === shareTargetId) ?? activeGallery
  const shareTargetPath = shareTargetGallery ? publicGalleryPath(shareTargetGallery.id) : "/portfolio"
  const shareTargetUrl = `${siteOrigin}${shareTargetPath}`
  const shareTargetTitle = shareTargetGallery ? shareTargetGallery.name : "PhotoViewPro portfolio"
  const publicGalleryUrl = `${siteOrigin}${publicGalleryPath(activeGallery.id)}`
  const embedGalleryUrl = shareTargetGallery ? `${siteOrigin}${embedGalleryPath(shareTargetGallery.id)}` : `${siteOrigin}${embedPortfolioPath()}`
  const emailInviteUrl = `mailto:?subject=${encodeURIComponent(`Portfolio link: ${shareTargetTitle}`)}&body=${encodeURIComponent(`I wanted to share this PhotoViewPro portfolio with you:\n\n${shareTargetUrl}`)}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(shareTargetUrl)}`
  const embedCode = [
    `<div style="width:100%;max-width:1200px;margin:0 auto;">`,
    `  <iframe src="${embedGalleryUrl}" title="${shareTargetTitle} PhotoViewPro ${shareTargetGallery ? "portfolio" : "portfolio grid"}" width="100%" height="720" style="display:block;width:100%;border:0;background:#000;" loading="lazy" allow="fullscreen" allowfullscreen></iframe>`,
    `</div>`,
  ].join("\n")
  const mobileImportSelectedCount = mobileImportPreviews.filter((preview) => preview.selected).length
  const mobileImportPageCount = Math.max(1, Math.ceil(mobileImportPreviews.length / MOBILE_IMPORT_PAGE_SIZE))
  const mobileImportVisiblePreviews = mobileImportPreviews.slice(
    mobileImportPage * MOBILE_IMPORT_PAGE_SIZE,
    (mobileImportPage + 1) * MOBILE_IMPORT_PAGE_SIZE,
  )
  const libraryItems = useMemo<LibraryPhotoItem[]>(
    () =>
      galleries.flatMap((gallery) =>
        (gallery.photos ?? [])
          .filter(isRenderableImage)
          .map((photo) => ({
            gallery,
            key: `${gallery.id}:${photo.id}`,
            photo,
          })),
      ),
    [galleries],
  )
  const filteredLibraryItems = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase()

    return libraryItems.filter((item) => {
      const { gallery, photo } = item
      const tags = photo.tags ?? []
      const matchesFilter =
        libraryFilter === "all" ||
        (libraryFilter === "visible" && !photo.hidden) ||
        (libraryFilter === "hidden" && Boolean(photo.hidden)) ||
        (libraryFilter === "untagged" && tags.length === 0) ||
        (libraryFilter === "uncaptioned" && !photo.caption?.trim())

      if (!matchesFilter) return false
      if (!query) return true

      return [
        gallery.name,
        gallery.client,
        photo.title,
        photo.fileName,
        photo.caption,
        photo.category,
        photo.location,
        photo.trip,
        photo.capturedDate,
        photo.camera,
        photo.lens,
        photo.notes,
        photo.story,
        ...tags,
      ].some((value) => value?.toLowerCase().includes(query))
    })
  }, [libraryFilter, libraryItems, libraryQuery])
  const selectedLibraryItems = libraryItems.filter((item) => librarySelectedKeys.includes(item.key))
  const activeLibraryItem =
    selectedLibraryItems[0] ??
    filteredLibraryItems[0] ??
    null
  const libraryHiddenCount = libraryItems.filter((item) => item.photo.hidden).length
  const libraryTaggedCount = libraryItems.filter((item) => (item.photo.tags ?? []).length > 0).length
  const configuredSocialAccounts = socialAccountFields.filter((platform) =>
    siteSettings.socialAccounts[platform.key].trim(),
  )
  const getDirectSocialShareUrl = (
    platform: keyof SiteSettings["socialAccounts"],
    url = shareTargetUrl,
    title = shareTargetTitle,
  ) => {
    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      case "linkedin":
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      case "pinterest":
        return `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`
      case "x":
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      default:
        return siteSettings.socialAccounts[platform]
    }
  }
  const renderConfiguredSocialButtons = (url: string, title: string, context: string, className = "") => {
    if (configuredSocialAccounts.length === 0) return null

    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {configuredSocialAccounts.map((platform) => {
          const icon = (
            <span className="flex size-7 items-center justify-center rounded-full bg-white text-[12px] shadow-sm" style={{ color: platform.brandColor }}>
              <SocialIcon platform={platform.key} />
            </span>
          )

          if (platform.shareStyle === "direct") {
            return (
              <a
                aria-label={`Share ${context} on ${platform.label}`}
                href={getDirectSocialShareUrl(platform.key, url, title)}
                key={platform.key}
                onClick={() => recordShareEvent(platform.key, url, activeGallery.id)}
                rel="noreferrer"
                target="_blank"
                title={`Share on ${platform.label}`}
              >
                {icon}
              </a>
            )
          }

          return (
            <button
              aria-label={`Share ${context} on ${platform.label}`}
              key={platform.key}
              onClick={() => {
                navigator.clipboard?.writeText(`${title}\n${url}`)
                recordShareEvent(platform.key, url, activeGallery.id)
                window.open(siteSettings.socialAccounts[platform.key], "_blank", "noreferrer")
              }}
              title={`Share on ${platform.label}`}
              type="button"
            >
              {icon}
            </button>
          )
        })}
      </div>
    )
  }
  const selectedMobileGalleryIds = mobileIncludedGalleryIds.filter((galleryId) =>
    galleries.some((gallery) => gallery.id === galleryId),
  )
  const mobileCompanionSearch = new URLSearchParams({ mobile: "1" })
  if (selectedMobileGalleryIds.length > 0 && selectedMobileGalleryIds.length !== galleries.length) {
    mobileCompanionSearch.set("galleries", selectedMobileGalleryIds.join(","))
  }
  const mobileCompanionUrl = `${siteOrigin}/portfolio?${mobileCompanionSearch.toString()}`
  const mobileCompanionEmailUrl = `mailto:?subject=${encodeURIComponent("PhotoViewPro mobile companion")}&body=${encodeURIComponent(`Open this PhotoViewPro mobile companion link on your phone:\n\n${mobileCompanionUrl}\n\nTo add it as an icon:\n- iPhone Safari: tap Share, then Add to Home Screen, then Add.\n- Android Chrome: tap the menu, then Add to Home screen or Install app.`)}`
  const activeTemplatePreviewKey = previewTemplate ?? siteSettings.siteTemplate
  const activeTemplatePreview = siteTemplatePresets[activeTemplatePreviewKey]
  const activeSettingsTab = settingsTabs.find((tab) => tab.id === settingsTab) ?? settingsTabs[0]
  const isActivePhotoSubmittedToShowcase = activePhoto
    ? showcaseSubmittedIds.includes(`local-${activeGallery.id}-${activePhoto.id}`)
    : false
  const lightroomApiBaseUrl =
    siteSettings.lightroomImport.apiBaseUrl.trim() || siteOrigin || "http://localhost:3000"
  const lightroomImportEndpoint = `${lightroomApiBaseUrl.replace(/\/+$/, "")}/api/lightroom/import`
  const desktopUploaderBaseUrl = lightroomApiBaseUrl
  const desktopUploaderCommand = [
    "npm run photoviewpro:watch --",
    `--folder "${siteSettings.desktopUploader.watchFolder}"`,
    `--api-url ${desktopUploaderBaseUrl}`,
    siteSettings.lightroomImport.apiKey ? `--api-key ${siteSettings.lightroomImport.apiKey}` : "",
    `--gallery "${siteSettings.desktopUploader.galleryName}"`,
    siteSettings.desktopUploader.clientName ? `--client "${siteSettings.desktopUploader.clientName}"` : "",
    siteSettings.desktopUploader.recursive ? "--recursive" : "",
  ].filter(Boolean).join(" ")

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

  const toggleMobileGallery = useCallback(
    (galleryId: string) => {
      setMobileIncludedGalleryIds((current) => {
        const currentSet = current.filter((id) => galleries.some((gallery) => gallery.id === id))

        if (currentSet.includes(galleryId)) {
          return currentSet.length === 1 ? currentSet : currentSet.filter((id) => id !== galleryId)
        }

        return [...currentSet, galleryId]
      })
    },
    [galleries],
  )

  useEffect(() => {
    setSiteOrigin(window.location.origin)
    queueMicrotask(async () => {
      try {
        const response = await fetch("/api/portfolio/galleries", {
          credentials: "same-origin",
        })

        if (response.ok) {
          const payload = await response.json() as { galleries?: Gallery[] }
          setIsRemotePortfolioEnabled(true)

          if (Array.isArray(payload.galleries) && payload.galleries.length > 0) {
            setGalleries(payload.galleries)
            setActiveGalleryId(payload.galleries[0].id)
            setPortfolioSaveStatus("saved")
            setHasLoadedSavedGalleries(true)
            return
          }
        }
      } catch {
        setIsRemotePortfolioEnabled(false)
      }

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
    setMobileIncludedGalleryIds((current) => {
      const galleryIds = galleries.map((gallery) => gallery.id)
      const existingIds = current.filter((galleryId) => galleryIds.includes(galleryId))
      const newIds = galleryIds.filter((galleryId) => !current.includes(galleryId))

      return [...existingIds, ...newIds]
    })
  }, [galleries])

  useEffect(() => {
    const homeSectionOrder = DEFAULT_WEBSITE_HOME_SECTION_ORDER
    const galleryIds = galleries.map((gallery) => gallery.id)

    setWebsiteSettings((current) => {
      const validFeaturedGalleryIds = current.featuredGalleryIds.filter((galleryId) => galleryIds.includes(galleryId))

      return {
        ...current,
        featuredGalleryIds: validFeaturedGalleryIds,
        selectedGalleryId: galleryIds.includes(current.selectedGalleryId)
          ? current.selectedGalleryId
          : galleries[0]?.id ?? "",
        heroGalleryId: galleryIds.includes(current.heroGalleryId)
          ? current.heroGalleryId
          : validFeaturedGalleryIds[0] ?? galleries[0]?.id ?? "",
        heroLibraryPhotoKey: websiteHeroLibraryItems.some((item) => item.key === current.heroLibraryPhotoKey)
          ? current.heroLibraryPhotoKey
          : "",
        homeSectionOrder: [
          ...(current.homeSectionOrder ?? []).filter((sectionKey) => homeSectionOrder.includes(sectionKey)),
          ...homeSectionOrder.filter((sectionKey) => !(current.homeSectionOrder ?? []).includes(sectionKey)),
        ],
        pageOrder: normalizeWebsitePageOrder(current.pageOrder),
        sectionOrder: normalizeWebsiteSectionOrder(current.sectionOrder),
        visiblePages: {
          about: current.visiblePages?.about ?? current.enabledPages.about,
          articles: current.visiblePages?.articles ?? current.enabledPages.articles,
          blog: current.visiblePages?.blog ?? current.enabledPages.blog,
          contact: current.visiblePages?.contact ?? current.enabledPages.contact,
          custom: current.visiblePages?.custom ?? current.enabledPages.custom,
          gear: current.visiblePages?.gear ?? current.enabledPages.gear,
        },
      }
    })
  }, [galleries, websiteHeroLibraryItems])

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
    try {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get("panel") === "website") {
        setActivePanel("website")
      }

      const savedBuilderUi = window.localStorage.getItem(WEBSITE_BUILDER_UI_STORAGE_KEY)
      if (savedBuilderUi) {
        const parsedUi = JSON.parse(savedBuilderUi) as {
          page?: string
          returnToBuilder?: boolean
          section?: string
        }

        if (parsedUi.returnToBuilder) {
          setActivePanel("website")
          window.localStorage.setItem(
            WEBSITE_BUILDER_UI_STORAGE_KEY,
            JSON.stringify({
              page: parsedUi.page,
              section: parsedUi.section,
            }),
          )
        }

        if (parsedUi.page && websiteBuilderPageKeys.includes(parsedUi.page as WebsiteBuilderPageKey)) {
          setWebsiteBuilderPage(parsedUi.page as WebsiteBuilderPageKey)
        }

        if (parsedUi.section && websiteBuilderSectionKeys.includes(parsedUi.section as WebsiteBuilderSectionKey)) {
          setWebsiteBuilderSection(parsedUi.section as WebsiteBuilderSectionKey)
        }
      }

      const savedWebsiteSettings = window.localStorage.getItem(WEBSITE_BUILDER_STORAGE_KEY)
      if (savedWebsiteSettings) {
        const parsedSettings = JSON.parse(savedWebsiteSettings) as Partial<WebsiteBuilderSettings>
        const isLegacyDefaultCustomTrips = parsedSettings.customPageTitle === "Trips"
        setWebsiteSettings((current) => ({
          ...current,
          ...parsedSettings,
          customPageTitle: isLegacyDefaultCustomTrips ? current.customPageTitle : parsedSettings.customPageTitle ?? current.customPageTitle,
          enabledBlocks: {
            ...current.enabledBlocks,
            ...parsedSettings.enabledBlocks,
          },
          enabledPages: {
            ...current.enabledPages,
            ...parsedSettings.enabledPages,
            home: true,
            custom: isLegacyDefaultCustomTrips ? false : parsedSettings.enabledPages?.custom ?? current.enabledPages.custom,
          },
          visiblePages: {
            ...current.visiblePages,
            ...(parsedSettings.visiblePages ?? parsedSettings.enabledPages),
            custom: isLegacyDefaultCustomTrips
              ? false
              : parsedSettings.visiblePages?.custom ?? parsedSettings.enabledPages?.custom ?? current.visiblePages.custom,
          },
          featuredGalleryIds: Array.isArray(parsedSettings.featuredGalleryIds) ? parsedSettings.featuredGalleryIds : current.featuredGalleryIds,
          pageCopy: {
            ...current.pageCopy,
            ...parsedSettings.pageCopy,
          },
          navigationLabels: {
            ...current.navigationLabels,
            ...parsedSettings.navigationLabels,
            gear:
              !parsedSettings.navigationLabels?.gear || parsedSettings.navigationLabels.gear === "Gear"
                ? current.navigationLabels.gear
                : parsedSettings.navigationLabels.gear,
          },
          pageOrder: normalizeWebsitePageOrder(parsedSettings.pageOrder),
          sectionOrder: normalizeWebsiteSectionOrder(parsedSettings.sectionOrder),
          showSectionBodies: {
            ...current.showSectionBodies,
            ...parsedSettings.showSectionBodies,
          },
          showSectionHeadings: {
            ...current.showSectionHeadings,
            ...parsedSettings.showSectionHeadings,
            ...(typeof (parsedSettings as Partial<WebsiteBuilderSettings> & { showFeaturedWorkHeadline?: boolean }).showFeaturedWorkHeadline === "boolean"
              ? {
                  "home:featuredPortfolio": (parsedSettings as Partial<WebsiteBuilderSettings> & { showFeaturedWorkHeadline?: boolean })
                    .showFeaturedWorkHeadline,
                }
              : {}),
          },
          tripEntries: Array.isArray(parsedSettings.tripEntries) ? parsedSettings.tripEntries : current.tripEntries,
        }))
      }
    } catch {
      window.localStorage.removeItem(WEBSITE_BUILDER_STORAGE_KEY)
    }

    setHasLoadedWebsiteSettings(true)
  }, [])

  useEffect(() => {
    try {
      const savedSubmissions = window.localStorage.getItem(SHOWCASE_SUBMISSIONS_STORAGE_KEY)
      if (!savedSubmissions) return

      const submissions = JSON.parse(savedSubmissions) as ShowcasePhoto[]
      if (Array.isArray(submissions)) {
        setShowcaseSubmittedIds(submissions.map((photo) => photo.id))
      }
    } catch {
      window.localStorage.removeItem(SHOWCASE_SUBMISSIONS_STORAGE_KEY)
    }
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
    if (!hasLoadedSavedGalleries || !isRemotePortfolioEnabled) return

    setPortfolioSaveStatus("saving")

    const syncTimer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/portfolio/galleries", {
          body: JSON.stringify({ galleries }),
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          method: "PUT",
        })

        if (!response.ok) throw new Error("Portfolio sync failed")

        setPortfolioSaveStatus("saved")
        setLastSyncedAt(new Date().toISOString())
      } catch {
        setPortfolioSaveStatus("error")
      }
    }, 900)

    return () => window.clearTimeout(syncTimer)
  }, [galleries, hasLoadedSavedGalleries, isRemotePortfolioEnabled])

  useEffect(() => {
    if (hasLoadedSiteSettings) {
      window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(siteSettings))
    }
  }, [hasLoadedSiteSettings, siteSettings])

  useEffect(() => {
    if (hasLoadedWebsiteSettings) {
      window.localStorage.setItem(WEBSITE_BUILDER_STORAGE_KEY, JSON.stringify(websiteSettings))
    }
  }, [hasLoadedWebsiteSettings, websiteSettings])

  useEffect(() => {
    if (hasLoadedWebsiteSettings) {
      window.localStorage.setItem(
        WEBSITE_BUILDER_UI_STORAGE_KEY,
        JSON.stringify({
          page: websiteBuilderPage,
          section: websiteBuilderSection,
        }),
      )
    }
  }, [hasLoadedWebsiteSettings, websiteBuilderPage, websiteBuilderSection])

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

  useEffect(() => {
    if (settingsTab !== "account" || accountSummary || accountSummaryStatus === "loading") return

    let isMounted = true
    setAccountSummaryStatus("loading")

    fetch("/api/account/summary", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load account")
        return response.json() as Promise<{ account: AccountSummary }>
      })
      .then(({ account }) => {
        if (!isMounted) return
        setAccountSummary(account)
        setAccountSummaryStatus("ready")
      })
      .catch(() => {
        if (!isMounted) return
        setAccountSummaryStatus("error")
      })

    return () => {
      isMounted = false
    }
  }, [accountSummary, accountSummaryStatus, settingsTab])

  useEffect(() => {
    return () => {
      mobileImportPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      mobileImportPreviewUrlsRef.current = []
    }
  }, [])

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
      description: "New portfolio gallery ready for uploads, curation, and sharing.",
      allowDownloads: true,
      infoPaneEnabled: false,
      photoLabelMode: "file-name",
      showFileNames: true,
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

  function parseTagInput(value: string) {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    )
  }

  function updateLibraryPhoto(galleryId: string, photoId: string, updates: Partial<PortfolioPhoto>) {
    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== galleryId) return gallery

        const photos = (gallery.photos ?? []).map((photo) =>
          photo.id === photoId ? { ...photo, ...updates } : photo,
        )

        return {
          ...gallery,
          images: photos.filter(isVisibleRenderableImage).length,
          photos,
        }
      }),
    )

    if (updates.hidden !== undefined) persistPhotoVisibility(galleryId, photoId, updates.hidden)
  }

  function bulkUpdateLibraryPhotos(updates: Partial<PortfolioPhoto>) {
    if (librarySelectedKeys.length === 0) return

    const selectedKeys = new Set(librarySelectedKeys)

    setGalleries((current) =>
      current.map((gallery) => {
        const photos = (gallery.photos ?? []).map((photo) =>
          selectedKeys.has(`${gallery.id}:${photo.id}`) ? { ...photo, ...updates } : photo,
        )

        return {
          ...gallery,
          images: photos.filter(isVisibleRenderableImage).length,
          photos,
        }
      }),
    )

    if (updates.hidden !== undefined) {
      selectedLibraryItems.forEach((item) => {
        persistPhotoVisibility(item.gallery.id, item.photo.id, updates.hidden ?? false)
        if (updates.hidden) removePhotoFromShowcaseSubmission(item.gallery.id, item.photo.id)
      })
    }
  }

  function addTagsToSelectedLibraryPhotos() {
    const tags = parseTagInput(libraryBulkTags)
    if (tags.length === 0 || librarySelectedKeys.length === 0) return

    const selectedKeys = new Set(librarySelectedKeys)

    setGalleries((current) =>
      current.map((gallery) => ({
        ...gallery,
        photos: (gallery.photos ?? []).map((photo) => {
          if (!selectedKeys.has(`${gallery.id}:${photo.id}`)) return photo

          return {
            ...photo,
            tags: Array.from(new Set([...(photo.tags ?? []), ...tags])),
          }
        }),
      })),
    )
    setLibraryBulkTags("")
  }

  function toggleLibrarySelection(key: string) {
    setLibrarySelectedKeys((current) =>
      current.includes(key) ? current.filter((selectedKey) => selectedKey !== key) : [...current, key],
    )
  }

  function openLibraryItem(item: LibraryPhotoItem) {
    setLibrarySelectedKeys([item.key])
  }

  function handleGalleryPhotoUploaded(uploadedFile: ClientPhotoUploadResult) {
    if (!uploadedFile.photo || !uploadedFile.gallery) return

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== uploadedFile.gallery?.id) return gallery

        const existingPhotos = gallery.photos ?? []
        const nextPhotos = [...existingPhotos, uploadedFile.photo as PortfolioPhoto]
        const nextCover = existingPhotos.length === 0 ? getPhotoCover(uploadedFile.photo) ?? gallery.cover : gallery.cover

        return {
          ...gallery,
          cover: nextCover,
          images: nextPhotos.filter(isVisibleRenderableImage).length,
          photos: nextPhotos,
        }
      }),
    )

    setActiveGalleryId(uploadedFile.gallery.id)
    setActivePhotoIndex((current) => (current === -1 ? (activePhotos.length === 0 ? 0 : current) : current))
  }

  function handleMobileImportFiles(files: FileList | null) {
    mobileImportPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    mobileImportPreviewUrlsRef.current = []

    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"))
    const previews = imageFiles.map((file, index) => {
      const url = URL.createObjectURL(file)
      mobileImportPreviewUrlsRef.current.push(url)

      return {
        file,
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        selected: true,
        url,
      }
    })

    setMobileImportPreviews(previews)
    setMobileImportPage(0)
    setMobileImportStatus("idle")
    setMobileImportProgress({ completed: 0, failed: 0, total: previews.length })
  }

  function toggleMobileImportSelection(previewId: string) {
    setMobileImportPreviews((current) =>
      current.map((preview) =>
        preview.id === previewId ? { ...preview, selected: !preview.selected } : preview,
      ),
    )
  }

  async function syncPortfolioGalleriesNow(nextGalleries: Gallery[]) {
    if (!isRemotePortfolioEnabled) return

    const response = await fetch("/api/portfolio/galleries", {
      body: JSON.stringify({ galleries: nextGalleries }),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    if (!response.ok) throw new Error("Portfolio sync failed")
  }

  async function startMobileImport() {
    const selectedPreviews = mobileImportPreviews.filter((preview) => preview.selected)
    const name = mobileImportName.trim()

    if (!name || selectedPreviews.length === 0 || mobileImportStatus === "uploading") return

    const idBase = slugify(name) || `phone-portfolio-${Date.now()}`
    const galleryId = galleries.some((gallery) => gallery.id === idBase) ? `${idBase}-${Date.now()}` : idBase
    const newGallery: Gallery = {
      id: galleryId,
      name,
      client: mobileImportClient.trim() || "Personal",
      status: "Draft",
      privacy: "Private link",
      images: 0,
      favorites: 0,
      revenue: "$0",
      cover: activeGallery.cover,
      description: "Imported from a mobile device. Choose a cover, hide weak images, and drag the order before sharing.",
      allowDownloads: true,
      embedEnabled: true,
      infoPaneEnabled: false,
      photoLabelMode: "caption",
      photos: [],
      showFileNames: false,
      watermarkEnabled: false,
      watermarkMode: "text",
      watermarkOpacity: 55,
      watermarkPosition: "bottom-right",
      watermarkSize: 140,
      watermarkText: mobileImportClient.trim() || "PhotoViewPro",
    }

    setMobileImportStatus("uploading")
    setMobileImportProgress({ completed: 0, failed: 0, total: selectedPreviews.length })

    try {
      await syncPortfolioGalleriesNow([newGallery, ...galleries])

      const uploadedPhotos: PortfolioPhoto[] = []

      for (const [index, preview] of selectedPreviews.entries()) {
        try {
          const extension = preview.file.name.split(".").pop()?.toLowerCase() || "jpg"
          const safeName = slugify(preview.file.name.replace(/\.[^/.]+$/, "")) || `phone-photo-${index + 1}`
          const uploaded = await uploadPhotoFromClient(
            `mobile/${galleryId}/${String(index + 1).padStart(3, "0")}-${safeName}.${extension}`,
            preview.file,
            {
              galleryId,
              title: preview.file.name.replace(/\.[^/.]+$/, "") || `Phone photo ${index + 1}`,
            },
          )

          if (uploaded.photo) {
            uploadedPhotos.push(uploaded.photo as PortfolioPhoto)
          }

          setMobileImportProgress((current) => ({
            ...current,
            completed: current.completed + 1,
          }))
        } catch {
          setMobileImportProgress((current) => ({
            ...current,
            failed: current.failed + 1,
          }))
        }
      }

      const importedGallery: Gallery = {
        ...newGallery,
        cover: getPhotoCover(uploadedPhotos[0]) ?? newGallery.cover,
        images: uploadedPhotos.filter(isVisibleRenderableImage).length,
        photos: uploadedPhotos,
      }
      const nextGalleries = [importedGallery, ...galleries]

      setGalleries(nextGalleries)
      setActiveGalleryId(galleryId)
      setActivePanel("photos")
      setPortfolioViewMode("grid")
      setActivePhotoIndex(-1)
      setMobileImportStatus("done")
      await syncPortfolioGalleriesNow(nextGalleries)
      window.requestAnimationFrame(() => {
        document.getElementById("portfolio-view")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      })
    } catch {
      setMobileImportStatus("error")
    }
  }

  function saveSiteSettings() {
    window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(siteSettings))
    setSiteSettingsSaveStatus("saved")
    window.setTimeout(() => setSiteSettingsSaveStatus("idle"), 1800)
  }

  function updateLightroomImport(updates: Partial<SiteSettings["lightroomImport"]>) {
    setSiteSettings((current) => ({
      ...current,
      lightroomImport: {
        ...current.lightroomImport,
        ...updates,
      },
    }))
  }

  function generateLightroomApiKey() {
    const bytes = new Uint8Array(24)
    window.crypto.getRandomValues(bytes)
    const key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    updateLightroomImport({ apiKey: `pvp_lr_${key}` })
  }

  function updateDesktopUploader(updates: Partial<SiteSettings["desktopUploader"]>) {
    setSiteSettings((current) => ({
      ...current,
      desktopUploader: {
        ...current.desktopUploader,
        ...updates,
      },
    }))
  }

  function openGallery(galleryId: string) {
    setActiveGalleryId(galleryId)
    setActivePhotoIndex(-1)
    setPortfolioViewMode("grid")
    setActivePanel("photos")
    window.requestAnimationFrame(() => {
      document.getElementById("portfolio-view")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  function openPhotoViewer(photoId: string) {
    const index = renderablePhotos.findIndex((photo) => photo.id === photoId)
    if (index < 0) return
    setActivePhotoIndex(index)
    setPortfolioViewMode("viewer")
  }

  function chooseReplacementCover(photos: PortfolioPhoto[], fallbackCover: string) {
    return getPhotoCover(photos.find(isVisibleRenderableImage)) ?? fallbackCover
  }

  function persistCoverSelection(galleryId: string, photoId: string, coverUrl: string) {
    fetch(`/api/portfolio/galleries/${encodeURIComponent(galleryId)}/cover`, {
      body: JSON.stringify({ coverUrl, photoId }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).catch(() => undefined)
  }

  function persistPhotoVisibility(galleryId: string, photoId: string, hidden: boolean) {
    fetch(`/api/portfolio/galleries/${encodeURIComponent(galleryId)}/photos/${encodeURIComponent(photoId)}`, {
      body: JSON.stringify({ hidden }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    }).catch(() => undefined)
  }

  function persistPhotoCaption(galleryId: string, photoId: string, caption: string) {
    fetch(`/api/portfolio/galleries/${encodeURIComponent(galleryId)}/photos/${encodeURIComponent(photoId)}`, {
      body: JSON.stringify({ caption }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    }).catch(() => undefined)
  }

  function persistPhotoDelete(galleryId: string, photoId: string) {
    fetch(`/api/portfolio/galleries/${encodeURIComponent(galleryId)}/photos/${encodeURIComponent(photoId)}`, {
      method: "DELETE",
    }).catch(() => undefined)
  }

  function recordShareEvent(network: string, shareUrl = shareTargetUrl, galleryId = shareTargetGallery?.id ?? "all") {
    fetch("/api/portfolio/share-events", {
      body: JSON.stringify({ galleryId, network, shareUrl }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).catch(() => undefined)
  }

  function buildAiPortfolioPayload(action: AiPortfolioAction) {
    return {
      action,
      gallery: {
        client: activeGallery.client,
        description: activeGallery.description,
        id: activeGallery.id,
        infoLocation: activeGallery.infoLocation ?? "",
        name: activeGallery.name,
        privacy: activeGallery.privacy,
        publicUrl: publicGalleryUrl,
      },
      photos: portfolioPhotos.map((photo) => ({
        caption: photo.caption ?? "",
        category: photo.category ?? "",
        fileName: photo.fileName ?? "",
        height: photo.height ?? null,
        hidden: Boolean(photo.hidden),
        id: photo.id,
        location: photo.location ?? "",
        tags: photo.tags ?? [],
        title: photo.title ?? "",
        trip: photo.trip ?? "",
        width: photo.width ?? null,
      })),
    }
  }

  async function requestAiPortfolioSuggestion(action: AiPortfolioAction) {
    if (portfolioPhotos.length === 0 || aiAssistantStatus === "asking") return

    setAiAssistantOpen(true)
    setAiAssistantStatus("asking")
    setAiAssistantNote("")

    try {
      const response = await fetch("/api/ai/portfolio", {
        body: JSON.stringify(buildAiPortfolioPayload(action)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as {
        error?: string
        mode?: "ai" | "local"
        note?: string
        suggestion?: AiPortfolioSuggestion
      }

      if (!response.ok || !payload.suggestion) {
        throw new Error(payload.error ?? "Portfolio assistant is unavailable.")
      }

      setAiAssistantSuggestion(payload.suggestion)
      setAiAssistantMode(payload.mode ?? "ai")
      setAiAssistantNote(payload.note ?? "")
      setAiAssistantStatus("idle")
    } catch (error) {
      setAiAssistantStatus("error")
      setAiAssistantNote(error instanceof Error ? error.message : "Portfolio assistant is unavailable.")
    }
  }

  function findPortfolioPhoto(photoId: string) {
    return portfolioPhotos.find((photo) => photo.id === photoId)
  }

  function applyAiCoverSuggestion() {
    if (!aiAssistantSuggestion?.coverPhotoId) return
    const photo = findPortfolioPhoto(aiAssistantSuggestion.coverPhotoId)
    if (!photo || photo.hidden) return

    setPhotoAsCover(photo)
  }

  function applyAiOrderSuggestion() {
    if (!aiAssistantSuggestion?.orderedPhotoIds.length) return

    const suggestedOrder = new Map(aiAssistantSuggestion.orderedPhotoIds.map((photoId, index) => [photoId, index]))

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = [...(gallery.photos ?? [])]
        const visibleSortedPhotos = photos
          .filter((photo) => !photo.hidden && suggestedOrder.has(photo.id))
          .sort((a, b) => (suggestedOrder.get(a.id) ?? 0) - (suggestedOrder.get(b.id) ?? 0))
        const untouchedPhotos = photos.filter((photo) => photo.hidden || !suggestedOrder.has(photo.id))

        return {
          ...gallery,
          photos: [...visibleSortedPhotos, ...untouchedPhotos],
        }
      }),
    )

    setActivePhotoIndex(-1)
  }

  function applyAiCaptionAndTagSuggestions() {
    if (!aiAssistantSuggestion?.captionUpdates.length) return
    const updatesByPhotoId = new Map(aiAssistantSuggestion.captionUpdates.map((update) => [update.photoId, update]))

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        return {
          ...gallery,
          photos: (gallery.photos ?? []).map((photo) => {
            const update = updatesByPhotoId.get(photo.id)
            if (!update) return photo

            return {
              ...photo,
              caption: photo.caption?.trim() ? photo.caption : update.caption,
              tags: Array.from(new Set([...(photo.tags ?? []), ...update.tags])).slice(0, 12),
            }
          }),
        }
      }),
    )
  }

  function applyAiPortfolioIntro() {
    if (!aiAssistantSuggestion?.intro) return
    updateActiveGallery({ description: aiAssistantSuggestion.intro })
  }

  function copyAiSocialPost(platform: keyof AiPortfolioSuggestion["socialPosts"]) {
    const text = aiAssistantSuggestion?.socialPosts[platform]
    if (!text) return

    navigator.clipboard?.writeText(text)
    recordShareEvent(`ai-${platform}`, publicGalleryUrl, activeGallery.id)
  }

  function setCurrentPhotoAsCover() {
    const cover = getPhotoCover(activePhoto)
    if (!cover || !activePhoto) return

    updateActiveGallery({ cover })
    persistCoverSelection(activeGallery.id, activePhoto.id, cover)
    setActivePhotoIndex(-1)
  }

  function setPhotoAsCover(photo: PortfolioPhoto) {
    const cover = getPhotoCover(photo)
    if (!cover) return

    updateActiveGallery({ cover })
    persistCoverSelection(activeGallery.id, photo.id, cover)
  }

  function reorderPortfolioPhoto(draggedId: string, targetId: string) {
    if (draggedId === targetId) return

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = [...(gallery.photos ?? [])]
        const fromIndex = photos.findIndex((photo) => photo.id === draggedId)
        const toIndex = photos.findIndex((photo) => photo.id === targetId)
        if (fromIndex < 0 || toIndex < 0) return gallery

        const [draggedPhoto] = photos.splice(fromIndex, 1)
        photos.splice(toIndex, 0, draggedPhoto)

        return { ...gallery, photos }
      }),
    )

    const activePhotoId = activePhoto?.id
    if (activePhotoId) {
      const nextVisiblePhotos = [...renderablePhotos]
      const fromIndex = nextVisiblePhotos.findIndex((photo) => photo.id === draggedId)
      const toIndex = nextVisiblePhotos.findIndex((photo) => photo.id === targetId)
      if (fromIndex >= 0 && toIndex >= 0) {
        const [draggedPhoto] = nextVisiblePhotos.splice(fromIndex, 1)
        nextVisiblePhotos.splice(toIndex, 0, draggedPhoto)
        setActivePhotoIndex(Math.max(0, nextVisiblePhotos.findIndex((photo) => photo.id === activePhotoId)))
      }
    }
  }

  function togglePortfolioPhotoVisibility(photoId: string, isVisible: boolean) {
    const currentCover = activeGallery.cover
    const nextHidden = !isVisible

    setGalleries((current) =>
      current.map((gallery) => {
        if (gallery.id !== activeGallery.id) return gallery

        const photos = (gallery.photos ?? []).map((photo) =>
          photo.id === photoId ? { ...photo, hidden: !isVisible } : photo,
        )
        const toggledPhoto = gallery.photos?.find((photo) => photo.id === photoId)
        const hiddenCurrentCover = !isVisible && getPhotoCover(toggledPhoto) === currentCover

        return {
          ...gallery,
          cover: hiddenCurrentCover ? chooseReplacementCover(photos, gallery.cover) : gallery.cover,
          images: photos.filter(isVisibleRenderableImage).length,
          photos,
        }
      }),
    )
    persistPhotoVisibility(activeGallery.id, photoId, nextHidden)
    if (nextHidden) removePhotoFromShowcaseSubmission(activeGallery.id, photoId)
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
    persistPhotoVisibility(activeGallery.id, hiddenPhotoId, true)
    removePhotoFromShowcaseSubmission(activeGallery.id, hiddenPhotoId)
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
    persistPhotoDelete(activeGallery.id, deletedPhotoId)
    removePhotoFromShowcaseSubmission(activeGallery.id, deletedPhotoId)
    setActivePhotoIndex((current) => Math.max(0, Math.min(current, renderablePhotos.length - 2)))
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

  function removePhotoFromShowcaseSubmission(galleryId: string, photoId: string) {
    const submissionId = `local-${galleryId}-${photoId}`

    try {
      const savedSubmissions = window.localStorage.getItem(SHOWCASE_SUBMISSIONS_STORAGE_KEY)
      const submissions = savedSubmissions ? (JSON.parse(savedSubmissions) as ShowcasePhoto[]) : []
      const nextSubmissions = submissions.filter((photo) => photo.id !== submissionId)

      window.localStorage.setItem(SHOWCASE_SUBMISSIONS_STORAGE_KEY, JSON.stringify(nextSubmissions))
      setShowcaseSubmittedIds((current) => current.filter((submittedPhotoId) => submittedPhotoId !== submissionId))
    } catch {
      return
    }
  }

  function submitCurrentPhotoToShowcase() {
    if (!activePhoto) return

    const submissionId = `local-${activeGallery.id}-${activePhoto.id}`

    try {
      const savedSubmissions = window.localStorage.getItem(SHOWCASE_SUBMISSIONS_STORAGE_KEY)
      const submissions = savedSubmissions ? (JSON.parse(savedSubmissions) as ShowcasePhoto[]) : []

      if (submissions.some((photo) => photo.id === submissionId)) {
        setShowcaseSubmitStatus("duplicate")
        window.setTimeout(() => setShowcaseSubmitStatus("idle"), 2200)
        return
      }

      const category = inferShowcaseCategory(activeGallery)
      const imageUrl = getDisplayUrl(activePhoto) ?? activeGallery.cover
      const submission: ShowcasePhoto = {
        id: submissionId,
        category,
        comments: 0,
        imageUrl,
        location: activeGallery.name,
        photographer: activeGallery.client || "PhotoViewPro Photographer",
        portfolioId: activeGallery.id,
        portfolioName: activeGallery.name,
        status: "Approved",
        submittedAt: new Date().toISOString(),
        tags: buildShowcaseTags(activeGallery.name, category, activePhoto.title),
        thumbnailUrl: getThumbnailUrl(activePhoto),
        title: activePhoto.caption || activePhoto.title || activeGallery.name,
        votes: 0,
      }
      const nextSubmissions = [submission, ...submissions]

      window.localStorage.setItem(SHOWCASE_SUBMISSIONS_STORAGE_KEY, JSON.stringify(nextSubmissions))
      setShowcaseSubmittedIds((current) => Array.from(new Set([submissionId, ...current])))
      setShowcaseSubmitStatus("submitted")
      window.setTimeout(() => setShowcaseSubmitStatus("idle"), 2200)
    } catch {
      setShowcaseSubmitStatus("idle")
    }
  }

  function removeCurrentPhotoFromShowcase() {
    if (!activePhoto) return

    removePhotoFromShowcaseSubmission(activeGallery.id, activePhoto.id)
    setShowcaseSubmitStatus("removed")
    window.setTimeout(() => setShowcaseSubmitStatus("idle"), 2200)
  }

  function toggleCurrentPhotoShowcaseSubmission() {
    if (isActivePhotoSubmittedToShowcase) {
      removeCurrentPhotoFromShowcase()
      return
    }

    submitCurrentPhotoToShowcase()
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

      const uploadedPhoto = await uploadPhotoFromClient(
        `watermarks/${activeGallery.id}/${safeName || "watermark"}.${extension}`,
        file,
      )

      updateActiveGallery({
        watermarkEnabled: true,
        watermarkImageUrl: uploadedPhoto.url,
        watermarkMode: activeGallery.watermarkMode === "text" ? "image" : activeGallery.watermarkMode ?? "image",
      })
      setWatermarkUploadStatus("uploaded")
    } catch {
      setWatermarkUploadStatus("error")
    }
  }

  async function uploadWebsiteAboutImage(file: File) {
    setAboutImageUploadStatus("uploading")

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)

      const uploadedPhoto = await uploadPhotoFromClient(
        `website/about/${safeName || "about-photo"}.${extension}`,
        file,
      )

      setWebsiteSettings((current) => ({
        ...current,
        aboutImageUrl: uploadedPhoto.url,
      }))
      setAboutImageUploadStatus("uploaded")
    } catch {
      setAboutImageUploadStatus("error")
    }
  }

  async function uploadWebsiteHeroImage(file: File) {
    setHeroImageUploadStatus("uploading")

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)

      const uploadedPhoto = await uploadPhotoFromClient(
        `website/hero/${safeName || "hero-image"}.${extension}`,
        file,
      )

      setWebsiteSettings((current) => ({
        ...current,
        heroImageMode: "upload",
        heroImageUrl: uploadedPhoto.url,
      }))
      setHeroImageUploadStatus("uploaded")
    } catch {
      setHeroImageUploadStatus("error")
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
      <div className={`grid min-h-screen ${activePanel === "website" ? "lg:grid-cols-1" : "lg:grid-cols-[248px_1fr]"}`}>
        <aside className={`border-b border-[#ded8cc] bg-[#151714] px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r ${activePanel === "website" ? "hidden" : ""}`}>
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-[#161713]">
                <Camera className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">PhotoViewPro</p>
                <p className="text-xs text-white/55">Portfolio dashboard</p>
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
                activePanel === "library"
                  ? "bg-white text-[#171814]"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setActivePanel("library")}
              type="button"
            >
              <Images className="size-4" />
              <span>Library</span>
            </button>

            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm ${
                activePanel === "website"
                  ? "bg-white text-[#171814]"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setActivePanel("website")}
              type="button"
            >
              <Globe2 className="size-4" />
              <span>My Website</span>
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
                <button
                  className="mb-1 flex w-full items-center gap-2 rounded bg-[#d8a84f] px-2 py-2 text-left text-xs font-semibold text-[#151714] hover:bg-[#e5b85f]"
                  onClick={() => {
                    setActivePanel("photos")
                    setShowNewGallery(true)
                  }}
                  type="button"
                >
                  <ImagePlus className="size-3.5" />
                  <span className="min-w-0 flex-1 truncate">Add new gallery</span>
                </button>
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
                activePanel === "settings" && settingsTab === "mobile"
                  ? "bg-white text-[#171814]"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => {
                setActivePanel("settings")
                setSettingsTab("mobile")
              }}
              type="button"
            >
              <Smartphone className="size-4" />
              <span>Mobile Access</span>
            </button>

            <button
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm ${
                activePanel === "settings" && settingsTab !== "mobile"
                  ? "bg-white text-[#171814]"
                  : "text-white/68 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => {
                setActivePanel("settings")
                if (settingsTab === "mobile") setSettingsTab("setup")
              }}
              type="button"
            >
              <Settings2 className="size-4" />
              <span>Settings</span>
            </button>

            <Link
              className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-white/68 hover:bg-white/10 hover:text-white"
              href="/api/auth/signout"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </Link>
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
                    : activePanel === "library"
                      ? `${libraryItems.length.toLocaleString()} photos across ${galleries.length.toLocaleString()} portfolios`
                      : activePanel === "website"
                        ? "Photography website builder"
                        : `${activeGallery.images.toLocaleString()} photos`}
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                {activePanel === "settings"
                  ? `${activeSettingsTab.label} settings`
                  : activePanel === "library"
                    ? "Library"
                    : activePanel === "website"
                      ? "My Website"
                    : activeGallery.name}
              </h1>
              <p className={`mt-1 text-xs ${mutedTextClass}`}>
                {isRemotePortfolioEnabled
                  ? portfolioSaveStatus === "saving"
                    ? "Saving subscriber portfolio..."
                    : portfolioSaveStatus === "error"
                      ? "Database save needs attention"
                      : "Saved to subscriber workspace"
                  : "Local browser portfolio fallback"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AskAiHelp
                buttonClassName={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                  isDark ? "border-[#d8a84f]/35 bg-[#d8a84f]/15 text-[#f7dd9a]" : "border-[#d8a84f] bg-[#fff8e8] text-[#735223]"
                }`}
              />
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
            </div>
          </header>

          {activePanel === "settings" && (
            <nav
              aria-label="Portfolio settings sections"
              className={`border-b px-5 lg:px-7 ${headerClass}`}
            >
              <div className="flex min-w-0 overflow-x-auto" role="tablist">
                {settingsTabs.map((tab) => {
                  const isSelected = settingsTab === tab.id

                  return (
                    <button
                      aria-selected={isSelected}
                      className={`relative flex h-14 shrink-0 items-center px-4 text-sm font-semibold transition ${
                        isSelected
                          ? isDark
                            ? "text-white"
                            : "text-[#1e211d]"
                          : isDark
                            ? "text-white/55 hover:text-white"
                            : "text-[#777064] hover:text-[#1e211d]"
                      }`}
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      role="tab"
                      type="button"
                    >
                      {tab.label}
                      <span
                        className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition ${
                          isSelected ? "bg-[#d8a84f]" : "bg-transparent"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </nav>
          )}

          <div className="px-5 py-5 lg:px-7">
            {activePanel === "website" ? (
              <section className="space-y-3">
                <div className={`flex flex-col gap-3 rounded-md border px-3 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between ${surfaceClass}`}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <button
                      className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"}`}
                      onClick={() => setActivePanel("photos")}
                      type="button"
                    >
                      <ChevronLeft className="size-4" />
                      Dashboard
                    </button>
                    <div className="flex h-10 items-center gap-2 px-1">
                      <Globe2 className="size-5 text-[#99702d]" />
                      <span className="text-base font-semibold">Website builder</span>
                    </div>
                    <label className={`flex h-10 min-w-48 items-center gap-2 rounded-md border px-3 ${fieldClass}`}>
                      <span className={`text-xs font-semibold ${mutedTextClass}`}>Focus</span>
                      <select
                        aria-label="Page or section to focus"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                        onChange={(event) => selectWebsiteBuilderPage(event.target.value as WebsiteBuilderPageKey)}
                        value={websiteBuilderPage}
                      >
                        {websitePageOptions.map((page) => (
                          <option key={page.key} value={page.key}>{page.label}</option>
                        ))}
                      </select>
                    </label>
                    <div className={`flex h-10 items-center rounded-md border p-1 ${isDark ? "border-white/15 bg-white/[0.04]" : "border-[#d4cdc0] bg-[#f6f3ed]"}`}>
                      <button
                        aria-label="Desktop preview"
                        className={`flex size-8 items-center justify-center rounded ${websitePreviewDevice === "desktop" ? "bg-[#1f2a24] text-white" : mutedTextClass}`}
                        onClick={() => setWebsitePreviewDevice("desktop")}
                        title="Desktop preview"
                        type="button"
                      >
                        <Monitor className="size-4" />
                      </button>
                      <button
                        aria-label="Mobile preview"
                        className={`flex size-8 items-center justify-center rounded ${websitePreviewDevice === "mobile" ? "bg-[#1f2a24] text-white" : mutedTextClass}`}
                        onClick={() => setWebsitePreviewDevice("mobile")}
                        title="Mobile preview"
                        type="button"
                      >
                        <Smartphone className="size-4" />
                      </button>
                    </div>
                    <span className="flex h-10 items-center gap-2 rounded-md border border-emerald-700/20 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800">
                      <span className="size-2 rounded-full bg-emerald-600" />
                      Live
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {websiteSaveStatus === "saved" && (
                      <span className="flex h-10 items-center rounded-md bg-[#e9f1dc] px-3 text-xs font-semibold text-[#466026]">Draft saved</span>
                    )}
                    <button
                      className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10 text-white" : "border-[#d4cdc0] bg-white"}`}
                      onClick={() => setWebsitePublishOpen(true)}
                      type="button"
                    >
                      <Globe2 className="size-4" />
                      Website address
                    </button>
                    <button
                      className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white"
                      onClick={() => {
                        window.localStorage.setItem(WEBSITE_BUILDER_STORAGE_KEY, JSON.stringify(websiteSettings))
                        window.localStorage.setItem(
                          WEBSITE_BUILDER_UI_STORAGE_KEY,
                          JSON.stringify({ page: websiteBuilderPage, section: websiteBuilderSection }),
                        )
                        setWebsiteSaveStatus("saved")
                        window.location.assign("/website-preview")
                      }}
                      type="button"
                    >
                      <Eye className="size-4" />
                      Preview
                    </button>
                  </div>
                </div>

                <div className={`grid min-w-0 overflow-hidden rounded-md border shadow-sm xl:grid-cols-[360px_minmax(0,1fr)] ${surfaceClass}`} data-testid="website-builder-workspace">
                  <aside className={`min-w-0 border-b p-3 xl:col-start-1 xl:row-start-1 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:border-b-0 xl:border-r ${websiteBuilderTool === "sections" && websiteInspectorOpen ? "hidden" : ""} ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}>
                    <div className={`mb-4 grid grid-cols-3 border-b ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}>
                      {[
                        { id: "sections" as const, label: "Build", icon: GripVertical },
                        { id: "style" as const, label: "Design", icon: Palette },
                        { id: "pages" as const, label: "Site", icon: Folder },
                      ].map((tool) => {
                        const ToolIcon = tool.icon
                        const isActive = websiteBuilderTool === tool.id || (tool.id === "sections" && websiteBuilderTool === "add")
                        return (
                          <button
                            className={`relative flex h-11 items-center justify-center gap-2 text-xs font-semibold ${isActive ? "text-[#9b6d22]" : mutedTextClass}`}
                            key={tool.id}
                            onClick={() => {
                              setWebsiteBuilderTool(tool.id)
                              setWebsiteInspectorOpen(false)
                            }}
                            type="button"
                          >
                            <ToolIcon className="size-4" />
                            {tool.label}
                            <span className={`absolute inset-x-2 bottom-0 h-0.5 ${isActive ? "bg-[#d8a84f]" : "bg-transparent"}`} />
                          </button>
                        )
                      })}
                    </div>
                    {websiteBuilderTool === "pages" && (
                      <div>
                        <p className="text-sm font-semibold">Pages</p>
                        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Choose the page you want to edit on the live canvas.</p>
                        <div className="mt-3 space-y-1.5">
                          {websitePageOptions.map((page) => (
                            <button
                              className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm font-semibold ${
                                websiteBuilderPage === page.key
                                  ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d]"
                                  : isDark
                                    ? "border-white/10 bg-white/[0.04]"
                                    : "border-[#ded8cc] bg-white"
                              }`}
                              key={page.key}
                              onClick={() => selectWebsiteBuilderPage(page.key)}
                              type="button"
                            >
                              <span>{page.label}</span>
                              <ChevronRight className="size-4 opacity-55" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {websiteBuilderTool === "sections" && (
                      <div>
                        <p className="text-sm font-semibold">Page sections</p>
                        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Drag to reorder. The canvas updates while you build.</p>
                        <div className="mt-3 space-y-2">
                          {orderedWebsiteSectionKeys.map((sectionKey) => {
                            const homeBlock = getHomeBlockFromSectionKey(sectionKey)
                            const pageKey = getPageFromSectionKey(sectionKey)
                            const isVisible = isWebsiteSectionVisible(sectionKey)
                            const isActiveSection = homeBlock
                              ? websiteBuilderPage === "home" && websiteBuilderSection === homeBlock
                              : pageKey === websiteBuilderPage

                            return (
                              <button
                                className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm font-semibold transition ${
                                  isActiveSection
                                    ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d]"
                                    : isDark
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-[#ded8cc] bg-white"
                                } ${draggedWebsiteSection === sectionKey ? "opacity-60 ring-2 ring-[#d8a84f]" : ""}`}
                                draggable
                                key={sectionKey}
                                onClick={() => selectWebsiteSection(sectionKey)}
                                onDragEnd={() => setDraggedWebsiteSection(null)}
                                onDragOver={(event) => event.preventDefault()}
                                onDragStart={(event) => {
                                  setDraggedWebsiteSection(sectionKey)
                                  event.dataTransfer.effectAllowed = "move"
                                  event.dataTransfer.setData("text/plain", sectionKey)
                                }}
                                onDrop={(event) => {
                                  event.preventDefault()
                                  const draggedKey = (event.dataTransfer.getData("text/plain") || draggedWebsiteSection) as WebsiteSectionOrderKey | null
                                  if (draggedKey && DEFAULT_WEBSITE_SECTION_ORDER.includes(draggedKey)) {
                                    moveWebsiteSection(draggedKey, sectionKey)
                                    selectWebsiteSection(draggedKey)
                                  }
                                  setDraggedWebsiteSection(null)
                                }}
                                type="button"
                              >
                                <GripVertical className="size-4 shrink-0 cursor-grab text-[#9c7b42]" />
                                <span className="min-w-0 flex-1 break-words">{getWebsiteSectionLabel(sectionKey)}</span>
                                <span className={`size-2 shrink-0 rounded-full ${isVisible ? "bg-emerald-600" : "bg-current opacity-25"}`} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {websiteBuilderTool === "add" && (
                      <div>
                        <p className="text-sm font-semibold">Add a section</p>
                        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Hidden sections can be restored with one click.</p>
                        <div className="mt-3 space-y-2">
                          {orderedWebsiteSectionKeys.map((sectionKey) => {
                            const isVisible = isWebsiteSectionVisible(sectionKey)
                            return (
                              <button
                                className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm font-semibold ${
                                  isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"
                                } ${isVisible ? "cursor-default opacity-55" : "hover:border-[#d8a84f]"}`}
                                disabled={isVisible}
                                key={sectionKey}
                                onClick={() => addWebsiteSection(sectionKey)}
                                type="button"
                              >
                                <span>{getWebsiteSectionLabel(sectionKey)}</span>
                                {isVisible ? <span className="text-[10px] uppercase tracking-[0.12em]">Added</span> : <Plus className="size-4" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {websiteBuilderTool === "style" && (
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold">Site style</p>
                          <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Templates and brand choices update the canvas instantly.</p>
                        </div>
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Design</p>
                          <div className="mt-2 space-y-2">
                            {websiteTemplateOptions.map((template) => {
                              const isSelected = websiteSettings.template === template.id
                              return (
                                <button
                                  className={`w-full rounded-md border p-2 text-left ${
                                    isSelected
                                      ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d] ring-1 ring-[#ead29b]"
                                      : isDark
                                        ? "border-white/10 bg-white/[0.04]"
                                        : "border-[#ded8cc] bg-white"
                                  }`}
                                  data-website-template={template.id}
                                  key={template.id}
                                  onClick={() => applyWebsiteTemplate(template.id)}
                                  type="button"
                                >
                                  <WebsiteTemplateMiniPreview isSelected={isSelected} templateId={template.id} />
                                  <span className="mt-2 block text-xs font-semibold">{template.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Colors</p>
                          {[
                            { label: "Background", key: "siteBackgroundColor" as const },
                            { label: "Text", key: "siteTextColor" as const },
                            { label: "Accent", key: "siteAccentColor" as const },
                          ].map((color) => (
                            <label className="flex items-center justify-between gap-3 text-xs font-semibold" key={color.key}>
                              {color.label}
                              <span className="flex items-center gap-2">
                                <input
                                  aria-label={`${color.label} color`}
                                  className="size-8 cursor-pointer rounded border border-current/20 bg-transparent p-0"
                                  onChange={(event) => setWebsiteSettings((current) => ({ ...current, [color.key]: event.target.value }))}
                                  type="color"
                                  value={websiteSettings[color.key]}
                                />
                                <input
                                  aria-label={`${color.label} hex value`}
                                  className={`h-8 w-24 rounded-md border px-2 font-mono text-[11px] font-normal uppercase outline-none ${fieldClass}`}
                                  maxLength={7}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    if (/^#[0-9a-f]{6}$/i.test(value)) {
                                      setWebsiteSettings((current) => ({ ...current, [color.key]: value }))
                                    }
                                  }}
                                  value={websiteSettings[color.key]}
                                />
                              </span>
                            </label>
                          ))}
                        </div>
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Font</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {websiteFontOptions.map((option) => (
                              <button
                                className={`rounded-md border px-2 py-2 text-left text-xs ${websiteSettings.siteFontStyle === option.key ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]" : isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                                key={option.key}
                                onClick={() => setWebsiteSettings((current) => ({ ...current, siteFontStyle: option.key }))}
                                type="button"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Image frame</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {websiteFrameOptions.map((option) => (
                              <button
                                className={`rounded-md border px-2 py-2 text-left text-xs ${websiteSettings.imageFrame === option.key ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]" : isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                                key={option.key}
                                onClick={() => setWebsiteSettings((current) => ({ ...current, imageFrame: option.key }))}
                                type="button"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <label className={`mt-3 grid gap-2 text-xs ${websiteSettings.imageFrame === "none" ? "opacity-45" : ""}`}>
                            <span className="flex justify-between"><span>Thickness</span><span>{websiteFrameThickness}px</span></span>
                            <input
                              className="accent-[#d8a84f]"
                              disabled={websiteSettings.imageFrame === "none"}
                              max="16"
                              min="1"
                              onChange={(event) => setWebsiteSettings((current) => ({ ...current, imageFrameThickness: Number(event.target.value) }))}
                              type="range"
                              value={websiteFrameThickness || 1}
                            />
                          </label>
                        </div>
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Image shape</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {websiteShapeOptions.map((option) => (
                              <button
                                className={`rounded-md border px-2 py-2 text-left text-xs ${websiteSettings.imageShape === option.key ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]" : isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                                key={option.key}
                                onClick={() => setWebsiteSettings((current) => ({ ...current, imageShape: option.key }))}
                                type="button"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </aside>

                  <div className={`min-w-0 p-3 xl:col-start-2 xl:row-start-1 ${isDark ? "bg-black/20" : "bg-[#efede8]"}`}>
                    <div
                      className={`mx-auto overflow-hidden rounded-lg border shadow-sm ${isDark ? "border-white/10" : "border-[#d9d1c4]"}`}
                      style={{
                        backgroundColor: websiteSettings.siteBackgroundColor,
                        maxWidth: websitePreviewDevice === "mobile" ? 410 : 1120,
                      }}
                    >
                      <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded6ca] bg-white"}`}>
                        <div>
                          <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Live canvas</p>
                          <h3 className="text-base font-semibold">{websitePageLabels[websiteBuilderPage]}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`rounded-full border px-3 py-1 ${isDark ? "border-white/10" : "border-[#ded8cc]"} ${mutedTextClass}`}>{activeWebsiteTemplate.label}</span>
                          {!websiteInspectorOpen && (
                            <button
                              className={`flex h-7 items-center gap-1.5 rounded-full border px-3 font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                              onClick={() => setWebsiteInspectorOpen(true)}
                              type="button"
                            >
                              <Edit3 className="size-3" />
                              Edit section
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        data-testid="website-live-canvas"
                        className={`mx-auto max-h-[calc(100vh-13rem)] w-full overflow-y-auto ${websiteFontClass} ${websiteTemplatePreviewDesigns[websiteSettings.template]?.background ?? "bg-white text-[#171814]"}`}
                        onClickCapture={() => {
                          setWebsiteBuilderTool("sections")
                          setWebsiteInspectorOpen(true)
                        }}
                        ref={websitePreviewScrollRef}
                        style={{ backgroundColor: websiteSettings.siteBackgroundColor, color: websiteSettings.siteTextColor }}
                      >
                        <header className="flex items-center justify-between border-b border-current/10 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-md text-[#171814]" style={{ backgroundColor: websiteSettings.siteAccentColor }}>
                              <Camera className="size-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">PhotoViewPro Website</p>
                              <p className="text-xs opacity-60">{websiteSettings.subdomain}.photoviewpro.com</p>
                            </div>
                          </div>
                          <nav className={`${websitePreviewDevice === "mobile" ? "hidden" : "hidden gap-4 text-xs font-semibold opacity-70 md:flex"}`}>
                            {orderedWebsiteNavPageOptions.filter((page) => websiteSettings.enabledPages[page.key]).map((page) => (
                              <button
                                className="hover:opacity-100"
                                key={page.key}
                                onClick={() => selectWebsiteBuilderPage(page.key)}
                                type="button"
                              >
                                {websiteSettings.navigationLabels[page.key] || websitePreviewNavLabels[page.key]}
                              </button>
                            ))}
                          </nav>
                        </header>

                        <div className="flex flex-col">
                        {websiteSettings.enabledBlocks.hero && (
                            <section
                              className={`group relative border-b border-current/10 ${
                                isOverlayHero
                                  ? `min-h-[560px] overflow-hidden ${websitePreviewDevice === "mobile" ? "min-h-[620px]" : ""}`
                                  : `grid gap-6 ${websitePreviewDevice === "mobile" ? "grid-cols-1 p-4" : "p-6"} ${
                                      isStackedHero
                                        ? "grid-cols-1"
                                        : websitePreviewDevice === "mobile"
                                          ? ""
                                          : "grid-cols-[0.9fr_1.1fr] items-center"
                                    }`
                              } ${websiteBuilderSection === "hero" ? "ring-2 ring-[#d8a84f]" : ""}`}
                              data-website-section="home:hero"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "hero")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("hero")
                              }}
                              style={{ order: websiteSectionOrderIndex("home:hero") }}
                              tabIndex={0}
                              role="button"
                            >
                              <div className={`${
                                isOverlayHero
                                  ? `absolute inset-x-0 bottom-0 z-20 max-w-2xl p-8 text-white ${websitePreviewDevice === "mobile" ? "p-5" : ""}`
                                  : isCenteredWebsite
                                    ? "mx-auto max-w-3xl text-center"
                                    : isPosterWebsite
                                      ? "mx-auto max-w-4xl text-center"
                                      : ""
                              } ${!websiteSettings.enabledBlocks.hero ? "opacity-35" : ""}`}>
                                {websiteSettings.showSectionHeadings["home:hero"] && (
                                  <h1 className={`font-semibold leading-tight ${websiteHeadingClass} ${
                                    isTravelAtlasWebsite
                                      ? "font-mono text-3xl uppercase tracking-[-0.01em]"
                                      : isEditorialMagazineWebsite
                                        ? "font-serif text-5xl leading-[0.98]"
                                        : "text-4xl"
                                  }`}>{websiteSettings.heroHeadline}</h1>
                                )}
                                {(websiteSettings.showSectionBodies["home:hero"] ?? true) && websiteSettings.heroSubhead && (
                                  <p className="mt-3 text-base leading-7 opacity-75">{websiteSettings.heroSubhead}</p>
                                )}
                                {websiteSettings.enabledBlocks.callToAction && (
                                  <div className="mt-4 inline-flex rounded-md bg-[#1f2a24] px-4 py-2 text-sm font-semibold text-white">
                                    {websiteSettings.heroButtonLabel || "View portfolios"}
                                  </div>
                                )}
                              </div>
                              <div className={`${isOverlayHero ? "absolute" : "relative"} min-h-72 overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass} ${
                                isOverlayHero
                                  ? "inset-0 min-h-0 rounded-none"
                                  : isStackedHero
                                    ? "min-h-[420px]"
                                    : "min-h-[390px]"
                              } ${!websiteSettings.enabledBlocks.hero ? "opacity-35" : ""}`} style={isOverlayHero ? undefined : websiteFrameStyle}>
                                <Image alt="Website hero cover" className="object-cover" fill priority sizes="50vw" src={websiteHeroImageSource} style={{ objectPosition: websiteHeroObjectPosition }} />
                                {isOverlayHero && (
                                  <div className="absolute inset-0 bg-black" style={{ opacity: Math.max(0, Math.min(80, websiteSettings.heroOverlayStrength)) / 100 }} />
                                )}
                                {!isOverlayHero && isTravelAtlasWebsite && (
                                  <div className="absolute inset-x-4 bottom-4 rounded-md bg-black/55 p-3 text-white backdrop-blur">
                                    <p className="mt-1 text-sm font-semibold">Locations, dates, and portfolios arranged like field notes.</p>
                                  </div>
                                )}
                                {!isOverlayHero && isEditorialMagazineWebsite && (
                                  <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#171814] shadow">Cover story</div>
                                )}
                              </div>
                              {!isOverlayHero && isTravelAtlasWebsite && (
                                <div className="grid gap-3 rounded-md border border-current/10 bg-black/5 p-3 font-mono text-xs uppercase tracking-[0.12em] 2xl:col-span-2 md:grid-cols-3">
                                  <span>01 Featured route</span>
                                  <span>02 Portfolio stops</span>
                                  <span>03 Field notes</span>
                                </div>
                              )}
                              {!isOverlayHero && isEditorialMagazineWebsite && (
                                <div className="grid gap-3 border-t border-current/10 pt-4 2xl:col-span-2 md:grid-cols-3">
                                  {["Cover story", "Recent essay", "Selected gallery"].map((item) => (
                                    <div className="rounded-md border border-current/10 bg-white/10 p-3" key={item}>
                                      <p className="font-serif text-lg font-semibold">{item}</p>
                                      <p className="mt-1 text-xs opacity-60">Magazine-style entry point</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </section>

                        )}

                        {websiteSettings.enabledBlocks.textBlock && (
                            <section
                              className={`group relative border-b border-current/10 p-6 ${websiteBuilderSection === "textBlock" ? "ring-2 ring-[#d8a84f]" : ""} ${!websiteSettings.enabledBlocks.textBlock ? "opacity-35" : ""}`}
                              data-website-section="home:textBlock"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "textBlock")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("textBlock")
                              }}
                              style={{ order: websiteSectionOrderIndex("home:textBlock") }}
                              tabIndex={0}
                              role="button"
                            >
                              {websiteSettings.showSectionHeadings["home:textBlock"] && (
                                <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`}>{websiteSettings.pageCopy.introHeadline}</h4>
                              )}
                              {(websiteSettings.showSectionBodies["home:textBlock"] ?? true) && websiteSettings.pageCopy.introBody && (
                                <p className="mt-3 text-base leading-7 opacity-75">{websiteSettings.pageCopy.introBody}</p>
                              )}
                            </section>
                        )}

                        {websiteSettings.enabledBlocks.featuredPortfolio && (
                            <section
                              className={`group relative border-b border-current/10 p-6 ${websiteBuilderSection === "featuredPortfolio" ? "ring-2 ring-[#d8a84f]" : ""} ${!websiteSettings.enabledBlocks.featuredPortfolio ? "opacity-35" : ""}`}
                              data-website-section="home:featuredPortfolio"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "featuredPortfolio")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("featuredPortfolio")
                              }}
                              style={{ order: websiteSectionOrderIndex("home:featuredPortfolio") }}
                              tabIndex={0}
                              role="button"
                            >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    {websiteSettings.showSectionHeadings["home:featuredPortfolio"] && websiteSettings.pageCopy.featuredWorkHeadline && (
                                      <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`}>{websiteSettings.pageCopy.featuredWorkHeadline}</h4>
                                    )}
                                  </div>
                              </div>
                              {websiteSettings.workDisplayMode === "slideshow" && (
                                <div className={`overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} style={websiteFrameStyle}>
                                  <div className="relative aspect-[16/9]">
                                    <Image alt={websitePrimaryWorkImage.title} className="object-cover" fill sizes="700px" src={websitePrimaryWorkImage.source} />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                                      <p className="text-xs uppercase tracking-[0.18em] opacity-75">Slideshow</p>
                                      <p className="mt-1 text-2xl font-semibold">
                                        {websiteSettings.workSourceMode === "single" ? websiteSelectedGallery?.name ?? "Selected portfolio" : websitePrimaryWorkImage.title}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "thumbnail-grid" && (
                                <div className={`grid gap-3 ${websitePreviewDevice === "mobile" ? "grid-cols-2" : "md:grid-cols-4"}`}>
                                  {websiteSettings.workSourceMode === "single"
                                    ? websiteSelectedPortfolioPhotos.slice(0, 12).map((photo) => (
                                        <div className={`overflow-hidden bg-black/5 ${websiteShapeClass} ${websiteFrameClass}`} key={photo.id} style={websiteFrameStyle}>
                                          <div className="relative aspect-[4/3] bg-black">
                                            <Image alt={photo.title} className="object-cover" fill sizes="220px" src={photo.source} />
                                          </div>
                                          <p className="truncate px-3 py-2 text-sm font-semibold">{photo.title}</p>
                                        </div>
                                      ))
                                    : websiteWorkGalleries.slice(0, 8).map((gallery) => (
                                        <div className={`overflow-hidden bg-black/5 ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                          <div className="relative aspect-[4/3] bg-black">
                                            <Image alt={gallery.name} className="object-cover" fill sizes="220px" src={gallery.cover} />
                                          </div>
                                          <p className="truncate px-3 py-2 text-sm font-semibold">{gallery.name}</p>
                                        </div>
                                      ))}
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "film-strip" && (
                                <div className="space-y-3">
                                  <div className={`relative aspect-[16/8] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} style={websiteFrameStyle}>
                                    <Image alt={websitePrimaryWorkImage.title} className="object-cover" fill sizes="720px" src={websitePrimaryWorkImage.source} />
                                  </div>
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {websiteSettings.workSourceMode === "single"
                                      ? websiteSelectedPortfolioPhotos.slice(0, 12).map((photo) => (
                                          <div className={`relative h-16 w-24 shrink-0 overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={photo.id} style={websiteFrameStyle}>
                                            <Image alt={photo.title} className="object-cover" fill sizes="96px" src={photo.source} />
                                          </div>
                                        ))
                                      : websiteWorkGalleries.slice(0, 8).map((gallery) => (
                                          <div className={`relative h-16 w-24 shrink-0 overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                            <Image alt={gallery.name} className="object-cover" fill sizes="96px" src={gallery.cover} />
                                          </div>
                                        ))}
                                  </div>
                                </div>
                              )}
                              {websiteSettings.workDisplayMode === "cover-cards" && (
                                <div className={`grid gap-4 ${websitePreviewDevice === "mobile" ? "grid-cols-1" : "md:grid-cols-3"}`}>
                                  {websiteSettings.workSourceMode === "single"
                                    ? websiteSelectedPortfolioPhotos.slice(0, 6).map((photo) => (
                                        <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={photo.id} style={websiteFrameStyle}>
                                          <Image alt={photo.title} className="object-cover" fill sizes="280px" src={photo.source} />
                                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                            <p className="text-lg font-semibold">{photo.title}</p>
                                          </div>
                                        </div>
                                      ))
                                    : websiteWorkGalleries.slice(0, 6).map((gallery) => (
                                        <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} key={gallery.id} style={websiteFrameStyle}>
                                          <Image alt={gallery.name} className="object-cover" fill sizes="280px" src={gallery.cover} />
                                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                            <p className="text-lg font-semibold">{gallery.name}</p>
                                            <p className="text-xs opacity-75">{gallery.photos?.filter((photo) => !photo.hidden).length ?? 0} photos</p>
                                          </div>
                                        </div>
                                      ))}
                                </div>
                              )}
                            </section>
                        )}

                        {websiteSettings.enabledBlocks.portfolioGrid && (
                            <section
                              className={`group relative p-6 ${websiteBuilderSection === "portfolioGrid" ? "ring-2 ring-[#d8a84f]" : ""} ${!websiteSettings.enabledBlocks.portfolioGrid ? "opacity-35" : ""}`}
                              data-website-section="home:portfolioGrid"
                              onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "home", "portfolioGrid")}
                              onClick={() => {
                                setWebsiteBuilderPage("home")
                                setWebsiteBuilderSection("portfolioGrid")
                              }}
                              style={{ order: websiteSectionOrderIndex("home:portfolioGrid") }}
                              tabIndex={0}
                              role="button"
                            >
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  {websiteSettings.showSectionHeadings["home:portfolioGrid"] && websiteSettings.pageCopy.portfolioGridHeadline && (
                                    <h4 className={`text-2xl font-semibold ${websiteHeadingClass}`}>{websiteSettings.pageCopy.portfolioGridHeadline}</h4>
                                  )}
                                </div>
                              </div>
                              <div className={websitePreviewDevice === "mobile" ? "grid grid-cols-1 gap-2" : isGalleryWallWebsite ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 md:grid-cols-3"}>
                                {(websiteSettings.workSourceMode === "featured" ? websiteWorkGalleries : galleries).map((gallery) => (
                                  <div className={`relative overflow-hidden bg-black ${isGalleryWallWebsite ? "aspect-[16/10] rounded-none border-transparent" : `aspect-[4/3] ${websiteShapeClass} ${websiteFrameClass}`}`} key={gallery.id} style={isGalleryWallWebsite ? undefined : websiteFrameStyle}>
                                    <Image alt={gallery.name} className="object-cover" fill sizes="260px" src={gallery.cover} />
                                    <span className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-sm font-semibold text-white">{gallery.name}</span>
                                  </div>
                                ))}
                              </div>
                            </section>
                        )}

                        {websiteSettings.visiblePages.about && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "about" && websiteBuilderSection === "about" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:about"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "about", "about")}
                            onClick={() => {
                              setWebsiteBuilderPage("about")
                              setWebsiteBuilderSection("about")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:about") }}
                            tabIndex={0}
                            role="button"
                          >
                            <div className={`grid gap-7 ${websitePreviewDevice === "desktop" && websiteSettings.aboutImageUrl ? "lg:grid-cols-[0.72fr_1.28fr] lg:items-start" : ""}`}>
                              {websiteSettings.aboutImageUrl && (
                                <div className={`relative aspect-[4/5] overflow-hidden bg-black ${websiteShapeClass} ${websiteFrameClass}`} style={websiteFrameStyle}>
                                  <Image alt="About page portrait" className="object-cover" fill sizes="320px" src={websiteSettings.aboutImageUrl} />
                                </div>
                              )}
                              <div>
                                {websiteSettings.showSectionHeadings["page:about"] && websiteSettings.pageCopy.aboutHeadline && (
                                  <h4 className="text-4xl font-semibold">{websiteSettings.pageCopy.aboutHeadline}</h4>
                                )}
                                {(websiteSettings.showSectionBodies["page:about"] ?? true) && websiteSettings.pageCopy.aboutBody && (
                                  <p className="mt-5 text-lg leading-8 opacity-75">{websiteSettings.pageCopy.aboutBody}</p>
                                )}
                                <button className="mt-4 rounded-md bg-[#1f2a24] px-5 py-3 text-sm font-semibold text-white" type="button">
                                  {websiteSettings.pageCopy.aboutButtonLabel}
                                </button>
                              </div>
                            </div>
                          </section>
                        )}

                        {websiteSettings.visiblePages.gear && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "gear" && websiteBuilderSection === "gear" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:gear"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "gear", "gear")}
                            onClick={() => {
                              setWebsiteBuilderPage("gear")
                              setWebsiteBuilderSection("gear")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:gear") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:gear"] && websiteSettings.pageCopy.gearHeadline && (
                              <h4 className="text-4xl font-semibold">{websiteSettings.pageCopy.gearHeadline}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:gear"] ?? true) && websiteSettings.pageCopy.gearBody && (
                              <p className="mt-5 text-lg leading-8 opacity-75">{websiteSettings.pageCopy.gearBody}</p>
                            )}
                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                              {["Camera body", "Favorite lens", "Travel kit"].map((item) => (
                                <div className="rounded-md border border-current/10 p-4" key={item}>
                                  <ShoppingBag className="size-5 text-[#b9842d]" />
                                  <p className="mt-3 font-semibold">{item}</p>
                                  <p className="mt-1 text-sm opacity-60">Gear cards and affiliate links come next.</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {websiteSettings.visiblePages.contact && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "contact" && websiteBuilderSection === "contact" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:contact"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "contact", "contact")}
                            onClick={() => {
                              setWebsiteBuilderPage("contact")
                              setWebsiteBuilderSection("contact")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:contact") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:contact"] && websiteSettings.pageCopy.contactHeadline && (
                              <h4 className="text-4xl font-semibold">{websiteSettings.pageCopy.contactHeadline}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:contact"] ?? true) && websiteSettings.pageCopy.contactIntro && (
                              <p className="mt-5 text-lg leading-8 opacity-75">{websiteSettings.pageCopy.contactIntro}</p>
                            )}
                            <div className={`mt-6 grid gap-3 ${websitePreviewDevice === "mobile" ? "grid-cols-1" : "md:grid-cols-2"}`}>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65">Name</div>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65">Email</div>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65 md:col-span-2">Subject</div>
                              <div className="rounded-md border border-current/15 px-3 py-3 text-sm opacity-65 md:col-span-2">Message</div>
                              <button className="rounded-md bg-[#1f2a24] px-5 py-3 text-sm font-semibold text-white md:col-span-2" type="button">Send message</button>
                            </div>
                            {!websiteSettings.contactEmail && (
                              <div className="mt-4 rounded-md border border-[#d8a84f]/50 bg-[#fff8e8] px-3 py-2 text-xs leading-5 text-[#735223]">
                                Builder note: add the delivery email in this section&apos;s Build controls before publishing. This note is not part of the public website.
                              </div>
                            )}
                          </section>
                        )}

                        {websiteSettings.visiblePages.blog && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "blog" && websiteBuilderSection === "articles" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:blog"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "blog", "articles")}
                            onClick={() => {
                              setWebsiteBuilderPage("blog")
                              setWebsiteBuilderSection("articles")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:blog") }}
                            tabIndex={0}
                            role="button"
                          >
                            <div>
                              {websiteSettings.showSectionHeadings["page:blog"] && websiteSettings.pageCopy.blogHeadline && (
                                <h4 className="text-4xl font-semibold">{websiteSettings.pageCopy.blogHeadline}</h4>
                              )}
                              {(websiteSettings.showSectionBodies["page:blog"] ?? true) && websiteSettings.pageCopy.blogBody && (
                                <p className="mt-5 text-lg leading-8 opacity-75">{websiteSettings.pageCopy.blogBody}</p>
                              )}
                            </div>
                            <div className="mt-8 grid gap-4">
                              {websiteSettings.tripEntries.map((trip) => (
                                <article className="rounded-md border border-current/15 bg-black/[0.03] p-4" key={trip.id}>
                                  <h5 className="text-2xl font-semibold">{trip.title}</h5>
                                  {getSubscriberTripMeta(trip.meta) && (
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{getSubscriberTripMeta(trip.meta)}</p>
                                  )}
                                  <p className="mt-4 text-base leading-7 opacity-75">{trip.body}</p>
                                  {trip.linkLabel && <span className="mt-4 inline-flex text-sm font-semibold underline">{trip.linkLabel}</span>}
                                </article>
                              ))}
                            </div>
                          </section>
                        )}

                        {websiteSettings.visiblePages.articles && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "articles" && websiteBuilderSection === "articles" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:articles"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "articles", "articles")}
                            onClick={() => {
                              setWebsiteBuilderPage("articles")
                              setWebsiteBuilderSection("articles")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:articles") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:articles"] && websiteSettings.pageCopy.articlesHeadline && (
                              <h4 className="text-4xl font-semibold">{websiteSettings.pageCopy.articlesHeadline}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:articles"] ?? true) && websiteSettings.pageCopy.articlesBody && (
                              <p className="mt-5 text-lg leading-8 opacity-75">{websiteSettings.pageCopy.articlesBody}</p>
                            )}
                          </section>
                        )}

                        {websiteSettings.visiblePages.custom && (
                          <section
                            className={`p-8 ${websiteBuilderPage === "custom" && websiteBuilderSection === "articles" ? "ring-2 ring-[#d8a84f]" : ""}`}
                            data-website-section="page:custom"
                            onKeyDown={(event) => handleWebsitePreviewSectionKeyDown(event, "custom", "articles")}
                            onClick={() => {
                              setWebsiteBuilderPage("custom")
                              setWebsiteBuilderSection("articles")
                            }}
                            style={{ order: websiteSectionOrderIndex("page:custom") }}
                            tabIndex={0}
                            role="button"
                          >
                            {websiteSettings.showSectionHeadings["page:custom"] && websiteSettings.customPageTitle && (
                              <h4 className="text-4xl font-semibold">{websiteSettings.customPageTitle}</h4>
                            )}
                            {(websiteSettings.showSectionBodies["page:custom"] ?? true) && websiteSettings.pageCopy.customBody && (
                              <p className="mt-5 text-lg leading-8 opacity-75">{websiteSettings.pageCopy.customBody}</p>
                            )}
                          </section>
                        )}

                        {!["home", "about", "gear", "contact", "blog", "articles", "custom"].includes(websiteBuilderPage) && (
                          <section className="p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b9842d]">{websitePageLabels[websiteBuilderPage]}</p>
                            <h4 className="mt-4 text-4xl font-semibold">{websiteBuilderPage === "custom" ? websiteSettings.customPageTitle : websitePageLabels[websiteBuilderPage]}</h4>
                            <p className="mt-5 max-w-2xl text-lg leading-8 opacity-70">
                              This page is enabled for navigation. The visual editor for this page type will support articles, trips, and custom page blocks in the next builder pass.
                            </p>
                          </section>
                        )}
                        </div>
                        <footer className="border-t border-current/10 px-6 py-5 text-center text-xs opacity-65">
                          <a
                            className="font-semibold underline-offset-4 hover:underline"
                            href="https://photoviewpro.com"
                            onClick={(event) => event.stopPropagation()}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Powered by PhotoViewPro.com
                          </a>
                        </footer>
                      </div>
                    </div>
                  </div>

                  {websiteInspectorOpen && (
                  <aside className={`min-w-0 max-w-full border-t xl:col-start-1 xl:row-start-1 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto xl:border-r xl:border-t-0 ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}>
                    <div className="min-w-0 max-w-full">
                      <div className={`sticky top-0 z-10 border-b px-4 pt-4 ${isDark ? "border-white/10 bg-[#151713]" : "border-[#ded8cc] bg-white"}`}>
                        <div className="grid grid-cols-3 border-b border-current/10">
                          <button className="relative flex h-10 items-center justify-center gap-2 text-xs font-semibold text-[#9b6d22]" onClick={() => setWebsiteBuilderTool("sections")} type="button">
                            <GripVertical className="size-4" />
                            Build
                            <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#d8a84f]" />
                          </button>
                          <button className={`flex h-10 items-center justify-center gap-2 text-xs font-semibold ${mutedTextClass}`} onClick={() => { setWebsiteInspectorOpen(false); setWebsiteBuilderTool("style") }} type="button">
                            <Palette className="size-4" />
                            Design
                          </button>
                          <button className={`flex h-10 items-center justify-center gap-2 text-xs font-semibold ${mutedTextClass}`} onClick={() => { setWebsiteInspectorOpen(false); setWebsiteBuilderTool("pages") }} type="button">
                            <Folder className="size-4" />
                            Site
                          </button>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Selected section</p>
                            <h3 className="mt-1 truncate text-base font-semibold">{getWebsiteSectionLabel(activeWebsiteSectionKey)}</h3>
                          </div>
                          <button
                            aria-label="Close section editor"
                            className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                            onClick={() => setWebsiteInspectorOpen(false)}
                            title="Close editor"
                            type="button"
                          >
                            <PanelRightClose className="size-4" />
                          </button>
                        </div>
                        <p className={`pb-3 pt-2 text-xs leading-5 ${mutedTextClass}`}>All controls for this section are together below. Opening another section closes this one.</p>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className={`rounded-md border p-3 ${isDark ? "border-[#d8a84f]/35 bg-[#d8a84f]/10" : "border-[#e0bd69] bg-[#fff8e8]"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{getWebsiteSectionLabel(activeWebsiteSectionKey)}</p>
                              <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Edit content, media, visibility, and layout here.</p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                              isWebsiteSectionVisible(activeWebsiteSectionKey)
                                ? "border-emerald-700/20 text-emerald-700"
                                : "border-current/15 opacity-55"
                            }`}>
                              {isWebsiteSectionVisible(activeWebsiteSectionKey) ? "On page" : "Hidden"}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2">
                            {(
                            <>
                            <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                              <span>
                                <span className="block font-semibold">Show on website</span>
                                <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Display this section in the page body.</span>
                              </span>
                              <input
                                checked={isWebsiteSectionVisible(activeWebsiteSectionKey)}
                                className="size-4 shrink-0 accent-[#d8a84f]"
                                onChange={(event) => toggleWebsiteSectionVisibility(activeWebsiteSectionKey, event.target.checked)}
                                type="checkbox"
                              />
                            </label>

                            {activeWebsitePageSection && (
                              <>
                                <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                                  <span>
                                    <span className="block font-semibold">Show in top menu</span>
                                    <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Keep the page easy to reach from navigation.</span>
                                  </span>
                                  <input
                                    checked={websiteSettings.enabledPages[activeWebsitePageSection]}
                                    className="size-4 shrink-0 accent-[#d8a84f]"
                                    onChange={(event) => toggleWebsiteSectionNavigation(activeWebsitePageSection, event.target.checked)}
                                    type="checkbox"
                                  />
                                </label>
                                {websiteSettings.enabledPages[activeWebsitePageSection] && (
                                  <label className="grid gap-1 text-xs font-medium">
                                    Menu label
                                    <input
                                      className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                      onChange={(event) =>
                                        setWebsiteSettings((current) => ({
                                          ...current,
                                          navigationLabels: {
                                            ...current.navigationLabels,
                                            [activeWebsitePageSection]: event.target.value,
                                          },
                                        }))
                                      }
                                      value={websiteSettings.navigationLabels[activeWebsitePageSection]}
                                    />
                                  </label>
                                )}
                              </>
                            )}
                            </>
                            )}

                            {(
                            <>
                            <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                              <span>
                                <span className="block font-semibold">Show headline</span>
                                <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Hide the heading without deleting its text.</span>
                              </span>
                              <input
                                checked={websiteSettings.showSectionHeadings[activeWebsiteSectionKey] ?? true}
                                className="size-4 shrink-0 accent-[#d8a84f]"
                                onChange={(event) =>
                                  setWebsiteSettings((current) => ({
                                    ...current,
                                    showSectionHeadings: {
                                      ...current.showSectionHeadings,
                                      [activeWebsiteSectionKey]: event.target.checked,
                                    },
                                  }))
                                }
                                type="checkbox"
                              />
                            </label>

                            {websiteSettings.showSectionHeadings[activeWebsiteSectionKey] && (
                              <label className="grid gap-1 text-xs font-medium">
                                Headline
                                <input
                                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => updateWebsiteSectionHeading(activeWebsiteSectionKey, event.target.value)}
                                  placeholder="Add a headline"
                                  value={activeWebsiteSectionHeading}
                                />
                              </label>
                            )}

                            {activeWebsiteSectionBody !== null && (
                              <>
                                <label className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-black/20" : "border-[#e3d3af] bg-white"}`}>
                                  <span>
                                    <span className="block font-semibold">Show body text</span>
                                    <span className={`mt-0.5 block text-xs ${mutedTextClass}`}>Hide the description without deleting its text.</span>
                                  </span>
                                  <input
                                    checked={websiteSettings.showSectionBodies[activeWebsiteSectionKey] ?? true}
                                    className="size-4 shrink-0 accent-[#d8a84f]"
                                    onChange={(event) =>
                                      setWebsiteSettings((current) => ({
                                        ...current,
                                        showSectionBodies: {
                                          ...current.showSectionBodies,
                                          [activeWebsiteSectionKey]: event.target.checked,
                                        },
                                      }))
                                    }
                                    type="checkbox"
                                  />
                                </label>
                                {(websiteSettings.showSectionBodies[activeWebsiteSectionKey] ?? true) && (
                                  <label className="grid gap-1 text-xs font-medium">
                                    Body text
                                    <textarea
                                      className={`min-h-28 resize-y rounded-md border px-3 py-2 text-sm font-normal leading-6 outline-none ${fieldClass}`}
                                      onChange={(event) => updateWebsiteSectionBody(activeWebsiteSectionKey, event.target.value)}
                                      placeholder="Add supporting text"
                                      value={activeWebsiteSectionBody}
                                    />
                                  </label>
                                )}
                              </>
                            )}
                            </>
                            )}
                          </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-2 rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                          <button
                            className={`flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc] bg-white"}`}
                            disabled={orderedWebsiteSectionKeys.indexOf(activeWebsiteSectionKey) <= 0}
                            onClick={() => moveWebsiteSectionByOffset(activeWebsiteSectionKey, -1)}
                            type="button"
                          >
                            <ArrowUp className="size-3.5" />
                            Move up
                          </button>
                          <button
                            className={`flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc] bg-white"}`}
                            disabled={orderedWebsiteSectionKeys.indexOf(activeWebsiteSectionKey) >= orderedWebsiteSectionKeys.length - 1}
                            onClick={() => moveWebsiteSectionByOffset(activeWebsiteSectionKey, 1)}
                            type="button"
                          >
                            <ArrowDown className="size-3.5" />
                            Move down
                          </button>
                        </div>

                        <details className="hidden">
                          <summary className="cursor-pointer px-3 py-3 text-sm font-semibold">Site design</summary>
                          <div className="space-y-3 border-t border-current/10 p-3">
                        <div className={`min-w-0 overflow-hidden rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em]">Site style</p>
                          <div className="mt-3 grid gap-2">
                            <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                              Background
                              <span className="flex items-center gap-2">
                                <input
                                  aria-label="Website background color"
                                  className="size-7 cursor-pointer rounded border border-current/20 bg-transparent p-0"
                                  onChange={(event) => setWebsiteSettings((current) => ({ ...current, siteBackgroundColor: event.target.value }))}
                                  type="color"
                                  value={websiteSettings.siteBackgroundColor}
                                />
                                <span className={`font-mono text-[11px] uppercase ${mutedTextClass}`}>{websiteSettings.siteBackgroundColor}</span>
                              </span>
                            </label>
                            <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                              Text
                              <span className="flex items-center gap-2">
                                <input
                                  aria-label="Website text color"
                                  className="size-7 cursor-pointer rounded border border-current/20 bg-transparent p-0"
                                  onChange={(event) => setWebsiteSettings((current) => ({ ...current, siteTextColor: event.target.value }))}
                                  type="color"
                                  value={websiteSettings.siteTextColor}
                                />
                                <span className={`font-mono text-[11px] uppercase ${mutedTextClass}`}>{websiteSettings.siteTextColor}</span>
                              </span>
                            </label>
                            <label className="flex items-center justify-between gap-3 text-xs font-semibold">
                              Accent
                              <span className="flex items-center gap-2">
                                <input
                                  aria-label="Website accent color"
                                  className="size-7 cursor-pointer rounded border border-current/20 bg-transparent p-0"
                                  onChange={(event) => setWebsiteSettings((current) => ({ ...current, siteAccentColor: event.target.value }))}
                                  type="color"
                                  value={websiteSettings.siteAccentColor}
                                />
                                <span className={`font-mono text-[11px] uppercase ${mutedTextClass}`}>{websiteSettings.siteAccentColor}</span>
                              </span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Font</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {websiteFontOptions.map((option) => (
                              <button
                                className={`rounded-md border px-3 py-2 text-left text-xs ${
                                  websiteSettings.siteFontStyle === option.key
                                    ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                                    : isDark
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-[#ded8cc] bg-white"
                                }`}
                                key={option.key}
                                onClick={() => setWebsiteSettings((current) => ({ ...current, siteFontStyle: option.key }))}
                                type="button"
                              >
                                <span className="block font-semibold">{option.label}</span>
                                <span className="mt-1 block opacity-60">{option.note}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Image frame</p>
                            <div className="mt-2 grid gap-2">
                              {websiteFrameOptions.map((option) => (
                                <button
                                  className={`rounded-md border px-3 py-2 text-left text-xs ${
                                    websiteSettings.imageFrame === option.key
                                      ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                                      : isDark
                                        ? "border-white/10 bg-white/[0.04]"
                                        : "border-[#ded8cc] bg-white"
                                  }`}
                                  key={option.key}
                                  onClick={() => setWebsiteSettings((current) => ({ ...current, imageFrame: option.key }))}
                                  type="button"
                                >
                                  <span className="font-semibold">{option.label}</span>
                                  <span className="ml-2 opacity-60">{option.note}</span>
                                </button>
                              ))}
                            </div>
                            <label className={`mt-3 grid gap-2 rounded-md border p-3 text-xs font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"} ${websiteSettings.imageFrame === "none" ? "opacity-50" : ""}`}>
                              <span className="flex items-center justify-between gap-3">
                                <span>Line thickness</span>
                                <span className={`font-mono ${mutedTextClass}`}>{websiteFrameThickness}px</span>
                              </span>
                              <input
                                aria-label="Image frame line thickness"
                                className="accent-[#d8a84f]"
                                disabled={websiteSettings.imageFrame === "none"}
                                max="16"
                                min="1"
                                onChange={(event) => setWebsiteSettings((current) => ({ ...current, imageFrameThickness: Number(event.target.value) }))}
                                type="range"
                                value={websiteFrameThickness || 1}
                              />
                            </label>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Image shape</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {websiteShapeOptions.map((option) => (
                                <button
                                  className={`rounded-md border px-3 py-2 text-left text-xs ${
                                    websiteSettings.imageShape === option.key
                                      ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                                      : isDark
                                        ? "border-white/10 bg-white/[0.04]"
                                        : "border-[#ded8cc] bg-white"
                                  }`}
                                  key={option.key}
                                  onClick={() => setWebsiteSettings((current) => ({ ...current, imageShape: option.key }))}
                                  type="button"
                                >
                                  <span className="block font-semibold">{option.label}</span>
                                  <span className="mt-1 block opacity-60">{option.note}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                          </div>
                        </details>

                        {(activeWebsiteHomeBlock === "featuredPortfolio" || activeWebsiteHomeBlock === "portfolioGrid") && (
                        <div className={`min-w-0 max-w-full overflow-hidden rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em]">What to show</p>
                          <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                            Choose the work source and presentation for this section. One selected portfolio shows its visible photos in the order you arranged them.
                          </p>
                          <div className="mt-3 grid gap-2">
                            {websiteWorkSourceOptions.map((option) => (
                              <button
                                className={`min-w-0 rounded-md border px-3 py-2 text-left text-xs ${
                                  websiteSettings.workSourceMode === option.key
                                    ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                                    : isDark
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-[#ded8cc] bg-white"
                                }`}
                                key={option.key}
                                onClick={() => setWebsiteSettings((current) => ({ ...current, workSourceMode: option.key }))}
                                type="button"
                              >
                                <span className="block font-semibold">{option.label}</span>
                                <span className="mt-1 block leading-4 opacity-60">{option.note}</span>
                              </button>
                            ))}
                          </div>
                          {websiteSettings.workSourceMode === "single" && (
                            <label className="mt-3 grid min-w-0 gap-1 text-xs font-medium">
                              Portfolio
                              <span className="block min-w-0 max-w-full overflow-hidden">
                                <select
                                  className={`box-border block h-10 w-full min-w-0 max-w-full truncate rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => setWebsiteSettings((current) => ({ ...current, selectedGalleryId: event.target.value }))}
                                  value={websiteSettings.selectedGalleryId}
                                >
                                  {galleries.map((gallery) => (
                                    <option key={gallery.id} value={gallery.id}>
                                      {gallery.name}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </label>
                          )}
                          <p className={`mt-4 text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Display as</p>
                          <div className="mt-2 grid gap-2">
                            {websiteWorkDisplayOptions.map((option) => (
                              <button
                                className={`rounded-md border px-3 py-2 text-left text-xs ${
                                  websiteSettings.workDisplayMode === option.key
                                    ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                                    : isDark
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-[#ded8cc] bg-white"
                                }`}
                                key={option.key}
                                onClick={() => setWebsiteSettings((current) => ({ ...current, workDisplayMode: option.key }))}
                                type="button"
                              >
                                <span className="block font-semibold">{option.label}</span>
                                <span className="mt-1 block opacity-60">{option.note}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        )}

                        {websiteBuilderSection === "hero" && (
                          <>
                            <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Hero layout</p>
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {([
                                  { key: "overlay", label: "Overlay" },
                                  { key: "split", label: "Split" },
                                  { key: "stacked", label: "Stacked" },
                                ] as Array<{ key: WebsiteHeroLayout; label: string }>).map((option) => (
                                  <button
                                    className={`rounded-md border px-2 py-2 text-xs font-semibold ${
                                      websiteSettings.heroLayout === option.key
                                        ? "border-[#b08336] bg-[#d8a84f] text-[#171814]"
                                        : isDark
                                          ? "border-white/10 bg-white/[0.04]"
                                          : "border-[#ded8cc] bg-white"
                                    }`}
                                    key={option.key}
                                    onClick={() => setWebsiteSettings((current) => ({ ...current, heroLayout: option.key }))}
                                    type="button"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                              <label className="mt-3 grid gap-1 text-xs font-medium">
                                Image focal point
                                <select
                                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => setWebsiteSettings((current) => ({ ...current, heroImagePosition: event.target.value as WebsiteHeroImagePosition }))}
                                  value={websiteSettings.heroImagePosition}
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </label>
                              {websiteSettings.heroLayout === "overlay" && (
                                <label className="mt-3 grid gap-2 text-xs font-medium">
                                  <span className="flex items-center justify-between"><span>Overlay strength</span><span>{websiteSettings.heroOverlayStrength}%</span></span>
                                  <input
                                    className="accent-[#d8a84f]"
                                    max="80"
                                    min="0"
                                    onChange={(event) => setWebsiteSettings((current) => ({ ...current, heroOverlayStrength: Number(event.target.value) }))}
                                    type="range"
                                    value={websiteSettings.heroOverlayStrength}
                                  />
                                </label>
                              )}
                            </div>
                            <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Hero image</p>
                              <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                Choose the main image visitors see at the top of the website.
                              </p>
                              <div className="mt-3 grid gap-2">
                                {[
                                  { key: "featured", label: "First featured portfolio cover" },
                                  { key: "portfolio", label: "Choose a portfolio cover" },
                                  { key: "library", label: "Pick my Hero Image from my Library" },
                                  { key: "upload", label: "Upload custom hero image" },
                                ].map((option) => (
                                  <button
                                    className={`rounded-md border px-3 py-2 text-left text-xs ${
                                      websiteSettings.heroImageMode === option.key
                                        ? "border-[#b08336] bg-[#fff8e8] text-[#1e211d]"
                                        : isDark
                                          ? "border-white/10 bg-white/[0.04]"
                                          : "border-[#ded8cc] bg-white"
                                    }`}
                                    key={option.key}
                                    onClick={() => setWebsiteSettings((current) => ({ ...current, heroImageMode: option.key as WebsiteHeroImageMode }))}
                                    type="button"
                                  >
                                    <span className="font-semibold">{option.label}</span>
                                  </button>
                                ))}
                              </div>
                              {websiteSettings.heroImageMode === "portfolio" && (
                                <label className="mt-3 grid gap-1 text-xs font-medium">
                                  Portfolio cover
                                  <select
                                    className={`h-10 w-full min-w-0 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                    onChange={(event) => setWebsiteSettings((current) => ({ ...current, heroGalleryId: event.target.value }))}
                                    value={websiteSettings.heroGalleryId}
                                  >
                                    {galleries.map((gallery) => (
                                      <option key={gallery.id} value={gallery.id}>
                                        {gallery.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                              {websiteSettings.heroImageMode === "library" && (
                                <div className="mt-3 space-y-3">
                                  {websiteHeroLibraryItem && (
                                    <div className={`rounded-md border p-2 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                                      <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-black">
                                        <Image alt={websiteHeroLibraryItem.photo.title || websiteHeroLibraryItem.gallery.name} className="object-cover" fill sizes="260px" src={websiteHeroLibraryItem.source} />
                                      </div>
                                      <p className="mt-2 truncate text-xs font-semibold">{websiteHeroLibraryItem.photo.title || websiteHeroLibraryItem.photo.fileName || websiteHeroLibraryItem.gallery.name}</p>
                                      <p className={`truncate text-[11px] ${mutedTextClass}`}>{websiteHeroLibraryItem.gallery.name}</p>
                                    </div>
                                  )}
                                  <label className="grid gap-1 text-xs font-medium">
                                    Search Library photos
                                    <input
                                      className={`h-10 w-full min-w-0 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                      onChange={(event) => setHeroLibraryQuery(event.target.value)}
                                      placeholder="Search title, caption, tag, or portfolio"
                                      value={heroLibraryQuery}
                                    />
                                  </label>
                                  <div className="grid max-h-[34rem] grid-cols-2 gap-3 overflow-y-auto pr-1">
                                    {filteredWebsiteHeroLibraryItems.map((item) => {
                                      const isSelected = websiteSettings.heroLibraryPhotoKey === item.key

                                      return (
                                        <button
                                          aria-label={`Use ${item.photo.title || item.photo.fileName || item.gallery.name} as website hero`}
                                          className={`group relative aspect-[4/3] overflow-hidden rounded-md border bg-black ${
                                            isSelected ? "border-[#d8a84f] ring-2 ring-[#d8a84f]" : isDark ? "border-white/10" : "border-[#ded8cc]"
                                          }`}
                                          key={item.key}
                                          onClick={() =>
                                            setWebsiteSettings((current) => ({
                                              ...current,
                                              heroImageMode: "library",
                                              heroLibraryPhotoKey: item.key,
                                            }))
                                          }
                                          type="button"
                                        >
                                          <Image alt={item.photo.title || item.gallery.name} className="object-cover" fill sizes="150px" src={item.source} />
                                          {isSelected && (
                                            <span className="absolute right-1 top-1 rounded-full bg-[#d8a84f] p-1 text-[#171814]">
                                              <Star className="size-3 fill-current" />
                                            </span>
                                          )}
                                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1.5 text-left text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                            {item.gallery.name}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                  {filteredWebsiteHeroLibraryItems.length === 0 && (
                                    <p className={`rounded-md border px-3 py-2 text-xs leading-5 ${isDark ? "border-white/10" : "border-[#ded8cc]"} ${mutedTextClass}`}>
                                      No visible Library photos match that search.
                                    </p>
                                  )}
                                  {filteredWebsiteHeroLibraryItems.length > 0 && (
                                    <p className={`text-[11px] leading-5 ${mutedTextClass}`}>
                                      Showing {filteredWebsiteHeroLibraryItems.length} visible Library photos. Search to narrow the list.
                                    </p>
                                  )}
                                </div>
                              )}
                              {websiteSettings.heroImageMode === "upload" && (
                                <div className="mt-3 space-y-3">
                                  {websiteSettings.heroImageUrl && (
                                    <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-black">
                                      <Image alt="Current hero image" className="object-cover" fill sizes="260px" src={websiteSettings.heroImageUrl} />
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2">
                                    <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                                      <Upload className="size-4" />
                                      {heroImageUploadStatus === "uploading" ? "Uploading..." : websiteSettings.heroImageUrl ? "Replace image" : "Upload image"}
                                      <input
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        className="sr-only"
                                        disabled={heroImageUploadStatus === "uploading"}
                                        onChange={(event) => {
                                          const file = event.target.files?.[0]
                                          event.target.value = ""
                                          if (file) {
                                            void uploadWebsiteHeroImage(file)
                                          }
                                        }}
                                        type="file"
                                      />
                                    </label>
                                    {websiteSettings.heroImageUrl && (
                                      <button
                                        className={`h-10 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
                                        onClick={() => setWebsiteSettings((current) => ({ ...current, heroImageUrl: "" }))}
                                        type="button"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                  {heroImageUploadStatus === "error" && (
                                    <p className="text-xs font-semibold text-[#b42318]">Upload failed. Try a JPG, PNG, WebP, or AVIF image.</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <label className="grid gap-1 text-xs font-medium">
                              Button text
                              <input className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`} onChange={(event) => setWebsiteSettings((current) => ({ ...current, heroButtonLabel: event.target.value }))} value={websiteSettings.heroButtonLabel} />
                            </label>
                            <label className="grid gap-1 text-xs font-medium">
                              Button link
                              <input className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`} onChange={(event) => setWebsiteSettings((current) => ({ ...current, heroButtonUrl: event.target.value }))} placeholder="#portfolios or https://..." value={websiteSettings.heroButtonUrl} />
                            </label>
                            <label className={`flex items-center gap-2 rounded-md border p-3 text-sm ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                              <input checked={websiteSettings.enabledBlocks.callToAction} className="size-4 accent-[#d8a84f]" onChange={(event) => setWebsiteSettings((current) => ({ ...current, enabledBlocks: { ...current.enabledBlocks, callToAction: event.target.checked } }))} type="checkbox" />
                              Show button on hero
                            </label>
                          </>
                        )}

                          {websiteBuilderSection === "about" && (
                            <>
                              <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em]">About photo</p>
                              <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                Optional. Upload a portrait or studio image to appear beside the About page text.
                              </p>
                              {websiteSettings.aboutImageUrl && (
                                <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-md bg-black">
                                  <Image alt="Current About page photo" className="object-cover" fill sizes="260px" src={websiteSettings.aboutImageUrl} />
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <label className={`flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}>
                                  <Upload className="size-4" />
                                  {aboutImageUploadStatus === "uploading" ? "Uploading..." : websiteSettings.aboutImageUrl ? "Replace photo" : "Upload photo"}
                                  <input
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    className="sr-only"
                                    disabled={aboutImageUploadStatus === "uploading"}
                                    onChange={(event) => {
                                      const file = event.target.files?.[0]
                                      event.target.value = ""
                                      if (file) {
                                        void uploadWebsiteAboutImage(file)
                                      }
                                    }}
                                    type="file"
                                  />
                                </label>
                                {websiteSettings.aboutImageUrl && (
                                  <button
                                    className={`h-10 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
                                    onClick={() => setWebsiteSettings((current) => ({ ...current, aboutImageUrl: "" }))}
                                    type="button"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              {aboutImageUploadStatus === "error" && (
                                <p className="mt-2 text-xs font-semibold text-[#b42318]">Upload failed. Try a JPG, PNG, WebP, or AVIF image.</p>
                              )}
                            </div>
                            <label className="grid gap-1 text-xs font-medium">
                              About button text
                              <input className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`} onChange={(event) => setWebsiteSettings((current) => ({ ...current, pageCopy: { ...current.pageCopy, aboutButtonLabel: event.target.value } }))} value={websiteSettings.pageCopy.aboutButtonLabel} />
                            </label>
                            <label className="grid gap-1 text-xs font-medium">
                              About button link
                              <input className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`} onChange={(event) => setWebsiteSettings((current) => ({ ...current, pageCopy: { ...current.pageCopy, aboutButtonUrl: event.target.value } }))} placeholder="#contact or https://..." value={websiteSettings.pageCopy.aboutButtonUrl} />
                            </label>
                            </>
                          )}

                          {(websiteBuilderSection === "featuredPortfolio" || websiteBuilderSection === "portfolioGrid") && (
                            <div className="space-y-2">
                              <p className={`text-xs leading-5 ${mutedTextClass}`}>
                              If you chose Featured above, select the portfolios to include here.
                            </p>
                            {websiteSettings.workSourceMode === "featured" && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Pick featured portfolios</p>
                                  <span className={`shrink-0 text-[11px] ${mutedTextClass}`}>
                                    {websiteSettings.featuredGalleryIds.length} selected
                                  </span>
                                </div>
                                <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                                  {galleries.map((gallery) => (
                                    <label className={`flex min-w-0 items-center gap-3 rounded-md border p-2 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`} key={gallery.id}>
                                      <input
                                        checked={websiteSettings.featuredGalleryIds.includes(gallery.id)}
                                        className="size-4 shrink-0 accent-[#d8a84f]"
                                        onChange={(event) =>
                                          setWebsiteSettings((current) => ({
                                            ...current,
                                            featuredGalleryIds: event.target.checked
                                              ? [...current.featuredGalleryIds, gallery.id]
                                              : current.featuredGalleryIds.filter((galleryId) => galleryId !== gallery.id),
                                          }))
                                        }
                                        type="checkbox"
                                      />
                                      <span className="relative size-11 shrink-0 overflow-hidden rounded bg-black/10">
                                        <Image alt="" className="object-cover" fill sizes="44px" src={gallery.cover} />
                                      </span>
                                      <span className="min-w-0 truncate text-sm font-semibold">{gallery.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {websiteBuilderPage === "blog" && (
                          <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]">Trip entries</p>
                                <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Add, edit, and remove the stories shown in this section.</p>
                              </div>
                              <button
                                className="flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white"
                                onClick={() =>
                                  setWebsiteSettings((current) => ({
                                    ...current,
                                    tripEntries: [
                                      ...current.tripEntries,
                                      {
                                        body: "Write a short story, field note, or travel update for this trip.",
                                        id: `trip-${Date.now()}`,
                                        linkLabel: "View portfolio",
                                        linkUrl: "#portfolios",
                                        meta: "",
                                        title: "New trip",
                                      },
                                    ],
                                  }))
                                }
                                type="button"
                              >
                                <Plus className="size-3.5" />
                                Add
                              </button>
                            </div>
                            <div className="mt-3 max-h-[36rem] space-y-3 overflow-y-auto pr-1">
                              {websiteSettings.tripEntries.map((trip, tripIndex) => (
                                <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`} key={trip.id}>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold">Trip {tripIndex + 1}</p>
                                    <button
                                      className="text-xs font-semibold text-[#a43b2f]"
                                      onClick={() =>
                                        setWebsiteSettings((current) => ({
                                          ...current,
                                          tripEntries: current.tripEntries.filter((entry) => entry.id !== trip.id),
                                        }))
                                      }
                                      type="button"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="mt-3 grid gap-2">
                                    <input
                                      aria-label={`Trip ${tripIndex + 1} title`}
                                      className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                                      onChange={(event) => {
                                        const title = event.target.value
                                        setWebsiteSettings((current) => ({
                                          ...current,
                                          tripEntries: current.tripEntries.map((entry) => (entry.id === trip.id ? { ...entry, title } : entry)),
                                        }))
                                      }}
                                      placeholder="Trip title"
                                      value={trip.title}
                                    />
                                    <input
                                      aria-label={`Trip ${tripIndex + 1} location or date`}
                                      className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                                      onChange={(event) => {
                                        const meta = event.target.value
                                        setWebsiteSettings((current) => ({
                                          ...current,
                                          tripEntries: current.tripEntries.map((entry) => (entry.id === trip.id ? { ...entry, meta } : entry)),
                                        }))
                                      }}
                                      placeholder={websitePlaceholderTripMeta}
                                      value={getSubscriberTripMeta(trip.meta)}
                                    />
                                    <textarea
                                      aria-label={`Trip ${tripIndex + 1} story`}
                                      className={`min-h-24 resize-y rounded-md border px-3 py-2 text-sm leading-6 outline-none ${fieldClass}`}
                                      onChange={(event) => {
                                        const body = event.target.value
                                        setWebsiteSettings((current) => ({
                                          ...current,
                                          tripEntries: current.tripEntries.map((entry) => (entry.id === trip.id ? { ...entry, body } : entry)),
                                        }))
                                      }}
                                      value={trip.body}
                                    />
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                      <input
                                        aria-label={`Trip ${tripIndex + 1} link label`}
                                        className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                                        onChange={(event) => {
                                          const linkLabel = event.target.value
                                          setWebsiteSettings((current) => ({
                                            ...current,
                                            tripEntries: current.tripEntries.map((entry) => (entry.id === trip.id ? { ...entry, linkLabel } : entry)),
                                          }))
                                        }}
                                        placeholder="Link label"
                                        value={trip.linkLabel}
                                      />
                                      <input
                                        aria-label={`Trip ${tripIndex + 1} link URL`}
                                        className={`h-10 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                                        onChange={(event) => {
                                          const linkUrl = event.target.value
                                          setWebsiteSettings((current) => ({
                                            ...current,
                                            tripEntries: current.tripEntries.map((entry) => (entry.id === trip.id ? { ...entry, linkUrl } : entry)),
                                          }))
                                        }}
                                        placeholder="#portfolios or https://..."
                                        value={trip.linkUrl}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {websiteBuilderSection === "contact" && (
                          <div className="space-y-3">
                            <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"} ${mutedTextClass}`}>
                              This is subscriber-only. The email below controls where Contact page messages go and is not shown to visitors.
                            </div>
                            <label className="grid gap-1 text-xs font-medium">
                              Form delivery email
                              <input
                                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                onChange={(event) => setWebsiteSettings((current) => ({ ...current, contactEmail: event.target.value }))}
                                placeholder="you@example.com"
                                type="email"
                                value={websiteSettings.contactEmail}
                              />
                            </label>
                            {!websiteSettings.contactEmail && (
                              <div className="rounded-md border border-[#d8a84f]/50 bg-[#fff8e8] p-3 text-xs leading-5 text-[#735223]">
                                Add an email address before publishing so visitors know where their message is going.
                              </div>
                            )}
                          </div>
                        )}
                        {activeWebsiteHomeBlock !== "featuredPortfolio" && activeWebsiteHomeBlock !== "portfolioGrid" && (
                          <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"} ${mutedTextClass}`}>
                            This section uses the selected site design. Open <button className="font-semibold text-[#9b6d22] underline" onClick={() => { setWebsiteInspectorOpen(false); setWebsiteBuilderTool("style") }} type="button">Design</button> to change its template, typography, colors, image frame, or image shape.
                          </div>
                        )}

                        <div className="space-y-1 border-t border-current/10 pt-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Page sections</p>
                            <button className="text-xs font-semibold text-[#9b6d22]" onClick={() => { setWebsiteInspectorOpen(false); setWebsiteBuilderTool("add") }} type="button">
                              Add section
                            </button>
                          </div>
                          {orderedWebsiteSectionKeys.filter((sectionKey) => sectionKey !== activeWebsiteSectionKey).map((sectionKey) => (
                            <button
                              className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm font-semibold ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-white"}`}
                              draggable
                              key={sectionKey}
                              onDragEnd={() => setDraggedWebsiteSection(null)}
                              onDragOver={(event) => event.preventDefault()}
                              onDragStart={(event) => {
                                setDraggedWebsiteSection(sectionKey)
                                event.dataTransfer.effectAllowed = "move"
                                event.dataTransfer.setData("text/plain", sectionKey)
                              }}
                              onDrop={(event) => {
                                event.preventDefault()
                                const draggedKey = (event.dataTransfer.getData("text/plain") || draggedWebsiteSection) as WebsiteSectionOrderKey | null
                                if (draggedKey && DEFAULT_WEBSITE_SECTION_ORDER.includes(draggedKey)) moveWebsiteSection(draggedKey, sectionKey)
                                setDraggedWebsiteSection(null)
                              }}
                              onClick={() => selectWebsiteSection(sectionKey)}
                              type="button"
                            >
                              <GripVertical className="size-4 shrink-0 text-[#9c7b42]" />
                              <span className="min-w-0 flex-1 truncate">{getWebsiteSectionLabel(sectionKey)}</span>
                              {isWebsiteSectionVisible(sectionKey) ? <Eye className="size-3.5 opacity-55" /> : <EyeOff className="size-3.5 opacity-35" />}
                              <ChevronRight className="size-3.5 opacity-45" />
                            </button>
                          ))}
                          <p className={`pt-2 text-[11px] leading-5 ${mutedTextClass}`}>Opening a section closes the previous one.</p>
                        </div>
                      </div>
                    </div>
                  </aside>
                  )}
                </div>

                {websitePublishOpen && (
                  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-setup-title">
                    <div className={`w-full max-w-lg rounded-md border p-5 shadow-2xl ${surfaceClass}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Website address</p>
                          <h3 className="mt-1 text-xl font-semibold" id="publish-setup-title">Website address</h3>
                          <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>Choose where this website will live. These settings are separate from page editing.</p>
                        </div>
                        <button
                          aria-label="Close website address"
                          className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                          onClick={() => setWebsitePublishOpen(false)}
                          type="button"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="mt-5 grid gap-4">
                        <label className="grid gap-1 text-xs font-medium">
                          PhotoViewPro address
                          <div className={`flex h-11 overflow-hidden rounded-md border ${fieldClass}`}>
                            <input
                              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-normal outline-none"
                              onChange={(event) => setWebsiteSettings((current) => ({ ...current, subdomain: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                              value={websiteSettings.subdomain}
                            />
                            <span className={`flex items-center border-l px-3 text-xs ${isDark ? "border-white/15" : "border-[#d7d0c4]"} ${mutedTextClass}`}>.photoviewpro.com</span>
                          </div>
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          Custom domain
                          <input
                            className={`h-11 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) => setWebsiteSettings((current) => ({ ...current, customDomain: event.target.value }))}
                            placeholder="yourphotography.com"
                            value={websiteSettings.customDomain}
                          />
                        </label>
                      </div>
                      <div className="mt-5 flex justify-end gap-2">
                        <button
                          className={`h-10 rounded-md border px-4 text-sm font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                          onClick={() => setWebsitePublishOpen(false)}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="h-10 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white"
                          onClick={() => {
                            window.localStorage.setItem(WEBSITE_BUILDER_STORAGE_KEY, JSON.stringify(websiteSettings))
                            setWebsiteSaveStatus("saved")
                            setWebsitePublishOpen(false)
                          }}
                          type="button"
                        >
                          Save draft
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ) : activePanel === "library" ? (
              <section className="space-y-5">
                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Images className="size-5 text-[#99702d]" />
                        <h2 className="text-xl font-semibold">Photo library</h2>
                      </div>
                      <p className={`mt-1 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                        Search, tag, and organize photos across every portfolio. Advanced fields stay in the details pane so the library remains easy to scan.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className={`rounded-md border px-3 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                        <p className={`text-[11px] uppercase tracking-[0.16em] ${mutedTextClass}`}>Photos</p>
                        <p className="mt-1 text-lg font-semibold">{libraryItems.length.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-md border px-3 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                        <p className={`text-[11px] uppercase tracking-[0.16em] ${mutedTextClass}`}>Tagged</p>
                        <p className="mt-1 text-lg font-semibold">{libraryTaggedCount.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-md border px-3 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                        <p className={`text-[11px] uppercase tracking-[0.16em] ${mutedTextClass}`}>Hidden</p>
                        <p className="mt-1 text-lg font-semibold">{libraryHiddenCount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                    <label className={`flex h-11 items-center gap-2 rounded-md border px-3 ${fieldClass}`}>
                      <Search className="size-4 shrink-0 text-[#99702d]" />
                      <input
                        aria-label="Search all photos and portfolios"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        onChange={(event) => setLibraryQuery(event.target.value)}
                        placeholder="Search title, file, tag, trip, location, camera..."
                        value={libraryQuery}
                      />
                    </label>
                    <div className="flex gap-2 overflow-x-auto">
                      {libraryFilterOptions.map((option) => (
                        <button
                          className={`h-10 shrink-0 rounded-md border px-3 text-sm font-semibold ${
                            libraryFilter === option.id
                              ? "border-[#d8a84f] bg-[#fff8e8] text-[#735223]"
                              : isDark
                                ? "border-white/15 bg-white/10 text-white/70 hover:text-white"
                                : "border-[#d7d0c4] bg-white text-[#5f594f] hover:text-[#1e211d]"
                          }`}
                          key={option.id}
                          onClick={() => setLibraryFilter(option.id)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {librarySelectedKeys.length > 0 && (
                    <div className={`mt-4 flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between ${
                      isDark ? "border-[#d8a84f]/25 bg-[#d8a84f]/10" : "border-[#e0bd69] bg-[#fff8e8]"
                    }`}>
                      <div>
                        <p className="text-sm font-semibold">{librarySelectedKeys.length.toLocaleString()} selected</p>
                        <p className={`mt-1 text-xs ${mutedTextClass}`}>Bulk actions apply only to selected photos.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          onClick={() => bulkUpdateLibraryPhotos({ hidden: false })}
                          type="button"
                        >
                          Show
                        </button>
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          onClick={() => bulkUpdateLibraryPhotos({ hidden: true })}
                          type="button"
                        >
                          Hide
                        </button>
                        <label className={`flex h-9 items-center gap-2 rounded-md border px-3 ${isDark ? "border-white/15 bg-black/30" : "border-[#d7d0c4] bg-white"}`}>
                          <Tag className="size-4 text-[#99702d]" />
                          <input
                            aria-label="Bulk tags"
                            className="w-44 bg-transparent text-sm outline-none"
                            onChange={(event) => setLibraryBulkTags(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault()
                                addTagsToSelectedLibraryPhotos()
                              }
                            }}
                            placeholder="tag, tag"
                            value={libraryBulkTags}
                          />
                        </label>
                        <button
                          className="h-9 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:opacity-45"
                          disabled={parseTagInput(libraryBulkTags).length === 0}
                          onClick={addTagsToSelectedLibraryPhotos}
                          type="button"
                        >
                          Add tags
                        </button>
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          onClick={() => setLibrarySelectedKeys([])}
                          type="button"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                  <div className={`rounded-md border shadow-sm ${surfaceClass}`}>
                    <div className="flex flex-col gap-3 border-b border-current/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className={`text-sm ${mutedTextClass}`}>
                        Showing {filteredLibraryItems.length.toLocaleString()} of {libraryItems.length.toLocaleString()} photos
                      </p>
                      <div className="flex gap-2">
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          onClick={() => setLibrarySelectedKeys(filteredLibraryItems.map((item) => item.key))}
                          type="button"
                        >
                          Select shown
                        </button>
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          onClick={() => {
                            setLibraryFilter("all")
                            setLibraryQuery("")
                          }}
                          type="button"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                    {filteredLibraryItems.length > 0 ? (
                      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {filteredLibraryItems.map((item) => {
                          const { gallery, photo } = item
                          const isSelected = librarySelectedKeys.includes(item.key)
                          const isCover = photoMatchesCover(photo, gallery.cover)

                          return (
                            <article
                              className={`overflow-hidden rounded-md border ${
                                isSelected
                                  ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/35"
                                  : isDark
                                    ? "border-white/10"
                                    : "border-[#ded8cc]"
                              } ${photo.hidden ? "opacity-70 grayscale" : ""}`}
                              key={item.key}
                            >
                              <button
                                className="relative block aspect-[4/3] w-full bg-black/5"
                                onClick={() => openLibraryItem(item)}
                                type="button"
                              >
                                <Image
                                  alt={photo.title}
                                  className="object-contain"
                                  fill
                                  sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                                  src={getThumbnailUrl(photo)}
                                />
                                <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                                  {gallery.name}
                                </span>
                                {isCover && (
                                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#d8a84f] px-2 py-1 text-[10px] font-semibold text-[#171814]">
                                    <Star className="size-3 fill-current" />
                                    Cover
                                  </span>
                                )}
                                {photo.hidden && (
                                  <span className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-xs font-semibold text-white">
                                    Hidden
                                  </span>
                                )}
                              </button>
                              <div className="grid gap-2 p-3">
                                <div className="flex items-start gap-2">
                                  <input
                                    aria-label={`Select ${photo.title}`}
                                    checked={isSelected}
                                    className="mt-1 size-4 accent-[#d8a84f]"
                                    onChange={() => toggleLibrarySelection(item.key)}
                                    type="checkbox"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{photo.caption || photo.title}</p>
                                    <p className={`mt-0.5 truncate text-xs ${mutedTextClass}`}>{photo.fileName}</p>
                                  </div>
                                </div>
                                {(photo.tags ?? []).length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {(photo.tags ?? []).slice(0, 4).map((tag) => (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-white/10 text-white/70" : "bg-[#f2eee7] text-[#6b6257]"}`} key={tag}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid min-h-64 place-items-center p-8 text-center">
                        <div>
                          <SlidersHorizontal className={`mx-auto size-8 ${mutedTextClass}`} />
                          <p className="mt-3 text-sm font-semibold">No photos match this view.</p>
                          <p className={`mt-1 text-sm ${mutedTextClass}`}>Try a different search or filter.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <aside className={`rounded-md border p-4 shadow-sm xl:sticky xl:top-5 xl:self-start ${surfaceClass}`}>
                    {activeLibraryItem ? (
                      <div className="space-y-4">
                        <div>
                          <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Details</p>
                          <h2 className="mt-1 text-lg font-semibold">{activeLibraryItem.photo.caption || activeLibraryItem.photo.title}</h2>
                          <p className={`mt-1 text-xs ${mutedTextClass}`}>{activeLibraryItem.gallery.name}</p>
                        </div>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-current/10 bg-black/5">
                          <Image
                            alt={activeLibraryItem.photo.title}
                            className="object-contain"
                            fill
                            sizes="360px"
                            src={getThumbnailUrl(activeLibraryItem.photo)}
                          />
                        </div>
                        <div className="grid gap-3">
                          <label className="grid gap-1 text-xs font-medium">
                            Caption
                            <input
                              className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                              onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { caption: event.target.value })}
                              placeholder="Display caption"
                              value={activeLibraryItem.photo.caption ?? ""}
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-medium">
                            Tags
                            <input
                              className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                              onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { tags: parseTagInput(event.target.value) })}
                              placeholder="landscape, night, favorite"
                              value={(activeLibraryItem.photo.tags ?? []).join(", ")}
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <label className="grid gap-1 text-xs font-medium">
                              Category
                              <input
                                className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                                onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { category: event.target.value })}
                                placeholder="Travel, landscape, portrait"
                                value={activeLibraryItem.photo.category ?? ""}
                              />
                            </label>
                            <label className="grid gap-1 text-xs font-medium">
                              Trip / collection
                              <input
                                className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                                onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { trip: event.target.value })}
                                placeholder="Myanmar 2024"
                                value={activeLibraryItem.photo.trip ?? ""}
                              />
                            </label>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <label className="grid gap-1 text-xs font-medium">
                              Location
                              <input
                                className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                                onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { location: event.target.value })}
                                placeholder="City, region, country"
                                value={activeLibraryItem.photo.location ?? ""}
                              />
                            </label>
                            <label className="grid gap-1 text-xs font-medium">
                              Date
                              <input
                                className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                                onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { capturedDate: event.target.value })}
                                type="date"
                                value={activeLibraryItem.photo.capturedDate ?? ""}
                              />
                            </label>
                          </div>
                          <details className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-[#ded8cc] bg-[#fbfaf7]"}`}>
                            <summary className="cursor-pointer text-sm font-semibold">Camera and notes</summary>
                            <div className="mt-3 grid gap-3">
                              <label className="grid gap-1 text-xs font-medium">
                                Camera
                                <input
                                  className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { camera: event.target.value })}
                                  placeholder="Camera body"
                                  value={activeLibraryItem.photo.camera ?? ""}
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium">
                                Lens
                                <input
                                  className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { lens: event.target.value })}
                                  placeholder="Lens"
                                  value={activeLibraryItem.photo.lens ?? ""}
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium">
                                Story behind the shot
                                <textarea
                                  className={`min-h-20 rounded-md border p-2 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { story: event.target.value })}
                                  placeholder="What makes this image matter?"
                                  value={activeLibraryItem.photo.story ?? ""}
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium">
                                Private notes
                                <textarea
                                  className={`min-h-20 rounded-md border p-2 text-sm font-normal outline-none ${fieldClass}`}
                                  onChange={(event) => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { notes: event.target.value })}
                                  placeholder="Editing, sequencing, or publishing notes"
                                  value={activeLibraryItem.photo.notes ?? ""}
                                />
                              </label>
                            </div>
                          </details>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                              onClick={() => updateLibraryPhoto(activeLibraryItem.gallery.id, activeLibraryItem.photo.id, { hidden: !activeLibraryItem.photo.hidden })}
                              type="button"
                            >
                              {activeLibraryItem.photo.hidden ? "Unhide" : "Hide"}
                            </button>
                            <button
                              className={`h-9 rounded-md border px-3 text-sm font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                              onClick={() => {
                                setActiveGalleryId(activeLibraryItem.gallery.id)
                                setActivePanel("photos")
                                setPortfolioViewMode("grid")
                              }}
                              type="button"
                            >
                              Open portfolio
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid min-h-64 place-items-center text-center">
                        <div>
                          <Info className={`mx-auto size-8 ${mutedTextClass}`} />
                          <p className="mt-3 text-sm font-semibold">Select a photo</p>
                          <p className={`mt-1 text-sm ${mutedTextClass}`}>Details and organization fields appear here.</p>
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            ) : activePanel === "photos" ? (
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
                      <p className={`mt-2 max-w-3xl text-xs leading-5 ${mutedTextClass}`}>
                        Showcase is PhotoViewPro&apos;s public discovery gallery. Submit only photos you want featured there; hidden photos are never displayed or shared publicly.
                      </p>
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
                        Set portfolio cover
                      </button>
                      <button
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isActivePhotoSubmittedToShowcase
                            ? isDark
                              ? "border-[#d8a84f]/50 bg-[#d8a84f]/20 text-[#f7dd9a]"
                              : "border-[#d8a84f] bg-[#fff8e8] text-[#735223]"
                            : isDark
                              ? "border-white/15 bg-white/10 text-white"
                              : "border-[#d7d0c4] bg-white"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                        disabled={!activePhoto}
                        onClick={toggleCurrentPhotoShowcaseSubmission}
                        type="button"
                      >
                        <Sparkles className="size-4" />
                        {isActivePhotoSubmittedToShowcase ? "Remove from Showcase" : "Submit to Showcase"}
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

                  <div className={`flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
                    isDark ? "border-white/10 bg-white/5" : "border-[#ded8cc] bg-[#fbfaf7]"
                  }`}>
                    <div>
                      <p className="text-sm font-semibold">{activeGallery.name}</p>
                      <p className={`mt-1 text-xs ${mutedTextClass}`}>
                        {renderablePhotos.length.toLocaleString()} shown, {hiddenPhotos.length.toLocaleString()} hidden. Drag tiles to change presentation order.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="flex rounded-md border border-current/10 p-1 text-sm font-medium">
                        <button
                          className={`flex h-9 items-center gap-2 rounded px-3 ${
                            portfolioViewMode === "grid" ? "bg-[#1f2a24] text-white" : mutedTextClass
                          }`}
                          onClick={() => setPortfolioViewMode("grid")}
                          type="button"
                        >
                          <Images className="size-4" />
                          Thumbnail grid
                        </button>
                        <button
                          className={`flex h-9 items-center gap-2 rounded px-3 ${
                            portfolioViewMode === "viewer" ? "bg-[#1f2a24] text-white" : mutedTextClass
                          }`}
                          onClick={() => setPortfolioViewMode("viewer")}
                          type="button"
                        >
                          <Eye className="size-4" />
                          Single image
                        </button>
                      </div>
                      {renderConfiguredSocialButtons(publicGalleryUrl, activeGallery.name, "portfolio", "justify-end")}
                    </div>
                  </div>

                  <div className={`rounded-md border p-3 ${surfaceClass}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="size-4 text-[#99702d]" />
                          AI Portfolio Assistant
                        </div>
                        <p className={`mt-1 max-w-3xl text-xs leading-5 ${mutedTextClass}`}>
                          Get suggestions for cover choice, display order, duplicate review, captions, tags, and social sharing copy. Nothing changes until you approve it.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={portfolioPhotos.length === 0 || aiAssistantStatus === "asking"}
                          onClick={() => void requestAiPortfolioSuggestion("curate")}
                          type="button"
                        >
                          {aiAssistantStatus === "asking" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                          Suggest portfolio polish
                        </button>
                        <button
                          className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${
                            isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                          disabled={portfolioPhotos.length === 0 || aiAssistantStatus === "asking"}
                          onClick={() => void requestAiPortfolioSuggestion("social")}
                          type="button"
                        >
                          <Share2 className="size-4" />
                          Write sharing copy
                        </button>
                        <button
                          className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold ${
                            isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                          }`}
                          onClick={() => setAiAssistantOpen((current) => !current)}
                          type="button"
                        >
                          {aiAssistantOpen ? "Hide assistant" : "Show assistant"}
                        </button>
                      </div>
                    </div>

                    {aiAssistantOpen && (
                      <div className={`mt-3 rounded-md border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-[#e5ded2] bg-[#fbfaf7]"}`}>
                        {aiAssistantStatus === "error" && (
                          <p className={`rounded-md border px-3 py-2 text-sm ${isDark ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-red-200 bg-red-50 text-red-700"}`}>
                            {aiAssistantNote}
                          </p>
                        )}
                        {aiAssistantStatus === "asking" && (
                          <p className={`flex items-center gap-2 text-sm ${mutedTextClass}`}>
                            <Loader2 className="size-4 animate-spin" />
                            Reviewing this portfolio without changing anything...
                          </p>
                        )}
                        {aiAssistantSuggestion ? (
                          <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
                            <div className="space-y-3">
                              <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">Suggested cover</p>
                                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                      {findPortfolioPhoto(aiAssistantSuggestion.coverPhotoId)?.title ?? "No visible cover suggestion yet."}
                                    </p>
                                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>{aiAssistantSuggestion.coverReason}</p>
                                  </div>
                                  <button
                                    className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={!findPortfolioPhoto(aiAssistantSuggestion.coverPhotoId) || Boolean(findPortfolioPhoto(aiAssistantSuggestion.coverPhotoId)?.hidden)}
                                    onClick={applyAiCoverSuggestion}
                                    type="button"
                                  >
                                    Apply cover
                                  </button>
                                </div>
                              </div>

                              <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">Suggested display order</p>
                                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>{aiAssistantSuggestion.orderReason}</p>
                                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                                      {aiAssistantSuggestion.orderedPhotoIds.length.toLocaleString()} visible photos in suggested order. Hidden photos stay hidden and are not included.
                                    </p>
                                  </div>
                                  <button
                                    className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={aiAssistantSuggestion.orderedPhotoIds.length === 0}
                                    onClick={applyAiOrderSuggestion}
                                    type="button"
                                  >
                                    Apply order
                                  </button>
                                </div>
                              </div>

                              <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">Portfolio intro</p>
                                    <p className={`mt-1 text-sm leading-6 ${mutedTextClass}`}>{aiAssistantSuggestion.intro}</p>
                                  </div>
                                  <button
                                    className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white"
                                    onClick={applyAiPortfolioIntro}
                                    type="button"
                                  >
                                    Use intro
                                  </button>
                                </div>
                              </div>

                              <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">Captions and tags</p>
                                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                      {aiAssistantSuggestion.captionUpdates.length.toLocaleString()} caption/tag suggestions. Captions only fill blank caption fields; existing captions are left alone.
                                    </p>
                                  </div>
                                  <button
                                    className="h-9 rounded-md bg-[#1f2a24] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={aiAssistantSuggestion.captionUpdates.length === 0}
                                    onClick={applyAiCaptionAndTagSuggestions}
                                    type="button"
                                  >
                                    Apply blanks + tags
                                  </button>
                                </div>
                              </div>

                              {aiAssistantSuggestion.duplicateGroups.length > 0 && (
                                <div className={`rounded-md border p-3 ${isDark ? "border-[#d8a84f]/30 bg-[#d8a84f]/10" : "border-[#ead29b] bg-[#fff8e8]"}`}>
                                  <p className="text-sm font-semibold">Possible duplicates to review</p>
                                  <div className="mt-2 space-y-2">
                                    {aiAssistantSuggestion.duplicateGroups.map((group) => (
                                      <p className={`text-xs leading-5 ${mutedTextClass}`} key={group.photoIds.join("-")}>
                                        {group.photoIds.map((photoId) => findPortfolioPhoto(photoId)?.title ?? photoId).join(", ")}: {group.reason}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/20" : "border-[#ded8cc] bg-white"}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">Social Sharing Assistant</p>
                                  <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                    Copy platform-ready text, then use your configured share buttons below. Instagram, TikTok, and YouTube still copy/open because they do not provide dependable public web-share posting.
                                  </p>
                                </div>
                                {aiAssistantMode && (
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${aiAssistantMode === "ai" ? "bg-[#e9f1dc] text-[#466026]" : "bg-[#fff8e8] text-[#735223]"}`}>
                                    {aiAssistantMode === "ai" ? "AI" : "Local"}
                                  </span>
                                )}
                              </div>
                              {aiAssistantNote && aiAssistantStatus !== "error" && (
                                <p className={`mt-2 rounded-md border px-3 py-2 text-xs leading-5 ${isDark ? "border-white/10 bg-white/5 text-white/60" : "border-[#ead29b] bg-[#fff8e8] text-[#735223]"}`}>
                                  {aiAssistantNote}
                                </p>
                              )}
                              <div className="mt-3 grid gap-2">
                                {([
                                  ["facebook", "Facebook"],
                                  ["instagram", "Instagram"],
                                  ["linkedin", "LinkedIn"],
                                  ["pinterest", "Pinterest"],
                                  ["x", "X"],
                                  ["email", "Email"],
                                ] as Array<[keyof AiPortfolioSuggestion["socialPosts"], string]>).map(([platform, label]) => (
                                  <div className={`rounded-md border p-2 ${isDark ? "border-white/10" : "border-[#e5ded2]"}`} key={platform}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-semibold">{label}</p>
                                      <button
                                        className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                                        onClick={() => copyAiSocialPost(platform)}
                                        type="button"
                                      >
                                        <Copy className="size-3.5" />
                                        Copy
                                      </button>
                                    </div>
                                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>{aiAssistantSuggestion.socialPosts[platform]}</p>
                                  </div>
                                ))}
                              </div>
                              {renderConfiguredSocialButtons(publicGalleryUrl, activeGallery.name, "AI-assisted portfolio share", "mt-3")}
                            </div>
                          </div>
                        ) : aiAssistantStatus !== "asking" ? (
                          <p className={`text-sm ${mutedTextClass}`}>
                            Run an assistant action to see suggestions here. The assistant uses only this portfolio&apos;s metadata, captions, and visibility settings.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className={`rounded-md border p-3 ${surfaceClass}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Info className="size-4 text-[#99702d]" />
                          Portfolio info pane
                        </div>
                        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                          Add context for this portfolio. Hidden photos are kept in the portfolio for you, but they are not displayed or shared publicly.
                        </p>
                        <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                          When shown, visitors see the location, date, time, and notes on the public portfolio page beneath the photo viewer. When hidden, that entire visitor info panel is removed.
                        </p>
                      </div>
                      <button
                        className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                        }`}
                        onClick={() => updateActiveGallery({ infoPaneEnabled: !(activeGallery.infoPaneEnabled ?? false) })}
                        type="button"
                      >
                        {(activeGallery.infoPaneEnabled ?? false) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {(activeGallery.infoPaneEnabled ?? false) ? "Hide info" : "Show info"}
                      </button>
                    </div>
                    {(activeGallery.infoPaneEnabled ?? false) && (
                      <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        <label className="grid gap-1 text-xs font-medium">
                          <span className="flex items-center gap-2"><MapPin className="size-3.5 text-[#99702d]" /> Location</span>
                          <input
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateActiveGallery({ infoLocation: event.target.value })}
                            placeholder="City, region, country"
                            value={activeGallery.infoLocation ?? ""}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          <span className="flex items-center gap-2"><Calendar className="size-3.5 text-[#99702d]" /> Date</span>
                          <input
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateActiveGallery({ infoDate: event.target.value })}
                            type="date"
                            value={activeGallery.infoDate ?? ""}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium">
                          <span className="flex items-center gap-2"><Clock className="size-3.5 text-[#99702d]" /> Time</span>
                          <input
                            className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateActiveGallery({ infoTime: event.target.value })}
                            type="time"
                            value={activeGallery.infoTime ?? ""}
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium lg:col-span-3">
                          <span className="flex items-center gap-2"><StickyNote className="size-3.5 text-[#99702d]" /> Notes</span>
                          <textarea
                            className={`min-h-24 rounded-md border p-2 text-sm font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateActiveGallery({ infoNotes: event.target.value })}
                            placeholder="Story, travel details, shooting notes, client context, or anything visitors should know."
                            value={activeGallery.infoNotes ?? ""}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {portfolioViewMode === "grid" ? (
                    <div className={`rounded-md border p-3 ${surfaceClass}`}>
                      {portfolioPhotos.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                          {portfolioPhotos.map((photo) => {
                            const isHidden = Boolean(photo.hidden)
                            const isCover = photoMatchesCover(photo, activeGallery.cover)
                            const isSubmittedToShowcase = showcaseSubmittedIds.includes(`local-${activeGallery.id}-${photo.id}`)
                            const photoShareUrl = `${publicGalleryUrl}?photo=${encodeURIComponent(photo.id)}`

                            return (
                              <div
                                className={`overflow-hidden rounded-md border ${
                                  isCover ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/40" : isDark ? "border-white/10" : "border-[#ded8cc]"
                                } ${
                                  draggedPhotoId === photo.id ? "opacity-45 ring-2 ring-[#d8a84f]/60" : isHidden ? "bg-black/5 opacity-70 grayscale" : isDark ? "bg-white/5" : "bg-white"
                                }`}
                                draggable
                                onDragEnd={() => setDraggedPhotoId(null)}
                                onDragOver={(event) => event.preventDefault()}
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = "move"
                                  event.dataTransfer.setData("text/plain", photo.id)
                                  setDraggedPhotoId(photo.id)
                                }}
                                onDrop={(event) => {
                                  event.preventDefault()
                                  const droppedPhotoId = event.dataTransfer.getData("text/plain") || draggedPhotoId
                                  if (droppedPhotoId) reorderPortfolioPhoto(droppedPhotoId, photo.id)
                                  setDraggedPhotoId(null)
                                }}
                                key={photo.id}
                              >
                                <button
                                  aria-label={`Open ${photo.title}`}
                                  className="relative block aspect-[3/2] w-full bg-black/5"
                                  disabled={isHidden}
                                  onClick={() => openPhotoViewer(photo.id)}
                                  type="button"
                                >
                                  <Image
                                    alt={photo.title}
                                    className="object-contain"
                                    fill
                                    sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                    src={getThumbnailUrl(photo)}
                                  />
                                  {isCover && (
                                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#d8a84f] px-2 py-1 text-[10px] font-semibold text-[#171814] shadow-sm">
                                      <Star className="size-3 fill-current" />
                                      Cover
                                    </span>
                                  )}
                                  {isSubmittedToShowcase && !isHidden && (
                                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#d8a84f] px-2 py-1 text-[10px] font-semibold text-[#171814] shadow-sm">
                                      <Star className="size-3 fill-current" />
                                      Showcase
                                    </span>
                                  )}
                                  {!isCover && !isHidden && (
                                    <span className="absolute left-2 top-2 rounded-full border border-white/30 bg-black/45 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                                      Drag
                                    </span>
                                  )}
                                  {isHidden && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                                      Hidden
                                    </span>
                                  )}
                                </button>
                                <div className="grid gap-2 border-t border-current/10 p-2">
                                  <span className={`min-w-0 truncate text-xs ${mutedTextClass}`}>{photo.caption || photo.title}</span>
                                  <div className="flex gap-2">
                                    <button
                                      className={`flex-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                        isCover
                                          ? "border-[#d8a84f] bg-[#fff8e8] text-[#6f4e17]"
                                          : isDark
                                            ? "border-white/15 bg-white/10 text-white"
                                            : "border-[#d7d0c4] bg-white text-[#1e211d]"
                                      } disabled:cursor-not-allowed disabled:opacity-50`}
                                      disabled={isCover || isHidden}
                                      onClick={() => setPhotoAsCover(photo)}
                                      type="button"
                                    >
                                      {isCover ? "Cover" : "Set cover"}
                                    </button>
                                    <button
                                      className={`flex-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                        isHidden
                                          ? "border-[#d8a84f] bg-[#fff8e8] text-[#6f4e17]"
                                          : isDark
                                            ? "border-white/15 bg-white/10 text-white"
                                            : "border-[#d7d0c4] bg-white text-[#1e211d]"
                                      }`}
                                      onClick={() => togglePortfolioPhotoVisibility(photo.id, isHidden)}
                                      type="button"
                                    >
                                      {isHidden ? "Unhide" : "Hide"}
                                    </button>
                                  </div>
                                  {!isHidden && renderConfiguredSocialButtons(photoShareUrl, photo.caption || photo.title, "photo")}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className={`p-6 text-center text-sm ${mutedTextClass}`}>No photos have been added to this portfolio yet.</p>
                      )}
                    </div>
                  ) : (
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
                        {isActivePhotoSubmittedToShowcase && (
                          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-[#f4d47e] bg-[#d8a84f] px-3 py-1 text-xs font-semibold text-[#171814] shadow-lg">
                            <Star className="size-3.5 fill-current" />
                            Showcase
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
                            : `${activePhotos.length.toLocaleString()} originals in photo storage`}
                          {hiddenPhotos.length > 0 ? `, ${hiddenPhotos.length.toLocaleString()} hidden` : ""}
                        </p>
                        {activePhoto && (
                          <div className="mt-3 grid gap-2 md:max-w-xl">
                            {showcaseSubmitStatus !== "idle" && (
                              <p className={`rounded-md px-3 py-2 text-xs font-medium ${
                                showcaseSubmitStatus === "submitted"
                                  ? isDark
                                    ? "bg-[#d8a84f]/20 text-[#f7dd9a]"
                                    : "bg-[#fff8e8] text-[#735223]"
                                  : isDark
                                    ? "bg-white/10 text-white/70"
                                    : "bg-[#f4f0e8] text-[#777064]"
                              }`}>
                                {showcaseSubmitStatus === "submitted"
                                  ? "Submitted to PhotoViewPro Showcase. In this prototype it appears immediately on the Showcase page."
                                  : showcaseSubmitStatus === "removed"
                                    ? "Removed from PhotoViewPro Showcase. It will no longer appear on the public Showcase page."
                                    : "This photo is already in Showcase."}
                              </p>
                            )}
                            <input
                              aria-label="Display caption"
                              className={`h-9 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                              maxLength={240}
                              onChange={(event) => updateCurrentPhotoCaption(event.target.value)}
                              onBlur={(event) => persistPhotoCaption(activeGallery.id, activePhoto.id, event.target.value)}
                              placeholder="Add a display caption"
                              value={activePhoto.caption ?? ""}
                            />
                            <p className={`text-xs leading-5 ${mutedTextClass}`}>
                              Captions appear only when this portfolio&apos;s photo display text is set to Caption. If a caption is blank, no caption text is shown for that image.
                            </p>
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
                            {renderConfiguredSocialButtons(
                              `${publicGalleryUrl}?photo=${encodeURIComponent(activePhoto.id)}`,
                              activePhoto.caption || activePhoto.title,
                              "photo",
                            )}
                          </div>
                        )}
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
                  )}
                </div>
              </section>
            ) : (
              <section className="space-y-5">
                {settingsTab === "setup" && (
                  <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                    <div className="flex flex-col gap-3 border-b border-current/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Subscriber setup</h2>
                        <p className={`mt-1 text-sm leading-6 ${mutedTextClass}`}>
                          Add the social accounts you use to promote your work. These accounts become the social buttons in Sharing, so you can select a portfolio link and send it to the right platform from one place.
                        </p>
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
                          Save setup
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-md border border-[#e5ded2] p-3">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <User className="size-4 text-[#99702d]" />
                          Social media accounts
                        </div>
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          Paste the public URL for each account you want PhotoViewPro to use. Leave a platform blank to hide it. After you save, enabled platforms appear as buttons in Sharing when you choose a portfolio link, and in Gallery access shortcuts for the active portfolio.
                        </p>
                        <div className="mt-3 grid gap-3">
                          {socialAccountFields.map((platform) => (
                            <label className="grid gap-1 text-xs font-medium" key={platform.key}>
                              {platform.label}
                              <input
                                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                                onChange={(event) =>
                                  setSiteSettings((current) => ({
                                    ...current,
                                    socialAccounts: {
                                      ...current.socialAccounts,
                                      [platform.key]: event.target.value,
                                    },
                                  }))
                                }
                                placeholder={platform.placeholder}
                                type="url"
                                value={siteSettings.socialAccounts[platform.key]}
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-md border border-[#e5ded2] p-3">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <Share2 className="size-4 text-[#99702d]" />
                          How these buttons work
                        </div>
                        <div className={`mt-3 grid gap-3 text-sm leading-6 ${mutedTextClass}`}>
                          <p>
                            In the Sharing tab, first choose the link target: all portfolios or one specific portfolio. The social buttons you enable here will appear under that generated link.
                          </p>
                          <p>
                            Facebook, LinkedIn, Pinterest, and X open their web share composer with the selected link. Instagram, TikTok, and YouTube do not offer reliable public web-share posting, so PhotoViewPro copies the link and opens your configured account page.
                          </p>
                          <p>
                            This setup is for subscriber-owned accounts. Visitor-facing social buttons are still controlled separately by Visitor chrome and public sharing settings.
                          </p>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {socialAccountFields.map((platform) => {
                            const isConnected = Boolean(siteSettings.socialAccounts[platform.key].trim())

                            return (
                              <div className="flex items-center justify-between rounded-md border border-[#e5ded2] px-3 py-2 text-sm" key={platform.key}>
                                <span className="flex items-center gap-2">
                                  <span className="flex size-7 items-center justify-center rounded-full bg-[#fff8e8] text-[#735223]">
                                    <SocialIcon platform={platform.key} />
                                  </span>
                                  {platform.label}
                                </span>
                                <span className={`text-xs ${isConnected ? "text-[#466026]" : mutedTextClass}`}>
                                  {isConnected ? "Connected" : "Hidden"}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="rounded-md border border-[#e5ded2] p-3 xl:col-span-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-3 text-sm font-semibold">
                              <Upload className="size-4 text-[#99702d]" />
                              Lightroom publishing
                            </div>
                            <p className={`mt-2 max-w-3xl text-xs leading-5 ${mutedTextClass}`}>
                              Use the Imports tab to enable the Lightroom Classic plugin, copy the API URL and API key, and follow the installation steps. Once configured, Lightroom can export selected photos directly into a PhotoViewPro portfolio without uploading them manually.
                            </p>
                          </div>
                          <button
                            className="h-9 rounded-md border border-[#d7d0c4] px-3 text-sm font-medium"
                            onClick={() => setSettingsTab("imports")}
                            type="button"
                          >
                            Configure imports
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === "account" && (
                  <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                    <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">My Account</h2>
                        <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                          See the subscriber plan, storage, bandwidth, and next billing date for this PhotoViewPro workspace. Billing changes open securely in Stripe.
                        </p>
                      </div>
                      <Link
                        className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7d0c4] bg-white px-3 text-sm font-semibold text-[#1e211d]"
                        href="/account"
                      >
                        <User className="size-4" />
                        Open full account
                      </Link>
                    </div>

                    {accountSummaryStatus === "loading" && (
                      <div className="mt-4 grid gap-4 md:grid-cols-4">
                        {["Plan", "Status", "Billing", "Next billing"].map((label) => (
                          <div className="min-h-28 rounded-md border border-[#e5ded2] p-3" key={label}>
                            <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>{label}</p>
                            <div className="mt-5 h-6 w-24 rounded bg-black/10" />
                            <div className="mt-3 h-3 w-32 rounded bg-black/10" />
                          </div>
                        ))}
                      </div>
                    )}

                    {accountSummaryStatus === "error" && (
                      <div className="mt-4 rounded-md border border-[#e5ded2] bg-[#fff8e8] p-4">
                        <p className="font-semibold text-[#735223]">Account details need a refresh.</p>
                        <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>
                          Open the full account page to check the subscriber record, billing status, and Stripe connection.
                        </p>
                        <Link
                          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white"
                          href="/account"
                        >
                          Open My Account
                        </Link>
                      </div>
                    )}

                    {accountSummary && (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="rounded-md border border-[#e5ded2] p-3">
                            <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Current plan</p>
                            <p className="mt-3 text-2xl font-semibold">{accountSummary.planName}</p>
                            <p className={`mt-1 text-xs ${mutedTextClass}`}>
                              {accountSummary.billingCycle === "ANNUAL" ? "Annual billing" : "Monthly billing"}
                            </p>
                          </div>
                          <div className="rounded-md border border-[#e5ded2] p-3">
                            <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Status</p>
                            <p className="mt-3 text-2xl font-semibold">
                              {formatAccountStatus(accountSummary.status, accountSummary.cancelAtPeriodEnd)}
                            </p>
                            <p className={`mt-1 text-xs ${mutedTextClass}`}>{accountSummary.workspaceName}</p>
                          </div>
                          <div className="rounded-md border border-[#e5ded2] p-3">
                            <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Storage</p>
                            <p className="mt-3 text-2xl font-semibold">{formatBytes(accountSummary.storageLimitBytes)}</p>
                            <p className={`mt-1 text-xs ${mutedTextClass}`}>Plan allowance</p>
                          </div>
                          <div className="rounded-md border border-[#e5ded2] p-3">
                            <p className={`text-xs uppercase tracking-[0.18em] ${mutedTextClass}`}>Next billing date</p>
                            <p className="mt-3 text-2xl font-semibold">
                              {formatAccountDate(accountSummary.currentPeriodEnd ?? accountSummary.trialEndsAt)}
                            </p>
                            <p className={`mt-1 text-xs ${mutedTextClass}`}>
                              {accountSummary.trialEndsAt ? `Trial ends ${formatAccountDate(accountSummary.trialEndsAt)}` : "Stripe managed"}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <AccountUsageMeter
                            label="Storage usage"
                            limit={accountSummary.storageLimitBytes}
                            mutedTextClass={mutedTextClass}
                            percent={accountSummary.storagePercent}
                            used={accountSummary.storageUsedBytes}
                          />
                          <AccountUsageMeter
                            label="Monthly bandwidth"
                            limit={accountSummary.bandwidthLimitBytes}
                            mutedTextClass={mutedTextClass}
                            percent={accountSummary.bandwidthPercent}
                            used={accountSummary.bandwidthUsedBytes}
                          />
                        </div>

                        <div className="rounded-md border border-[#e5ded2] p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">Billing controls</p>
                              <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                                These buttons open the secure Stripe customer portal. From there, subscribers can upgrade or downgrade, change the credit card, cancel, or view invoices.
                              </p>
                            </div>
                            {!accountSummary.stripeCustomerId && (
                              <span className="rounded-full bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#735223]">
                                Stripe setup needed
                              </span>
                            )}
                          </div>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <AccountPortalButton icon={<Sparkles className="size-4" />} primary>
                              Upgrade or downgrade
                            </AccountPortalButton>
                            <AccountPortalButton icon={<CreditCard className="size-4" />}>
                              Change card
                            </AccountPortalButton>
                            <AccountPortalButton icon={<ReceiptText className="size-4" />}>
                              View invoices
                            </AccountPortalButton>
                            <AccountPortalButton icon={<X className="size-4" />}>
                              Cancel subscription
                            </AccountPortalButton>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#e5ded2] p-3">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="flex items-center gap-2 text-sm font-semibold">
                                <Gift className="size-4 text-[#99702d]" />
                                Your referral link
                              </p>
                              <p className={`mt-1 max-w-3xl text-xs leading-5 ${mutedTextClass}`}>
                                Share PhotoViewPro with another photographer. After their trial converts to a paid account, this account automatically earns added capacity.
                              </p>
                            </div>
                            <span className="w-fit rounded-full bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#735223]">
                              {accountSummary.referral.convertedCount} converted
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                            <input
                              className={`h-10 min-w-0 rounded-md border px-3 text-sm outline-none ${fieldClass}`}
                              readOnly
                              value={accountSummary.referral.referralUrl}
                            />
                            <button
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white"
                              onClick={() => navigator.clipboard.writeText(accountSummary.referral.referralUrl)}
                              type="button"
                            >
                              <Copy className="size-4" />
                              Copy link
                            </button>
                          </div>
                          <div className={`mt-3 grid gap-2 text-xs leading-5 ${mutedTextClass} sm:grid-cols-3`}>
                            <p><span className="font-semibold text-current">Pending:</span> {accountSummary.referral.pendingCount}</p>
                            <p><span className="font-semibold text-current">Capacity earned:</span> {formatBytes(accountSummary.referral.earnedStorageBytes)}</p>
                            <p><span className="font-semibold text-current">Month equivalent:</span> {accountSummary.referral.earnedMonths}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {settingsTab === "design" && (
                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
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

                  <div className={`mt-4 rounded-md border p-4 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#e5ded2] bg-[#fbfaf7]"}`}>
                    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="flex items-start gap-3">
                        <ImagePlus className="mt-0.5 size-4 shrink-0 text-[#99702d]" />
                        <div>
                          <h3 className="text-sm font-semibold">Home page cover</h3>
                          <p className={`mt-2 max-w-sm text-xs leading-5 ${mutedTextClass}`}>
                            Controls the first impression on the public home page. Rotating uses the cover chosen inside each portfolio. Static keeps one selected home page image in place. Dimming improves text contrast without changing the original upload.
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(260px,1fr)_240px] lg:items-start">
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

                        <div className="min-w-0">
                          {siteSettings.homeCoverMode === "static" ? (
                            <div>
                              <p className={`mb-2 text-xs leading-5 ${mutedTextClass}`}>Choose the single image visitors see on the home page.</p>
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {homeCoverOptions.slice(0, 10).map((cover, index) => (
                                  <button
                                    aria-label={`Use home page image ${index + 1}`}
                                    className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border ${
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
                                    <Image alt={`Home page image option ${index + 1}`} className="object-cover" fill sizes="96px" src={cover} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className={`rounded-md border px-3 py-2 text-xs leading-5 ${isDark ? "border-white/10 bg-black/15" : "border-[#e5ded2] bg-white"} ${mutedTextClass}`}>
                              Rotates through portfolio cover images every 2 seconds. Use this when the home page should feel like a live showcase of the subscriber&apos;s work.
                            </p>
                          )}
                        </div>

                        <div className={`grid gap-2 rounded-md border p-3 ${isDark ? "border-white/10 bg-black/15" : "border-[#e5ded2] bg-white"}`}>
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
                          <p className={`text-[11px] leading-4 ${mutedTextClass}`}>Adds a soft overlay only on the public home page so text stays readable.</p>
                          {siteSettings.homeCoverDimEnabled && (
                            <div className="flex h-9 items-center gap-3">
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
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          Templates are starting points for how portfolios feel: cinematic, editorial, compact, event-focused, and more. Hover previews the layout on the right; clicking applies the preset and updates the controls below.
                        </p>
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
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          Choose where these design changes are intended to apply. In this prototype the settings are site-level, but the scope prepares the dashboard for per-homepage or per-gallery customization later.
                        </p>
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
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          The background controls the public viewing canvas. Black feels cinematic, white feels editorial, and the accent color is used for selected states, highlights, and calls to action.
                        </p>
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
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          Density changes how many portfolio covers fit on screen. Width controls whether the grid feels full-bleed or contained. Corners tune the visual style without changing the images.
                        </p>
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
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          These switches show or hide product-page sections. Turn off sections that do not matter for the current site so the page stays focused and easy to scan.
                        </p>
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
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          These are global visitor permissions. Downloads and copy links affect public controls; HDR prefers higher-quality display assets when available, with longer load times.
                        </p>
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
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        Chrome means the extra interface around the photos: menus, breadcrumbs, labels, and image counts. Fewer controls creates a cleaner showcase; more controls improves navigation.
                      </p>
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
                )}
  
              {settingsTab === "imports" && (
              <div className="space-y-5">
                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Lightroom Classic publishing</h2>
                      <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                        Connect Lightroom Classic to PhotoViewPro so selected images can be exported directly into a portfolio. This uses the local plugin folder in this project and the import endpoint below.
                      </p>
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
                        Save imports
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(340px,0.95fr)_minmax(420px,1.05fr)]">
                    <div className="space-y-3">
                      <label className="flex items-start justify-between gap-4 rounded-md border border-[#e5ded2] p-3 text-sm">
                        <span>
                          <span className="font-semibold">Enable Lightroom imports</span>
                          <span className={`mt-1 block text-xs leading-5 ${mutedTextClass}`}>
                            Shows this workflow as active for the subscriber. The API key still needs to match the server-side import key until per-subscriber keys are wired to the database.
                          </span>
                        </span>
                        <input
                          checked={siteSettings.lightroomImport.enabled}
                          className="mt-1 size-4 accent-[#d8a84f]"
                          onChange={(event) => updateLightroomImport({ enabled: event.target.checked })}
                          type="checkbox"
                        />
                      </label>

                      <label className="grid gap-2 text-sm font-medium">
                        API URL to paste into Lightroom
                        <div className="flex gap-2">
                          <input
                            className={`h-10 min-w-0 flex-1 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateLightroomImport({ apiBaseUrl: event.target.value })}
                            placeholder={siteOrigin || "https://your-domain.com"}
                            type="url"
                            value={siteSettings.lightroomImport.apiBaseUrl}
                          />
                          <button
                            className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] px-3 text-sm font-medium"
                            onClick={() => navigator.clipboard?.writeText(lightroomApiBaseUrl)}
                            type="button"
                          >
                            <Copy className="size-4" />
                            Copy
                          </button>
                        </div>
                        <span className={`text-xs font-normal ${mutedTextClass}`}>
                          Use the base site URL, not the full endpoint. The plugin automatically adds `/api/lightroom/import`.
                        </span>
                      </label>

                      <label className="grid gap-2 text-sm font-medium">
                        Lightroom API key
                        <div className="flex gap-2">
                          <input
                            className={`h-10 min-w-0 flex-1 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateLightroomImport({ apiKey: event.target.value })}
                            placeholder="pvp_lr_..."
                            type="password"
                            value={siteSettings.lightroomImport.apiKey}
                          />
                          <button
                            className="h-10 rounded-md border border-[#d7d0c4] px-3 text-sm font-medium"
                            onClick={generateLightroomApiKey}
                            type="button"
                          >
                            Generate
                          </button>
                          <button
                            className="flex h-10 items-center gap-2 rounded-md border border-[#d7d0c4] px-3 text-sm font-medium"
                            onClick={() => navigator.clipboard?.writeText(siteSettings.lightroomImport.apiKey)}
                            type="button"
                          >
                            <Copy className="size-4" />
                            Copy
                          </button>
                        </div>
                        <span className={`text-xs font-normal ${mutedTextClass}`}>
                          For this prototype, this value must match `PHOTOVIEWPRO_IMPORT_API_KEY` in the deployed app environment. Later this becomes an automatic subscriber-specific key.
                        </span>
                      </label>

                      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-1 min-[1700px]:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium">
                          Default gallery name
                          <input
                            className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateLightroomImport({ defaultGalleryName: event.target.value })}
                            placeholder="Lightroom Portfolio"
                            value={siteSettings.lightroomImport.defaultGalleryName}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                          Default client
                          <input
                            className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateLightroomImport({ defaultClientName: event.target.value })}
                            placeholder="Optional"
                            value={siteSettings.lightroomImport.defaultClientName}
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-3 rounded-md border border-[#e5ded2] p-3 text-sm">
                        <input
                          checked={siteSettings.lightroomImport.makePublicDefault}
                          className="size-4 accent-[#d8a84f]"
                          onChange={(event) => updateLightroomImport({ makePublicDefault: event.target.checked })}
                          type="checkbox"
                        />
                        Make Lightroom-created galleries public by default
                      </label>
                    </div>

                    <div className="min-w-0 rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Code2 className="size-4 text-[#99702d]" />
                            Lightroom instructions
                          </div>
                          <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                            Give subscribers these exact steps when they want to publish from Lightroom Classic.
                          </p>
                        </div>
                        <button
                          className="flex h-9 items-center gap-2 rounded-md border border-[#d7d0c4] px-3 text-sm font-medium"
                          onClick={() => navigator.clipboard?.writeText(lightroomImportEndpoint)}
                          type="button"
                        >
                          <Copy className="size-4" />
                          Endpoint
                        </button>
                      </div>

                      <ol className={`mt-4 grid gap-3 text-sm leading-6 ${mutedTextClass}`}>
                        <li className="rounded-md bg-current/5 p-3">
                          <span className="font-semibold text-current">1. Install the plugin.</span> In Lightroom Classic, open <code>File &gt; Plug-in Manager</code>, click <code>Add</code>, and choose the <code>lightroom/PhotoViewPro.lrplugin</code> folder from this project.
                        </li>
                        <li className="rounded-md bg-current/5 p-3">
                          <span className="font-semibold text-current">2. Select photos.</span> Choose the edited photos or collection you want to publish, then open <code>File &gt; Export</code>.
                        </li>
                        <li className="rounded-md bg-current/5 p-3">
                          <span className="font-semibold text-current">3. Choose PhotoViewPro.</span> Set <code>Export To</code> to <code>PhotoViewPro</code>, then paste the API URL and API key from this panel.
                        </li>
                        <li className="rounded-md bg-current/5 p-3">
                          <span className="font-semibold text-current">4. Name the portfolio.</span> Enter the gallery name and optional client name. Lightroom will render the selected photos and send them to PhotoViewPro.
                        </li>
                      </ol>

                      <div className="mt-4 rounded-md border border-[#d8a84f]/40 bg-[#fff8e8] p-3 text-xs leading-5 text-[#735223]">
                        Current endpoint: <span className="font-mono">{lightroomImportEndpoint}</span>. This first version uploads rendered Lightroom exports to configured photo storage; database attachment, storage metering, and subscriber-specific tokens are the next backend step.
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Import from phone</h2>
                      <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                        Create a new portfolio directly from a mobile photo library. Choose a batch from the phone, review thumbnails 50 at a time, import only the selected images, then choose the cover, hide weak images, caption, and order the portfolio.
                      </p>
                    </div>
                    <div className={`rounded-md border px-3 py-2 text-xs leading-5 ${isDark ? "border-white/15 bg-white/5 text-white/70" : "border-[#ead29b] bg-[#fff8e8] text-[#735223]"}`}>
                      Phone privacy note: PhotoViewPro can only show thumbnails after the user chooses files from the device picker.
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium">
                          Portfolio name
                          <input
                            className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => setMobileImportName(event.target.value)}
                            placeholder="Costa Rica highlights"
                            value={mobileImportName}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                          Client
                          <input
                            className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => setMobileImportClient(event.target.value)}
                            placeholder="Optional"
                            value={mobileImportClient}
                          />
                        </label>
                      </div>

                      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#cfc6b8] px-4 py-5 text-center">
                        <Smartphone className="size-6 text-[#99702d]" />
                        <span className="text-sm font-semibold">Choose photos from mobile device</span>
                        <span className={`max-w-md text-xs leading-5 ${mutedTextClass}`}>
                          Select as many as you want from the phone library. The review grid loads them in pages of 50 so large selections stay manageable.
                        </span>
                        <input
                          accept="image/*"
                          className="sr-only"
                          multiple
                          onChange={(event) => {
                            handleMobileImportFiles(event.target.files)
                            event.currentTarget.value = ""
                          }}
                          type="file"
                        />
                      </label>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-medium ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          disabled={mobileImportPreviews.length === 0 || mobileImportStatus === "uploading"}
                          onClick={() => setMobileImportPreviews((current) => current.map((preview) => ({ ...preview, selected: true })))}
                          type="button"
                        >
                          Select all
                        </button>
                        <button
                          className={`h-9 rounded-md border px-3 text-sm font-medium ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          disabled={mobileImportPreviews.length === 0 || mobileImportStatus === "uploading"}
                          onClick={() => setMobileImportPreviews((current) => current.map((preview) => ({ ...preview, selected: false })))}
                          type="button"
                        >
                          Clear all
                        </button>
                        <button
                          className="h-9 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                          disabled={!mobileImportName.trim() || mobileImportSelectedCount === 0 || mobileImportStatus === "uploading"}
                          onClick={() => void startMobileImport()}
                          type="button"
                        >
                          {mobileImportStatus === "uploading" ? "Importing..." : "Create portfolio"}
                        </button>
                      </div>

                      <p className={`text-xs leading-5 ${mutedTextClass}`}>
                        Selected: {mobileImportSelectedCount.toLocaleString()} of {mobileImportPreviews.length.toLocaleString()} photos. After import, hidden photos remain stored but will not display or share.
                      </p>
                      {mobileImportStatus === "uploading" && (
                        <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/15 bg-white/5" : "border-[#e5ded2] bg-[#fbfaf7]"}`}>
                          Uploaded {mobileImportProgress.completed.toLocaleString()} of {mobileImportProgress.total.toLocaleString()}
                          {mobileImportProgress.failed > 0 ? `, ${mobileImportProgress.failed.toLocaleString()} failed` : ""}.
                        </div>
                      )}
                      {mobileImportStatus === "done" && (
                        <p className="rounded-md border border-[#d6e8b8] bg-[#f1f7e8] p-3 text-xs font-medium leading-5 text-[#466026]">
                          Phone portfolio created. Choose the cover, hide any images you do not want public, and drag the tiles into the presentation order you want.
                        </p>
                      )}
                      {mobileImportStatus === "error" && (
                        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium leading-5 text-red-700">
                          Phone import could not finish. Make sure you are logged in, storage is configured, and the selected files are under your upload limit.
                        </p>
                      )}
                    </div>

                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">Mobile review thumbnails</p>
                          <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                            Page {Math.min(mobileImportPage + 1, mobileImportPageCount)} of {mobileImportPageCount}, 50 thumbnails per page.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className={`h-8 rounded-md border px-3 text-xs font-medium ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                            disabled={mobileImportPage === 0}
                            onClick={() => setMobileImportPage((current) => Math.max(0, current - 1))}
                            type="button"
                          >
                            Previous
                          </button>
                          <button
                            className={`h-8 rounded-md border px-3 text-xs font-medium ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                            disabled={mobileImportPage >= mobileImportPageCount - 1}
                            onClick={() => setMobileImportPage((current) => Math.min(mobileImportPageCount - 1, current + 1))}
                            type="button"
                          >
                            Next
                          </button>
                        </div>
                      </div>

                      {mobileImportVisiblePreviews.length > 0 ? (
                        <div className="mt-3 grid max-h-[31rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                          {mobileImportVisiblePreviews.map((preview) => (
                            <button
                              className={`group overflow-hidden rounded-md border text-left ${
                                preview.selected
                                  ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/35"
                                  : isDark
                                    ? "border-white/10 opacity-55"
                                    : "border-[#ded8cc] opacity-55"
                              }`}
                              key={preview.id}
                              onClick={() => toggleMobileImportSelection(preview.id)}
                              type="button"
                            >
                              <span className="relative block aspect-square bg-black/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  alt={preview.file.name}
                                  className="h-full w-full object-cover"
                                  src={preview.url}
                                />
                                <span className={`absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                                  preview.selected ? "bg-[#d8a84f] text-[#171814]" : "bg-black/50 text-white"
                                }`}>
                                  {preview.selected ? "On" : ""}
                                </span>
                              </span>
                              <span className={`block truncate px-2 py-1.5 text-[11px] ${mutedTextClass}`}>
                                {preview.file.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={`mt-3 flex min-h-56 items-center justify-center rounded-md border border-dashed text-center text-sm ${isDark ? "border-white/15 text-white/50" : "border-[#ded8cc] text-[#777064]"}`}>
                          Choose photos from a phone or tablet to review thumbnails here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Desktop folder uploader</h2>
                      <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                        Use this for photo apps that can export finished files but do not have a native PhotoViewPro plugin yet. Point Capture One, Photoshop, Photo Mechanic, DxO, ON1, Luminar, Affinity, Pixelmator, RawTherapee, or darktable at one export folder, then let PhotoViewPro watch it.
                      </p>
                    </div>
                    <button
                      className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                      onClick={saveSiteSettings}
                      type="button"
                    >
                      <Settings2 className="size-4" />
                      Save uploader
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-3">
                      <label className="flex items-start justify-between gap-4 rounded-md border border-[#e5ded2] p-3 text-sm">
                        <span>
                          <span className="font-semibold">Enable desktop folder imports</span>
                          <span className={`mt-1 block text-xs leading-5 ${mutedTextClass}`}>
                            Shows the folder-watch workflow as available for this subscriber. It uses the same API URL and API key as the Lightroom importer.
                          </span>
                        </span>
                        <input
                          checked={siteSettings.desktopUploader.enabled}
                          className="mt-1 size-4 accent-[#d8a84f]"
                          onChange={(event) => updateDesktopUploader({ enabled: event.target.checked })}
                          type="checkbox"
                        />
                      </label>

                      <label className="grid gap-2 text-sm font-medium">
                        Watch folder
                        <input
                          className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                          onChange={(event) => updateDesktopUploader({ watchFolder: event.target.value })}
                          placeholder="~/Pictures/PhotoViewPro-Exports"
                          value={siteSettings.desktopUploader.watchFolder}
                        />
                        <span className={`text-xs font-normal ${mutedTextClass}`}>
                          Export finished images from other photo apps into this folder. PhotoViewPro skips files it has already uploaded.
                        </span>
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium">
                          Gallery name
                          <input
                            className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateDesktopUploader({ galleryName: event.target.value })}
                            placeholder="Desktop Uploads"
                            value={siteSettings.desktopUploader.galleryName}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                          Client
                          <input
                            className={`h-10 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
                            onChange={(event) => updateDesktopUploader({ clientName: event.target.value })}
                            placeholder="Optional"
                            value={siteSettings.desktopUploader.clientName}
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-3 rounded-md border border-[#e5ded2] p-3 text-sm">
                        <input
                          checked={siteSettings.desktopUploader.recursive}
                          className="size-4 accent-[#d8a84f]"
                          onChange={(event) => updateDesktopUploader({ recursive: event.target.checked })}
                          type="checkbox"
                        />
                        Include nested folders inside the watch folder
                      </label>
                    </div>

                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Folder className="size-4 text-[#99702d]" />
                            Run command
                          </div>
                          <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                            Run this command on the computer where your photo app exports files. Leave it running while you export finished images.
                          </p>
                        </div>
                        <button
                          className="flex h-9 items-center gap-2 rounded-md border border-[#d7d0c4] px-3 text-sm font-medium"
                          onClick={() => navigator.clipboard?.writeText(desktopUploaderCommand)}
                          type="button"
                        >
                          <Copy className="size-4" />
                          Copy
                        </button>
                      </div>

                      <pre className="mt-4 overflow-x-auto rounded-md bg-black p-3 text-xs leading-5 text-white">
                        <code>{desktopUploaderCommand}</code>
                      </pre>

                      <div className={`mt-4 grid gap-3 text-sm leading-6 ${mutedTextClass}`}>
                        <p>
                          Capture One: create a process recipe that exports JPEG or TIFF files to the watch folder.
                        </p>
                        <p>
                          Photoshop or Affinity: export final images into the watch folder manually, or use a batch/action workflow.
                        </p>
                        <p>
                          Photo Mechanic, DxO, ON1, Luminar, Pixelmator, RawTherapee, and darktable: set the output/export destination to the watch folder.
                        </p>
                      </div>

                      <div className="mt-4 rounded-md border border-[#d8a84f]/40 bg-[#fff8e8] p-3 text-xs leading-5 text-[#735223]">
                        This uploader supports JPEG, PNG, WebP, HEIC, HEIF, and TIFF. It is the bridge workflow until each platform gets a native plugin.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
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
                      Paste a public SmugMug folder or gallery URL. The importer discovers gallery covers and visible public images, skips duplicates it has already seen, and adds each discovered gallery as a portfolio you can edit.
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

                  <BlobUpload galleryId={activeGallery.id} onUploaded={handleGalleryPhotoUploaded} />
                </div>
              </div>
              )}

              {(settingsTab === "sharing" || settingsTab === "gallery") && (
              <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                <h2 className="text-lg font-semibold">{settingsTab === "sharing" ? "Sharing and previews" : "Gallery controls"}</h2>
                <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>
                  {settingsTab === "sharing"
                    ? "Create links for the full portfolio or individual portfolios, prepare embeds for an existing website, and tune how links appear when shared."
                    : "Set who can see this portfolio, what they can do with it, which image represents it, and how protected public images should appear."}
                </p>
                <div className="mt-4 grid gap-3">
                  {settingsTab === "gallery" && (
                  <>
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
                      <p className={`text-xs leading-5 font-normal ${mutedTextClass}`}>
                        Private link keeps the portfolio unlisted but shareable by URL. Password adds a simple gate. Client portal is a placeholder for future subscriber/client access. Public makes the portfolio discoverable from the public grid.
                      </p>
                    </label>

                  <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                    <span className="flex items-center gap-3">
                      <Globe2 className="size-4 text-[#99702d]" />
                      Public portfolio grid visibility
                    </span>
                      <span className="flex items-start justify-between gap-4 rounded-md bg-current/5 p-3">
                        <span className={`text-xs leading-5 font-normal ${mutedTextClass}`}>
                          Turn this on when this portfolio should appear in the public gallery grid. Turn it off when the portfolio should only be accessible by direct link, password, or future client portal access.
                        </span>
                        <input
                          checked={activeGallery.privacy === "Public"}
                          className="mt-0.5 size-4 accent-[#d8a84f]"
                          onChange={(event) =>
                            updateActiveGallery({ privacy: event.target.checked ? "Public" : "Private link" })
                          }
                          type="checkbox"
                        />
                      </span>
                      <p className={`text-xs leading-5 font-normal ${mutedTextClass}`}>
                        Current state: {activeGallery.privacy === "Public" ? "shown in the public grid" : "unlisted from the public grid"}.
                      </p>
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
                      <Share2 className="size-4 text-[#99702d]" />
                      Social access shortcuts
                    </div>
                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                      These shortcuts use the subscriber social accounts from Setup and share the active portfolio link. Use the Sharing tab when you want to switch between all portfolios and a specific portfolio.
                    </p>
                    {configuredSocialAccounts.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {configuredSocialAccounts.map((platform) =>
                          platform.shareStyle === "direct" ? (
                            <a
                              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium ${
                                isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                              }`}
                                href={getDirectSocialShareUrl(platform.key, publicGalleryUrl, activeGallery.name)}
                                key={platform.key}
                                onClick={() => recordShareEvent(platform.key, publicGalleryUrl, activeGallery.id)}
                                rel="noreferrer"
                                target="_blank"
                            >
                              <span className="flex size-5 items-center justify-center rounded-full bg-[#fff8e8] text-[11px] font-bold text-[#735223]">
                                <SocialIcon platform={platform.key} />
                              </span>
                              {platform.label}
                            </a>
                          ) : (
                            <button
                              className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium ${
                                isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                              }`}
                              key={platform.key}
                              onClick={() => {
                                navigator.clipboard?.writeText(`${activeGallery.name}\n${publicGalleryUrl}`)
                                recordShareEvent(platform.key, publicGalleryUrl, activeGallery.id)
                                window.open(siteSettings.socialAccounts[platform.key], "_blank", "noreferrer")
                              }}
                              type="button"
                            >
                              <span className="flex size-5 items-center justify-center rounded-full bg-[#fff8e8] text-[11px] font-bold text-[#735223]">
                                <SocialIcon platform={platform.key} />
                              </span>
                              {platform.label}
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <button
                        className={`mt-3 h-10 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                        }`}
                        onClick={() => setSettingsTab("setup")}
                        type="button"
                      >
                        Add social accounts in Setup
                      </button>
                    )}
                  </div>
                  </>
                  )}

                  {settingsTab === "sharing" && (
                  <>
                  <div className="rounded-md border border-[#e5ded2] p-3">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <Share2 className="size-4 text-[#99702d]" />
                      Share links
                    </div>
                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                      Choose whether to share the full portfolio grid or a specific portfolio. Social buttons from Setup appear here after they are configured, so you can send this selected link to your own connected platforms.
                    </p>
                    <div className="mt-3 grid gap-3">
                      <label className="grid gap-1 text-xs font-medium">
                        Share target
                        <select
                          className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                          onChange={(event) => setShareTargetId(event.target.value)}
                          value={shareTargetId}
                        >
                          <option value="all">All portfolios</option>
                          {galleries.map((gallery) => (
                            <option key={gallery.id} value={gallery.id}>{gallery.name}</option>
                          ))}
                        </select>
                      </label>
                      <div className="flex gap-2">
                        <input
                          aria-label="Generated share link"
                          className={`h-9 min-w-0 flex-1 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                          readOnly
                          value={shareTargetUrl}
                        />
                        <button
                          className={`flex h-9 w-10 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                          onClick={() => {
                            navigator.clipboard?.writeText(shareTargetUrl)
                            recordShareEvent("copy")
                          }}
                          type="button"
                        >
                          <Copy className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className={`mt-3 rounded-md border px-3 py-2 text-xs leading-5 ${
                      isDark ? "border-white/15 bg-white/5 text-white/70" : "border-[#ead29b] bg-[#fff8e8] text-[#735223]"
                    }`}>
                      Please click the social media platform icon below you want to share on, provided you have already set it up in the Setup tab. To add more platforms, click Setup and enter the account URLs you want to share with.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {socialAccountFields.map((platform) => {
                        const isConfigured = Boolean(siteSettings.socialAccounts[platform.key].trim())
                        const iconContent = (
                          <>
                            <span
                              className={`flex size-9 items-center justify-center rounded-full border bg-white transition ${
                                isConfigured ? "border-current shadow-sm" : "border-[#ded8cc] opacity-35 grayscale"
                              }`}
                              style={{ color: platform.brandColor }}
                            >
                              <SocialIcon platform={platform.key} />
                            </span>
                            <span className="sr-only">{isConfigured ? `Share on ${platform.label}` : `${platform.label} not configured`}</span>
                          </>
                        )

                        if (!isConfigured) {
                          return (
                            <span
                              aria-disabled="true"
                              className="inline-flex size-10 items-center justify-center"
                              key={platform.key}
                              title={`${platform.label} is not configured yet`}
                            >
                              {iconContent}
                            </span>
                          )
                        }

                        if (platform.shareStyle === "direct") {
                          return (
                            <a
                              aria-label={`Share on ${platform.label}`}
                              className="inline-flex size-10 items-center justify-center"
                              href={getDirectSocialShareUrl(platform.key)}
                              key={platform.key}
                              onClick={() => recordShareEvent(platform.key)}
                              rel="noreferrer"
                              target="_blank"
                              title={`Share on ${platform.label}`}
                            >
                              {iconContent}
                            </a>
                          )
                        }

                        return (
                          <button
                            aria-label={`Share on ${platform.label}`}
                            className="inline-flex size-10 items-center justify-center"
                            key={platform.key}
                            onClick={() => {
                              navigator.clipboard?.writeText(`${shareTargetTitle}\n${shareTargetUrl}`)
                              recordShareEvent(platform.key)
                              window.open(siteSettings.socialAccounts[platform.key], "_blank", "noreferrer")
                            }}
                            title={`Share on ${platform.label}`}
                            type="button"
                          >
                            {iconContent}
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <a
                        className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                        href={emailInviteUrl}
                        onClick={() => recordShareEvent("email")}
                      >
                        <Mail className="size-4" />
                        Email invite
                      </a>
                      <a
                        className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                        }`}
                        href={qrCodeUrl}
                        onClick={() => recordShareEvent("qr")}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <QrCode className="size-4" />
                        QR code
                      </a>
                      {configuredSocialAccounts.map((platform) => {
                        const buttonClass = `flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium ${
                          isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"
                        }`

                        if (platform.shareStyle === "direct") {
                          return (
                            <a
                              className={buttonClass}
                              href={getDirectSocialShareUrl(platform.key)}
                              key={platform.key}
                              onClick={() => recordShareEvent(platform.key)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <span className="flex size-5 items-center justify-center rounded-full bg-white" style={{ color: platform.brandColor }}>
                                <SocialIcon platform={platform.key} />
                              </span>
                              {platform.label}
                            </a>
                          )
                        }

                        return (
                          <button
                            className={buttonClass}
                            key={platform.key}
                            onClick={() => {
                              navigator.clipboard?.writeText(`${shareTargetTitle}\n${shareTargetUrl}`)
                              recordShareEvent(platform.key)
                              window.open(siteSettings.socialAccounts[platform.key], "_blank", "noreferrer")
                            }}
                            type="button"
                          >
                            <span className="flex size-5 items-center justify-center rounded-full bg-white" style={{ color: platform.brandColor }}>
                              <SocialIcon platform={platform.key} />
                            </span>
                            {platform.label}
                          </button>
                        )
                      })}
                    </div>
                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                      Only platforms configured in Setup appear here. Instagram, TikTok, and YouTube copy the selected link, then open your configured account page because they do not offer reliable public web-share posting.
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
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        Copy this block into an existing website builder, WordPress page, custom HTML block, or landing page. Choose All portfolios above to embed the full grid, or choose one portfolio to embed only that portfolio viewer.
                      </p>
                    {(activeGallery.embedEnabled ?? true) && (
                      <div className="mt-3 grid gap-2">
                        <div className={`rounded-md border px-3 py-2 text-xs leading-5 ${isDark ? "border-white/15 bg-white/5 text-white/70" : "border-[#e5ded2] bg-[#fbfaf7] text-[#777064]"}`}>
                          The embedded gallery stays hosted by PhotoViewPro. When you update covers, hide photos, reorder images, or change the selected portfolio, visitors see the updated presentation without replacing the code on the outside website.
                        </div>
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
                    <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                      These fields control how the active portfolio page appears when its link is shared on social platforms, messaging apps, or indexed by search engines.
                    </p>
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
                      <div className={`rounded-md border p-3 ${isDark ? "border-white/15 bg-white/5" : "border-[#e5ded2] bg-[#fbfaf7]"}`}>
                        <p className={`text-[11px] uppercase tracking-[0.16em] ${mutedTextClass}`}>Preview card</p>
                        <p className="mt-2 text-sm font-semibold">{activeGallery.seoTitle || activeGallery.name}</p>
                        <p className={`mt-1 line-clamp-2 text-xs leading-5 ${mutedTextClass}`}>
                          {activeGallery.seoDescription || activeGallery.description}
                        </p>
                        <p className={`mt-2 truncate text-xs ${mutedTextClass}`}>{publicGalleryUrl}</p>
                      </div>
                    </div>
                  </div>
                  </>
                  )}

                  {settingsTab === "gallery" && (
                  <>
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
                    <p className={`-mt-1 rounded-md border border-[#e5ded2] px-3 py-2 text-xs leading-5 ${mutedTextClass}`}>
                      Downloads controls whether visitors see download actions for this portfolio. It does not remove stored originals or prevent the subscriber from downloading their own files.
                    </p>

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
                    <p className={`-mt-1 rounded-md border border-[#e5ded2] px-3 py-2 text-xs leading-5 ${mutedTextClass}`}>
                      Favorites lets visitors mark images they like. Use this as a lightweight way to see which photos resonate without turning the portfolio into a client-proofing workflow.
                    </p>

                    <label className="grid gap-2 rounded-md border border-[#e5ded2] p-3 text-sm font-medium">
                      <span className="flex items-center gap-3">
                        {(activeGallery.photoLabelMode ?? (activeGallery.showFileNames === false ? "none" : "file-name")) === "none" ? (
                          <EyeOff className="size-4 text-[#99702d]" />
                        ) : (
                          <Eye className="size-4 text-[#99702d]" />
                        )}
                        Photo display text
                      </span>
                      <select
                        className={`h-9 rounded-md border px-2 text-sm font-normal outline-none ${fieldClass}`}
                        onChange={(event) => {
                          const photoLabelMode = event.target.value as Gallery["photoLabelMode"]
                          updateActiveGallery({
                            photoLabelMode,
                            showFileNames: photoLabelMode !== "none",
                          })
                        }}
                        value={activeGallery.photoLabelMode ?? (activeGallery.showFileNames === false ? "none" : "file-name")}
                      >
                        <option value="caption">Caption</option>
                        <option value="file-name">File name</option>
                        <option value="none">Nothing</option>
                      </select>
                    </label>
                    <p className={`-mt-1 rounded-md border border-[#e5ded2] px-3 py-2 text-xs leading-5 ${mutedTextClass}`}>
                      Choose exactly what visitors see under the displayed photo for this portfolio. Caption shows only your written caption, File name shows the uploaded file name, and Nothing removes that text row completely.
                    </p>

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
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        Watermarks affect public viewing only. Choose text, uploaded image, or both; then set position, opacity, and size. Originals remain unchanged in storage.
                      </p>

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
                                <SafeImage
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
                    <div className="flex items-center justify-between gap-3 text-sm font-medium">
                      <span className="flex items-center gap-3">
                        <Eye className="size-4 text-[#99702d]" />
                        Photos shown when this portfolio is opened
                      </span>
                      <span className={`text-xs font-normal ${mutedTextClass}`}>
                        {renderablePhotos.length} shown / {portfolioPhotos.length} total
                      </span>
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        These controls affect only the currently selected portfolio. They do not change the public home page carousel and they do not choose the portfolio cover. Use Show to decide which stored photos visitors see after opening this portfolio. To choose the portfolio cover, open the portfolio, select the image on screen, then click Set portfolio cover.
                      </p>
                    {portfolioPhotos.length > 0 ? (
                      <div className="mt-3 grid max-h-[34rem] grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-3">
                        {portfolioPhotos.map((photo) => {
                          const photoCover = getPhotoCover(photo)
                          const isCover = normalizeAssetUrl(photoCover) === normalizeAssetUrl(activeGallery.cover)
                          const isShown = !photo.hidden

                          return (
                            <div
                              className={`overflow-hidden rounded-md border ${
                                isCover ? "border-[#b08336] ring-2 ring-[#ead29b]" : "border-[#ded8cc]"
                              } ${isShown ? "" : "opacity-60"}`}
                              key={photo.id}
                            >
                              <div className="relative aspect-[3/2] w-full bg-black/5">
                                <Image
                                  alt={photo.title}
                                  className="object-contain"
                                  fill
                                  sizes="160px"
                                  src={getThumbnailUrl(photo)}
                                />
                                {isCover && (
                                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#d8a84f] px-2 py-1 text-[10px] font-semibold text-[#171814]">
                                    <Star className="size-3 fill-current" />
                                    Cover
                                  </span>
                                )}
                                {!isShown && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold text-white">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <div className="border-t border-[#ded8cc]">
                                <label className="flex h-9 items-center justify-center gap-1.5 text-xs font-medium">
                                  <input
                                    checked={isShown}
                                    className="size-3.5 accent-[#d8a84f]"
                                    onChange={(event) => togglePortfolioPhotoVisibility(photo.id, event.target.checked)}
                                    type="checkbox"
                                  />
                                  Show
                                </label>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className={`mt-2 text-sm ${mutedTextClass}`}>No photos have been added to this portfolio yet.</p>
                    )}
                  </div>

                  {[
                    [Download, "Downloads", activeGallery.allowDownloads ?? true ? "Enabled" : "Disabled"],
                    [Eye, "Visibility", activeGallery.privacy],
                  ].map(([Icon, label, value]) => (
                    <div className="flex items-center justify-between rounded-md border border-[#e5ded2] p-3" key={label as string}>
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-[#99702d]" />
                        <span className="text-sm font-medium">{label as string}</span>
                      </div>
                      <span className={`text-sm ${mutedTextClass}`}>{value as string}</span>
                    </div>
                  ))}
                  </>
                  )}
                </div>
              </div>
              )}

                {settingsTab === "mobile" && (
                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Mobile companion</h2>
                      <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                        Send a phone-friendly portfolio link to clients, friends, or yourself. The link opens the portfolio experience with mobile viewing in mind, and the recipient can add it to their phone home screen like an app icon.
                      </p>
                    </div>
                    <a
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-medium text-white"
                      href={mobileCompanionEmailUrl}
                    >
                      <Mail className="size-4" />
                      Email mobile link
                    </a>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="grid gap-4">
                      <div className="rounded-md border border-[#e5ded2] p-3">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <Share2 className="size-4 text-[#99702d]" />
                          Mobile companion link
                        </div>
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          This is the URL to send. If you include only selected portfolios below, the link carries that selection. Use it in email, text messages, QR codes, or as a private shortcut for showing work on a phone.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <input
                            aria-label="Mobile companion link"
                            className={`h-10 min-w-0 flex-1 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                            readOnly
                            value={mobileCompanionUrl}
                          />
                          <button
                            className={`flex h-10 w-11 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                            onClick={() => navigator.clipboard?.writeText(mobileCompanionUrl)}
                            type="button"
                          >
                            <Copy className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-md border border-[#e5ded2] p-3">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <Folder className="size-4 text-[#99702d]" />
                          Included portfolios
                        </div>
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          Choose which portfolios appear from this mobile companion link. This does not delete galleries or change the main public site; it only narrows what this specific mobile link is meant to show.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="h-9 rounded-md bg-[#1f2a24] px-3 text-sm font-medium text-white"
                            onClick={() => setMobileIncludedGalleryIds(galleries.map((gallery) => gallery.id))}
                            type="button"
                          >
                            Include all
                          </button>
                          <button
                            className={`h-9 rounded-md border px-3 text-sm font-medium ${isDark ? "border-white/15 bg-white/10" : "border-[#d7d0c4] bg-white"}`}
                            onClick={() => setMobileIncludedGalleryIds([activeGallery.id])}
                            type="button"
                          >
                            Active only
                          </button>
                        </div>
                        <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                          {galleries.map((gallery) => (
                            <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-[#e5ded2] px-3 py-2 text-sm font-medium" key={gallery.id}>
                              <span className="min-w-0 truncate">{gallery.name}</span>
                              <input
                                checked={selectedMobileGalleryIds.includes(gallery.id)}
                                className="size-4 shrink-0 accent-[#d8a84f]"
                                onChange={() => toggleMobileGallery(gallery.id)}
                                type="checkbox"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-md border border-[#e5ded2] p-3">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <ImagePlus className="size-4 text-[#99702d]" />
                          Add to phone home screen
                        </div>
                        <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                          Send the link, then ask the recipient to open it on their phone. On iPhone, use Safari, tap Share, choose Add to Home Screen, then Add. On Android, open in Chrome, tap the menu, then Add to Home screen or Install app.
                        </p>
                        <ol className={`mt-3 grid gap-2 text-xs leading-5 ${mutedTextClass}`}>
                          <li>1. Open the mobile companion link on the phone.</li>
                          <li>2. Add it to the home screen from Safari or Chrome.</li>
                          <li>3. Launch it from the new icon for a cleaner viewing experience.</li>
                        </ol>
                      </div>

                      <div className="rounded-md bg-[#f4f4f5] p-4">
                        <div className="mx-auto h-64 w-36 rounded-[1.8rem] border-4 border-[#1f2a24] bg-[#1f2a24] p-2 shadow-sm">
                          <div className="h-full rounded-[1.25rem] bg-cover bg-center" style={{ backgroundImage: `url(${activeGallery.cover})` }} />
                        </div>
                        <p className="mt-3 text-center text-xs font-medium text-[#5f6368]">
                          {selectedMobileGalleryIds.length} portfolio{selectedMobileGalleryIds.length === 1 ? "" : "s"} included
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {settingsTab === "storage" && (
                <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`}>
                  <div className="flex flex-col gap-3 border-b border-current/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Storage and metering</h2>
                      <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                        This tab explains what the dashboard is measuring now and how subscriber storage can be enforced later. It counts uploaded originals plus generated display and thumbnail files when byte data is available.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#735223]">
                      {formatBytes(storageBytes)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Cloud className="size-4 text-[#99702d]" />
                        Current usage
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        Shows total known bytes across the local portfolio data. Imported public SmugMug images may not always report exact file size until they are copied into managed storage.
                      </p>
                      <div className="mt-4 h-2 rounded-full bg-black/10">
                        <div className="h-full rounded-full bg-[#d8a84f]" style={{ width: `${storagePercent}%` }} />
                      </div>
                      <p className={`mt-2 text-xs ${mutedTextClass}`}>{storagePercent}% of a 75 GB Premier reference bucket</p>
                    </div>
                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <Images className="size-4 text-[#99702d]" />
                        What counts
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        Originals, mobile-optimized display versions, and thumbnails all count because all three use storage. Hidden photos still count because they remain recoverable.
                      </p>
                      <p className="mt-4 text-2xl font-semibold">{storagePhotoCount}</p>
                      <p className={`text-xs ${mutedTextClass}`}>photos tracked</p>
                    </div>
                    <div className="rounded-md border border-[#e5ded2] p-3">
                      <div className="flex items-center gap-3 text-sm font-semibold">
                        <BarChart3 className="size-4 text-[#99702d]" />
                        Subscriber controls
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>
                        The production version should meter storage per subscriber, warn near plan limits, block oversized uploads by plan, and report bandwidth separately from storage.
                      </p>
                    </div>
                  </div>
                </div>
                )}
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
                  placeholder="Norway winter collection"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Optional label
                <input
                  className="h-10 rounded-md border border-[#d7d0c4] px-3 font-normal outline-none focus:border-[#b08336]"
                  name="client"
                  placeholder="Travel, family, fine art, portfolio series"
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
