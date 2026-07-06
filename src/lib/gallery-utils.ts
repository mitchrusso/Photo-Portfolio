import type { MigratedPhoto } from "@/data/migrated-galleries"

export const LOCAL_GALLERY_STORAGE_KEY = "photo-portfolio-galleries-v6"
export const SITE_SETTINGS_STORAGE_KEY = "photo-portfolio-site-settings-v1"

export type SiteCoverMode = "rotate" | "static"
export type SiteAccentColor = "gold" | "emerald" | "blue" | "white"
export type SiteBackgroundStyle = "black" | "soft-black" | "white"
export type SiteDesignScope = "entire-site" | "homepage" | "all-galleries"
export type SiteGalleryDensity = "immersive" | "balanced" | "compact"
export type SiteTemplate =
  | "black-white"
  | "cinematic"
  | "commercial"
  | "editorial"
  | "embedded"
  | "event"
  | "fine-art"
  | "fullscreen"
  | "masonry"
  | "minimal"
  | "portrait"
  | "real-estate"
  | "sidecar"
  | "sports"
  | "travel-journal"
  | "wedding-story"
export type SiteTileShape = "square" | "soft"
export type SiteWidth = "full" | "wide" | "contained"

export type SiteSettings = {
  allowVisitorCopy: boolean
  allowVisitorDownloads: boolean
  designScope: SiteDesignScope
  galleryDensity: SiteGalleryDensity
  homeContentBlocks: {
    comparison: boolean
    lightroomWorkflow: boolean
    mobileShowcase: boolean
    productPreview: boolean
    roadmap: boolean
  }
  homeCoverDimEnabled: boolean
  homeCoverDimPercent: number
  homeCoverImage?: string
  homeCoverMode: SiteCoverMode
  lightroomImport: {
    apiBaseUrl: string
    apiKey: string
    defaultClientName: string
    defaultGalleryName: string
    enabled: boolean
    makePublicDefault: boolean
  }
  desktopUploader: {
    clientName: string
    enabled: boolean
    galleryName: string
    recursive: boolean
    watchFolder: string
  }
  pageWidth: SiteWidth
  preferHdrDisplay: boolean
  publicBackground: SiteBackgroundStyle
  showBreadcrumbs: boolean
  showGalleryImageCounts: boolean
  showGalleryLabels: boolean
  showSiteMenu: boolean
  showSocialLinks: boolean
  socialAccounts: {
    facebook: string
    instagram: string
    linkedin: string
    pinterest: string
    tiktok: string
    x: string
    youtube: string
  }
  siteAccentColor: SiteAccentColor
  siteTemplate: SiteTemplate
  tileShape: SiteTileShape
}

export const defaultSiteSettings: SiteSettings = {
  allowVisitorCopy: false,
  allowVisitorDownloads: false,
  designScope: "entire-site",
  galleryDensity: "immersive",
  homeContentBlocks: {
    comparison: true,
    lightroomWorkflow: true,
    mobileShowcase: true,
    productPreview: true,
    roadmap: true,
  },
  homeCoverDimEnabled: true,
  homeCoverDimPercent: 25,
  homeCoverMode: "rotate",
  lightroomImport: {
    apiBaseUrl: "",
    apiKey: "",
    defaultClientName: "",
    defaultGalleryName: "Lightroom Portfolio",
    enabled: false,
    makePublicDefault: false,
  },
  desktopUploader: {
    clientName: "",
    enabled: false,
    galleryName: "Desktop Uploads",
    recursive: false,
    watchFolder: "$HOME/Pictures/PhotoViewPro-Exports",
  },
  pageWidth: "full",
  preferHdrDisplay: false,
  publicBackground: "black",
  showBreadcrumbs: false,
  showGalleryImageCounts: true,
  showGalleryLabels: true,
  showSiteMenu: true,
  showSocialLinks: true,
  socialAccounts: {
    facebook: "",
    instagram: "",
    linkedin: "",
    pinterest: "",
    tiktok: "",
    x: "",
    youtube: "",
  },
  siteAccentColor: "gold",
  siteTemplate: "cinematic",
  tileShape: "square",
}

