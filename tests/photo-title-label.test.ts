import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { getPortfolioPhotoDisplayLabel, type PortfolioPhoto } from "../src/lib/gallery-utils.ts"
import { getWebsitePhotoDisplayLabel } from "../src/lib/website-photo-labels.ts"

test("photo display text supports the photo title in portfolio and website views", () => {
  const photo = {
    caption: "A longer written description",
    fileName: "IMG_0042.jpg",
    title: "Autumn light",
  } as PortfolioPhoto

  assert.equal(getPortfolioPhotoDisplayLabel({ photoLabelMode: "title" }, photo), "Autumn light")
  assert.equal(getWebsitePhotoDisplayLabel({ photoLabelMode: "title" }, photo, false), "Autumn light")
  assert.equal(getWebsitePhotoDisplayLabel({ photoLabelMode: "title" }, photo, true), "Autumn light")
})

test("the title choice is selectable, persisted, and documented", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const persistenceSource = readFileSync(join(process.cwd(), "src/lib/portfolio-persistence.ts"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")
  const recipeSource = readFileSync(join(process.cwd(), "src/lib/ai-help-recipes.ts"), "utf8")

  assert.match(dashboardSource, /<option value="title">Title<\/option>/)
  assert.match(persistenceSource, /settings\.photoLabelMode === "title"/)
  assert.match(helpSource, /Photo display text to Title, Caption, File name, or Nothing/)
  assert.match(recipeSource, /Choose Title, Caption, File name, or Nothing/)
})
