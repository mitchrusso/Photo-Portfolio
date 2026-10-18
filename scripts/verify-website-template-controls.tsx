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
    id: "verification-one",
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
    public: true,
    workspaceSlug: "template-verification",
  },
  {
    client: "Template verification",
    cover: "/marketing-preview/loften-aurora.png",
    id: "verification-two",
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
    public: true,
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

function render(template: (typeof SELECTABLE_WEBSITE_TEMPLATE_IDS)[number], patch: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    <WebsiteDraftPreview
      initialGalleries={galleries as never}
      initialSettings={{ ...baseSettings, ...patch, template }}
      mode="published"
    />,
  )
}

for (const template of SELECTABLE_WEBSITE_TEMPLATE_IDS) {
  const capabilities = getWebsiteTemplateHomeCapabilities(template)
  const baseline = render(template)
  assert.ok(baseline.length > 500, `${template}: baseline preview did not render`)

  const identityHidden = render(template, { showSiteIdentity: false })
  assert.notEqual(identityHidden, baseline, `${template}: website identity on/off control made no rendered change`)

  const storyAccordionHidden = render(template, {
    storyAccordion: { ...baseSettings.storyAccordion, enabled: false },
  })
  assert.notEqual(storyAccordionHidden, baseline, `${template}: story accordion on/off control made no rendered change`)

  if (capabilities.heroButton) {
    const buttonHidden = render(template, {
      enabledBlocks: { ...allBlocks, callToAction: false },
    })
    assert.notEqual(buttonHidden, baseline, `${template}: Hero button on/off control made no rendered change`)
  }

  if (capabilities.heroEyebrow) {
    const eyebrowHidden = render(template, { showHeroEyebrow: false })
    assert.notEqual(eyebrowHidden, baseline, `${template}: Hero label on/off control made no rendered change`)
  }

  for (const block of capabilities.blocks) {
    const hidden = render(template, {
      enabledBlocks: { ...allBlocks, [block]: false },
    })
    assert.notEqual(hidden, baseline, `${template}: ${block} on/off control made no rendered change`)
  }

  for (const block of capabilities.headlineBlocks) {
    const sectionKey = `home:${block}` as `home:${WebsiteHomeSectionKey}`
    const hidden = render(template, {
      showSectionHeadings: { ...headings, [sectionKey]: false },
    })
    assert.notEqual(hidden, baseline, `${template}: ${block} headline on/off control made no rendered change`)
  }

  for (const block of capabilities.bodyBlocks) {
    const sectionKey = `home:${block}` as `home:${WebsiteHomeSectionKey}`
    const hidden = render(template, {
      showSectionBodies: { ...bodies, [sectionKey]: false },
    })
    assert.notEqual(hidden, baseline, `${template}: ${block} body on/off control made no rendered change`)
  }
}

console.log(`Verified on/off rendering contracts for ${SELECTABLE_WEBSITE_TEMPLATE_IDS.length} templates.`)
