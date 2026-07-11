import assert from "node:assert/strict"
import test from "node:test"
import { getPhotoStorageProvider } from "../src/lib/photo-storage.ts"
import {
  getCanonicalPlanSlug,
  getPlanPriceEnvNames,
  getSubscriberPlan,
  subscriberPlans,
} from "../src/lib/plans.ts"
import {
  DEFAULT_WEBSITE_HOME_SECTION_ORDER,
  DEFAULT_WEBSITE_PAGE_ORDER,
  getWebsiteTemplateEnabledBlocks,
  getWebsiteTemplateHomeSectionOrder,
  normalizeWebsitePageOrder,
  type WebsiteEnabledBlocks,
} from "../src/lib/website-builder-rules.ts"
import {
  getCompletedWebsiteGearCategories,
  normalizeWebsiteGearCategories,
} from "../src/lib/website-gear.ts"

function withPhotoStorageProvider(value: string | undefined, assertion: () => void) {
  const previousValue = process.env.PHOTO_STORAGE_PROVIDER

  if (value === undefined) {
    delete process.env.PHOTO_STORAGE_PROVIDER
  } else {
    process.env.PHOTO_STORAGE_PROVIDER = value
  }

  try {
    assertion()
  } finally {
    if (previousValue === undefined) {
      delete process.env.PHOTO_STORAGE_PROVIDER
    } else {
      process.env.PHOTO_STORAGE_PROVIDER = previousValue
    }
  }
}

test("photo storage defaults to Cloudflare R2 unless legacy Vercel Blob is explicitly selected", () => {
  withPhotoStorageProvider(undefined, () => {
    assert.equal(getPhotoStorageProvider(), "r2")
  })

  withPhotoStorageProvider("r2", () => {
    assert.equal(getPhotoStorageProvider(), "r2")
  })

  withPhotoStorageProvider(" vercel-blob ", () => {
    assert.equal(getPhotoStorageProvider(), "vercel-blob")
  })
})

test("Premier is canonical while old Archive slugs and env names remain migration-compatible", () => {
  assert.equal(getSubscriberPlan("premier").name, "Premier")
  assert.equal(getSubscriberPlan("archive").name, "Premier")
  assert.equal(getCanonicalPlanSlug("archive"), "premier")
  assert.equal(getCanonicalPlanSlug("premier"), "premier")
  assert.equal(subscriberPlans.some((plan) => plan.slug === "archive"), false)
  assert.deepEqual(getPlanPriceEnvNames(getSubscriberPlan("premier"), "monthly"), [
    "STRIPE_PRICE_PREMIER_MONTHLY",
    "STRIPE_PRICE_ARCHIVE_MONTHLY",
  ])
})

test("website template switching does not leave Gallery Wall settings stuck on other templates", () => {
  const currentBlocks: WebsiteEnabledBlocks = {
    articles: true,
    callToAction: true,
    featuredPortfolio: true,
    gear: false,
    hero: true,
    portfolioGrid: true,
    textBlock: true,
  }

  const galleryWallBlocks = getWebsiteTemplateEnabledBlocks("gallery-wall", currentBlocks)

  assert.equal(galleryWallBlocks.hero, false)
  assert.equal(galleryWallBlocks.textBlock, false)
  assert.equal(galleryWallBlocks.featuredPortfolio, false)
  assert.equal(galleryWallBlocks.portfolioGrid, true)

  const cleanGridBlocks = getWebsiteTemplateEnabledBlocks("clean-grid", galleryWallBlocks)

  assert.equal(cleanGridBlocks.hero, true)
  assert.equal(cleanGridBlocks.textBlock, true)
  assert.equal(cleanGridBlocks.featuredPortfolio, true)
  assert.equal(cleanGridBlocks.portfolioGrid, true)
})

test("website template section order resets after leaving Gallery Wall", () => {
  assert.deepEqual(getWebsiteTemplateHomeSectionOrder("gallery-wall"), [
    "portfolioGrid",
    "featuredPortfolio",
    "hero",
    "textBlock",
  ])

  const cleanOrder = getWebsiteTemplateHomeSectionOrder("clean-grid")

  assert.deepEqual(cleanOrder, [...DEFAULT_WEBSITE_HOME_SECTION_ORDER])

  cleanOrder.reverse()
  assert.deepEqual(DEFAULT_WEBSITE_HOME_SECTION_ORDER, ["hero", "textBlock", "featuredPortfolio", "portfolioGrid"])
})

test("website page order keeps subscriber order while adding any missing pages", () => {
  const customOrder = normalizeWebsitePageOrder(["contact", "home", "about"])

  assert.deepEqual(customOrder.slice(0, 3), ["contact", "home", "about"])
  assert.deepEqual(customOrder, [
    "contact",
    "home",
    "about",
    "gear",
    "blog",
    "articles",
    "custom",
  ])

  assert.deepEqual(normalizeWebsitePageOrder(), [...DEFAULT_WEBSITE_PAGE_ORDER])
})

test("website gear drafts migrate safely and publish only named products", () => {
  const categories = normalizeWebsiteGearCategories([
    {
      id: "camera-bodies",
      title: "My cameras",
      items: [
        { id: "camera-1", name: "Mirrorless body", description: "Compact travel body", url: "https://example.com/camera" },
        { id: "camera-2", name: "", description: "Unfinished draft", url: "" },
      ],
    },
  ])

  assert.equal(categories.length, 3)
  assert.equal(categories[0].title, "My cameras")
  assert.equal(categories[1].title, "Favorite lenses")
  assert.deepEqual(getCompletedWebsiteGearCategories(categories).map((category) => category.id), ["camera-bodies"])
  assert.equal(getCompletedWebsiteGearCategories(categories)[0].items.length, 1)
})
