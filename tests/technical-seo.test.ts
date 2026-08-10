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

test("llms.txt describes PhotoView and links to its primary resources", () => {
  const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8")

  assert.match(llms, /^# PhotoView\.io/m)
  assert.match(llms, /30 responsive website templates/)
  assert.match(llms, /https:\/\/photoview\.io\/register/)
  assert.match(llms, /https:\/\/photoview\.io\/tutorials/)
  assert.match(llms, /https:\/\/photoview\.io\/articles/)
})

test("every audited homepage image is served from an optimized asset below 100 KB", () => {
  const optimizedAssets = [
    "../public/brand/photoview-logo-horizontal-transparent.webp",
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
