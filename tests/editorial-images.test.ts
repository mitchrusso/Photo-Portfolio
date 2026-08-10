import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { articleImages } from "../src/data/article-images.ts"
import { productTutorials } from "../src/data/product-tutorials.ts"

test("every article has a unique, high-resolution hero image", () => {
  const articleSources = [
    readFileSync(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
    readFileSync(new URL("../src/data/approved-articles.ts", import.meta.url), "utf8"),
  ].join("\n")
  const articleSlugs = [...articleSources.matchAll(/["']?slug["']?\s*:\s*["']([^"']+)["']/g)].map((match) => match[1])
  const mappedSlugs = Object.keys(articleImages)

  assert.deepEqual(mappedSlugs.sort(), articleSlugs.sort())

  const imageSources = Object.values(articleImages).map((image) => image.src)
  assert.equal(new Set(imageSources).size, imageSources.length)

  for (const image of Object.values(articleImages)) {
    assert.ok(image.width >= 1800, `${image.src} should be at least 1800 pixels wide`)
    assert.ok(image.height >= 800, `${image.src} should be at least 800 pixels tall`)
    assert.ok(image.alt.length > 0)
    assert.ok(image.caption.length > 0)
  }
})

test("every tutorial uses its own screenshot", () => {
  const screenshotSources = productTutorials.map((tutorial) => tutorial.screenshot.src)

  assert.equal(new Set(screenshotSources).size, screenshotSources.length)
  assert.ok(productTutorials.every((tutorial) => tutorial.screenshot.alt.length > 0))
  assert.ok(productTutorials.every((tutorial) => tutorial.screenshot.caption.length > 0))
})
