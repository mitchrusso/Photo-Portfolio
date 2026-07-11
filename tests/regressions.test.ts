import assert from "node:assert/strict"
import test from "node:test"
import { getPhotoStorageProvider } from "../src/lib/photo-storage.ts"
import { createStripePortalSession } from "../src/lib/stripe-rest.ts"
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
import {
  classifyWebsiteWalkthroughGoal,
  getWebsiteEditHint,
  getWebsiteWalkthrough,
} from "../src/lib/website-walkthroughs.ts"
import {
  buildSocialQueue,
  normalizeSocialSchedule,
  socialScheduleIssue,
} from "../src/lib/social-scheduler.ts"

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

test("Stripe replacement-card sessions use the secure payment method update flow", async () => {
  const previousFetch = globalThis.fetch
  const previousSecret = process.env.STRIPE_SECRET_KEY
  let sentBody = ""

  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder"
  globalThis.fetch = (async (_input, init) => {
    sentBody = String(init?.body ?? "")
    return new Response(JSON.stringify({ id: "bps_test", url: "https://billing.stripe.test/session" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  }) as typeof fetch

  try {
    await createStripePortalSession({
      customerId: "cus_test",
      flowType: "payment_method_update",
      returnUrl: "https://photoviewpro.com/account",
    })

    const body = new URLSearchParams(sentBody)
    assert.equal(body.get("customer"), "cus_test")
    assert.equal(body.get("flow_data[type]"), "payment_method_update")
    assert.equal(body.get("flow_data[after_completion][type]"), "redirect")
    assert.equal(body.get("flow_data[after_completion][redirect][return_url]"), "https://photoviewpro.com/account?billing=payment-method-updated")
  } finally {
    globalThis.fetch = previousFetch
    if (previousSecret === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = previousSecret
  }
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

test("Merlin chooses safe website walkthroughs and keeps destinations deterministic", () => {
  assert.equal(classifyWebsiteWalkthroughGoal("Help me add my cameras and favorite lenses"), "gear")
  assert.equal(classifyWebsiteWalkthroughGoal("I need to get my domain ready to go live"), "publish")
  assert.equal(classifyWebsiteWalkthroughGoal("Make my opening headline and hero image better"), "homepage")

  const walkthrough = getWebsiteWalkthrough("gear")
  assert.equal(walkthrough.steps[1].destination.kind, "section")
  assert.deepEqual(walkthrough.steps[1].destination, {
    control: "content",
    kind: "section",
    sectionKey: "page:gear",
  })
  assert.match(getWebsiteEditHint("Featured work", "headline").description, /Featured work → Headline/)
})

test("social scheduler spaces visible portfolio photos and never queues hidden work", () => {
  const schedule = normalizeSocialSchedule({
    captionMode: "caption-and-title",
    includePortfolioLink: true,
    intervalHours: 3,
    networks: ["facebook", "instagram"],
    postsPerDay: 2,
    repeat: false,
    startAt: "2026-07-12T13:00:00.000Z",
    status: "draft",
    timezone: "America/New_York",
    updatedAt: "2026-07-11T12:00:00.000Z",
  }, new Date("2026-07-11T12:00:00.000Z"))

  const queue = buildSocialQueue(schedule, [
    { caption: "First caption", id: "one", imageUrl: "https://example.com/one.jpg", title: "First" },
    { hidden: true, id: "hidden", imageUrl: "https://example.com/hidden.jpg", title: "Hidden" },
    { id: "two", imageUrl: "https://example.com/two.jpg", title: "Second" },
    { id: "three", imageUrl: "https://example.com/three.jpg", title: "Third" },
  ])

  assert.deepEqual(queue.map((post) => post.photoId), ["one", "two", "three"])
  assert.equal(queue[1].publishAt, "2026-07-12T16:00:00.000Z")
  assert.equal(queue[2].publishAt, "2026-07-13T13:00:00.000Z")
  assert.match(queue[0].caption, /First caption/)
  assert.equal(socialScheduleIssue(schedule, 3), null)
})
