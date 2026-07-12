import assert from "node:assert/strict"
import test from "node:test"
import { getAppUrl } from "../src/lib/app-url.ts"
import { createCancellationSurveyToken, verifyCancellationSurveyToken } from "../src/lib/cancellation-survey-token.ts"
import {
  createGalleryAccessToken,
  hashGalleryPassword,
  verifyGalleryAccessToken,
  verifyGalleryPassword,
} from "../src/lib/gallery-access.ts"
import { createImportToken, verifyImportToken } from "../src/lib/import-token.ts"
import {
  createR2ObjectReference,
  getPhotoDeliveryUrl,
  getPhotoStorageProvider,
  resolveR2ObjectReference,
  uniqueManagedPhotoReferences,
} from "../src/lib/photo-storage.ts"
import { findStoredCoverPhotoId } from "../src/lib/portfolio-cover.ts"
import { uniqueGalleryPhotos, type PortfolioPhoto } from "../src/lib/gallery-utils.ts"
import { sumStoredPhotoBytes } from "../src/lib/storage-math.ts"
import { createStripePortalSession } from "../src/lib/stripe-rest.ts"
import { evaluateSubscriptionAccess } from "../src/lib/subscription-access-rules.ts"
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

test("R2 references are opaque and delivery URLs are short lived", async () => {
  const envNames = [
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_ACCOUNT_ID",
    "CLOUDFLARE_R2_BUCKET",
    "CLOUDFLARE_R2_ENDPOINT",
    "CLOUDFLARE_R2_PUBLIC_BASE_URL",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  ] as const
  const previous = Object.fromEntries(envNames.map((name) => [name, process.env[name]]))

  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "test-access-key"
  process.env.CLOUDFLARE_R2_ACCOUNT_ID = "test-account"
  process.env.CLOUDFLARE_R2_BUCKET = "private-media"
  process.env.CLOUDFLARE_R2_ENDPOINT = "https://test-account.r2.cloudflarestorage.com"
  process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL = "https://legacy-media.example.com"
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "test-secret-key"

  try {
    const reference = createR2ObjectReference("private-media", "workspace/My Photo.jpg")
    assert.equal(reference, "r2://private-media/workspace/My%20Photo.jpg")
    assert.deepEqual(resolveR2ObjectReference(reference), {
      bucket: "private-media",
      pathname: "workspace/My Photo.jpg",
    })
    assert.deepEqual(resolveR2ObjectReference("https://legacy-media.example.com/workspace/My%20Photo.jpg"), {
      bucket: "private-media",
      pathname: "workspace/My Photo.jpg",
    })

    const deliveryUrl = new URL(await getPhotoDeliveryUrl(reference, { expiresIn: 60 }))
    assert.equal(deliveryUrl.protocol, "https:")
    assert.equal(deliveryUrl.searchParams.get("X-Amz-Expires"), "60")
    assert.equal(deliveryUrl.href.includes("test-secret-key"), false)
  } finally {
    for (const name of envNames) {
      if (previous[name] === undefined) delete process.env[name]
      else process.env[name] = previous[name]
    }
  }
})

test("storage cleanup deduplicates managed objects and ignores external source URLs", () => {
  assert.deepEqual(
    uniqueManagedPhotoReferences([
      "r2://private-media/workspace/original.jpg",
      "r2://private-media/workspace/original.jpg",
      "r2://private-media/workspace/display.jpg",
      "https://example.com/source.jpg",
      null,
      undefined,
      "",
    ]),
    [
      "r2://private-media/workspace/original.jpg",
      "r2://private-media/workspace/display.jpg",
    ],
  )
})

test("storage reconciliation counts originals and generated variants", () => {
  assert.equal(
    sumStoredPhotoBytes({
      bytes: BigInt(12_000_000),
      displayBytes: BigInt(2_000_000),
      thumbnailBytes: BigInt(200_000),
    }),
    BigInt(14_200_000),
  )
})

test("portfolio cover sync resolves stable public photo ids to database records", () => {
  const photos = [
    { id: "db-photo-1", metadata: { externalId: "public-photo-1" } },
    { id: "db-photo-2", metadata: null },
  ]

  assert.equal(findStoredCoverPhotoId(photos, "public-photo-1"), "db-photo-1")
  assert.equal(findStoredCoverPhotoId(photos, "db-photo-2"), "db-photo-2")
  assert.equal(findStoredCoverPhotoId(photos, "missing-photo"), null)
  assert.equal(findStoredCoverPhotoId(photos, null), null)
})

