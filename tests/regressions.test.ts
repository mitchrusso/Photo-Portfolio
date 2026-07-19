import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { uploadPhotoFromClient } from "../src/lib/client-photo-upload.ts"
import { getAmazonCreatorsProductData } from "../src/lib/amazon-creators.ts"
import { mapWithConcurrency } from "../src/lib/async-concurrency.ts"
import { featureAcademySequence } from "../src/lib/feature-academy.ts"
import { isDeliverableAutomationEmail } from "../src/lib/email-address-safety.ts"
import { getAppUrl } from "../src/lib/app-url.ts"
import { normalizeAiHelpAnswer } from "../src/lib/ai-help-format.ts"
import { findRelevantAiHelpTopics } from "../src/lib/ai-help-knowledge.ts"
import { autoresponderAudiences, notifyAutoresponder } from "../src/lib/autoresponder.ts"
import { isAdminIdentity } from "../src/lib/admin-access.ts"
import { normalizeDatabaseConnectionString } from "../src/lib/database-connection.ts"
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
import { validateFeedbackAttachment } from "../src/lib/feedback-attachment-safety.ts"
import {
  createR2ObjectReference,
  getPhotoDeliveryUrl,
  getPhotoStorageProvider,
  resolveR2ObjectReference,
  uniqueManagedPhotoReferences,
} from "../src/lib/photo-storage.ts"
import { findStoredCoverPhotoId } from "../src/lib/portfolio-cover.ts"
import { formatGalleryPosition, formatImageCount } from "../src/lib/portfolio-counts.ts"
import { isAllowedPortfolioImageContentType } from "../src/lib/portfolio-upload-rules.ts"
import { isPrivateOrReservedAddress, validatePublicImageUrl } from "../src/lib/public-network-url.ts"
import { readResponseBytesLimited } from "../src/lib/limited-response.ts"
import {
  getPublicSiteHost,
  getPublicSiteSubdomain,
  getPublicSiteUrl,
} from "../src/lib/site-domain.ts"
import {
  calculateSubscriberOnboardingProgress,
  previewedWorkspaceIds,
} from "../src/lib/onboarding-progress-rules.ts"
import {
  criticalAlertCooldownElapsed,
  stripeWebhookStaleBefore,
  usageAlertWasDelivered,
} from "../src/lib/operational-health-rules.ts"
import {
  embedGalleryPath,
  embedPhotoKey,
  embedPortfolioPath,
  galleryAccessPath,
  getPublicGalleryCoverUrl,
  mobilePortfolioPath,
  parseEmbedPhotoKey,
  publicGalleryPath,
  publicPortfolioPath,
  resolvePublicGallerySegments,
  uniqueGalleryPhotos,
  type PortfolioPhoto,
} from "../src/lib/gallery-utils.ts"
import { sumStoredPhotoBytes } from "../src/lib/storage-math.ts"
import { normalizeSocialAccountInput, normalizeSocialAccounts } from "../src/lib/social-account-url.ts"
import { createStripePortalSession } from "../src/lib/stripe-rest.ts"
import {
  getInvoiceSubscriptionStatus,
  isPaidStripeInvoice,
  isStripeSubscriptionCancellationScheduled,
} from "../src/lib/stripe-lifecycle-rules.ts"
import { isSubscriberLifecycleVerificationObject } from "../src/lib/stripe-webhook-notification-rules.ts"
import { verifyStripeWebhookSignature } from "../src/lib/stripe-webhook-signature.ts"
import { getSafeWebsiteActionUrl } from "../src/lib/website-url-safety.ts"
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
import { getWebsiteImageFramePresentation } from "../src/lib/website-image-frame.ts"
import { getWebsitePublicationIssues } from "../src/lib/website-publication-readiness.ts"
import {
  getWebsiteHeroHeadlineStyle,
  normalizeWebsiteHeroHeadlineSize,
} from "../src/lib/website-hero-typography.ts"
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
  applySocialCampaignTemplate,
  defaultSocialCampaignDesign,
} from "../src/lib/social-campaign-design.ts"
import { signSocialRender, verifySocialRender } from "../src/lib/social-render-signing.ts"
import { createSocialOAuthState, verifySocialOAuthState } from "../src/lib/social-oauth-state.ts"
import { decryptSocialToken, encryptSocialToken } from "../src/lib/social-token-crypto.ts"
import { settingsTabs } from "../src/components/portfolio/portfolio-dashboard-model.ts"
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

test("sharing uses opaque secure links and confirms clipboard success", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const secureRouteSource = readFileSync(join(process.cwd(), "src/app/s/[token]/page.tsx"), "utf8")
  const mediaRouteSource = readFileSync(join(process.cwd(), "src/app/api/media/[galleryId]/[photoId]/route.ts"), "utf8")

  assert.match(dashboardSource, /fetch\("\/api\/secure-share-links"/)
  assert.match(dashboardSource, /Share link copied to clipboard\./)
  assert.match(dashboardSource, /<span>Copied<\/span>/)
  assert.match(dashboardSource, /setShareLinkCopyStatus\("error"\)/)
  assert.match(secureRouteSource, /parseSecureShareToken/)
  assert.match(secureRouteSource, /robots: \{ follow: false, index: false \}/)
  assert.match(mediaRouteSource, /secureShareTargetAllows/)
})

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : [path]
  })
}

test("active application source uses only the PhotoView.io subscriber-facing brand", () => {
  const legacyReferences = sourceFiles(join(process.cwd(), "src"))
    .filter((path) => /\.(?:ts|tsx)$/.test(path))
    .flatMap((path) => {
      const contents = readFileSync(path, "utf8")
      return /PhotoViewPro|PhotoVue|photoviewpro\.com/.test(contents) ? [path] : []
    })

  assert.deepEqual(legacyReferences, [])
})

test("subscriber registration requires and records a versioned license click-signature", () => {
  const registerSource = readFileSync(join(process.cwd(), "src/app/register/page.tsx"), "utf8")
  const registrationRouteSource = readFileSync(join(process.cwd(), "src/app/api/trial/register/route.ts"), "utf8")
  const onboardingSource = readFileSync(join(process.cwd(), "src/lib/subscriber-onboarding.ts"), "utf8")
  const licenseSource = readFileSync(join(process.cwd(), "src/app/license/2026-07-16/page.tsx"), "utf8")
  const schemaSource = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8")

  assert.match(registerSource, /name="subscriberLicenseAccepted" required type="checkbox"/)
  assert.match(registerSource, /I intend to electronically sign that agreement/)
  assert.match(registerSource, /href=\{SUBSCRIBER_LICENSE_PATH\}/)
  assert.match(registerSource, /Subscriber License Agreement shown above/)
  assert.match(registerSource, /SUBSCRIBER_LICENSE_SECTIONS\.map/)
  assert.doesNotMatch(registerSource, /name="marketingConsent"/)
  assert.match(registerSource, /setup, and trial education emails/)
  assert.match(registrationRouteSource, /subscriberLicenseAccepted: z\.literal\(true\)/)
  assert.match(registrationRouteSource, /subscriberLicenseVersion: SUBSCRIBER_LICENSE_VERSION/)
  assert.match(onboardingSource, /subscriberLicenseSignerName/)
  assert.match(schemaSource, /subscriberLicenseAcceptedAt DateTime\?/)
  assert.match(licenseSource, /Version \{SUBSCRIBER_LICENSE_VERSION\}/)
  assert.match(licenseSource, /registration checkbox is not preselected/)
})