export const siteTemplatePresets: Record<SiteTemplate, {
  accent: SiteAccentColor
  description: string
  galleryDensity: SiteGalleryDensity
  label: string
  pageWidth: SiteWidth
  publicBackground: SiteBackgroundStyle
  showBreadcrumbs: boolean
  showGalleryImageCounts: boolean
  showGalleryLabels: boolean
  showSiteMenu: boolean
  tileShape: SiteTileShape
  useCase: string
}> = {
  cinematic: {
    accent: "gold",
    description: "Large dark covers, restrained chrome, and a gallery-first presentation for landscape, travel, and fine art.",
    galleryDensity: "immersive",
    label: "Cinematic dark",
    pageWidth: "full",
    publicBackground: "black",
    showBreadcrumbs: false,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Travel, landscape, fine art",
  },
  editorial: {
    accent: "gold",
    description: "A lighter portfolio layout with cleaner spacing for photographers who want a magazine-like feel.",
    galleryDensity: "balanced",
    label: "Editorial light",
    pageWidth: "wide",
    publicBackground: "white",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Portrait, wedding, brand work",
  },
  minimal: {
    accent: "white",
    description: "Quiet labels, compact navigation, and square covers for portfolios that should feel like a clean index.",
    galleryDensity: "compact",
    label: "Minimal grid",
    pageWidth: "contained",
    publicBackground: "soft-black",
    showBreadcrumbs: false,
    showGalleryImageCounts: false,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Fine art, personal archives",
  },
  sidecar: {
    accent: "blue",
    description: "A left-nav inspired structure for larger portfolios where browsing many galleries matters.",
    galleryDensity: "balanced",
    label: "Sidecar browse",
    pageWidth: "wide",
    publicBackground: "black",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Travel collections, multi-year projects",
  },
  event: {
    accent: "emerald",
    description: "Bold, high-density covers for fast scanning and high-energy work without adding proofing complexity.",
    galleryDensity: "compact",
    label: "Event wall",
    pageWidth: "full",
    publicBackground: "black",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Events, sports, schools",
  },
  "wedding-story": {
    accent: "gold",
    description: "Soft, story-led presentation with romantic spacing and elegant cover cards for wedding portfolios.",
    galleryDensity: "balanced",
    label: "Wedding story",
    pageWidth: "wide",
    publicBackground: "white",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Weddings, couples, engagements",
  },
  portrait: {
    accent: "gold",
    description: "Portrait-forward covers with taller cards and quiet labels for studio and personal branding sessions.",
    galleryDensity: "balanced",
    label: "Portrait studio",
    pageWidth: "contained",
    publicBackground: "soft-black",
    showBreadcrumbs: false,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Portraits, headshots, sessions",
  },
  commercial: {
    accent: "blue",
    description: "Polished project tiles for product, architecture, corporate, and brand photography portfolios.",
    galleryDensity: "balanced",
    label: "Commercial brand",
    pageWidth: "wide",
    publicBackground: "white",
    showBreadcrumbs: true,
    showGalleryImageCounts: false,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Commercial, brand, product",
  },
  "fine-art": {
    accent: "white",
    description: "Museum-like spacing, minimal labels, and a restrained black viewing environment for art series.",
    galleryDensity: "immersive",
    label: "Fine art collector",
    pageWidth: "contained",
    publicBackground: "black",
    showBreadcrumbs: false,
    showGalleryImageCounts: false,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Fine art, editions, collections",
  },
  "travel-journal": {
    accent: "gold",
    description: "Location-led covers with generous cards for destination galleries and visual travel journals.",
    galleryDensity: "immersive",
    label: "Travel journal",
    pageWidth: "full",
    publicBackground: "soft-black",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Travel, documentary, places",
  },
  sports: {
    accent: "emerald",
    description: "Fast, high-contrast browsing for action galleries where people need to scan many images quickly.",
    galleryDensity: "compact",
    label: "Sports action",
    pageWidth: "full",
    publicBackground: "black",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Sports, races, tournaments",
  },
  "real-estate": {
    accent: "blue",
    description: "Wide, clean gallery cards that favor interiors, architecture, hospitality, and property tours.",
    galleryDensity: "balanced",
    label: "Real estate",
    pageWidth: "wide",
    publicBackground: "white",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Real estate, architecture, venues",
  },
  "black-white": {
    accent: "white",
    description: "A monochrome-first presentation with high contrast and reduced color noise around the images.",
    galleryDensity: "balanced",
    label: "Black and white",
    pageWidth: "wide",
    publicBackground: "black",
    showBreadcrumbs: false,
    showGalleryImageCounts: false,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Monochrome, street, documentary",
  },
  masonry: {
    accent: "gold",
    description: "Mixed card proportions for portfolios that combine portrait, landscape, and square imagery.",
    galleryDensity: "compact",
    label: "Masonry portfolio",
    pageWidth: "wide",
    publicBackground: "soft-black",
    showBreadcrumbs: true,
    showGalleryImageCounts: true,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "soft",
    useCase: "Mixed orientation portfolios",
  },
  fullscreen: {
    accent: "white",
    description: "A showcase-first layout with large, nearly full-screen cover cards and very restrained labels.",
    galleryDensity: "immersive",
    label: "Fullscreen showcase",
    pageWidth: "full",
    publicBackground: "black",
    showBreadcrumbs: false,
    showGalleryImageCounts: false,
    showGalleryLabels: true,
    showSiteMenu: true,
    tileShape: "square",
    useCase: "Hero portfolios, presentations",
  },
  embedded: {
    accent: "gold",
    description: "A compact, low-chrome template designed to drop cleanly into an existing photographer website.",
    galleryDensity: "compact",
    label: "Embedded minimal",
    pageWidth: "contained",
    publicBackground: "black",
    showBreadcrumbs: false,
    showGalleryImageCounts: false,
    showGalleryLabels: true,
    showSiteMenu: false,
    tileShape: "soft",
    useCase: "Embeds, portfolio modules",
  },
}

