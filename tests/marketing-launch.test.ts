import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()

test("PhotoView launch campaign contains 30 approval-gated daily posts with attributed destinations", () => {
  const manifestPath = path.join(root, "marketing/photoview-30-day-launch/campaign-manifest.json")
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    approvalStatus: string
    posts: Array<{ approvalStatus: string; asset: string; destinationUrl: string; scheduledAt: string }>
  }

  assert.equal(manifest.approvalStatus, "DRAFT_FOR_APPROVAL")
  assert.equal(manifest.posts.length, 30)
  for (const [index, post] of manifest.posts.entries()) {
    assert.equal(post.approvalStatus, "DRAFT_FOR_APPROVAL")
    assert.match(post.destinationUrl, /utm_source=organic_social/)
    assert.match(post.destinationUrl, /utm_content=/)
    assert.ok(fs.existsSync(path.join(root, "marketing/photoview-30-day-launch", post.asset)))
    if (index > 0) {
      const prior = new Date(manifest.posts[index - 1].scheduledAt).getTime()
      assert.equal(new Date(post.scheduledAt).getTime() - prior, 24 * 60 * 60 * 1000)
    }
  }
})

test("marketing solution routes are indexed and send attributed trial traffic", () => {
  const sitemap = fs.readFileSync(path.join(root, "src/app/sitemap.ts"), "utf8")
  const page = fs.readFileSync(path.join(root, "src/app/solutions/[slug]/page.tsx"), "utf8")
  const attributedLink = fs.readFileSync(path.join(root, "src/components/site/attributed-trial-link.tsx"), "utf8")
  const data = fs.readFileSync(path.join(root, "src/data/marketing-solutions.ts"), "utf8")

  assert.match(sitemap, /marketingSolutions/)
  assert.match(page, /FAQPage/)
  assert.match(page, /AttributedTrialLink/)
  assert.match(attributedLink, /utm_source=seo/)
  assert.match(attributedLink, /current\.get\(key\)/)
  for (const slug of ["lightroom-portfolio-website", "photography-portfolio-with-video", "embed-photography-portfolio"]) {
    assert.match(data, new RegExp(`slug: "${slug}"`))
  }
})

test("server-side activation milestones cover the complete acquisition funnel", () => {
  const analytics = fs.readFileSync(path.join(root, "src/lib/activation-analytics.ts"), "utf8")
  for (const event of [
    "REGISTRATION_CAPTURED",
    "TRIAL_STARTED",
    "PHOTO_IMPORTED",
    "PORTFOLIO_PUBLISHED",
    "SITE_PUBLISHED",
    "DESTINATION_SHARED",
    "PAID_CONVERSION",
  ]) {
    assert.match(analytics, new RegExp(event))
  }
  assert.match(analytics, /recordedMilestones\.has/)
  assert.match(analytics, /recordedMilestones\.delete/)
})

test("Meta Pixel is lazy-loaded and permitted by the content security policy", () => {
  const pixel = fs.readFileSync(path.join(root, "src/components/analytics/meta-pixel.tsx"), "utf8")
  const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8")

  assert.match(pixel, /strategy="lazyOnload"/)
  assert.match(pixel, /connect\.facebook\.net\/en_US\/fbevents\.js/)
  assert.match(nextConfig, /script-src[^\n]+https:\/\/connect\.facebook\.net/)
})

test("trial registration carries campaign attribution into activation analytics and Stripe", () => {
  const registerPage = fs.readFileSync(path.join(root, "src/app/register/page.tsx"), "utf8")
  const registerRoute = fs.readFileSync(path.join(root, "src/app/api/trial/register/route.ts"), "utf8")
  const visitorAnalytics = fs.readFileSync(path.join(root, "src/components/analytics/visitor-analytics.tsx"), "utf8")

  for (const field of ["utmSource", "utmMedium", "utmCampaign", "utmContent"]) {
    assert.match(registerPage, new RegExp(field))
    assert.match(registerRoute, new RegExp(field))
  }
  assert.match(registerPage, /getCampaignAttribution/)
  assert.match(visitorAnalytics, /photoview-campaign-attribution/)
})
