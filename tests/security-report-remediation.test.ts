import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

test("homepage blocks framing and cross-origin resource embedding without breaking public embed routes", () => {
  const nextConfig = read("next.config.ts")
  assert.match(nextConfig, /Cross-Origin-Resource-Policy[\s\S]+same-origin[\s\S]+source: "\/"/)
  assert.match(nextConfig, /X-Frame-Options[\s\S]+DENY[\s\S]+source: "\/"/)
  assert.doesNotMatch(nextConfig, /"\/embed\/:path\*"[\s\S]+X-Frame-Options/)
})

test("optional analytics load only after affirmative consent and Global Privacy Control is honored", () => {
  const layout = read("src/app/layout.tsx")
  const manager = read("src/components/privacy/privacy-consent-manager.tsx")
  assert.doesNotMatch(layout, /GoogleAnalytics|MetaPixel|RedditPixel|rybbit-analytics|VisitorAnalytics/)
  assert.match(layout, /PrivacyConsentManager/)
  assert.match(manager, /consent === "granted"/)
  assert.match(manager, /globalPrivacyControl/)
  assert.match(manager, /Reject optional tracking/)
  assert.match(manager, /GoogleAnalytics/)
  assert.match(manager, /MetaPixel/)
  assert.match(manager, /RedditPixel/)
  assert.match(manager, /rybbit-analytics/)
})

test("privacy choices, data requests, and accessibility help are public and linked", () => {
  const footer = read("src/components/site/site-footer.tsx")
  const privacy = read("src/app/privacy/page.tsx")
  const privacyChoices = read("src/app/privacy-choices/page.tsx")
  const accessibility = read("src/app/accessibility/page.tsx")
  assert.match(footer, /Privacy Choices/)
  assert.match(footer, /Accessibility/)
  assert.match(privacy, /Privacy and data requests/)
  assert.match(privacyChoices, /Global Privacy Control/)
  assert.match(accessibility, /WCAG 2\.1 Level AA/)
  assert.match(accessibility, /support@photoview\.io/)
})

test("registration sharing metadata and structured data use the site preview image", () => {
  const registerLayout = read("src/app/register/layout.tsx")
  assert.match(registerLayout, /images: \[\{ alt: "PhotoView\.io photography portfolio website builder", height: 630, url: "\/opengraph-image", width: 1200 \}\]/)
  assert.match(registerLayout, /"@type": "SoftwareApplication"/)
  assert.match(registerLayout, /<JsonLd data=\{structuredData\}/)
})

test("reported article uses a concise search title without changing its visible headline", () => {
  const articlePage = read("src/app/articles/[slug]/page.tsx")
  assert.match(articlePage, /"upload-photos-from-phone": "Upload Photos From Your Phone"/)
  assert.match(articlePage, /articleSeoTitles\[article\.slug\] \|\| article\.title/)
  assert.match(articlePage, /<h1[^>]*>\{article\.title\}<\/h1>/)
})

test("homepage eyebrow text uses an AA-safe color on light surfaces", () => {
  const sources = [
    read("src/app/page.tsx"),
    read("src/components/site/home-video-showcase.tsx"),
    read("src/components/site/settings-capabilities-showcase.tsx"),
  ].join("\n")
  assert.doesNotMatch(sources, /uppercase[^\n]+text-\[#9c6f1d\]/)
  assert.match(sources, /uppercase[^\n]+text-\[#76500b\]/)
  assert.match(sources, /text-\[#d8a84f\][^\n]*>Product</)
})