test("website builder keeps templates above one unified accordion menu", () => {
  const source = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(source, /data-testid="website-template-filmstrip"/)
  assert.match(source, /Choose a site template/)
  assert.match(source, /Build your site/)
  assert.match(source, /Template controls/)
  assert.match(source, /Customize colors, fonts, image frames, and shapes/)
  assert.match(source, /className=\{`shrink-0 overflow-hidden rounded-md border transition/)
  assert.match(source, /data-testid="website-template-controls-card"/)
  assert.match(source, /data-testid="website-template-controls-panel"/)
  assert.match(source, /overflow-y-scroll.*overscroll-contain/)
  assert.match(source, /onWheelCapture=\{\(event\) => event\.stopPropagation\(\)\}/)
  assert.match(source, /height: "min\(52vh, 520px\)"/)
  assert.match(source, /scrollbarGutter: "stable"/)
  assert.match(source, /tabIndex=\{0\}/)
  assert.doesNotMatch(source, /Step 1\. Design|Step 2\. Site|Step 3\. Build/)
  assert.match(source, /aria-expanded=\{websiteBuilderTool === "style"\}/)
  assert.match(source, /aria-expanded=\{isOpen\}/)
  assert.match(source, /createPortal\(/)
  assert.match(source, /Open Template controls or a page below, make your changes, then click its heading again to close it\./)
})

test("gallery template picker fills the live-preview row while preserving its own scrolling", () => {
  const source = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(source, /data-testid="gallery-template-scroll-region"/)
  assert.match(source, /aria-label="Portfolio shown in live gallery preview"/)
  assert.match(source, /onChange=\{\(event\) => setActiveGalleryId\(event\.target\.value\)\}/)
  assert.match(source, /\{galleries\.map\(\(gallery\) => \(/)
  assert.match(source, /rounded-md border border-\[#e5ded2\] p-3 lg:flex lg:min-h-0 lg:flex-col/)
  assert.match(source, /h-\[470px\] min-h-\[320px\] max-h-\[60vh\].*lg:h-0 lg:min-h-\[470px\] lg:max-h-none lg:flex-1/)
  assert.doesNotMatch(source, /self-start rounded-md border border-\[#e5ded2\] p-3/)
  assert.doesNotMatch(source, /grid max-h-\[430px\] gap-2 overflow-y-auto/)
})

test("website builder keeps a compact side-by-side laptop workspace and sticky Preview action", () => {
  const source = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(source, /lg:grid-cols-\[360px_minmax\(0,1fr\)\]/)
  assert.match(source, /xl:grid-cols-\[380px_minmax\(0,1fr\)\]/)
  assert.match(source, /lg:max-h-\[calc\(100vh-7rem\)\]/)
  assert.match(source, /data-testid="website-live-canvas-header"[\s\S]*data-testid="website-live-preview-button"/)
  assert.match(source, /lg:sticky lg:top-2 lg:col-start-2/)
  assert.match(source, /openWebsiteSectionEditor/)
  assert.match(source, /Its controls are open in the <strong>Build your site<\/strong> panel on the left/)
  assert.match(source, /Hero video paused while editing/)
  assert.doesNotMatch(source, /autoPlay/)

  const visitorPreviewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")
  assert.match(visitorPreviewSource, /<video[\s\S]*autoPlay/)
})

test("subscriber guided help is presented as Tours", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const toursSource = readFileSync(join(process.cwd(), "src/components/website/merlin-walkthrough.tsx"), "utf8")

  assert.match(dashboardSource, /ToursWalkthrough/)
  assert.match(toursSource, /PhotoView\.io Tours/)
  assert.match(toursSource, /Take a Tour/)
  assert.match(toursSource, /Build my tour/)
  assert.doesNotMatch(toursSource, />Merlin|Merlin walkthrough|tell Merlin/)
})

test("signed-in subscribers can send secure feedback with supporting files", () => {
  const feedbackSource = readFileSync(join(process.cwd(), "src/components/feedback/subscriber-feedback.tsx"), "utf8")
  const feedbackRouteSource = readFileSync(join(process.cwd(), "src/app/api/feedback/route.ts"), "utf8")

  assert.match(feedbackSource, /Bug\/Feature Request/)
  assert.match(feedbackSource, /<option value="bug">Bug<\/option>/)
  assert.match(feedbackSource, /<option value="improvement">Improvement<\/option>/)
  assert.match(feedbackSource, /<option value="question">Question<\/option>/)
  assert.match(feedbackSource, /<option value="feedback">Feedback<\/option>/)
  assert.match(feedbackSource, /Take screenshot/)
  assert.match(feedbackSource, /foreignObjectRendering: false/)
  assert.match(feedbackSource, /data-feedback-capture-ignore/)
  assert.match(feedbackSource, /The feedback form will return when the screenshot is attached\./)
  assert.match(feedbackSource, /Screenshot captured and attached\./)
  assert.match(feedbackSource, /Attach files/)
  assert.match(feedbackSource, /session\?\.user\?\.email/)
  assert.match(feedbackSource, /session\?\.user\?\.name/)
  assert.match(feedbackRouteSource, /const session = await auth\(\)/)
  assert.match(feedbackRouteSource, /checkRequestRateLimit\(`feedback:/)
  assert.match(feedbackRouteSource, /MAX_TOTAL_ATTACHMENT_BYTES/)
  assert.match(feedbackRouteSource, /process\.env\.FEEDBACK_EMAIL/)
  assert.match(feedbackRouteSource, /reply_to: reporterEmail/)
})

test("subscriber shortcuts expose referrals and the compact website toolbar", () => {
  const feedbackSource = readFileSync(join(process.cwd(), "src/components/feedback/subscriber-feedback.tsx"), "utf8")
  const accountSource = readFileSync(join(process.cwd(), "src/components/account/overage-settings-form.tsx"), "utf8")
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(feedbackSource, />\s*Earn more storage\s*</)
  assert.match(feedbackSource, /href="\/account#referrals"/)
  assert.match(feedbackSource, /showFloatingShortcuts = pathname === "\/dashboard" \|\| pathname\.startsWith\("\/dashboard\/"\)/)
  assert.match(feedbackSource, /\{showFloatingShortcuts \? \(/)
  assert.match(accountSource, /id="referrals"/)
  assert.match(dashboardSource, /data-testid="website-builder-toolbar"/)
  assert.match(dashboardSource, /gap-2 overflow-hidden rounded-md border/)
  assert.doesNotMatch(dashboardSource, /website-builder-toolbar[^\n]*overflow-x-auto/)
  assert.match(dashboardSource, /activePanel !== "website"/)
  assert.match(dashboardSource, /<span className="hidden text-base font-semibold 2xl:inline">Site<\/span>/)
  assert.match(dashboardSource, /max-2xl:w-10 max-2xl:justify-center/)
  assert.match(feedbackSource, /w-\[calc\(240px-2rem\)\]/)
})

test("subscriber dashboard header stays condensed and non-scrollable", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const dashboardPageSource = readFileSync(join(process.cwd(), "src/app/dashboard/page.tsx"), "utf8")

  assert.match(dashboardSource, /data-testid="dashboard-header-toolbar"/)
  assert.match(dashboardSource, /title=\{subscriberName\}>\{subscriberName\}/)
  assert.doesNotMatch(dashboardSource, />Portfolio dashboard</)
  assert.match(dashboardPageSource, /subscriberName=\{session\?\.user\?\.name\?\.trim\(\) \|\| "Your portfolio"\}/)
  assert.match(dashboardSource, /items-center gap-3 overflow-hidden border-b px-5 py-2\.5/)
  assert.match(dashboardSource, /truncate text-lg font-semibold md:text-xl/)
  assert.equal(
    (dashboardSource.match(/buttonClassName=\{`flex h-10 w-10 shrink-0 items-center justify-center gap-0 rounded-md border px-0 text-\[0px\] font-medium/g) ?? []).length,
    0,
  )
  assert.match(dashboardSource, /data-testid="settings-help-tools"/)
  assert.match(dashboardSource, /context="settings"/)
  assert.match(dashboardSource, /buttonTitle=\{`Ask AI how to use \$\{activeSettingsTab\.label\} settings`\}/)
  assert.match(dashboardSource, /className=\{`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border px-0 text-sm font-medium/)
  assert.match(dashboardSource, /<span className="sr-only">\{isDark \? "Light" : "Dark"\}<\/span>/)
  assert.doesNotMatch(dashboardSource, /dashboard-header-toolbar[^\n]*overflow-x-auto/)
})

test("library exposes permanent single, bulk, and portfolio deletion controls", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const portfolioDeleteRoute = readFileSync(join(process.cwd(), "src/app/api/portfolio/galleries/[galleryId]/route.ts"), "utf8")

  assert.match(dashboardSource, /void deleteLibraryPhotos\(selectedLibraryItems\)/)
  assert.match(dashboardSource, /void deleteLibraryPhotos\(\[activeLibraryItem\]\)/)
  assert.match(dashboardSource, /void deleteActivePortfolio\(\)/)
  assert.match(dashboardSource, /Type DELETE to confirm/)
  assert.match(portfolioDeleteRoute, /await tx\.gallery\.delete/)
  assert.match(portfolioDeleteRoute, /processStorageDeletionJobs/)
})

test("marketing highlights Hero video and no longer links to a private-photo demo", () => {
  const homeSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")
  const heroSource = readFileSync(join(process.cwd(), "src/components/site/home-hero.tsx"), "utf8")
  const headerSource = readFileSync(join(process.cwd(), "src/components/site/site-header.tsx"), "utf8")

  assert.match(homeSource, /website header can use a photograph or an uploaded looping MP4 video/)
  assert.match(homeSource, /one uploaded MP4 Hero video/)
  assert.doesNotMatch(heroSource, /href="\/demo"/)
  assert.doesNotMatch(headerSource, /\["Demo", "\/demo"\]/)
})

test("public homepage sharing uses a dedicated PhotoView.io image instead of subscriber photography", () => {
  const layoutSource = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8")
  const openGraphSource = readFileSync(join(process.cwd(), "src/app/opengraph-image.tsx"), "utf8")

  assert.match(layoutSource, /url: "\/opengraph-image"/)
  assert.match(layoutSource, /card: "summary_large_image"/)
  assert.match(openGraphSource, /width: 1200/)
  assert.match(openGraphSource, /height: 630/)
  assert.match(openGraphSource, /A beautiful home for the photography you care about most/)
  assert.doesNotMatch(openGraphSource, /migratedGalleries|subscriber|gallery\.cover|\/api\/media/)
})

test("hero headline sizing stays proportional across builder and preview", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")

  assert.equal(normalizeWebsiteHeroHeadlineSize(undefined), 100)
  assert.equal(normalizeWebsiteHeroHeadlineSize(55), 70)
  assert.equal(normalizeWebsiteHeroHeadlineSize(155), 140)
  assert.deepEqual(getWebsiteHeroHeadlineStyle(100), {
    fontSize: "clamp(2.250rem, 5.500cqw, 4.500rem)",
  })
  assert.match(dashboardSource, /aria-label="Hero headline size"/)
  assert.match(dashboardSource, /getWebsiteHeroHeadlineStyle\(websiteSettings\.heroHeadlineSize\)/)
  assert.match(previewSource, /getWebsiteHeroHeadlineStyle\(settings\.heroHeadlineSize\)/)
  assert.match(dashboardSource, /containerType: "inline-size"/)
  assert.match(previewSource, /containerType: "inline-size"/)
})

test("Hero video is direct-uploaded, server-verified, paused in builder, and rendered in visitor preview", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")
  const routeSource = readFileSync(join(process.cwd(), "src/app/api/website/hero-video/route.ts"), "utf8")
  const storageSource = readFileSync(join(process.cwd(), "src/lib/photo-storage.ts"), "utf8")

  assert.match(dashboardSource, /Upload Hero video/)
  assert.match(dashboardSource, /HERO_VIDEO_MAX_BYTES = 200 \* 1024 \* 1024/)
  assert.match(dashboardSource, /HERO_VIDEO_MAX_SECONDS = 90/)
  assert.match(dashboardSource, /fetch\(initialized\.uploadUrl/)
  assert.match(dashboardSource, /Hero video paused while editing/)
  assert.doesNotMatch(dashboardSource, /autoPlay/)
  assert.match(previewSource, /settings\.heroImageMode === "video"/)
  assert.match(previewSource, /autoPlay[\s\S]*loop[\s\S]*muted[\s\S]*playsInline/)
  assert.doesNotMatch(previewSource, /poster=\{normalizedHeroCoverSources\[0\]\}/)
  assert.match(previewSource, /className="absolute inset-0 size-full bg-black object-contain"/)
  assert.match(previewSource, /failedHeroVideoUrl !== settings\.heroVideoUrl/)
  assert.match(previewSource, /onError=\{\(\) => setFailedHeroVideoUrl\(settings\.heroVideoUrl\)\}/)
  assert.match(routeSource, /const HERO_VIDEO_MAX_BYTES = 200 \* 1024 \*\* 2/)
  assert.match(routeSource, /const HERO_VIDEO_MAX_SECONDS = 90/)
  assert.match(routeSource, /readMp4Duration/)
  assert.match(routeSource, /assetPurpose: "website"/)
  assert.match(storageSource, /createDirectPhotoUpload/)
  assert.match(storageSource, /HeadObjectCommand/)
})

test("website help and tooltips describe the unified builder interface", () => {
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")

  assert.match(helpSource, /Site templates appear in a horizontal filmstrip above the workspace/)
  assert.match(helpSource, /left Build your site menu contains one expandable Template controls card followed by expandable page cards/)
  assert.match(helpSource, /Use Save changes after editing text, design, or page order/)
  assert.doesNotMatch(helpSource, /Build, Design, and Site tools|Open Design|Open Site|Open Build|left Build menu/)
  assert.doesNotMatch(helpSource, /Save draft/)
  assert.match(previewSource, /choose a template from the filmstrip, then use Template controls and the page cards/)
  assert.doesNotMatch(previewSource, /select the Design tab/)
  assert.match(getWebsiteEditHint("Featured work", "section").description, /Build your site menu/)
})

test("trip entries can link directly to a selected subscriber portfolio", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")

  assert.match(dashboardSource, /Portfolio for this trip/)
  assert.match(dashboardSource, /Trip \$\{tripIndex \+ 1\} associated portfolio/)
  assert.match(dashboardSource, /gallery\.privacy !== "Client portal"/)
  assert.match(dashboardSource, /password required/)
  assert.match(previewSource, /gallery\.id === trip\.galleryId/)
  assert.match(previewSource, /publicGalleryPath\(linkedGallery\.id, linkedGallery\.workspaceSlug\)/)
  assert.match(helpSource, /select the exact portfolio the trip button should open/)
})

test("published website subdomains accept safe workspace slugs and reject platform hosts", () => {
  assert.equal(getPublicSiteSubdomain("mitch-russo.photoview.io"), "mitch-russo")
  assert.equal(getPublicSiteSubdomain("MITCH-RUSSO.PHOTOVIEW.IO:443"), "mitch-russo")
  assert.equal(getPublicSiteSubdomain("photoview.io"), "")
  assert.equal(getPublicSiteSubdomain("www.photoview.io"), "")
  assert.equal(getPublicSiteSubdomain("nested.mitch-russo.photoview.io"), "")
  assert.equal(getPublicSiteSubdomain("mitch-russo.example.com"), "")
  assert.equal(getPublicSiteHost("Mitch-Russo"), "mitch-russo.photoview.io")
  assert.equal(getPublicSiteUrl("mitch-russo"), "https://mitch-russo.photoview.io")
})

test("published websites render saved settings on the first server and client pass", () => {
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")
  const publicationSource = readFileSync(join(process.cwd(), "src/lib/website-publication.ts"), "utf8")
  const persistenceSource = readFileSync(join(process.cwd(), "src/lib/portfolio-persistence.ts"), "utf8")

  assert.match(previewSource, /return mode === "published"\s+\? mergeWebsitePreviewSettings\(defaults, \(initialSettings \?\? \{\}\)/)
  assert.match(previewSource, /const \[hasDraft, setHasDraft\] = useState\(mode === "published"\)/)
  assert.match(publicationSource, /getPublicWorkspacePortfolioGalleries/)
  assert.doesNotMatch(publicationSource, /getWorkspacePortfolioGalleries/)
  assert.match(persistenceSource, /privacy: \{[\s\S]*?in: \["PUBLIC"\]/)
  assert.match(persistenceSource, /blobUrl: deliveryUrl/)
  assert.match(persistenceSource, /downloadUrl: `\$\{deliveryUrl\}\$\{deliveryUrl\.includes\("\?"\) \? "&" : "\?"\}variant=download`/)
})

test("subscribers can save a public website address without changing their workspace slug", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const addressRouteSource = readFileSync(join(process.cwd(), "src/app/api/website/address/route.ts"), "utf8")
  const publicationSource = readFileSync(join(process.cwd(), "src/lib/website-publication.ts"), "utf8")

  assert.match(dashboardSource, /onChange=\{\(event\) => \{\s+const subdomain/)
  assert.doesNotMatch(dashboardSource, /readOnly\s+value=\{workspaceSlug \|\| websiteSettings\.subdomain\}/)
  assert.match(addressRouteSource, /websiteSubdomain: subdomain/)
  assert.match(addressRouteSource, /already in use/)
  assert.match(publicationSource, /websiteSubdomain: publicSiteSlug/)
})

test("TinyEmail contacts are assigned to the PhotoView.io audience that triggers their sequence", async () => {
  const originalFetch = globalThis.fetch
  const previousApiKey = process.env.TINYEMAIL_API_KEY
  const previousApiBaseUrl = process.env.TINYEMAIL_API_BASE_URL
  const requests: Array<{ body?: string; method: string; url: string }> = []

  process.env.TINYEMAIL_API_KEY = "tinyemail-test-key"
  process.env.TINYEMAIL_API_BASE_URL = "https://tinyemail.example/v1"
  globalThis.fetch = async (input, init) => {
    const url = String(input)
    const method = init?.method ?? "GET"
    requests.push({ body: typeof init?.body === "string" ? init.body : undefined, method, url })

    if (url.endsWith("/account/customer/test%40example.com")) return new Response(null, { status: 404 })
    if (url.endsWith("/account/customer")) return Response.json({ ok: true })
    if (url.endsWith("/audiences")) {
      return Response.json({ contacts: [{ id: "trial-audience", name: autoresponderAudiences.trial }] })
    }
    if (url.endsWith("/audiences/trial-audience")) return new Response(null, { status: 204 })
    return new Response(null, { status: 500 })
  }

  try {
    assert.equal(await notifyAutoresponder({
      addTags: ["photoviewpro:trial"],
      email: "test@example.com",
      event: "trial_started",
      firstName: "Test",
      lastName: "Photographer",
      list: autoresponderAudiences.trial,
    }), "sent")

    const assignment = requests.find((request) => request.url.endsWith("/audiences/trial-audience"))
    assert.ok(assignment)
    assert.equal(assignment.method, "PUT")
    assert.deepEqual(JSON.parse(assignment.body ?? "{}"), {
      assignMembers: [{
        email: "test@example.com",
        firstName: "Test",
        lastName: "Photographer",
        source: "PhotoView.io",
        tags: ["photoviewpro:trial"],
      }],
      unAssignMembers: [],
    })
  } finally {
    globalThis.fetch = originalFetch
    if (previousApiKey === undefined) delete process.env.TINYEMAIL_API_KEY
    else process.env.TINYEMAIL_API_KEY = previousApiKey
    if (previousApiBaseUrl === undefined) delete process.env.TINYEMAIL_API_BASE_URL
    else process.env.TINYEMAIL_API_BASE_URL = previousApiBaseUrl
  }
})

test("feature academy schedules 15 unique tutorials without an existing-customer email burst", () => {
  assert.equal(featureAcademySequence.length, 15)
  assert.equal(new Set(featureAcademySequence.map((item) => item.key)).size, 15)
  assert.deepEqual(featureAcademySequence.map((item) => item.customerDay), [
    14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70,
  ])
  assert.deepEqual(featureAcademySequence.map((item) => item.rolloutDay), [
    1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57,
  ])
})

test("lifecycle automation skips reserved development and test email domains", () => {
  assert.equal(isDeliverableAutomationEmail("dev@example.com"), false)
  assert.equal(isDeliverableAutomationEmail("qa@sub.example.org"), false)
  assert.equal(isDeliverableAutomationEmail("tester@product.test"), false)
  assert.equal(isDeliverableAutomationEmail("owner@localhost"), false)
  assert.equal(isDeliverableAutomationEmail("subscriber@yahoo.com"), true)
})

test("static public portfolio covers bypass database-only media routes", () => {
  const staticGallery = {
    cover: "https://images.example/cover.jpg",
    id: "legacy-gallery",
    photos: [],
  }

  assert.equal(getPublicGalleryCoverUrl(staticGallery), staticGallery.cover)
  assert.equal(normalizeAiHelpAnswer("Open **My Website** and choose `Build`."), "Open My Website and choose Build.")
})

test("database connections preserve strict TLS semantics without warning noise", () => {
  const prismaConfigSource = readFileSync(join(process.cwd(), "prisma.config.ts"), "utf8")

  assert.equal(
    normalizeDatabaseConnectionString("postgres://example.test/db?sslmode=require"),
    "postgres://example.test/db?sslmode=verify-full",
  )
  assert.equal(
    normalizeDatabaseConnectionString("postgres://example.test/db?pool=true&sslmode=prefer"),
    "postgres://example.test/db?pool=true&sslmode=verify-full",
  )
  assert.equal(
    normalizeDatabaseConnectionString("postgres://example.test/db?sslmode=disable"),
    "postgres://example.test/db?sslmode=disable",
  )
  assert.match(prismaConfigSource, /DATABASE_URL_UNPOOLED/)
  assert.match(prismaConfigSource, /POSTGRES_URL_NON_POOLING/)
  assert.ok(prismaConfigSource.indexOf("DATABASE_URL_UNPOOLED") < prismaConfigSource.indexOf('process.env["DATABASE_URL"]'))
})

test("operational health rules preserve retries without duplicate alerts", () => {
  const now = new Date("2026-07-14T20:30:00.000Z")

  assert.equal(criticalAlertCooldownElapsed(null, now), true)
  assert.equal(criticalAlertCooldownElapsed(new Date("2026-07-14T20:01:00.000Z"), now), false)
  assert.equal(criticalAlertCooldownElapsed(new Date("2026-07-14T20:00:00.000Z"), now), true)
  assert.equal(stripeWebhookStaleBefore(now).toISOString(), "2026-07-14T20:25:00.000Z")
  assert.equal(usageAlertWasDelivered({ autoresponderStatus: "failed", emailStatus: "failed" }), false)
  assert.equal(usageAlertWasDelivered({ autoresponderStatus: "sent", emailStatus: "failed" }), true)
  assert.equal(usageAlertWasDelivered({ autoresponderStatus: "failed", emailStatus: "sent" }), true)
})

test("public gallery routes are workspace scoped and preserve legacy links", () => {
  assert.equal(publicGalleryPath("travel", "mitch-russo"), "/g/mitch-russo/travel")
  assert.equal(embedGalleryPath("travel", "mitch-russo"), "/embed/mitch-russo/travel")
  assert.equal(galleryAccessPath("travel", "mitch-russo"), "/api/gallery-access/mitch-russo/travel")
  assert.equal(publicGalleryPath("travel"), "/g/travel")
  assert.notEqual(publicGalleryPath("travel", "photographer-a"), publicGalleryPath("travel", "photographer-b"))
  assert.equal(publicGalleryPath("My Trip", "Jane Doe"), "/g/Jane%20Doe/My%20Trip")
})

test("portfolio share and embed routes remain workspace scoped with explicit selections", () => {
  assert.equal(publicPortfolioPath("photographer-a"), "/portfolio/photographer-a")
  assert.equal(embedPortfolioPath("photographer-a"), "/embed/photographer-a")
  assert.equal(
    embedPortfolioPath("photographer-a", { galleryIds: ["portraits", "travel", "portraits"] }),
    "/embed/photographer-a?galleries=portraits%2Ctravel",
  )
  assert.equal(embedPhotoKey("travel", "photo-1"), "travel::photo-1")
  assert.deepEqual(parseEmbedPhotoKey("travel::photo-1"), { galleryId: "travel", photoId: "photo-1" })
  assert.equal(parseEmbedPhotoKey("not-a-photo-key"), null)
  assert.equal(
    embedPortfolioPath("photographer-a", { photoKeys: ["travel::photo-1"] }),
    "/embed/photographer-a?photos=travel%3A%3Aphoto-1",
  )
  assert.notEqual(embedPortfolioPath("photographer-a"), embedPortfolioPath("photographer-b"))
})

test("mobile companion routes remain workspace scoped and preserve explicit selections", () => {
  assert.equal(mobilePortfolioPath("photographer-a"), "/mobile/photographer-a")
  assert.equal(
    mobilePortfolioPath("photographer-a", ["portraits", "travel"]),
    "/mobile/photographer-a?galleries=portraits%2Ctravel",
  )
  assert.equal(mobilePortfolioPath("photographer-a", []), "/mobile/photographer-a?galleries=")
  assert.notEqual(mobilePortfolioPath("photographer-a"), mobilePortfolioPath("photographer-b"))
  assert.equal(mobilePortfolioPath("", ["travel"]), "/portfolio?mobile=1")
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
    amount: 399,
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
    unit_amount: 399,
  }

  assert.deepEqual(validatePrice(validPrice, expected, "live"), [])
  assert.match(validatePrice({ ...validPrice, unit_amount: 499 }, expected, "live").join(" "), /expected 399/)
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
  assert.deepEqual(
    uniqueGalleryPhotos([cover, visible], "https://media.example.com/opaque-cover-route", "cover").map((item) => item.id),
    ["visible"],
  )
})

test("Design settings use one red Save state and apply Hero dimming to photos and video", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")
  const templatePreviewSource = readFileSync(join(process.cwd(), "src/components/portfolio/template-gallery-preview.tsx"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")

  assert.match(dashboardSource, /hasUnsavedSiteSettingsChanges/)
  assert.match(dashboardSource, /hasUnsavedSettingsChanges \? "Save" : "Saved"/)
  assert.match(dashboardSource, /bg-\[#b42318\]/)
  assert.match(dashboardSource, /Dim Hero media/)
  assert.match(dashboardSource, /A video is currently your website Hero/)
  assert.match(dashboardSource, /websiteSettings\.heroOverlayStrength > 0/)
  assert.match(previewSource, /settings\.heroOverlayStrength > 0/)
  assert.match(helpSource, /non-destructive dark overlay to either photographs or video/)
  assert.doesNotMatch(templatePreviewSource, /index % previewImages\.length/)
  assert.match(templatePreviewSource, /photoPreviewImages\.length > 0 \? photoPreviewImages : \[gallery\.cover\]/)
  assert.match(templatePreviewSource, /No additional photo/)
})

test("portfolio uploads accept still images and reject video reserved for website Hero", () => {
  assert.equal(isAllowedPortfolioImageContentType("image/jpeg"), true)
  assert.equal(isAllowedPortfolioImageContentType("image/avif"), true)
  assert.equal(isAllowedPortfolioImageContentType("video/mp4"), false)
  assert.equal(isAllowedPortfolioImageContentType("video/quicktime"), false)
})

test("public portfolio counts use consistent singular and position labels", () => {
  assert.equal(formatImageCount(1), "1 image")
  assert.equal(formatImageCount(2), "2 images")
  assert.equal(formatGalleryPosition(-1, 1), "Cover image · 1 image total")
  assert.equal(formatGalleryPosition(0, 2), "2 of 2 images")
})

test("website publication readiness blocks contact and starter copy until completed or hidden", () => {
  const incompleteDraft = JSON.stringify({
    contactEmail: "",
    enabledBlocks: { textBlock: true },
    enabledPages: { about: true, articles: false, blog: false, contact: true, gear: false },
    pageCopy: {
      aboutBody: "Write a short photographer bio, artist statement, or welcome note that helps visitors understand the person behind the work.",
      contactIntro: "Use this form for print questions, licensing, assignments, or travel and photography conversations.",
      introBody: "Use this short introduction to tell visitors what kind of work they are about to see and why it matters.",
    },
  })
  assert.deepEqual(getWebsitePublicationIssues(incompleteDraft), [
    "Add a valid contact email or hide the Contact page.",
    "Replace or hide the starter copy in: Home introduction, About, Contact.",
  ])

  const readyDraft = JSON.stringify({
    enabledBlocks: { textBlock: false },
    enabledPages: { about: false, articles: false, blog: false, contact: false, gear: false },
    pageCopy: {},
  })
  assert.deepEqual(getWebsitePublicationIssues(readyDraft), [])
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
    const replacement = createImportToken("workspace-123")
    const importTokenSource = readFileSync(join(process.cwd(), "src/lib/import-token.ts"), "utf8")
    assert.equal(verifyImportToken(token)?.workspaceId, "workspace-123")
    assert.notEqual(replacement, token)
    assert.equal(verifyImportToken(`${token}x`), null)
    assert.match(importTokenSource, /importCredential\.upsert/)
    assert.match(importTokenSource, /tokenHash: hashToken\(token\)/)
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
    assert.equal(getAppUrl(new Request("https://attacker.example/checkout"), "production"), "https://photoview.io")
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
      returnUrl: "https://photoview.io/account",
    })

    const body = new URLSearchParams(sentBody)
    assert.equal(body.get("customer"), "cus_test")
    assert.equal(body.get("flow_data[type]"), "payment_method_update")
    assert.equal(body.get("flow_data[after_completion][type]"), "redirect")
    assert.equal(body.get("flow_data[after_completion][redirect][return_url]"), "https://photoview.io/account?billing=payment-method-updated")
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

test("published website actions reject scriptable and credential-bearing URLs", () => {
  assert.equal(getSafeWebsiteActionUrl("#portfolios"), "#portfolios")
  assert.equal(getSafeWebsiteActionUrl("/g/example"), "/g/example")
  assert.equal(getSafeWebsiteActionUrl("https://example.com/path"), "https://example.com/path")
  assert.equal(getSafeWebsiteActionUrl("javascript:alert(1)", "#safe"), "#safe")
  assert.equal(getSafeWebsiteActionUrl("data:text/html,unsafe", "#safe"), "#safe")
  assert.equal(getSafeWebsiteActionUrl("//evil.example/path", "#safe"), "#safe")
  assert.equal(getSafeWebsiteActionUrl("https://user:secret@example.com", "#safe"), "#safe")
})

test("feedback attachments require matching safe formats and file signatures", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString("base64")
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64")
  const textAttachment = Buffer.from("Browser console notes\n", "utf8").toString("base64")

  assert.equal(validateFeedbackAttachment({ base64: jpeg, contentType: "image/jpeg", filename: "screen.jpg" }), true)
  assert.equal(validateFeedbackAttachment({ base64: png, contentType: "image/png", filename: "screen.png" }), true)
  assert.equal(validateFeedbackAttachment({ base64: textAttachment, contentType: "text/plain", filename: "notes.txt" }), true)
  assert.equal(validateFeedbackAttachment({ base64: jpeg, contentType: "image/png", filename: "screen.png" }), false)
  assert.equal(validateFeedbackAttachment({ base64: textAttachment, contentType: "text/html", filename: "report.html" }), false)
  assert.equal(validateFeedbackAttachment({ base64: "not-base64!", contentType: "image/jpeg", filename: "screen.jpg" }), false)
})

test("remote response limits stop chunked bodies even without content-length", async () => {
  const safeResponse = new Response(new Uint8Array([1, 2, 3]))
  assert.deepEqual(Array.from(await readResponseBytesLimited(safeResponse, 3)), [1, 2, 3])

  const oversizedResponse = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]))
      controller.enqueue(new Uint8Array([4]))
      controller.close()
    },
  }))
  await assert.rejects(() => readResponseBytesLimited(oversizedResponse, 3), /too large/)
})

