export const DEFAULT_WEBSITE_HOME_SECTION_ORDER = ["hero", "textBlock", "featuredPortfolio", "portfolioGrid"] as const
export const DEFAULT_WEBSITE_PAGE_ORDER = ["home", "about", "gear", "blog", "articles", "contact", "custom"] as const
export const DEFAULT_WEBSITE_SECTION_ORDER = [
  "home:hero",
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

export const SUBSCRIBER_WEBSITE_CONTENT_NOTICE =
  "Website content is created by and is the sole responsibility of the subscriber. PhotoView.io provides the publishing platform."

export type WebsiteTemplate =
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
