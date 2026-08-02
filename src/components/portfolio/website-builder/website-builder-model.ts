import type {
  WebsiteTripEntry,
  WebsiteWorkPhotoItem,
} from "@/components/portfolio/portfolio-dashboard-model"
import type {
  WebsiteHeroImageFit,
  WebsiteHeroImageMode,
  WebsiteHeroImagePosition,
  WebsiteHeroLayout,
} from "@/components/portfolio/website-builder/website-hero-controls"
import type {
  WebsiteWorkDisplayMode,
  WebsiteWorkSourceMode,
} from "@/components/portfolio/website-builder/website-portfolio-content-controls"
import type {
  WebsiteFontStyle,
  WebsiteImageShape,
} from "@/components/portfolio/website-builder/website-template-controls"
import type { GearAffiliateSettings } from "@/components/portfolio/website-gear-editor"
import type { WebsiteImageFrame } from "@/lib/website-image-frame"
import type {
  WebsiteBuilderPageKey,
  WebsiteContentWidthMode,
  WebsiteCustomBlock,
  WebsiteCustomPage,
  WebsiteHomeBlockOrderKey,
  WebsiteHomeSectionKey,
  WebsiteHeadlineAlignment,
  WebsiteNavigationPlacement,
  WebsiteSectionOrderKey,
  WebsiteTemplate,
} from "@/lib/website-builder-rules"
import type { WebsiteGearCategory } from "@/lib/website-gear"

export type WebsiteHeroVerticalAlignment = "top" | "middle" | "bottom"

export type WebsiteBuilderSettings = {
  aboutImageUrl: string
  aboutVideoUrl: string
  contentWidthMode: WebsiteContentWidthMode
  contactEmail: string
  customDomain: string
  customBlocks: WebsiteCustomBlock[]
  customPageTitle: string
  customPages: WebsiteCustomPage[]
  enabledBlocks: {
    articles: boolean
    callToAction: boolean
    featuredPortfolio: boolean
    filmStrip: boolean
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
  filmStripGalleryId: string
  filmStripImageCount: number
  gearAffiliate: GearAffiliateSettings
  gearCategories: WebsiteGearCategory[]
  headlineAlignment: Record<WebsiteSectionOrderKey, WebsiteHeadlineAlignment>
  heroButtonLabel: string
  heroButtonUrl: string
  heroContentVerticalAlignment: WebsiteHeroVerticalAlignment
  heroEyebrow: string
  heroGalleryId: string
  heroHeadline: string
  heroHeadlineScrollSlowdown: number
  heroHeadlineScrollSpeed: number
  heroHeadlineSize: number
  heroImageFit: WebsiteHeroImageFit
  heroImageMode: WebsiteHeroImageMode
  heroImagePosition: WebsiteHeroImagePosition
  heroImageUrl: string
  heroLayout: WebsiteHeroLayout
  heroLibraryPhotoKey: string
  heroOverlayStrength: number
  heroSubhead: string
  heroVideoPosterUrl: string
  heroVideoUrl: string
  homeBlockOrder: WebsiteHomeBlockOrderKey[]
  homeSectionOrder: WebsiteHomeSectionKey[]
  imageFrame: WebsiteImageFrame
  imageFrameThickness: number
  imageShape: WebsiteImageShape
  navigationLabels: Record<WebsiteBuilderPageKey, string>
  navigationPlacement: Record<WebsiteBuilderPageKey, WebsiteNavigationPlacement>
  pageCopy: {
    aboutBody: string
    aboutButtonLabel: string
    aboutButtonUrl: string
    aboutHeadline: string
    articlesBody: string
    articlesHeadline: string
    blogBody: string
    blogHeadline: string
    contactHeadline: string
    contactIntro: string
    customBody: string
    featuredWorkHeadline: string
    gearBody: string
    gearHeadline: string
    introBody: string
    introHeadline: string
    portfolioGridHeadline: string
  }
  pageOrder: WebsiteBuilderPageKey[]
  portfolioGridDisplayMode: WebsiteWorkDisplayMode
  sectionOrder: WebsiteSectionOrderKey[]
  selectedGalleryId: string
  showHeroEyebrow: boolean
  showSectionBodies: Record<WebsiteSectionOrderKey, boolean>
  showSectionHeadings: Record<WebsiteSectionOrderKey, boolean>
  showSiteIdentity: boolean
  siteAccentColor: string
  siteBackgroundColor: string
  siteBackgroundImageBrightness: number
  siteBackgroundImageLibrary: string[]
  siteBackgroundImageScreenBack: number
  siteBackgroundImageUrl: string
  siteFontStyle: WebsiteFontStyle
  siteLogoUrl: string
  siteName: string
  siteTextColor: string
  subdomain: string
  template: WebsiteTemplate
  tripEntries: WebsiteTripEntry[]
  visiblePages: {
    about: boolean
    articles: boolean
    blog: boolean
    contact: boolean
    custom: boolean
    gear: boolean
  }
  workDisplayMode: WebsiteWorkDisplayMode
  workSourceMode: WebsiteWorkSourceMode
}

export type WebsiteBuilderSectionKey =
  | "about"
  | "articles"
  | "contact"
  | "featuredPortfolio"
  | "filmStrip"
  | "gear"
  | "hero"
  | "portfolioGrid"
  | "textBlock"

export type WebsiteBuilderTool = "identity" | "pages" | "style"

export type WebsiteBuilderNavItem = {
  customPageId: string | null
  id: string
  label: string
  pageKey: WebsiteBuilderPageKey
  placement: WebsiteNavigationPlacement
}

export type { WebsiteWorkPhotoItem }