test("public media serialization cannot expose underlying storage references", () => {
  const persistenceSource = readFileSync(join(process.cwd(), "src/lib/portfolio-persistence.ts"), "utf8")
  const websiteMediaSource = readFileSync(join(process.cwd(), "src/app/api/website/media/[photoId]/route.ts"), "utf8")

  assert.match(persistenceSource, /Never serialize provider URLs or private object references/)
  assert.match(persistenceSource, /blobUrl: deliveryUrl/)
  assert.match(persistenceSource, /downloadUrl: `\$\{deliveryUrl\}\$\{deliveryUrl\.includes\("\?"\) \? "&" : "\?"\}variant=download`/)
  assert.match(persistenceSource, /thumbnailUrl: `\$\{deliveryUrl\}\$\{deliveryUrl\.includes\("\?"\) \? "&" : "\?"\}variant=thumbnail`/)
  assert.match(websiteMediaSource, /const isOwner = session\?\.user\?\.workspaceId === photo\.workspaceId/)
  assert.match(websiteMediaSource, /WEBSITE_PUBLISHED_SLUG/)
  assert.match(websiteMediaSource, /published\?\.status !== "PUBLISHED"/)
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

test("custom watermark uploads are discoverable, private, and stored as managed gallery assets", async () => {
  const originalFetch = globalThis.fetch
  let submittedForm: FormData | null = null
  globalThis.fetch = async (_input, init) => {
    submittedForm = init?.body as FormData
    return Response.json({
      downloadUrl: "/api/media/travel-portfolio/asset/watermark?variant=download",
      ok: true,
      pathname: "watermarks/travel-portfolio/signature.png",
      provider: "r2",
      size: 4,
      url: "/api/media/travel-portfolio/asset/watermark",
    })
  }

  try {
    const file = new File([new Uint8Array([137, 80, 78, 71])], "signature.png", { type: "image/png" })
    const result = await uploadPhotoFromClient("watermarks/travel-portfolio/signature.png", file, {
      assetPurpose: "watermark",
      galleryId: "travel-portfolio",
      title: "Custom watermark",
    })

    const submitted = submittedForm as FormData | null
    assert.ok(submitted)
    assert.equal(submitted.get("assetPurpose"), "watermark")
    assert.equal(submitted.get("galleryId"), "travel-portfolio")
    assert.equal(result.url, "/api/media/travel-portfolio/asset/watermark")
  } finally {
    globalThis.fetch = originalFetch
  }

  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const persistenceSource = readFileSync(join(process.cwd(), "src/lib/portfolio-persistence.ts"), "utf8")
  const uploadRouteSource = readFileSync(join(process.cwd(), "src/app/api/storage/upload/route.ts"), "utf8")

  assert.match(dashboardSource, /Upload custom watermark/)
  assert.match(dashboardSource, /assetPurpose: "watermark"/)
  assert.match(uploadRouteSource, /isHidden: Boolean\(input\.assetPurpose\)/)
  assert.match(uploadRouteSource, /WATERMARK_UPLOADED/)
  assert.match(uploadRouteSource, /watermarkImageUrl: input\.storedUrl/)
  assert.match(persistenceSource, /persistedWatermarkReference/)
  assert.match(persistenceSource, /cleaned\.startsWith\("\/api\/media\/"\)/)
  assert.equal(findRelevantAiHelpTopics("How do I upload my own custom watermark?", 1)[0]?.title, "Watermarks")
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

test("website image frames clamp thickness and stay visible on full-width heroes", () => {
  const gold = getWebsiteImageFramePresentation("gold", 7)
  const thin = getWebsiteImageFramePresentation("thin", 99)
  const none = getWebsiteImageFramePresentation("none", 12)

  assert.equal(gold.thickness, 7)
  assert.equal(gold.style["--website-image-frame-thickness"], "7px")
  assert.equal(gold.style["--website-image-frame-color"], "#d8a84f")
  assert.match(gold.className, /website-image-frame/)
  assert.match(gold.style.boxShadow, /96, 66, 23/)
  assert.equal(thin.thickness, 16)
  assert.equal(none.thickness, 0)
  assert.equal(none.style["--website-image-frame-thickness"], "0px")
  assert.equal(none.style["--website-image-frame-color"], "transparent")
  assert.equal(none.style.boxShadow, "none")
})

test("website image frame sliders update continuously while they are dragged", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const frameSliderInputHandlers = dashboardSource.match(/const nextImageFrameThickness = Number\(event\.currentTarget\.value\)/g) ?? []

  assert.equal(frameSliderInputHandlers.length, 2)
})

test("website preview keeps overlay Hero media visible and falls back across saved image sources", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const previewSource = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")

  assert.match(previewSource, /window\.history\.scrollRestoration = "manual"/)
  assert.match(previewSource, /window\.scrollTo\(0, 0\)/)
  assert.match(previewSource, /md:!absolute md:inset-0/)
  assert.match(previewSource, /data-testid="website-preview-toolbar"/)
  assert.match(previewSource, /bg-\[#1f2a24\]/)
  assert.match(previewSource, /WebsiteHeroPreviewImage/)
  assert.match(previewSource, /onError=\{\(\) => setSourceIndex/)
  assert.match(dashboardSource, /const websiteBuilderStorageKey = `\$\{WEBSITE_BUILDER_STORAGE_KEY\}:\$\{workspaceSlug\}`/)
  assert.match(dashboardSource, /const siteStorageKey = `\$\{SITE_STORAGE_KEY\}:\$\{workspaceSlug\}`/)
  assert.doesNotMatch(dashboardSource, /localStorage\.getItem\(WEBSITE_BUILDER_STORAGE_KEY\)/)
  assert.doesNotMatch(previewSource, /photoviewpro-website-builder-v1/)
})

test("website builder page cards expose saved drag ordering and explicit save feedback", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(dashboardSource, /data-website-page=\{page\.key\}/)
  assert.match(dashboardSource, /setDraggedWebsitePage\(page\.key\)/)
  assert.match(dashboardSource, /pageOrder: nextPageOrder/)
  assert.match(dashboardSource, /Unsaved changes/)
  assert.match(dashboardSource, /Save changes/)
})

test("website Hero video changes restore an off-screen dashboard viewport", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(dashboardSource, /function restoreDashboardViewportAfterLayoutChange\(\)/)
  assert.match(dashboardSource, /main\.getBoundingClientRect\(\)\.bottom <= 0/)
  assert.match(dashboardSource, /window\.scrollTo\(\{ behavior: "auto", left: 0, top: 0 \}\)/)
  assert.equal((dashboardSource.match(/restoreDashboardViewportAfterLayoutChange\(\)/g) ?? []).length, 3)
})

test("Tours choose safe website walkthroughs and keep destinations deterministic", () => {
  assert.equal(classifyWebsiteWalkthroughGoal("Help me add my cameras and favorite lenses"), "gear")
  assert.equal(classifyWebsiteWalkthroughGoal("I need to get my domain ready to go live"), "publish")
  assert.equal(classifyWebsiteWalkthroughGoal("Make my opening headline and hero image better"), "homepage")
  assert.equal(classifyWebsiteWalkthroughGoal("Help me run an automatic Instagram campaign"), "social-campaign")

  const walkthrough = getWebsiteWalkthrough("gear")
  assert.equal(walkthrough.steps[1].destination.kind, "section")
  assert.deepEqual(walkthrough.steps[1].destination, {
    control: "content",
    kind: "section",
    sectionKey: "page:gear",
  })
  assert.match(getWebsiteEditHint("Featured work", "headline").description, /Featured work → Headline/)

  const socialCampaignTour = getWebsiteWalkthrough("social-campaign")
  assert.equal(socialCampaignTour.steps.length, 8)
  assert.deepEqual(socialCampaignTour.steps[0].destination, { kind: "scheduler" })
  assert.match(socialCampaignTour.steps.map((step) => step.description).join(" "), /Save plan.*never sends|Save plan.*draft/)
})

test("Settings help, tooltips, and the guided tour cover every Settings page", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const settingsTour = getWebsiteWalkthrough("settings-overview")
  const tourTabs = settingsTour.steps.flatMap((step) => step.destination.kind === "settings" ? [step.destination.tab] : [])

  assert.equal(settingsTabs.length, 9)
  assert.deepEqual(tourTabs, settingsTabs.map((tab) => tab.id))
  assert.ok(settingsTabs.every((tab) => tab.help.length >= 80))
  assert.ok(settingsTabs.every((tab) => tab.helpQuestion.endsWith("?")))
  assert.match(dashboardSource, /title=\{`\$\{tab\.label\}: \$\{tab\.description\}`\}/)
  assert.match(dashboardSource, /\{activeSettingsTab\.help\}/)
  assert.match(dashboardSource, /activeSettingsTab\.helpQuestion/)
  assert.match(dashboardSource, /Take a guided tour of all nine Settings pages/)
})

test("Lightroom guidance and plugin support beginner-friendly new and existing portfolio imports", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const importRouteSource = readFileSync(join(process.cwd(), "src/app/api/lightroom/import/route.ts"), "utf8")
  const importHandlerSource = readFileSync(join(process.cwd(), "src/lib/photo-import-handler.ts"), "utf8")
  const lightroomPluginSource = readFileSync(join(process.cwd(), "lightroom/PhotoViewIo.lrplugin/PhotoViewIoExportServiceProvider.lua"), "utf8")

  assert.match(dashboardSource, /What is an endpoint\?/)
  assert.match(dashboardSource, /Download plugin/)
  assert.match(dashboardSource, /Lightroom import workflow/)
  assert.match(dashboardSource, /Create a new portfolio/)
  assert.match(dashboardSource, /Add to an existing portfolio/)
  assert.match(importRouteSource, /export async function GET/)
  assert.match(importHandlerSource, /listImportPortfolios/)
  assert.match(importHandlerSource, /selected portfolio no longer exists/)
  assert.match(lightroomPluginSource, /Refresh portfolios/)
  assert.match(lightroomPluginSource, /destinationMode/)
  assert.match(lightroomPluginSource, /existingGallerySlug/)
  assert.match(lightroomPluginSource, /default = "https:\/\/photoview\.io"/)
  assert.match(lightroomPluginSource, /isAllowedBaseUrl/)
})

test("subscriber-facing social configuration is consistently named Social Settings", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const modelSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard-model.ts"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")
  const schedulerSource = readFileSync(join(process.cwd(), "src/components/social/social-scheduler.tsx"), "utf8")

  assert.match(modelSource, /label: "Social Settings"/)
  assert.match(dashboardSource, /hasUnsavedSettingsChanges \? "Save" : "Saved"/)
  assert.match(helpSource, /title: "Social Settings"/)
  assert.match(schedulerSource, /Add them in Social Settings first/)
  assert.doesNotMatch(dashboardSource, /Setup tab|Add social accounts in Setup|Social buttons from Setup/)
})

