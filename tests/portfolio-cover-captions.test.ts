import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

import {
  getDisplayUrl,
  getThumbnailUrl,
  isVisibleRenderableImage,
  photoMatchesCover,
  publicGalleryPath,
  type PortfolioGallery,
  type PortfolioPhoto,
} from "../src/lib/gallery-utils.ts"
import { getWebsitePhotoDisplayLabel } from "../src/lib/website-photo-labels.ts"

function photo(id: string, caption: string): PortfolioPhoto {
  return {
    id,
    caption,
    blobUrl: `/photos/${id}.jpg`,
    displayUrl: `/photos/${id}.webp`,
    downloadUrl: `/photos/${id}.jpg`,
    bytes: 1,
    fileName: `${id}.jpg`,
    height: 800,
    kind: "Image",
    sourceUrl: `/photos/${id}.jpg`,
    title: id,
    width: 1200,
  }
}

// Run the actual Canvas and Preview/published story mappings without remote services.
for (const [component, variable] of [
  ["../src/components/portfolio/portfolio-dashboard.tsx", "websiteStoryPortfolioItems"],
  ["../src/components/site/website-draft-preview.tsx", "storyPortfolioItems"],
]) {
  const source = readFileSync(new URL(component, import.meta.url), "utf8")
  const helperStart = source.indexOf("function getWebsiteGalleryPhotoItems(")
  const helperEnd = source.indexOf("\nfunction ", helperStart)
  const mapping = source.match(new RegExp(`  const ${variable} = [\\s\\S]*?(?=\\n  const )`))?.[0]
  assert.ok(helperStart >= 0 && helperEnd > helperStart && mapping)
  const executable = ts.transpileModule(`${source.slice(helperStart, helperEnd)}\n${mapping}\n${variable}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2017 },
  }).outputText

  function storyFor(coverPhoto: PortfolioPhoto, overrides: Partial<PortfolioGallery> = {}) {
    const first = photo("first-regular", "First image caption")
    const gallery: PortfolioGallery = {
      id: "portfolio",
      name: "Portfolio",
      client: "Photographer",
      status: "Draft",
      privacy: "Public",
      images: 2,
      favorites: 0,
      revenue: "$0",
      cover: "/portfolio-cover",
      coverPhotoId: coverPhoto.id,
      description: "",
      photoLabelMode: "caption",
      photos: [first, coverPhoto],
      ...overrides,
    }
    return runInNewContext(executable, {
      getDisplayUrl,
      getThumbnailUrl,
      getWebsitePhotoDisplayLabel,
      getWebsitePhotoTitle: (item: PortfolioPhoto) => item.title,
      isVisibleRenderableImage,
      photoMatchesCover,
      publicGalleryPath,
      settings: { hideWebsitePhotoFileNames: true },
      websiteSettings: { hideWebsitePhotoFileNames: true },
      websiteWorkGalleries: [gallery],
      workGalleries: [gallery],
    })[0] as { summary: string; photos: { id: string; displayLabel: string }[] }
  }

  test(`${variable}: the first regular image keeps its caption when the cover has no caption`, () => {
    const story = storyFor(photo("cover", ""))
    assert.equal(story.summary, "")
    assert.equal(story.photos.find((item) => item.id === "first-regular")?.displayLabel, "First image caption")
  })

  test(`${variable}: cover text belongs to the selected cover photo`, () => {
    assert.equal(storyFor(photo("cover", "Cover caption")).summary, "Cover caption")
    assert.equal(storyFor(photo("cover", "Cover caption"), {
      cover: "/photos/cover.webp",
      coverPhotoId: undefined,
    }).summary, "Cover caption")
  })

  test(`${variable}: the selected cover takes precedence over an earlier URL match`, () => {
    for (const caption of ["Cover caption", ""]) {
      const story = storyFor(photo("cover", caption), { cover: "/photos/first-regular.webp" })
      assert.equal(story.summary, caption)
      assert.equal(story.photos.find((item) => item.id === "first-regular")?.displayLabel, "First image caption")
    }
  })

  test(`${variable}: an unavailable selected cover cannot borrow a URL match's caption`, () => {
    const overrides = { cover: "/photos/first-regular.webp" }
    assert.equal(storyFor({ ...photo("cover", "Hidden caption"), hidden: true }, overrides).summary, "")
    assert.equal(storyFor(photo("cover", "Cover caption"), { ...overrides, coverPhotoId: "missing" }).summary, "")
  })

  test(`${variable}: unmatched and hidden covers never borrow another image's caption`, () => {
    assert.equal(storyFor(photo("cover", "Cover caption"), { coverPhotoId: undefined }).summary, "")
    assert.equal(storyFor({ ...photo("cover", "Hidden caption"), hidden: true }).summary, "")
    assert.equal(storyFor(photo("cover", "Cover caption"), { photoLabelMode: "none" }).summary, "")
  })
}
