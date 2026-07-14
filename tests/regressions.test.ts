import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test from "node:test"
import { uploadPhotoFromClient } from "../src/lib/client-photo-upload.ts"
import { getAmazonCreatorsProductData } from "../src/lib/amazon-creators.ts"
import { mapWithConcurrency } from "../src/lib/async-concurrency.ts"
import { getAppUrl } from "../src/lib/app-url.ts"
import { isAdminIdentity } from "../src/lib/admin-access.ts"
import { createCancellationSurveyToken, verifyCancellationSurveyToken } from "../src/lib/cancellation-survey-token.ts"
import {
  createGalleryAccessToken,
  hashGalleryPassword,
  verifyGalleryAccessToken,
  verifyGalleryPassword,
} from "../src/lib/gallery-access.ts"
import { createImportToken, verifyImportToken } from "../src/lib/import-token.ts"
import {
  getAmazonGearSearchUrl,
  getRetailerProductImageFallback,
  normalizeGearSearchEntry,
  withRetailerAffiliateTracking,
} from "../src/lib/gear-retailer.ts"
import { validateGearProductImageUrl } from "../src/lib/gear-image-validation.ts"
import {
  createR2ObjectReference,
  getPhotoDeliveryUrl,
  getPhotoStorageProvider,
  resolveR2ObjectReference,
  uniqueManagedPhotoReferences,
} from "../src/lib/photo-storage.ts"
import { findStoredCoverPhotoId } from "../src/lib/portfolio-cover.ts"
import { isPrivateOrReservedAddress, validatePublicImageUrl } from "../src/lib/public-network-url.ts"
import {
  calculateSubscriberOnboardingProgress,
  previewedWorkspaceIds,
} from "../src/lib/onboarding-progress-rules.ts"
import {
  embedGalleryPath,
  galleryAccessPath,
  publicGalleryPath,
  resolvePublicGallerySegments,
  uniqueGalleryPhotos,
  type PortfolioPhoto,
} from "../src/lib/gallery-utils.ts"
import { sumStoredPhotoBytes } from "../src/lib/storage-math.ts"
import { createStripePortalSession } from "../src/lib/stripe-rest.ts"
import {
  getInvoiceSubscriptionStatus,
  isPaidStripeInvoice,
  isStripeSubscriptionCancellationScheduled,
} from "../src/lib/stripe-lifecycle-rules.ts"
import { isSubscriberLifecycleVerificationObject } from "../src/lib/stripe-webhook-notification-rules.ts"
import { verifyStripeWebhookSignature } from "../src/lib/stripe-webhook-signature.ts"
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
  addApprovedWebsiteGearItems,
  getCompletedWebsiteGearCategories,
  getSafeWebsiteGearImageUrl,
  getSafeWebsiteGearLink,
  normalizeWebsiteGearCategories,
  removeWebsiteGearItem,
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
import {
  missingWebhookEvents,
  validatePrice,
} from "../scripts/verify-stripe-cutover.mjs"

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

test("public gallery routes are workspace scoped and preserve legacy links", () => {
  assert.equal(publicGalleryPath("travel", "mitch-russo"), "/g/mitch-russo/travel")
  assert.equal(embedGalleryPath("travel", "mitch-russo"), "/embed/mitch-russo/travel")
  assert.equal(galleryAccessPath("travel", "mitch-russo"), "/api/gallery-access/mitch-russo/travel")
  assert.equal(publicGalleryPath("travel"), "/g/travel")
  assert.notEqual(publicGalleryPath("travel", "photographer-a"), publicGalleryPath("travel", "photographer-b"))
  assert.equal(publicGalleryPath("My Trip", "Jane Doe"), "/g/Jane%20Doe/My%20Trip")
})

test("bounded concurrency preserves result order and limits active work", async () => {
  let active = 0
  let peak = 0
  const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, 2))
    active -= 1
    return value * 2
  })

  assert.deepEqual(results, [2, 4, 6, 8, 10])
  assert.equal(peak, 2)
})

test("external URL validation rejects private and reserved network ranges", () => {
  assert.equal(isPrivateOrReservedAddress("127.0.0.1"), true)
  assert.equal(isPrivateOrReservedAddress("100.64.0.1"), true)
  assert.equal(isPrivateOrReservedAddress("169.254.169.254"), true)
  assert.equal(isPrivateOrReservedAddress("198.18.0.1"), true)
  assert.equal(isPrivateOrReservedAddress("203.0.113.10"), true)
  assert.equal(isPrivateOrReservedAddress("::ffff:127.0.0.1"), true)
  assert.equal(isPrivateOrReservedAddress("2001:db8::1"), true)
  assert.equal(isPrivateOrReservedAddress("8.8.8.8"), false)
  assert.equal(isPrivateOrReservedAddress("2606:4700:4700::1111"), false)
})