test("marketing, Tours, and AI Help explain the complete social campaign workflow", () => {
  const homepageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")
  const toursSource = readFileSync(join(process.cwd(), "src/lib/website-walkthroughs.ts"), "utf8")

  assert.match(homepageSource, /Social campaign studio/)
  assert.match(homepageSource, /Turn one portfolio into a complete social campaign\./)
  assert.doesNotMatch(homepageSource, /social-campaign-studio\.png/)
  assert.match(homepageSource, /SiFacebook/)
  assert.match(homepageSource, /SiInstagram/)
  assert.match(homepageSource, /Build your first campaign/)
  assert.match(homepageSource, /Facebook Pages and Instagram Professional accounts/)
  assert.match(toursSource, /Run a social campaign/)
  assert.match(toursSource, /Review every prepared post/)
  assert.match(helpSource, /Running an automated social media campaign/)
  assert.match(helpSource, /Save plan stores the campaign as a draft and never publishes anything/)
  assert.match(helpSource, /Recent delivery activity shows pending, processing, published, failed, retried, or canceled deliveries/)
  for (const question of [
    "How do I run an automated social media campaign?",
    "How do I connect multiple Facebook and Instagram accounts?",
    "What happens if a scheduled social post fails?",
    "How do I pause or repeat my campaign?",
  ]) {
    assert.equal(findRelevantAiHelpTopics(question, 1)[0]?.title, "Running an automated social media campaign")
  }
})