export function getSiteTemplatePreset(template: SiteTemplate) {
  return siteTemplatePresets[template] ?? siteTemplatePresets.cinematic
}

export function mergeSiteSettings(settings?: Partial<SiteSettings>): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...settings,
    homeContentBlocks: {
      ...defaultSiteSettings.homeContentBlocks,
      ...settings?.homeContentBlocks,
    },
    socialAccounts: {
      ...defaultSiteSettings.socialAccounts,
      ...settings?.socialAccounts,
    },
    lightroomImport: {
      ...defaultSiteSettings.lightroomImport,
      ...settings?.lightroomImport,
    },
    desktopUploader: {
      ...defaultSiteSettings.desktopUploader,
      ...settings?.desktopUploader,
    },
  }
}

export type PortfolioPhoto = MigratedPhoto & {
  caption?: string
  hidden?: boolean
}

export type PortfolioGallerySettings = {
  allowFavorites?: boolean
  allowDownloads?: boolean
  embedEnabled?: boolean
  password?: string
  seoDescription?: string
  seoTitle?: string
  socialImageUrl?: string
  watermarkEnabled?: boolean
  watermarkImageUrl?: string
  watermarkMode?: "text" | "image" | "both"
  watermarkOpacity?: number
  watermarkPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center"
  watermarkSize?: number
  watermarkText?: string
}

export type PortfolioGallery = {
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
  photos?: PortfolioPhoto[]
} & PortfolioGallerySettings

export function isRenderableImage(photo: MigratedPhoto) {
  return /\.(jpe?g|png|webp|gif)$/i.test(photo.fileName)
}

export function isVisibleRenderableImage(photo: PortfolioPhoto) {
  return !photo.hidden && isRenderableImage(photo)
}

export function getDisplayUrl(photo?: MigratedPhoto) {
  return photo?.displayUrl ?? photo?.blobUrl
}

export function getPreferredDisplayUrl(photo: MigratedPhoto | undefined, preferHdrDisplay: boolean) {
  if (!photo) return undefined

  return preferHdrDisplay ? photo.blobUrl ?? photo.displayUrl : getDisplayUrl(photo)
}

export function getPhotoCover(photo?: MigratedPhoto) {
  return photo ? getDisplayUrl(photo) ?? photo.thumbnailUrl ?? photo.blobUrl : undefined
}

export function getThumbnailUrl(photo: MigratedPhoto) {
  return photo.thumbnailUrl ?? photo.displayUrl ?? photo.blobUrl
}

export function normalizeAssetUrl(url?: string) {
  if (!url) return ""

  try {
    const parsedUrl = new URL(url)
    parsedUrl.search = ""
    parsedUrl.hash = ""
    return parsedUrl.toString().toLowerCase()
  } catch {
    return url.split("?")[0].split("#")[0].toLowerCase()
  }
}

function photoDedupeKeys(photo: MigratedPhoto) {
  return [
    normalizeAssetUrl(photo.blobUrl),
    normalizeAssetUrl(photo.displayUrl),
    normalizeAssetUrl(photo.thumbnailUrl),
    normalizeAssetUrl(photo.sourceUrl),
    photo.id ? `id:${photo.id.toLowerCase()}` : "",
    `media:${photo.fileName.toLowerCase()}:${photo.width ?? ""}:${photo.height ?? ""}:${photo.bytes ?? ""}`,
  ].filter(Boolean)
}

export function photoMatchesCover(photo: MigratedPhoto, cover: string) {
  const normalizedCover = normalizeAssetUrl(cover)

  return [
    photo.blobUrl,
    photo.displayUrl,
    photo.thumbnailUrl,
    photo.sourceUrl,
  ].some((url) => normalizeAssetUrl(url) === normalizedCover)
}

export function uniqueGalleryPhotos(photos: PortfolioPhoto[], cover: string) {
  const seen = new Set<string>()

  return photos.filter((photo) => {
    if (!isVisibleRenderableImage(photo) || photoMatchesCover(photo, cover)) return false

    const keys = photoDedupeKeys(photo)
    if (keys.some((key) => seen.has(key))) return false

    keys.forEach((key) => seen.add(key))
    return true
  })
}

export function publicGalleryPath(galleryId: string) {
  return `/g/${galleryId}`
}

export function embedGalleryPath(galleryId: string) {
  return `/embed/${galleryId}`
}