test("external image validation rejects private hosts without fetching remote content", async () => {
  const result = await validatePublicImageUrl("https://images.example/product.jpg", {
    resolveAddresses: async () => ["127.0.0.1"],
  })

  assert.equal(result, "")
})

test("external image validation accepts a public image URL without server-side retrieval", async () => {
  const result = await validatePublicImageUrl("https://images.example/product.jpg", {
    resolveAddresses: async () => ["8.8.8.8"],
  })

  assert.equal(result, "https://images.example/product.jpg")
})

test("B&H product pages receive a validated CDN image fallback", () => {
  assert.equal(
    getRetailerProductImageFallback(
      "bh",
      "https://www.bhphotovideo.com/c/product/1765622-REG/nikon_z8_mirrorless_camera.html",
    ),
    "https://static.bhphoto.com/images/images500x500/nikon_z8_mirrorless_camera_1765622.jpg",
  )
  assert.equal(
    getRetailerProductImageFallback("amazon", "https://www.amazon.com/dp/example"),
    "",
  )
  assert.equal(
    getRetailerProductImageFallback("bh", "https://example.com/c/product/1765622-REG/nikon_z8_mirrorless_camera.html"),
    "",
  )
})

test("affiliate tracking is applied only to Amazon product links", () => {
  assert.equal(
    withRetailerAffiliateTracking("https://www.amazon.com/dp/B0C123?ref_=example", "amazon", "photo-view-20"),
    "https://www.amazon.com/dp/B0C123?ref_=example&tag=photo-view-20",
  )
  assert.equal(
    withRetailerAffiliateTracking("https://www.amazon.com/dp/B0C123?tag=old-tag", "amazon", "new-tag"),
    "https://www.amazon.com/dp/B0C123?tag=new-tag",
  )
  assert.equal(
    withRetailerAffiliateTracking("https://www.bhphotovideo.com/c/product/1765622-REG/example.html", "bh", "not-used"),
    "https://www.bhphotovideo.com/c/product/1765622-REG/example.html",
  )
  assert.equal(
    withRetailerAffiliateTracking("https://www.amazon.com/dp/B0C123", "amazon", "  "),
    "https://www.amazon.com/dp/B0C123",
  )
  assert.equal(withRetailerAffiliateTracking("not a URL", "amazon", "photo-view-20"), "not a URL")
})

test("gear search ignores trailing list punctuation and builds tracked Amazon searches", () => {
  assert.equal(normalizeGearSearchEntry("  Sony A7R V camera body,  "), "Sony A7R V camera body")
  assert.equal(normalizeGearSearchEntry("Sony 16-35mm f/4 zoom."), "Sony 16-35mm f/4 zoom")
  assert.equal(normalizeGearSearchEntry("Sony FE 24-105mm f/4 zoom"), "Sony FE 24-105mm f/4 zoom")

  const searchUrl = new URL(getAmazonGearSearchUrl("Sony A7R V camera body,", "photo-view-20"))
  assert.equal(searchUrl.origin + searchUrl.pathname, "https://www.amazon.com/s")
  assert.equal(searchUrl.searchParams.get("k"), "Sony A7R V camera body")
  assert.equal(searchUrl.searchParams.get("tag"), "photo-view-20")
})

test("Amazon Creators API product data keeps official images and product pages", () => {
  assert.deepEqual(getAmazonCreatorsProductData({
    asin: "B0EXAMPLE",
    detailPageURL: "https://www.amazon.com/dp/B0EXAMPLE?tag=photo-view-20",
    images: {
      primary: {
        large: { url: "https://m.media-amazon.com/images/I/official.jpg" },
      },
    },
    itemInfo: {
      features: { displayValues: ["Full-frame mirrorless camera", "High-resolution sensor"] },
      title: { displayValue: "Sony Alpha camera" },
    },
  }), {
    asin: "B0EXAMPLE",
    description: "Full-frame mirrorless camera High-resolution sensor",
    imageUrl: "https://m.media-amazon.com/images/I/official.jpg",
    name: "Sony Alpha camera",
    url: "https://www.amazon.com/dp/B0EXAMPLE?tag=photo-view-20",
  })
})

