export const DEFAULT_WEBSITE_HOME_SECTION_ORDER = ["hero", "filmStrip", "textBlock", "featuredPortfolio", "portfolioGrid"] as const
export const DEFAULT_WEBSITE_PAGE_ORDER = ["home", "about", "gear", "blog", "articles", "contact", "custom"] as const
export const DEFAULT_WEBSITE_SECTION_ORDER = [
  "home:hero",
  "home:filmStrip",
  "home:textBlock",
  "home:featuredPortfolio",
  "home:portfolioGrid",
  "page:about",
  "page:gear",
  "page:blog",
  "page:articles",
  "page:contact",
  "page:custom",
] as const

export type WebsiteHomeSectionKey = typeof DEFAULT_WEBSITE_HOME_SECTION_ORDER[number]
export type WebsiteBuilderPageKey = typeof DEFAULT_WEBSITE_PAGE_ORDER[number]
export type WebsiteHeadlineAlignment = "left" | "center" | "right"
export type WebsiteNavigationPlacement = "top" | "bottom"
export type WebsiteSectionOrderKey = typeof DEFAULT_WEBSITE_SECTION_ORDER[number]
export type WebsiteContentWidthMode = "adaptive" | "full"
export type WebsiteCustomBlockType = "text" | "portfolio"
export type WebsiteCustomBlock = {
  body: string
  galleryIds: string[]
  id: string
  title: string
  type: WebsiteCustomBlockType
  visible: boolean
}
export type WebsiteHomeBlockOrderKey = WebsiteHomeSectionKey | `custom:${string}`
export type WebsiteCustomPage = {
  body: string
  headlineAlignment: WebsiteHeadlineAlignment
  id: string
  navigationLabel: string
  navigationPlacement: WebsiteNavigationPlacement
  showBody: boolean
  showHeadline: boolean
  showInNavigation: boolean
  title: string
  visible: boolean
}

export const MAX_WEBSITE_CUSTOM_PAGES = 5
export const MAX_WEBSITE_CUSTOM_BLOCKS = 12

function normalizeCustomBlockId(value: unknown, index: number) {
  const normalized = typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    : ""

  return normalized || `block-${index + 1}`
}