test("public portfolio sequences omit hidden photos and do not duplicate the cover", () => {
  const photo = (id: string, hidden = false): PortfolioPhoto => ({
    blobUrl: `https://media.example.com/${id}.jpg`,
    bytes: 1,
    displayUrl: `https://media.example.com/${id}.webp`,
    downloadUrl: `https://media.example.com/${id}.jpg`,
    fileName: `${id}.jpg`,
    height: 800,
    hidden,
    id,
    kind: "Image",
    sourceUrl: `https://media.example.com/${id}.jpg`,
    title: id,
    width: 1200,
  })
  const cover = photo("cover")
  const visible = photo("visible")
  const hidden = photo("hidden", true)

  assert.deepEqual(
    uniqueGalleryPhotos([cover, visible, hidden], cover.displayUrl ?? cover.blobUrl).map((item) => item.id),
    ["visible"],
  )
})

test("gallery passwords are salted and access cookies reject tampering and expiry", () => {
  const previousSecret = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = "test-secret-with-enough-randomness"
  try {
    const firstHash = hashGalleryPassword("correct horse battery staple")
    const secondHash = hashGalleryPassword("correct horse battery staple")
    assert.notEqual(firstHash, secondHash)
    assert.equal(verifyGalleryPassword("correct horse battery staple", firstHash), true)
    assert.equal(verifyGalleryPassword("wrong", firstHash), false)

    const token = createGalleryAccessToken("gallery-1", 1_000_000)
    assert.equal(verifyGalleryAccessToken(token, "gallery-1", 1_000_001), true)
    assert.equal(verifyGalleryAccessToken(`${token}x`, "gallery-1", 1_000_001), false)
    assert.equal(verifyGalleryAccessToken(token, "gallery-2", 1_000_001), false)
    assert.equal(verifyGalleryAccessToken(token, "gallery-1", 50_000_000), false)
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = previousSecret
  }
})

test("cancellation survey links are signed and expire", () => {
  const previousSecret = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = "test-secret-with-enough-randomness"
  try {
    const token = createCancellationSurveyToken({ email: "User@Example.com", subscriptionId: "sub_123" })
    assert.deepEqual(verifyCancellationSurveyToken(token)?.email, "user@example.com")
    assert.equal(verifyCancellationSurveyToken(token)?.subscriptionId, "sub_123")
    assert.equal(verifyCancellationSurveyToken(`${token}x`), null)
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = previousSecret
  }
})

test("desktop and Lightroom import keys are signed and workspace scoped", () => {
  const previousSecret = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = "test-secret-with-enough-randomness"
  try {
    const token = createImportToken("workspace-123")
    assert.equal(verifyImportToken(token)?.workspaceId, "workspace-123")
    assert.equal(verifyImportToken(`${token}x`), null)
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = previousSecret
  }
})

test("subscription access permits active accounts and unexpired trials", () => {
  const now = new Date("2026-07-12T12:00:00.000Z")

  assert.equal(evaluateSubscriptionAccess({ status: "ACTIVE" }, now).mode, "write")
  assert.equal(evaluateSubscriptionAccess({
    status: "TRIALING",
    trialEndsAt: new Date("2026-07-13T12:00:00.000Z"),
  }, now).mode, "write")
})

test("expired trials and billing problems preserve read access but block changes", () => {
  const now = new Date("2026-07-12T12:00:00.000Z")
  const expiredTrial = evaluateSubscriptionAccess({
    status: "TRIALING",
    trialEndsAt: new Date("2026-07-11T12:00:00.000Z"),
  }, now)

  assert.equal(expiredTrial.mode, "read-only")
  assert.equal(expiredTrial.code, "TRIAL_EXPIRED")
  assert.equal(evaluateSubscriptionAccess({ status: "TRIALING" }, now).code, "TRIAL_END_UNKNOWN")
  for (const status of ["PAST_DUE", "UNPAID", "CANCELED", "INCOMPLETE"]) {
    assert.equal(evaluateSubscriptionAccess({ status }, now).mode, "read-only")
  }
  assert.equal(evaluateSubscriptionAccess(null, now).mode, "blocked")
})

test("production app URLs do not trust an arbitrary request host", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  try {
    assert.equal(getAppUrl(new Request("https://attacker.example/checkout"), "production"), "https://photoviewpro.com")
  } finally {
    if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
  }
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
  assert.equal(subscriberPlans.some((plan) => String(plan.slug) === "archive"), false)
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
    startAt: "2099-07-12T13:00:00.000Z",
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
  assert.equal(queue[1].publishAt, "2099-07-12T16:00:00.000Z")
  assert.equal(queue[2].publishAt, "2099-07-13T13:00:00.000Z")
  assert.match(queue[0].caption, /First caption/)
  assert.equal(socialScheduleIssue(schedule, 3), null)
})
