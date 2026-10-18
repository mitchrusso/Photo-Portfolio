import type {
  WebsiteHomeSectionKey,
  WebsiteTemplate,
} from "@/lib/website-builder-rules"

export type WebsiteTemplateHomeCapabilities = {
  blocks: readonly WebsiteHomeSectionKey[]
  headlineBlocks: readonly WebsiteHomeSectionKey[]
  bodyBlocks: readonly WebsiteHomeSectionKey[]
  heroButton: boolean
  heroEyebrow: boolean
  reorderable: boolean
  supportsCustomBlocks: boolean
}

const flexibleCapabilities: WebsiteTemplateHomeCapabilities = {
  blocks: ["hero", "filmStrip", "textBlock", "featuredPortfolio", "portfolioGrid"],
  headlineBlocks: ["hero", "textBlock", "featuredPortfolio", "portfolioGrid"],
  bodyBlocks: ["hero", "textBlock"],
  heroButton: true,
  heroEyebrow: false,
  reorderable: true,
  supportsCustomBlocks: true,
}

const fixedCapabilities = (
  blocks: readonly WebsiteHomeSectionKey[],
  options: {
    bodyBlocks?: readonly WebsiteHomeSectionKey[]
    headlineBlocks?: readonly WebsiteHomeSectionKey[]
    heroButton?: boolean
    heroEyebrow?: boolean
  } = {},
): WebsiteTemplateHomeCapabilities => ({
  blocks,
  bodyBlocks: options.bodyBlocks ?? [],
  headlineBlocks: options.headlineBlocks ?? [],
  heroButton: options.heroButton ?? false,
  heroEyebrow: options.heroEyebrow ?? false,
  reorderable: false,
  supportsCustomBlocks: false,
})

const fixedTemplateCapabilities: Partial<Record<WebsiteTemplate, WebsiteTemplateHomeCapabilities>> = {
  "acclaim-portfolio": fixedCapabilities(["hero", "featuredPortfolio"], { bodyBlocks: ["hero"] }),
  "atelier-split": fixedCapabilities(["hero", "featuredPortfolio"], { bodyBlocks: ["hero"], headlineBlocks: ["hero"], heroEyebrow: true }),
  "cinematic-chapters": fixedCapabilities(["hero", "featuredPortfolio"], { bodyBlocks: ["hero"], headlineBlocks: ["hero"], heroButton: true, heroEyebrow: true }),
  "commercial-casebook": fixedCapabilities(["featuredPortfolio"]),
  "coral-panorama": fixedCapabilities(["portfolioGrid"]),
  "dark-filmstrip": fixedCapabilities(["hero", "filmStrip"], { bodyBlocks: ["hero"], headlineBlocks: ["hero"], heroButton: true, heroEyebrow: true }),
  "editorial-rail": fixedCapabilities(["hero", "filmStrip"]),
  "editorial-story": fixedCapabilities(["hero", "textBlock", "featuredPortfolio"], { bodyBlocks: ["hero", "textBlock"], headlineBlocks: ["hero", "textBlock"], heroButton: true, heroEyebrow: true }),
  "kinetic-headline": fixedCapabilities(["hero"], { bodyBlocks: ["hero"], headlineBlocks: ["hero"] }),
  "masonry-journal": fixedCapabilities(["portfolioGrid"]),
  "museum-index": fixedCapabilities(["hero", "featuredPortfolio"], { bodyBlocks: ["hero"], headlineBlocks: ["hero"], heroButton: true, heroEyebrow: true }),
  "object-stage": fixedCapabilities(["featuredPortfolio"]),
  "quiet-sequence": fixedCapabilities(["featuredPortfolio"]),
  "specimen-wall": fixedCapabilities(["featuredPortfolio"]),
  "studio-split": fixedCapabilities(["hero", "featuredPortfolio"], { bodyBlocks: ["hero"], headlineBlocks: ["hero"], heroEyebrow: true }),
  "swiss-sequence": fixedCapabilities(["featuredPortfolio"]),
  "triptych-stage": fixedCapabilities(["featuredPortfolio"]),
}

export function getWebsiteTemplateHomeCapabilities(template: WebsiteTemplate): WebsiteTemplateHomeCapabilities {
  if (template === "scroll-stack") {
    return { ...flexibleCapabilities, heroEyebrow: true, supportsCustomBlocks: false }
  }

  return fixedTemplateCapabilities[template] ?? flexibleCapabilities
}
