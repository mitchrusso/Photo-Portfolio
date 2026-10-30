import assert from "node:assert/strict"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { WebsiteDraftPreview } from "../src/components/site/website-draft-preview"
import {
  SELECTABLE_WEBSITE_TEMPLATE_IDS,
  type WebsiteHomeSectionKey,
} from "../src/lib/website-builder-rules"
import { getWebsiteTemplateHomeCapabilities } from "../src/lib/website-template-capabilities"

const galleries = [
  {
    client: "Template verification",
    cover: "/marketing-preview/egypt-sphinx.png",
    description: "Verification portfolio one",
    favorites: 0,
    id: "verification-one",
    images: 1,
    name: "Verification Portfolio One",
    photos: [
      {
        caption: "Verification photograph one",
        displayUrl: "/marketing-preview/egypt-sphinx.png",
        fileName: "verification-one.jpg",
        height: 900,
        hidden: false,
        id: "verification-photo-one",
        thumbnailUrl: "/marketing-preview/egypt-sphinx-thumbnail.webp",
        title: "Verification photograph one",
        width: 1600,
      },
    ],
    privacy: "Public",
    revenue: "$0",
    status: "Delivered",
    workspaceSlug: "template-verification",
  },
  {
    client: "Template verification",
    cover: "/marketing-preview/loften-aurora.png",
    description: "Verification portfolio two",
    favorites: 0,
    id: "verification-two",
    images: 1,
    name: "Verification Portfolio Two",
    photos: [
      {
        caption: "Verification photograph two",
        displayUrl: "/marketing-preview/loften-aurora.png",
        fileName: "verification-two.jpg",
        height: 900,
        hidden: false,
        id: "verification-photo-two",
        thumbnailUrl: "/marketing-preview/lofoten-aurora-thumbnail.webp",
        title: "Verification photograph two",
        width: 1600,
      },
    ],
    privacy: "Public",
    revenue: "$0",
    status: "Delivered",
    workspaceSlug: "template-verification",
  },
]

const allBlocks = {
  articles: true,
  callToAction: true,
  featuredPortfolio: true,
  filmStrip: true,
  gear: true,
  hero: true,
  portfolioGrid: true,
  textBlock: true,
}

const headings = {
  "home:featuredPortfolio": true,
  "home:filmStrip": true,
  "home:hero": true,
  "home:portfolioGrid": true,
  "home:textBlock": true,
  "page:about": true,
  "page:articles": true,
  "page:blog": true,
  "page:contact": true,
  "page:custom": true,
  "page:gear": true,
}

const bodies = { ...headings }

const fixedPresentationTemplates = new Set([
  "acclaim-portfolio",
  "atelier-split",
  "cinematic-chapters",
  "commercial-casebook",
  "coral-panorama",
  "dark-filmstrip",
  "editorial-rail",
  "editorial-story",
  "kinetic-headline",
  "masonry-journal",
  "museum-index",
  "object-stage",
  "quiet-sequence",
  "scroll-stack",
  "specimen-wall",
  "studio-split",
  "swiss-sequence",
  "triptych-stage",
])

const baseSettings = {
  enabledBlocks: allBlocks,
  featuredGalleryIds: galleries.map((gallery) => gallery.id),
  filmStripGalleryId: galleries[0].id,
  filmStripImageCount: 12,
  heroButtonLabel: "Verification action",
  heroButtonUrl: "#verification",
  heroEyebrow: "Verification eyebrow",
  heroHeadline: "Verification hero headline",
  heroSubhead: "Verification hero supporting copy",
  pageCopy: {
    featuredWorkHeadline: "Verification featured headline",
    introBody: "Verification introduction body",
    introHeadline: "Verification introduction headline",
    portfolioGridHeadline: "Verification portfolio headline",
  },
  selectedGalleryId: galleries[0].id,
  showHeroEyebrow: true,
  showSiteIdentity: true,
  showSectionBodies: bodies,
  showSectionHeadings: headings,
  siteName: "Template Verification Studio",
  storyAccordion: {
    enabled: true,
    heading: "Verification photographer story",
    items: [
      {
        body: "Verification story chapter body",
        galleryId: galleries[0].id,
        id: "verification-story-one",
        title: "Verification story chapter",
      },
      {
        body: "Verification second chapter body",
        galleryId: galleries[1].id,
        id: "verification-story-two",
        title: "Verification second chapter",
      },
    ],
  },
  workSourceMode: "all",
}