test("Amazon gear images are kept only when the retailer CDN returns an image", async () => {
  const validUrl = "https://m.media-amazon.com/images/I/valid-product.jpg"
  const missingUrl = "https://m.media-amazon.com/images/I/made-up-product.jpg"
  const fetchImage = async (input: string) => new Response(input === validUrl ? "image" : "missing", {
    headers: { "Content-Type": input === validUrl ? "image/jpeg" : "text/plain" },
    status: input === validUrl ? 200 : 404,
  })
  const resolveAddresses = async () => ["54.239.28.85"]

  assert.equal(await validateGearProductImageUrl(validUrl, "amazon", fetchImage, resolveAddresses), validUrl)
  assert.equal(await validateGearProductImageUrl(missingUrl, "amazon", fetchImage, resolveAddresses), "")
  assert.equal(await validateGearProductImageUrl("https://untrusted.example/product.jpg", "amazon", fetchImage, resolveAddresses), "")
})

test("public gallery route segments accept only legacy or workspace-scoped shapes", () => {
  assert.deepEqual(resolvePublicGallerySegments(["travel"]), {
    gallerySlug: "travel",
    workspaceSlug: undefined,
  })
  assert.deepEqual(resolvePublicGallerySegments(["mitch-russo", "travel"]), {
    gallerySlug: "travel",
    workspaceSlug: "mitch-russo",
  })
  assert.equal(resolvePublicGallerySegments([]), null)
  assert.equal(resolvePublicGallerySegments(["one", "two", "three"]), null)
})

