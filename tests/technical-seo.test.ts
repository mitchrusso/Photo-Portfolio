import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"
import test from "node:test"

const homepageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
const homepageComponentSource = [
  "../src/components/site/home-hero.tsx",
  "../src/components/site/home-video-showcase.tsx",
  "../src/components/site/site-header.tsx",
  "../src/components/site/site-footer.tsx",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n")
const tutorialDataSource = readFileSync(new URL("../src/data/product-tutorials.ts", import.meta.url), "utf8")
const portfolioGridSource = readFileSync(new URL("../src/components/portfolio/public-portfolio-grid.tsx", import.meta.url), "utf8")
const rootLayoutSource = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8")
const dashboardPageSource = readFileSync(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8")
const globalStylesSource = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8")

test("homepage exposes complete canonical metadata and structured data", () => {
  const title = homepageSource.match(/const pageTitle = "([^"]+)"/)?.[1] ?? ""
  const description = homepageSource.match(/const pageDescription = "([^"]+)"/)?.[1] ?? ""

  assert.ok(title.length >= 45 && title.length <= 60, `title length was ${title.length}`)
  assert.ok(description.length >= 150 && description.length <= 160, `description length was ${description.length}`)
  assert.match(homepageSource, /alternates: \{ canonical: "\/" \}/)
  assert.match(homepageSource, /type="application\/ld\+json"/)
  assert.match(homepageSource, /"@type": "SoftwareApplication"/)
  assert.match(homepageSource, /"@type": "WebPage"/)
  assert.match(homepageSource, /"@type": "WebSite"/)
  assert.match(homepageSource, /"@type": "Organization"/)
})