const pageControlCases = [
  {
    bodyKey: "aboutBody",
    bodyMarker: "Changed about body",
    headlineKey: "aboutHeadline",
    headlineMarker: "Changed about headline",
    pageKey: "about",
    sectionKey: "page:about",
  },
  {
    bodyKey: "blogBody",
    bodyMarker: "Changed trips body",
    headlineKey: "blogHeadline",
    headlineMarker: "Changed trips headline",
    pageKey: "blog",
    sectionKey: "page:blog",
  },
  {
    bodyKey: "gearBody",
    bodyMarker: "Changed gear body",
    headlineKey: "gearHeadline",
    headlineMarker: "Changed gear headline",
    pageKey: "gear",
    sectionKey: "page:gear",
  },
  {
    bodyKey: "articlesBody",
    bodyMarker: "Changed articles body",
    headlineKey: "articlesHeadline",
    headlineMarker: "Changed articles headline",
    pageKey: "articles",
    sectionKey: "page:articles",
  },
  {
    bodyKey: "contactIntro",
    bodyMarker: "Changed contact body",
    headlineKey: "contactHeadline",
    headlineMarker: "Changed contact headline",
    pageKey: "contact",
    sectionKey: "page:contact",
  },
] as const

let verifiedControlVariants = 0
const noEffectControls: string[] = []

function render(template: (typeof SELECTABLE_WEBSITE_TEMPLATE_IDS)[number], patch: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    <WebsiteDraftPreview
      initialGalleries={galleries as never}
      initialSettings={{ ...baseSettings, ...patch, template }}
      mode="published"
    />,
  )
}

function assertRenderedChange(
  template: (typeof SELECTABLE_WEBSITE_TEMPLATE_IDS)[number],
  baseline: string,
  label: string,
  patch: Record<string, unknown>,
) {
  const updated = render(template, patch)
  assert.notEqual(updated, baseline, `${template}: ${label} made no rendered change`)
  verifiedControlVariants += 1
  return updated
}

function assertRenderedText(
  template: (typeof SELECTABLE_WEBSITE_TEMPLATE_IDS)[number],
  label: string,
  marker: string,
  patch: Record<string, unknown>,
) {
  const updated = render(template, patch)
  assert.match(updated, new RegExp(marker), `${template}: ${label} did not render its saved value`)
  verifiedControlVariants += 1
  return updated
}

function recordRenderedChange(
  template: (typeof SELECTABLE_WEBSITE_TEMPLATE_IDS)[number],
  baseline: string,
  label: string,
  patch: Record<string, unknown>,
) {
  const updated = render(template, patch)
  if (updated === baseline) {
    noEffectControls.push(`${template}: ${label}`)
    return updated
  }
  verifiedControlVariants += 1
  return updated
}

function recordRenderedText(
  template: (typeof SELECTABLE_WEBSITE_TEMPLATE_IDS)[number],
  label: string,
  marker: string,
  patch: Record<string, unknown>,
) {
  const updated = render(template, patch)
  if (!new RegExp(marker).test(updated)) {
    noEffectControls.push(`${template}: ${label}`)
    return updated
  }
  verifiedControlVariants += 1
  return updated
}