test("admin access is role based and cannot be granted by an environment email list", () => {
  const previousAdminEmails = process.env.ADMIN_EMAILS
  process.env.ADMIN_EMAILS = "owner@example.com"

  try {
    assert.equal(isAdminIdentity({ email: "owner@example.com", role: "user", systemRole: "USER" }), false)
    assert.equal(isAdminIdentity({ email: "legacy@example.com", role: "admin", systemRole: "USER" }), false)
    assert.equal(isAdminIdentity({ email: "support@example.com", systemRole: "SUPPORT" }), true)
    assert.equal(isAdminIdentity({ email: "owner@example.com", systemRole: "SUPERADMIN" }), true)
  } finally {
    if (previousAdminEmails === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = previousAdminEmails
  }
})

test("Stripe cutover validation checks plan prices and required webhook events", () => {
  const expected = {
    amount: 199,
    cycle: "monthly",
    envNames: ["STRIPE_PRICE_STARTER_MONTHLY"],
    interval: "month",
    plan: "Starter",
  }
  const validPrice = {
    active: true,
    currency: "usd",
    livemode: true,
    product: { active: true },
    recurring: { interval: "month", interval_count: 1 },
    type: "recurring",
    unit_amount: 199,
  }

  assert.deepEqual(validatePrice(validPrice, expected, "live"), [])
  assert.match(validatePrice({ ...validPrice, unit_amount: 299 }, expected, "live").join(" "), /expected 199/)
  assert.deepEqual(missingWebhookEvents(["*"]), [])
  assert.deepEqual(missingWebhookEvents(["checkout.session.completed"]), [
    "customer.subscription.created",
    "customer.subscription.deleted",
    "customer.subscription.updated",
    "invoice.payment_failed",
    "invoice.payment_succeeded",
  ])
})

test("Stripe webhook signatures reject tampering and replay attempts", () => {
  const now = Date.UTC(2026, 6, 13, 12, 0, 0)
  const timestamp = Math.floor(now / 1000)
  const payload = JSON.stringify({ id: "evt_test", type: "customer.subscription.updated" })
  const secret = "whsec_test_secret"
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")
  const staleTimestamp = timestamp - 301
  const staleSignature = createHmac("sha256", secret)
    .update(`${staleTimestamp}.${payload}`)
    .digest("hex")
  const validHeader = `t=${timestamp},v1=invalid-rotated-signature,v1=${signature}`

  assert.equal(verifyStripeWebhookSignature({ now, payload, secret, signatureHeader: validHeader }), true)
  assert.equal(verifyStripeWebhookSignature({ now, payload: `${payload} `, secret, signatureHeader: validHeader }), false)
  assert.equal(verifyStripeWebhookSignature({ now, payload, secret: "wrong-secret", signatureHeader: validHeader }), false)
  assert.equal(verifyStripeWebhookSignature({
    now,
    payload,
    secret,
    signatureHeader: `t=${staleTimestamp},v1=${staleSignature}`,
  }), false)
  assert.equal(verifyStripeWebhookSignature({ now, payload, secret, signatureHeader: "malformed" }), false)
})

test("Stripe cancellation scheduling recognizes period-end and explicit cancellation dates", () => {
  assert.equal(isStripeSubscriptionCancellationScheduled({ cancel_at_period_end: true }), true)
  assert.equal(isStripeSubscriptionCancellationScheduled({ cancel_at: 1_783_978_462 }), true)
  assert.equal(isStripeSubscriptionCancellationScheduled({ cancel_at: null, cancel_at_period_end: false }), false)
  assert.equal(isStripeSubscriptionCancellationScheduled({ cancel_at: 0 }), false)
})

test("subscriber lifecycle verification events never trigger customer messaging", () => {
  assert.equal(isSubscriberLifecycleVerificationObject({
    customer_email: "qa-lifecycle+owner-123@example.com",
  }), true)
  assert.equal(isSubscriberLifecycleVerificationObject({
    metadata: { source: "subscriber_lifecycle_verifier" },
  }), true)
  assert.equal(isSubscriberLifecycleVerificationObject({
    parent: { subscription_details: { metadata: { qaRunId: "123" } } },
  }), true)
  assert.equal(isSubscriberLifecycleVerificationObject({
    customer_email: "real-photographer@example.com",
    metadata: { source: "registration" },
  }), false)
})

test("subscriber onboarding progress reflects real completion signals", () => {
  const progress = calculateSubscriberOnboardingProgress({
    hasCover: true,
    hasPhotos: true,
    hasPortfolio: true,
    hasPreviewed: false,
    hasShared: false,
    hasVisibility: true,
  })

  assert.equal(progress.completedSteps, 4)
  assert.equal(progress.percent, 67)
  assert.equal(progress.totalSteps, 6)
  assert.deepEqual(
    [...previewedWorkspaceIds([
      { metadata: { workspaceId: "workspace-a" } },
      { metadata: { workspaceId: "workspace-a" } },
      { metadata: { another: "value" } },
      { metadata: null },
    ])],
    ["workspace-a"],
  )
})

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

test("Stripe trial invoices do not convert subscribers until money is actually collected", () => {
  assert.equal(isPaidStripeInvoice(0), false)
  assert.equal(isPaidStripeInvoice(undefined), false)
  assert.equal(isPaidStripeInvoice(299), true)
  assert.equal(getInvoiceSubscriptionStatus("invoice.payment_succeeded", 0), null)
  assert.equal(getInvoiceSubscriptionStatus("invoice.payment_succeeded", 299), "ACTIVE")
  assert.equal(getInvoiceSubscriptionStatus("invoice.payment_failed", 299), "PAST_DUE")
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
        { id: "camera-1", name: "Mirrorless body", description: "Compact travel body", imageUrl: "https://example.com/camera.jpg", retailer: "Camera Shop", url: "https://example.com/camera" },
        { id: "camera-2", name: "", description: "Unfinished draft", url: "" },
      ],
    },
  ])

  assert.equal(categories.length, 3)
  assert.equal(categories[0].title, "My cameras")
  assert.equal(categories[1].title, "Favorite lenses")
  assert.deepEqual(getCompletedWebsiteGearCategories(categories).map((category) => category.id), ["camera-bodies"])
  assert.equal(getCompletedWebsiteGearCategories(categories)[0].items.length, 1)
  assert.equal(categories[0].items[0].imageUrl, "https://example.com/camera.jpg")
  assert.equal(categories[0].items[0].retailer, "Camera Shop")
  assert.equal(categories[0].items[1].imageUrl, "")
  assert.equal(getSafeWebsiteGearImageUrl("javascript:alert(1)"), "")
  assert.equal(getSafeWebsiteGearImageUrl("http://example.com/product.jpg"), "")
  assert.equal(getSafeWebsiteGearImageUrl("https://user:secret@example.com/product.jpg"), "")
  assert.equal(getSafeWebsiteGearImageUrl("https://example.com/product.jpg"), "https://example.com/product.jpg")
  assert.equal(getSafeWebsiteGearImageUrl("/api/website/media/photo_123"), "/api/website/media/photo_123")
  assert.equal(getSafeWebsiteGearImageUrl("/api/website/media/../private"), "")
  assert.equal(getSafeWebsiteGearLink("javascript:alert(1)"), "")
  assert.equal(getSafeWebsiteGearLink("https://user:secret@example.com/product"), "")
  assert.equal(getSafeWebsiteGearLink("https://example.com/product"), "https://example.com/product")
})