test("homepage previews website templates between its introduction and feature cards", () => {
  const homepageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")
  const introductionIndex = homepageSource.indexOf("A portfolio home built around the photographs themselves.")
  const templatesIndex = homepageSource.indexOf('aria-label="Website template previews"')
  const featuresIndex = homepageSource.indexOf("featureCards.map")

  assert.ok(introductionIndex >= 0)
  assert.ok(templatesIndex > introductionIndex)
  assert.ok(featuresIndex > templatesIndex)
  assert.match(homepageSource, /A full selection of website templates is available in the dashboard, with more being added regularly\./)
  assert.match(homepageSource, /WebsiteTemplateMiniPreview/)
})

test("homepage presents the real settings categories beneath its nine feature cards", () => {
  const homepageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")
  const showcaseSource = readFileSync(join(process.cwd(), "src/components/site/settings-capabilities-showcase.tsx"), "utf8")
  const featuresIndex = homepageSource.indexOf("featureCards.map")
  const settingsIndex = homepageSource.indexOf("<SettingsCapabilitiesShowcase />")

  assert.ok(featuresIndex >= 0)
  assert.ok(settingsIndex > featuresIndex)
  assert.match(showcaseSource, /Your entire photography system, tuned from one place\./)
  assert.match(showcaseSource, /settingsTabs\.map/)
  assert.match(showcaseSource, /Saved to your subscriber workspace/)
  assert.match(showcaseSource, /Custom watermarks/)
  assert.match(showcaseSource, /Watched export folders/)
  assert.match(showcaseSource, /role="tablist"/)
  assert.match(showcaseSource, /role="tabpanel"/)
})