for (const template of SELECTABLE_WEBSITE_TEMPLATE_IDS) {
  const capabilities = getWebsiteTemplateHomeCapabilities(template)
  const baseline = render(template)
  assert.ok(baseline.length > 500, `${template}: baseline preview did not render`)

  assertRenderedText(template, "website name", "Changed Verification Studio", {
    siteName: "Changed Verification Studio",
  })

  for (const [label, patch] of [
    ["background color", { siteBackgroundColor: "#123456" }],
    ["text color", { siteTextColor: "#654321" }],
    ["accent color", { siteAccentColor: "#abcdef" }],
    ["full-screen content width", { contentWidthMode: "full" }],
    ["compact footer", { footerSize: "compact" }],
    ["spacious footer", { footerSize: "spacious" }],
    ["smaller site font", { siteFontSize: 85 }],
    ["larger site font", { siteFontSize: 120 }],
    ["editorial font", { siteFontStyle: "editorial" }],
    ["classic font", { siteFontStyle: "classic" }],
    ["field-notes font", { siteFontStyle: "mono" }],
    ["thin image frame", { imageFrame: "thin", imageFrameThickness: 2 }],
    ["shadow image frame", { imageFrame: "shadow", imageFrameThickness: 4 }],
    ["print image frame", { imageFrame: "print", imageFrameThickness: 8 }],
    ["square image shape", { imageShape: "square" }],
    ["pill image shape", { imageShape: "pill" }],
    ["arch image shape", { imageShape: "arch" }],
    ["background image", {
      siteBackgroundImageBrightness: 70,
      siteBackgroundImageScreenBack: 25,
      siteBackgroundImageUrl: "/marketing-preview/loften-aurora.png",
    }],
  ] as const) {
    if (
      fixedPresentationTemplates.has(template)
      && (label.includes("image frame") || label.includes("image shape"))
    ) continue
    recordRenderedChange(template, baseline, label, patch)
  }

  if (baseline.includes("verification-one.jpg") || baseline.includes("verification-two.jpg")) {
    assertRenderedChange(template, baseline, "photo filename visibility", {
      hideWebsitePhotoFileNames: true,
    })
  }

  const identityHidden = render(template, { showSiteIdentity: false })
  assert.notEqual(identityHidden, baseline, `${template}: website identity on/off control made no rendered change`)
  verifiedControlVariants += 1

  const storyAccordionHidden = render(template, {
    storyAccordion: { ...baseSettings.storyAccordion, enabled: false },
  })
  assert.notEqual(storyAccordionHidden, baseline, `${template}: story accordion on/off control made no rendered change`)
  verifiedControlVariants += 1
  assertRenderedText(template, "story accordion heading", "Changed photographer story", {
    storyAccordion: { ...baseSettings.storyAccordion, heading: "Changed photographer story" },
  })
  assertRenderedText(template, "story accordion chapter title", "Changed story chapter", {
    storyAccordion: {
      ...baseSettings.storyAccordion,
      items: [{ ...baseSettings.storyAccordion.items[0], title: "Changed story chapter" }],
    },
  })

  if (capabilities.heroButton) {
    const buttonHidden = render(template, {
      enabledBlocks: { ...allBlocks, callToAction: false },
    })
    assert.notEqual(buttonHidden, baseline, `${template}: Hero button on/off control made no rendered change`)
    verifiedControlVariants += 1
    assertRenderedText(template, "Hero button label", "Changed hero action", {
      heroButtonLabel: "Changed hero action",
    })
  }

  if (capabilities.heroEyebrow) {
    const eyebrowHidden = render(template, { showHeroEyebrow: false })
    assert.notEqual(eyebrowHidden, baseline, `${template}: Hero label on/off control made no rendered change`)
    verifiedControlVariants += 1
    assertRenderedText(template, "Hero eyebrow text", "Changed hero eyebrow", {
      heroEyebrow: "Changed hero eyebrow",
    })
  }

  for (const block of capabilities.blocks) {
    const hidden = render(template, {
      enabledBlocks: { ...allBlocks, [block]: false },
    })
    assert.notEqual(hidden, baseline, `${template}: ${block} on/off control made no rendered change`)
    verifiedControlVariants += 1
  }

  for (const block of capabilities.headlineBlocks) {
    const sectionKey = `home:${block}` as `home:${WebsiteHomeSectionKey}`
    const hidden = render(template, {
      showSectionHeadings: { ...headings, [sectionKey]: false },
    })
    assert.notEqual(hidden, baseline, `${template}: ${block} headline on/off control made no rendered change`)
    verifiedControlVariants += 1

    if (!(template === "kinetic-headline" && block === "hero")) {
      recordRenderedChange(template, baseline, `${block} headline alignment`, {
        headlineAlignment: { [sectionKey]: "right" },
      })
    } else {
      recordRenderedChange(template, baseline, "Hero vertical position", {
        heroContentVerticalAlignment: "top",
      })
    }
    recordRenderedChange(
      template,
      baseline,
      `${block} headline size`,
      block === "hero"
        ? { heroHeadlineSize: 160 }
        : { headlineSize: { [sectionKey]: 160 } },
    )
  }

  for (const block of capabilities.bodyBlocks) {
    const sectionKey = `home:${block}` as `home:${WebsiteHomeSectionKey}`
    const hidden = render(template, {
      showSectionBodies: { ...bodies, [sectionKey]: false },
    })
    assert.notEqual(hidden, baseline, `${template}: ${block} body on/off control made no rendered change`)
    verifiedControlVariants += 1
  }

  if (capabilities.headlineBlocks.includes("hero")) {
    recordRenderedText(template, "Hero headline copy", "Changed hero headline", {
      heroHeadline: "Changed hero headline",
    })
  }
  if (capabilities.bodyBlocks.includes("hero")) {
    recordRenderedText(template, "Hero body copy", "Changed hero supporting copy", {
      heroSubhead: "Changed hero supporting copy",
    })
  }

  if (capabilities.blocks.includes("textBlock")) {
    assertRenderedText(template, "intro headline copy", "Changed introduction headline", {
      pageCopy: { ...baseSettings.pageCopy, introHeadline: "Changed introduction headline" },
    })
    assertRenderedText(template, "intro body copy", "Changed introduction body", {
      pageCopy: { ...baseSettings.pageCopy, introBody: "Changed introduction body" },
    })
  }

  if (capabilities.blocks.includes("featuredPortfolio")) {
    if (capabilities.headlineBlocks.includes("featuredPortfolio")) {
      assertRenderedText(template, "featured work headline", "Changed featured headline", {
        pageCopy: { ...baseSettings.pageCopy, featuredWorkHeadline: "Changed featured headline" },
      })
    }
    assertRenderedChange(template, baseline, "featured portfolio selection", {
      featuredGalleryIds: [galleries[1].id],
      workSourceMode: "featured",
    })
    assertRenderedChange(template, baseline, "portfolio ordering", {
      portfolioOrder: galleries.map((gallery) => gallery.id).reverse(),
    })
  }

  if (capabilities.blocks.includes("portfolioGrid")) {
    if (capabilities.headlineBlocks.includes("portfolioGrid")) {
      assertRenderedText(template, "all portfolios headline", "Changed portfolio headline", {
        pageCopy: { ...baseSettings.pageCopy, portfolioGridHeadline: "Changed portfolio headline" },
      })
    }
    assertRenderedChange(template, baseline, "all-portfolio ordering", {
      portfolioOrder: galleries.map((gallery) => gallery.id).reverse(),
    })
  }

  if (capabilities.blocks.includes("filmStrip")) {
    assertRenderedChange(template, baseline, "film-strip portfolio", {
      filmStripGalleryId: galleries[1].id,
    })
  }

  if (capabilities.reorderable && !fixedPresentationTemplates.has(template)) {
    for (const displayMode of ["slideshow", "thumbnail-grid", "full-frame-grid", "film-strip", "cover-cards"] as const) {
      if (displayMode === "thumbnail-grid") continue
      assertRenderedChange(template, baseline, `${displayMode} work display`, {
        workDisplayMode: displayMode,
        portfolioGridDisplayMode: displayMode,
      })
    }
    for (const sourceMode of ["featured", "single"] as const) {
      assertRenderedChange(template, baseline, `${sourceMode} work source`, {
        featuredGalleryIds: sourceMode === "featured" ? [galleries[1].id] : baseSettings.featuredGalleryIds,
        selectedGalleryId: galleries[1].id,
        workSourceMode: sourceMode,
      })
    }
  }

  for (const page of pageControlCases) {
    const pagePrerequisites = page.pageKey === "contact"
      ? { contactEmail: "support@example.com" }
      : {}
    const pageBaseline = page.pageKey === "contact" ? render(template, pagePrerequisites) : baseline
    assertRenderedText(template, `${page.pageKey} headline copy`, page.headlineMarker, {
      ...pagePrerequisites,
      pageCopy: { [page.headlineKey]: page.headlineMarker },
    })
    assertRenderedText(template, `${page.pageKey} body copy`, page.bodyMarker, {
      ...pagePrerequisites,
      pageCopy: { [page.bodyKey]: page.bodyMarker },
    })
    assertRenderedChange(template, pageBaseline, `${page.pageKey} headline visibility`, {
      ...pagePrerequisites,
      showSectionHeadings: { [page.sectionKey]: false },
    })
    assertRenderedChange(template, pageBaseline, `${page.pageKey} body visibility`, {
      ...pagePrerequisites,
      showSectionBodies: { [page.sectionKey]: false },
    })
    assertRenderedChange(template, pageBaseline, `${page.pageKey} headline alignment`, {
      ...pagePrerequisites,
      headlineAlignment: { [page.sectionKey]: "right" },
    })
    assertRenderedChange(template, pageBaseline, `${page.pageKey} headline size`, {
      ...pagePrerequisites,
      headlineSize: { [page.sectionKey]: 160 },
    })
    recordRenderedText(template, `${page.pageKey} navigation label`, `Changed ${page.pageKey} navigation`, {
      ...pagePrerequisites,
      navigationLabels: { [page.pageKey]: `Changed ${page.pageKey} navigation` },
    })
    recordRenderedChange(template, pageBaseline, `${page.pageKey} footer navigation placement`, {
      ...pagePrerequisites,
      navigationPlacement: { [page.pageKey]: "bottom" },
    })
    assertRenderedChange(template, pageBaseline, `${page.pageKey} page visibility`, {
      ...pagePrerequisites,
      enabledPages: { [page.pageKey]: false },
      visiblePages: { [page.pageKey]: false },
    })
  }

  recordRenderedChange(template, baseline, "page navigation order", {
    pageOrder: ["home", "contact", "articles", "gear", "blog", "about", "custom"],
  })

  assertRenderedText(template, "custom page title", "Changed custom page title", {
    customPages: [{
      body: "Changed custom page body",
      headlineAlignment: "right",
      headlineSize: 155,
      id: "verification-custom-page",
      navigationLabel: "Changed custom navigation",
      navigationPlacement: "both",
      showBody: true,
      showHeadline: true,
      showInNavigation: true,
      title: "Changed custom page title",
      visible: true,
    }],
  })
  assertRenderedText(template, "custom page body", "Changed custom page body", {
    customPages: [{
      body: "Changed custom page body",
      headlineAlignment: "right",
      headlineSize: 155,
      id: "verification-custom-page",
      navigationLabel: "Changed custom navigation",
      navigationPlacement: "both",
      showBody: true,
      showHeadline: true,
      showInNavigation: true,
      title: "Changed custom page title",
      visible: true,
    }],
  })
}

console.log(
  `Verified ${verifiedControlVariants} independent rendering-control variants across ${SELECTABLE_WEBSITE_TEMPLATE_IDS.length} templates.`,
)
if (noEffectControls.length > 0) {
  console.log(`Controls with no visible effect (${noEffectControls.length}):`)
  for (const control of noEffectControls) console.log(`- ${control}`)
}
assert.deepEqual(noEffectControls, [], "Every exposed template control must produce a visible result")