test("audited public routes have canonical metadata and truthful structured data", () => {
  const routes = ["tutorials", "license/2026-07-16", "terms", "contact", "whats-in-my-bag", "privacy", "trips", "portfolio", "copyright"]

  for (const route of routes) {
    const source = readFileSync(new URL(`../src/app/${route}/page.tsx`, import.meta.url), "utf8")
    assert.match(source, /canonical:/, `${route} was missing canonical metadata`)
    assert.match(source, /JsonLd|application\/ld\+json/, `${route} was missing JSON-LD`)
  }

  const contactSource = readFileSync(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(contactSource, /"@type": "Organization"[\s\S]*Mitch Russo Photography/)
})

test("contact and field-kit titles describe their visible page content", () => {
  const contactSource = readFileSync(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8")
  const fieldKitSource = readFileSync(new URL("../src/app/whats-in-my-bag/page.tsx", import.meta.url), "utf8")

  assert.match(contactSource, /title: "Contact PhotoView\.io Support and Product Team"/)
  assert.match(contactSource, /support@photoview\.io/)
  assert.doesNotMatch(contactSource, /Mitch Russo Photography|contact@mitchrussophotography\.com/)
  assert.match(fieldKitSource, /title: "Photography Field Kit: What's in My Bag and Essential Gear"/)
})

test("thin demos and utility routes have explicit indexation roles", () => {
  const demoSource = readFileSync(new URL("../src/app/demo/[galleryId]/page.tsx", import.meta.url), "utf8")
  const loginSource = readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8")
  const storageContactSource = readFileSync(new URL("../src/app/storage-contact/page.tsx", import.meta.url), "utf8")
  const registrationLayoutSource = readFileSync(new URL("../src/app/register/layout.tsx", import.meta.url), "utf8")
  const registrationSuccessLayoutSource = readFileSync(new URL("../src/app/register/success/layout.tsx", import.meta.url), "utf8")

  assert.match(demoSource, /robots: \{ follow: true, index: false \}/)
  assert.match(loginSource, /robots: \{ follow: true, index: false \}/)
  assert.match(storageContactSource, /robots: \{ follow: true, index: false \}/)
  assert.match(registrationLayoutSource, /canonical: "\/register"/)
  assert.match(registrationSuccessLayoutSource, /robots: \{ follow: true, index: false \}/)
})

test("high-intent template and portfolio example pages are discoverable", () => {
  const templatesSource = readFileSync(new URL("../src/app/photography-website-templates/page.tsx", import.meta.url), "utf8")
  const examplesSource = readFileSync(new URL("../src/app/articles/photography-portfolio-examples/page.tsx", import.meta.url), "utf8")
  const templateData = readFileSync(new URL("../src/data/marketing-templates.ts", import.meta.url), "utf8")
  const sitemapSource = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8")

  assert.match(templatesSource, /canonical: "\/photography-website-templates"/)
  assert.match(templatesSource, /"@type": "CollectionPage"/)
  assert.match(templatesSource, /"@type": "ItemList"/)
  assert.match(templatesSource, /"@type": "FAQPage"/)
  assert.match(examplesSource, /canonical: "\/articles\/photography-portfolio-examples"/)
  assert.match(examplesSource, /"@type": "Article"/)
  assert.match(templateData, /id: "blank-canvas"/)
  assert.match(templateData, /id: "bold-color"/)
  assert.match(sitemapSource, /"\/photography-website-templates"/)
})

test("audited tutorial images and portfolio covers stay below the public-page byte budget", () => {
  const tutorialAssets = [...tutorialDataSource.matchAll(/src: "\/tutorials\/([^"]+)"/g)].map((match) => match[1])

  for (const asset of tutorialAssets) {
    const size = statSync(new URL(`../public/tutorials/${asset}`, import.meta.url)).size
    assert.ok(size < 100_000, `${asset} was ${size} bytes`)
  }

  assert.doesNotMatch(tutorialDataSource, /tutorials\/[^"']+\.png/)
  assert.match(portfolioGridSource, /gallery\.photos\?\.\[0\]\?\.thumbnailUrl/)
})

test("llms.txt describes PhotoView and links to its primary resources", () => {
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8")

  assert.match(llms, /^# PhotoView\.io/m)
  assert.match(llms, /30\+ responsive website templates/)
  assert.match(llms, /https:\/\/photoview\.io\/photography-website-templates/)
  assert.match(llms, /https:\/\/photoview\.io\/articles\/photography-portfolio-examples/)
  assert.match(llms, /https:\/\/photoview\.io\/register/)
  assert.match(llms, /https:\/\/photoview\.io\/tutorials/)
  assert.match(llms, /https:\/\/photoview\.io\/articles/)
})

test("every audited homepage image is served from an optimized asset below 100 KB", () => {
  const optimizedAssets = [
    "../public/brand/photoview-logo-horizontal-transparent.webp",
    "../public/brand/photoview-logo-horizontal-transparent-small.webp",
    "../public/marketing-preview/myanmar-temple.webp",
    "../public/marketing-preview/lofoten-aurora.webp",
    "../public/marketing-preview/egypt-sphinx.webp",
    "../public/marketing-preview/sunset-panorama.webp",
    "../public/marketing-preview/portrait-scarf.webp",
    "../public/marketing-preview/mobile-tree-milky-way.webp",
    "../public/marketing-preview/mobile-ice-cave.webp",
    "../public/marketing-preview/gallery-sloss-furnaces.webp",
    "../public/marketing-preview/gallery-brazil.webp",
    "../public/marketing-preview/gallery-moab-night-sky.webp",
    "../public/marketing-preview/gallery-greenland.webp",
    "../public/marketing-preview/photography-portfolio-examples.webp",
    "../public/marketing-preview/myanmar-temple-thumbnail.webp",
    "../public/marketing-preview/lofoten-aurora-thumbnail.webp",
    "../public/marketing-preview/egypt-sphinx-thumbnail.webp",
    "../public/marketing-preview/sunset-panorama-thumbnail.webp",
  ]

  for (const asset of optimizedAssets) {
    const size = statSync(new URL(asset, import.meta.url)).size
    assert.ok(size < 100_000, `${asset} was ${size} bytes`)
  }

  const publicHomepageSources = `${homepageSource}\n${homepageComponentSource}`
  assert.doesNotMatch(publicHomepageSources, /marketing-preview\/(?:myanmar-temple|loften-aurora|egypt-sphinx|sunset-panorama|portrait-scarf|mobile-tree-milky-way|mobile-ice-cave)\.png/)
  assert.doesNotMatch(publicHomepageSources, /photoview-logo-horizontal-transparent\.png/)
  assert.doesNotMatch(publicHomepageSources, /rgn4fum6n5kjfahz\.public\.blob\.vercel-storage\.com/)
})

test("public pages defer analytics and do not hydrate subscriber-only session tools", () => {
  assert.match(rootLayoutSource, /strategy="lazyOnload"/)
  assert.match(rootLayoutSource, /const inter = Inter\(\{[\s\S]*display: "optional"/)
  assert.match(rootLayoutSource, /const jetbrainsMono = JetBrains_Mono\(\{[\s\S]*preload: false/)
  assert.doesNotMatch(rootLayoutSource, /SessionProvider|SubscriberFeedback/)
  assert.match(dashboardPageSource, /<SubscriberFeedback/)
  assert.doesNotMatch(homepageComponentSource, /from "next-auth\/react"/)
  assert.doesNotMatch(readFileSync(new URL("../src/components/site/home-hero.tsx", import.meta.url), "utf8"), /^"use client"/)
})

test("homepage defers below-the-fold rendering without removing crawlable content", () => {
  assert.match(homepageSource, /data-marketing-home/)
  assert.match(globalStylesSource, /main\[data-marketing-home\] > section:nth-of-type\(n \+ 3\)/)
  assert.match(globalStylesSource, /content-visibility: auto/)
  assert.match(globalStylesSource, /contain-intrinsic-size: auto 760px/)
})