test("website PNG uploads include their portfolio and public asset purpose", async () => {
  const originalFetch = globalThis.fetch
  let submittedForm: FormData | null = null
  globalThis.fetch = async (_input, init) => {
    submittedForm = init?.body as FormData
    return Response.json({
      downloadUrl: "/api/website/media/photo-1?variant=download",
      ok: true,
      pathname: "website/about/portrait.png",
      provider: "r2",
      size: 4,
      url: "/api/website/media/photo-1",
    })
  }

  try {
    const file = new File([new Uint8Array([137, 80, 78, 71])], "portrait.png", { type: "image/png" })
    const result = await uploadPhotoFromClient("website/about/portrait.png", file, {
      assetPurpose: "website",
      galleryId: "travel-portfolio",
      title: "Website About photo",
    })

    const submitted = submittedForm as FormData | null
    assert.ok(submitted)
    assert.equal(submitted.get("assetPurpose"), "website")
    assert.equal(submitted.get("galleryId"), "travel-portfolio")
    assert.equal((submitted.get("file") as File).type, "image/png")
    assert.equal(result.url, "/api/website/media/photo-1")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Quick Add Gear approves only selected, named, non-duplicate products", () => {
  const categories = normalizeWebsiteGearCategories([
    {
      id: "camera-bodies",
      title: "Camera bodies",
      items: [{ id: "existing-camera", name: "Nikon Z8", description: "", imageUrl: "", retailer: "B&H Photo", url: "https://example.com/nikon-z8" }],
    },
  ])
  const result = addApprovedWebsiteGearItems(categories, [
    { approved: true, categoryId: "favorite-lenses", description: "Fast standard zoom", id: "review-1", imageUrl: "https://example.com/lens.jpg", name: "NIKKOR Z 24-70mm f/2.8 S", retailer: "B&H Photo", url: "https://example.com/lens" },
    { approved: false, categoryId: "travel-accessories", description: "Not selected", id: "review-2", imageUrl: "", name: "Travel tripod", retailer: "B&H Photo", url: "https://example.com/tripod" },
    { approved: true, categoryId: "camera-bodies", description: "Duplicate name", id: "review-3", imageUrl: "", name: "nikon z8", retailer: "B&H Photo", url: "https://example.com/another-z8" },
    { approved: true, categoryId: "camera-bodies", description: "Missing name", id: "review-4", imageUrl: "", name: "  ", retailer: "B&H Photo", url: "https://example.com/unnamed" },
  ], (categoryId, itemIndex) => `${categoryId}-test-${itemIndex}`)

  assert.equal(result.importedCount, 1)
  assert.deepEqual(result.categories[1].items.at(-1), {
    description: "Fast standard zoom",
    id: "favorite-lenses-test-0",
    imageUrl: "https://example.com/lens.jpg",
    name: "NIKKOR Z 24-70mm f/2.8 S",
    retailer: "B&H Photo",
    url: "https://example.com/lens",
  })
  assert.equal(result.categories.flatMap((category) => category.items).some((item) => item.name === "Travel tripod"), false)
})

test("approved gear survives the website draft save and reload round trip", () => {
  const initialCategories = normalizeWebsiteGearCategories([])
  const approved = addApprovedWebsiteGearItems(initialCategories, [
    { approved: true, categoryId: "camera-bodies", description: "My primary body", id: "review-1", imageUrl: "https://example.com/z8.jpg", name: "Nikon Z8", retailer: "B&H Photo", url: "https://example.com/z8?affiliate=photographer" },
  ], () => "saved-camera")
  const savedDraft = JSON.parse(JSON.stringify({ gearCategories: approved.categories })) as { gearCategories: unknown }
  const reloadedCategories = normalizeWebsiteGearCategories(savedDraft.gearCategories)

  assert.equal(approved.importedCount, 1)
  assert.deepEqual(reloadedCategories[0].items.at(-1), {
    description: "My primary body",
    id: "saved-camera",
    imageUrl: "https://example.com/z8.jpg",
    name: "Nikon Z8",
    retailer: "B&H Photo",
    url: "https://example.com/z8?affiliate=photographer",
  })
})

test("deleting saved gear removes only the selected product and persists after reload", () => {
  const categories = normalizeWebsiteGearCategories([
    {
      id: "camera-bodies",
      title: "Camera bodies",
      items: [
        { id: "keep-camera", name: "Nikon Z8", description: "Keep", imageUrl: "", retailer: "B&H Photo", url: "https://example.com/z8" },
        { id: "delete-camera", name: "Nikon Z6 III", description: "Remove", imageUrl: "", retailer: "B&H Photo", url: "https://example.com/z6" },
      ],
    },
  ])
  const afterDeletion = removeWebsiteGearItem(categories, "camera-bodies", "delete-camera")
  const reloadedCategories = normalizeWebsiteGearCategories(JSON.parse(JSON.stringify(afterDeletion)))

  assert.deepEqual(reloadedCategories[0].items.map((item) => item.id), ["keep-camera"])
  assert.equal(reloadedCategories[1].items.length, 1)
  assert.equal(categories[0].items.length, 2)
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