export function normalizeWebsiteCustomBlocks(value: unknown): WebsiteCustomBlock[] {
  if (!Array.isArray(value)) return []

  const seenIds = new Set<string>()

  return value.slice(0, MAX_WEBSITE_CUSTOM_BLOCKS).map((candidate, index) => {
    const block = candidate && typeof candidate === "object"
      ? candidate as Partial<WebsiteCustomBlock>
      : {}
    const baseId = normalizeCustomBlockId(block.id, index)
    let id = baseId
    let suffix = 2
    while (seenIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    seenIds.add(id)

    const type: WebsiteCustomBlockType = block.type === "portfolio" ? "portfolio" : "text"

    return {
      body: typeof block.body === "string" ? block.body : "",
      galleryIds: Array.isArray(block.galleryIds)
        ? block.galleryIds.filter((galleryId): galleryId is string => typeof galleryId === "string")
        : [],
      id,
      title: typeof block.title === "string" && block.title.trim()
        ? block.title
        : type === "portfolio"
          ? "Portfolio collection"
          : "Text block",
      type,
      visible: block.visible !== false,
    }
  })
}

export function normalizeWebsiteHomeBlockOrder(
  order: unknown,
  customBlocks: WebsiteCustomBlock[],
  fallbackHomeOrder: readonly WebsiteHomeSectionKey[] = DEFAULT_WEBSITE_HOME_SECTION_ORDER,
): WebsiteHomeBlockOrderKey[] {
  const validCustomKeys = new Set(customBlocks.map((block) => `custom:${block.id}` as const))
  const seen = new Set<WebsiteHomeBlockOrderKey>()
  const normalized: WebsiteHomeBlockOrderKey[] = []

  if (Array.isArray(order)) {
    for (const value of order) {
      if (typeof value !== "string") continue
      const key = value as WebsiteHomeBlockOrderKey
      const isBuiltIn = DEFAULT_WEBSITE_HOME_SECTION_ORDER.includes(key as WebsiteHomeSectionKey)
      if ((!isBuiltIn && !validCustomKeys.has(key as `custom:${string}`)) || seen.has(key)) continue
      seen.add(key)
      normalized.push(key)
    }
  }

  for (const key of fallbackHomeOrder) {
    if (!seen.has(key)) {
      seen.add(key)
      normalized.push(key)
    }
  }
  for (const key of DEFAULT_WEBSITE_HOME_SECTION_ORDER) {
    if (!seen.has(key)) {
      seen.add(key)
      normalized.push(key)
    }
  }
  for (const key of validCustomKeys) {
    if (!seen.has(key)) normalized.push(key)
  }

  return normalized
}

export function normalizeWebsiteContentWidthMode(value: unknown): WebsiteContentWidthMode {
  return value === "full" ? "full" : "adaptive"
}

export function getWebsiteContentWidthClass(mode: WebsiteContentWidthMode) {
  return mode === "full" ? "w-full max-w-none" : "mx-auto w-full max-w-[1120px]"
}

function normalizeCustomPageId(value: unknown, index: number) {
  const normalized = typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    : ""

  return normalized || `custom-${index + 1}`
}

export function normalizeWebsiteCustomPages(
  value: unknown,
  legacyPage: WebsiteCustomPage,
): WebsiteCustomPage[] {
  const candidates = Array.isArray(value) ? value : [legacyPage]
  const seenIds = new Set<string>()

  return candidates.slice(0, MAX_WEBSITE_CUSTOM_PAGES).map((candidate, index) => {
    const page = candidate && typeof candidate === "object"
      ? candidate as Partial<WebsiteCustomPage>
      : {}
    const baseId = normalizeCustomPageId(page.id, index)
    let id = baseId
    let suffix = 2
    while (seenIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    seenIds.add(id)

    const title = typeof page.title === "string" && page.title.trim()
      ? page.title
      : index === 0
        ? legacyPage.title
        : `Custom page ${index + 1}`
    const navigationLabel = typeof page.navigationLabel === "string" && page.navigationLabel.trim()
      ? page.navigationLabel
      : title

    return {
      body: typeof page.body === "string" ? page.body : index === 0 ? legacyPage.body : "",
      headlineAlignment: page.headlineAlignment === "center" || page.headlineAlignment === "right"
        ? page.headlineAlignment
        : "left",
      id,
      navigationLabel,
      navigationPlacement: page.navigationPlacement === "bottom" ? "bottom" : "top",
      showBody: page.showBody !== false,
      showHeadline: page.showHeadline !== false,
      showInNavigation: page.showInNavigation === true,
      title,
      visible: page.visible === true,
    }
  })
}

export function normalizeLegacyAboutButton(label: unknown, url: unknown) {
  const normalizedLabel = typeof label === "string" ? label.trim() : ""
  const normalizedUrl = typeof url === "string" ? url.trim() : ""
  const isLegacyDefault = normalizedLabel.toLowerCase() === "learn more" && (!normalizedUrl || normalizedUrl === "#contact")

  return isLegacyDefault
    ? { aboutButtonLabel: "Get in touch", aboutButtonUrl: "#contact" }
    : null
}

export const SUBSCRIBER_WEBSITE_CONTENT_NOTICE =
  "Website content is created by and is the sole responsibility of the subscriber. PhotoView.io provides the publishing platform."

export type WebsiteTemplate =
  | "acclaim-portfolio"
  | "article-first"
  | "adventure-map"
  | "about-first"
  | "atelier-split"
  | "bold-color"
  | "botanical-soft"
  | "cinematic-chapters"
  | "cinematic-home"
  | "clean-grid"
  | "coastal-clean"
  | "commercial-casebook"
  | "coral-panorama"
  | "creator-studio"
  | "darkroom"
  | "dark-filmstrip"
  | "editorial-rail"
  | "editorial-story"
  | "editorial-magazine"
  | "fashion-panel"
  | "fine-art-index"
  | "gallery-wall"
  | "gallery-luxe"
  | "gear-notebook"
  | "landing-portfolios"
  | "kinetic-headline"
  | "panorama-scroll"
  | "minimal-white"
  | "masonry-journal"
  | "mosaic-board"
  | "museum-index"
  | "museum-wall"
  | "monochrome-zine"
  | "object-stage"
  | "portfolio-index"
  | "portrait-card"
  | "quiet-sequence"
  | "scroll-stack"
  | "social-hub"
  | "specimen-wall"
  | "split-hero"
  | "studio-card"
  | "studio-split"
  | "street-poster"
  | "story-journal"
  | "swiss-sequence"
  | "travel-atlas"
  | "triptych-stage"
  | "wedding-air"

export const SELECTABLE_WEBSITE_TEMPLATE_IDS = [
  "kinetic-headline",
  "atelier-split",
  "triptych-stage",
  "commercial-casebook",
  "studio-split",
  "swiss-sequence",
  "object-stage",
  "specimen-wall",
  "quiet-sequence",
  "scroll-stack",
  "acclaim-portfolio",
  "cinematic-home",
  "editorial-rail",
  "masonry-journal",
  "dark-filmstrip",
  "coral-panorama",
  "editorial-story",
  "cinematic-chapters",
  "museum-index",
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
] as const satisfies readonly WebsiteTemplate[]

export const DEFAULT_WEBSITE_NAVIGATION_PLACEMENT: Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement> = {
  about: "top",
  articles: "top",
  blog: "top",
  contact: "top",
  custom: "top",
  gear: "top",
  home: "top",
}

export function normalizeWebsiteNavigationPlacement(
  placement?: Partial<Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement>>,
): Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement> {
  return Object.fromEntries(
    DEFAULT_WEBSITE_PAGE_ORDER.map((pageKey) => [pageKey, placement?.[pageKey] === "bottom" ? "bottom" : "top"]),
  ) as Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement>
}

export function normalizeWebsiteHeadlineAlignment(
  alignment?: Partial<Record<WebsiteSectionOrderKey, WebsiteHeadlineAlignment>>,
): Record<WebsiteSectionOrderKey, WebsiteHeadlineAlignment> {
  return Object.fromEntries(
    DEFAULT_WEBSITE_SECTION_ORDER.map((sectionKey) => {
      const value = alignment?.[sectionKey]
      return [sectionKey, value === "center" || value === "right" ? value : "left"]
    }),
  ) as Record<WebsiteSectionOrderKey, WebsiteHeadlineAlignment>
}

export type WebsiteEnabledBlocks = {
  articles: boolean
  callToAction: boolean
  featuredPortfolio: boolean
  filmStrip: boolean
  gear: boolean
  hero: boolean
  portfolioGrid: boolean
  textBlock: boolean
}

export function getWebsiteTemplateEnabledBlocks(
  template: WebsiteTemplate,
  current: WebsiteEnabledBlocks,
): WebsiteEnabledBlocks {
  if (template === "gallery-wall") {
    return {
      ...current,
      featuredPortfolio: false,
      filmStrip: false,
      hero: false,
      portfolioGrid: true,
      textBlock: false,
    }
  }

  return {
    ...current,
    featuredPortfolio: true,
    hero: true,
    portfolioGrid: true,
    textBlock: true,
  }
}

export function getWebsiteTemplateHomeSectionOrder(
  template: WebsiteTemplate,
  presetOrder?: WebsiteHomeSectionKey[],
): WebsiteHomeSectionKey[] {
  if (template === "gallery-wall") return ["portfolioGrid", "featuredPortfolio", "hero", "textBlock"]
  return presetOrder ?? [...DEFAULT_WEBSITE_HOME_SECTION_ORDER]
}

export function getWebsiteTemplateSectionOrder(
  template: WebsiteTemplate,
  presetHomeOrder?: WebsiteHomeSectionKey[],
  currentOrder?: readonly string[],
): WebsiteSectionOrderKey[] {
  const normalizedCurrentOrder = normalizeWebsiteSectionOrder(currentOrder)
  const currentPageSections = normalizedCurrentOrder.filter((sectionKey) => sectionKey.startsWith("page:"))
  const homeSections = getWebsiteTemplateHomeSectionOrder(template, presetHomeOrder).map(
    (sectionKey) => `home:${sectionKey}` as WebsiteSectionOrderKey,
  )

  return [
    ...homeSections,
    ...(currentPageSections.length > 0
      ? currentPageSections
      : DEFAULT_WEBSITE_SECTION_ORDER.filter((sectionKey) => sectionKey.startsWith("page:"))),
  ]
}

export function normalizeWebsitePageOrder(order?: readonly string[]): WebsiteBuilderPageKey[] {
  const seen = new Set<WebsiteBuilderPageKey>()
  const orderedPages: WebsiteBuilderPageKey[] = []

  for (const pageKey of order ?? []) {
    if (!DEFAULT_WEBSITE_PAGE_ORDER.includes(pageKey as WebsiteBuilderPageKey)) continue
    if (seen.has(pageKey as WebsiteBuilderPageKey)) continue

    seen.add(pageKey as WebsiteBuilderPageKey)
    orderedPages.push(pageKey as WebsiteBuilderPageKey)
  }

  return [
    ...orderedPages,
    ...DEFAULT_WEBSITE_PAGE_ORDER.filter((pageKey) => !seen.has(pageKey)),
  ]
}

export function normalizeWebsiteSectionOrder(order?: readonly string[]): WebsiteSectionOrderKey[] {
  const seen = new Set<WebsiteSectionOrderKey>()
  const orderedSections: WebsiteSectionOrderKey[] = []

  for (const sectionKey of order ?? []) {
    if (!DEFAULT_WEBSITE_SECTION_ORDER.includes(sectionKey as WebsiteSectionOrderKey)) continue
    if (seen.has(sectionKey as WebsiteSectionOrderKey)) continue

    seen.add(sectionKey as WebsiteSectionOrderKey)
    orderedSections.push(sectionKey as WebsiteSectionOrderKey)
  }

  return [
    ...orderedSections,
    ...DEFAULT_WEBSITE_SECTION_ORDER.filter((sectionKey) => !seen.has(sectionKey)),
  ]
}