test("homepage replaces the long workflow checklist with a five-stage visual ribbon", () => {
  const homepageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")

  assert.match(homepageSource, /data-testid="homepage-workflow-ribbon"/)
  assert.match(homepageSource, /From first import to finished audience, one connected creative flow\./)
  for (const stage of ["Import", "Organize", "Curate", "Design", "Share"]) {
    assert.match(homepageSource, new RegExp(`label: "${stage}"`))
  }
  assert.doesNotMatch(homepageSource, /Import directly from a phone and review selected thumbnails 50 at a time/)
  assert.doesNotMatch(homepageSource, /Design, review, and automatically publish a multi-account social campaign from selected photographs/)
})

test("homepage presents Workflow before Mobile and Why Different before Pricing", () => {
  const homepageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")

  assert.match(homepageSource, /<div className="flex flex-col">/)
  assert.match(homepageSource, /<section id="workflow" className="order-1 /)
  assert.match(homepageSource, /<section className="order-2 bg-\[#edf7f5\]/)
  assert.match(homepageSource, /<section className="order-3 border-y border-\[#ded8e7\]/)
})

test("homepage comparison does not send visitors to competitor plan pages", () => {
  const homepageSource = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8")

  assert.doesNotMatch(homepageSource, /https:\/\/www\.smugmug\.com\/plans/)
  assert.doesNotMatch(homepageSource, /https:\/\/zenfolio\.com\/plans-pricing/)
  assert.doesNotMatch(homepageSource, />SmugMug plans</)
  assert.doesNotMatch(homepageSource, />Zenfolio plans</)
})

test("social account setup accepts handles, domain paths, and existing full URLs", () => {
  assert.equal(normalizeSocialAccountInput("facebook", "@PhotoView"), "https://www.facebook.com/PhotoView")
  assert.equal(normalizeSocialAccountInput("instagram", "photo.view"), "https://www.instagram.com/photo.view")
  assert.equal(normalizeSocialAccountInput("linkedin", "mitch-russo"), "https://www.linkedin.com/in/mitch-russo")
  assert.equal(normalizeSocialAccountInput("pinterest", "pinterest.com/photo-view"), "https://pinterest.com/photo-view")
  assert.equal(normalizeSocialAccountInput("x", "@photo_view"), "https://x.com/photo_view")
  assert.equal(normalizeSocialAccountInput("tiktok", "@photo-view"), "https://www.tiktok.com/@photo-view")
  assert.equal(normalizeSocialAccountInput("youtube", "@PhotoView"), "https://www.youtube.com/@PhotoView")
  assert.equal(
    normalizeSocialAccountInput("linkedin", "https://www.linkedin.com/company/photoview/"),
    "https://www.linkedin.com/company/photoview/",
  )

  assert.deepEqual(normalizeSocialAccounts({
    facebook: "PhotoView",
    instagram: "",
    linkedin: "mitch-russo",
    pinterest: "@photo-view",
    tiktok: "photo-view",
    x: "@photo_view",
    youtube: "@PhotoView",
  }), {
    facebook: "https://www.facebook.com/PhotoView",
    instagram: "",
    linkedin: "https://www.linkedin.com/in/mitch-russo",
    pinterest: "https://www.pinterest.com/photo-view",
    tiktok: "https://www.tiktok.com/@photo-view",
    x: "https://x.com/photo_view",
    youtube: "https://www.youtube.com/@PhotoView",
  })
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

test("social scheduler supports exact photo selection, day intervals, and portfolio links", () => {
  const schedule = normalizeSocialSchedule({
    captionMode: "title",
    connectionIds: ["connection-1"],
    dayInterval: 3,
    includePortfolioLink: true,
    intervalHours: 4,
    networks: ["facebook"],
    postsPerDay: 1,
    repeat: false,
    selectedPhotoIds: ["one", "three"],
    startAt: "2099-07-12T13:00:00.000Z",
    status: "draft",
    timezone: "America/New_York",
    updatedAt: "2026-07-11T12:00:00.000Z",
  })
  const queue = buildSocialQueue(schedule, [
    { id: "one", imageUrl: "https://example.com/one.jpg", title: "First" },
    { id: "two", imageUrl: "https://example.com/two.jpg", title: "Second" },
    { id: "three", imageUrl: "https://example.com/three.jpg", title: "Third" },
  ], 60, "https://photoview.io/g/example/gallery")

  assert.deepEqual(queue.map((post) => post.photoId), ["one", "three"])
  assert.equal(queue[1].publishAt, "2099-07-15T13:00:00.000Z")
  assert.equal(queue[0].linkUrl, "https://photoview.io/g/example/gallery")
  assert.match(queue[0].caption, /https:\/\/photoview\.io\/g\/example\/gallery/)
})

test("campaign designs persist calls to action and replace the portfolio fallback link", () => {
  const campaignDesign = applySocialCampaignTemplate(defaultSocialCampaignDesign(), "client-invitation")
  const schedule = normalizeSocialSchedule({
    campaignDesign: {
      ...campaignDesign,
      campaignName: "Architect outreach",
      destinationUrl: "https://example.com/request-a-quote",
      directions: "Encourage commercial prospects to request a quote.",
    },
    networks: ["facebook"],
    startAt: "2099-07-12T13:00:00.000Z",
  })
  const queue = buildSocialQueue(
    schedule,
    [{ id: "one", imageUrl: "https://example.com/one.jpg", title: "First" }],
    10,
    "https://photoview.io/g/example/gallery",
  )

  assert.equal(queue[0].design.templateId, "client-invitation")
  assert.equal(queue[0].linkUrl, "https://example.com/request-a-quote")
  assert.match(queue[0].caption, /request-a-quote/)
  assert.doesNotMatch(queue[0].caption, /Encourage commercial prospects/)
})

test("designed social image links are signed, expiring, and tamper-resistant", () => {
  const previousRenderSecret = process.env.SOCIAL_RENDER_SIGNING_SECRET
  process.env.SOCIAL_RENDER_SIGNING_SECRET = "test-render-secret-with-at-least-thirty-two-characters"
  try {
    const expires = Math.floor(Date.now() / 1000) + 600
    const signature = signSocialRender("delivery-1", expires)
    assert.equal(verifySocialRender("delivery-1", expires, signature), true)
    assert.equal(verifySocialRender("delivery-2", expires, signature), false)
    assert.equal(verifySocialRender("delivery-1", expires - 1000, signature), false)
  } finally {
    process.env.SOCIAL_RENDER_SIGNING_SECRET = previousRenderSecret
  }
})

test("social OAuth state and stored provider tokens reject tampering", () => {
  const previousAuthSecret = process.env.AUTH_SECRET
  const previousEncryptionSecret = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY
  process.env.AUTH_SECRET = "test-auth-secret-with-at-least-thirty-two-characters"
  process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = "test-social-secret-with-at-least-thirty-two-characters"
  try {
    const state = createSocialOAuthState({ provider: "meta", userId: "user-1", workspaceId: "workspace-1" })
    assert.equal(verifySocialOAuthState(state)?.workspaceId, "workspace-1")
    assert.equal(verifySocialOAuthState(`${state}tampered`), null)

    const encrypted = encryptSocialToken("provider-access-token")
    assert.notEqual(encrypted, "provider-access-token")
    assert.equal(decryptSocialToken(encrypted), "provider-access-token")
    assert.throws(() => decryptSocialToken(`${encrypted}tampered`))
  } finally {
    if (previousAuthSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = previousAuthSecret
    if (previousEncryptionSecret === undefined) delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY
    else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = previousEncryptionSecret
  }
})

test("AI Help routes gallery sharing and QR questions to accurate guidance", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  for (const question of [
    "What gets posted when I share a gallery?",
    "How does the gallery QR code work?",
    "Does Facebook post every image?",
  ]) {
    assert.equal(findRelevantAiHelpTopics(question, 1)[0]?.title, "Sharing portfolios and photos")
  }

  const sharingTopic = findRelevantAiHelpTopics("What does the QR code share?", 1)[0]
  assert.match(sharingTopic.summary, /public gallery share buttons always share the complete current gallery/)
  assert.match(sharingTopic.details.join(" "), /one cover\/social preview image/)
  assert.match(sharingTopic.details.join(" "), /phone camera/)
  assert.match(dashboardSource, /How to use this QR code/)
  assert.match(dashboardSource, /The QR code always opens that exact selected destination/)
  assert.match(dashboardSource, /Test the finished code with your phone before printing it/)
  assert.match(dashboardSource, /password and privacy requirements still apply/)
})

test("account screens identify the email from the authenticated session", () => {
  const dashboardPageSource = readFileSync(join(process.cwd(), "src/app/dashboard/page.tsx"), "utf8")
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const accountPageSource = readFileSync(join(process.cwd(), "src/app/account/page.tsx"), "utf8")

  assert.match(dashboardPageSource, /subscriberEmail=\{session\?\.user\?\.email/)
  assert.match(dashboardSource, /title=\{subscriberEmail\}>\{subscriberEmail\}/)
  assert.match(dashboardSource, /Signed in as/)
  assert.match(dashboardSource, /\{subscriberEmail\}/)
  assert.match(accountPageSource, /Signed in as/)
  assert.match(accountPageSource, /\{session\.user\.email\}/)
})

test("Admin subscriber email uses an in-page composer instead of a mail handler", () => {
  const adminSource = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8")
  const lifecycleSource = readFileSync(join(process.cwd(), "src/lib/lifecycle-email.ts"), "utf8")

  assert.doesNotMatch(adminSource, /mailto:\$\{row\.ownerEmail\}/)
  assert.match(adminSource, /<form action=\{sendSubscriberMessage\}/)
  assert.match(adminSource, /Replies go to the SuperAdmin email/)
  assert.match(adminSource, /getAttentionEmailDraft\(row\)/)
  assert.match(adminSource, /Payment failures, cancellation confirmations, and storage warnings/)
  assert.match(adminSource, /Action needed: review your PhotoView\.io billing/)
  assert.match(adminSource, /Your PhotoView\.io storage is nearly full/)
  assert.match(adminSource, /Your PhotoView\.io cancellation/)
  assert.match(adminSource, /ADMIN_SUBSCRIBER_EMAIL_SENT/)
  assert.match(adminSource, /ADMIN_SUBSCRIBER_EMAIL_FAILED/)
  assert.equal((adminSource.match(/href="\/admin\/subscribers"/g) ?? []).length, 1)
  assert.match(lifecycleSource, /export function sendAdminSubscriberEmail/)
  assert.match(lifecycleSource, /reply_to: payload\.replyTo/)
})

test("magic-link login replaces stale identities and routes admins to privileged verification", () => {
  const authSource = readFileSync(join(process.cwd(), "src/auth.ts"), "utf8")
  const magicRouteSource = readFileSync(join(process.cwd(), "src/app/api/auth/magic/route.ts"), "utf8")

  assert.match(authSource, /token\.email = user\.email/)
  assert.match(authSource, /token\.sub = user\.id/)
  assert.match(magicRouteSource, /clearExistingSessionCookies\(\)/)
  assert.match(magicRouteSource, /__Secure-authjs\.session-token/)
  assert.match(magicRouteSource, /cookie\.name\.startsWith\(`\$\{name\}\.\`\)/)
  assert.match(magicRouteSource, /\["SUPERADMIN", "SUPPORT"\]\.includes\(subscriber\.systemRole\) \? "\/admin" : "\/dashboard"/)
})

test("login request and inbox confirmation use the light PhotoView.io visual system", () => {
  const loginSource = readFileSync(join(process.cwd(), "src/app/login/page.tsx"), "utf8")

  assert.match(loginSource, /bg-\[#f7f8f5\]/)
  assert.match(loginSource, /bg-\[#eef7f3\]/)
  assert.match(loginSource, /bg-\[#fffaf0\]/)
  assert.match(loginSource, /bg-\[#1d2b22\]/)
  assert.doesNotMatch(loginSource, /bg-black/)
  assert.doesNotMatch(loginSource, /bg-\[#070707\]/)
})

test("floating subscriber shortcuts do not cover the website builder controls", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const feedbackSource = readFileSync(join(process.cwd(), "src/components/feedback/subscriber-feedback.tsx"), "utf8")
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")

  assert.match(dashboardSource, /data-dashboard-panel=\{activePanel\}/)
  assert.equal((feedbackSource.match(/subscriber-floating-shortcut/g) ?? []).length, 2)
  assert.match(globalStyles, /data-dashboard-panel="website"/)
  assert.match(globalStyles, /\.subscriber-floating-shortcut/)
})

test("dashboard uses persistent Gallery to Portfolio to Photo organization and explains portfolio autosave", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const aiHelpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")
  const groupLibrarySource = readFileSync(join(process.cwd(), "src/lib/portfolio-groups.ts"), "utf8")
  const persistenceSource = readFileSync(join(process.cwd(), "src/lib/portfolio-persistence.ts"), "utf8")
  const groupRouteSource = readFileSync(join(process.cwd(), "src/app/api/portfolio/groups/route.ts"), "utf8")
  const groupRenameRouteSource = readFileSync(join(process.cwd(), "src/app/api/portfolio/groups/[groupId]/route.ts"), "utf8")
  const photoMoveRouteSource = readFileSync(join(process.cwd(), "src/app/api/portfolio/galleries/[galleryId]/photos/[photoId]/move/route.ts"), "utf8")
  const schemaSource = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8")
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")

  assert.match(dashboardSource, />Galleries</)
  assert.match(dashboardSource, />Current gallery</)
  assert.match(dashboardSource, /currentPortfolioGroupDisplayName/)
  assert.match(dashboardSource, /"My Gallery"/)
  assert.match(dashboardSource, />\s*Rename\s*</)
  assert.match(dashboardSource, /Add new gallery/)
  assert.match(dashboardSource, /Create a new empty gallery and give it a clear name/)
  assert.match(dashboardSource, /You can add or move individual portfolios later from Settings → Gallery/)
  assert.match(dashboardSource, /Give your first gallery a name that is meaningful to you/)
  assert.doesNotMatch(dashboardSource, /To create an empty gallery instead/)
  assert.doesNotMatch(dashboardSource, /Organize unfiled portfolios/)
  assert.match(aiHelpSource, /original gallery is called My Gallery/)
  assert.match(aiHelpSource, /Choose Add new gallery to create a new, empty parent gallery/)
  assert.doesNotMatch(aiHelpSource, /Organize unfiled portfolios/)
  assert.match(dashboardSource, /Rename .* gallery/)
  assert.match(dashboardSource, /id="rename-gallery-title">Rename gallery/)
  assert.match(dashboardSource, /Choose a new name for this gallery/)
  assert.doesNotMatch(dashboardSource, /window\.prompt\("Rename this gallery"/)
  assert.match(dashboardSource, /Delete .* gallery/)
  assert.match(dashboardSource, /deletePortfolioGroup/)
  assert.match(dashboardSource, />Portfolios</)
  assert.match(dashboardSource, /Add new portfolio/)
  assert.match(dashboardSource, /Move to another portfolio/)
  assert.match(dashboardSource, /movePhotoToPortfolio/)
  assert.match(dashboardSource, /Move selected photos to portfolio/)
  assert.match(dashboardSource, /moveLibraryPhotosToPortfolio/)
  assert.match(dashboardSource, /Photos live in this portfolio; portfolios assigned to the same named gallery are grouped together/)
  assert.match(dashboardSource, /No Save button is needed\. Cover, visibility, order, and deletion changes save automatically\./)
  assert.match(persistenceSource, /galleryName: gallery\.galleryName/)
  assert.match(groupRouteSource, /createWorkspacePortfolioGroup/)
  assert.match(groupRouteSource, /status: 409/)
  assert.match(groupLibrarySource, /A gallery with that name already exists/)
  assert.match(groupRenameRouteSource, /renameWorkspacePortfolioGroup/)
  assert.match(groupRenameRouteSource, /deleteWorkspacePortfolioGroup/)
  assert.match(groupRenameRouteSource, /portfolioCount > 0/)
  assert.match(photoMoveRouteSource, /targetGalleryId/)
  assert.match(photoMoveRouteSource, /tx\.photo\.update/)
  assert.match(photoMoveRouteSource, /storageUsedBytes/)
  assert.match(schemaSource, /model PortfolioGroup/)
  assert.match(globalStyles, /data-portfolio-menu-open="true"/)
})

test("subscriber shortcuts stay off authentication and SuperAdmin screens", () => {
  const feedbackSource = readFileSync(join(process.cwd(), "src/components/feedback/subscriber-feedback.tsx"), "utf8")

  assert.match(feedbackSource, /pathname === "\/dashboard" \|\| pathname\.startsWith\("\/dashboard\/"\)/)
  assert.doesNotMatch(feedbackSource, /showFloatingShortcuts = !\(pathname === "\/account"/)
})
