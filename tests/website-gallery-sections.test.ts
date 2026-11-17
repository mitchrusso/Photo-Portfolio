import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import {
  findReusableWebsiteCustomBlock,
  getWebsiteCustomPortfolioBlockIds,
  normalizeWebsiteCustomBlocks,
} from "../src/lib/website-builder-rules.ts"

test("a full Home canvas can restore a compatible hidden block instead of disabling its plus button", () => {
  const blocks = normalizeWebsiteCustomBlocks([
    ...Array.from({ length: 11 }, (_, index) => ({
      id: `saved-${index}`,
      type: "text",
      title: `Saved ${index}`,
      body: "Subscriber content",
      visible: index < 5,
    })),
    {
      id: "unused-grid",
      type: "portfolio",
      title: "Portfolio collection",
      body: "",
      galleryIds: ["previous-selection"],
      portfolioSourceMode: "selected",
      visible: false,
    },
  ])

  assert.equal(blocks.length, 12)
  assert.equal(findReusableWebsiteCustomBlock(blocks, "portfolio")?.id, "unused-grid")
  assert.deepEqual(findReusableWebsiteCustomBlock(blocks, "portfolio")?.galleryIds, ["previous-selection"])
  assert.equal(findReusableWebsiteCustomBlock(blocks, "text"), undefined)
})

test("reusing a hidden Home block opens its editor so it can be configured", () => {
  const dashboard = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(dashboard, /data-website-custom-block="\$\{reusableBlock\.id\}"/)
  assert.match(dashboard, /editor\.open = true/)
  assert.match(dashboard, /editor\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/)
})

test("Gallery-sourced website grids stay synchronized without changing legacy manual grids", () => {
  const portfolios = [
    { id: "forest", portfolioGroupId: "nature" },
    { id: "ocean", portfolioGroupId: "nature" },
    { id: "portrait", portfolioGroupId: "people" },
  ]
  const [legacyBlock, galleryBlock, allBlock] = normalizeWebsiteCustomBlocks([
    { id: "legacy", type: "portfolio", galleryIds: ["portrait"] },
    { id: "nature", type: "portfolio", portfolioSourceMode: "gallery", portfolioGroupId: "nature" },
    { id: "everything", type: "portfolio", portfolioSourceMode: "all" },
  ])

  assert.equal(legacyBlock.portfolioSourceMode, "selected")
  assert.deepEqual(getWebsiteCustomPortfolioBlockIds(legacyBlock, portfolios), ["portrait"])
  assert.deepEqual(getWebsiteCustomPortfolioBlockIds(galleryBlock, portfolios), ["forest", "ocean"])
  assert.deepEqual(getWebsiteCustomPortfolioBlockIds(allBlock, portfolios), ["forest", "ocean", "portrait"])

  const afterAddingPortfolio = [...portfolios, { id: "mountains", portfolioGroupId: "nature" }]
  assert.deepEqual(getWebsiteCustomPortfolioBlockIds(galleryBlock, afterAddingPortfolio), ["forest", "ocean", "mountains"])
})

test("website builder exposes one-Gallery sourcing and fast Gallery section creation", () => {
  const menu = readFileSync(join(process.cwd(), "src/components/portfolio/website-builder/website-home-block-menu.tsx"), "utf8")
  const controls = readFileSync(join(process.cwd(), "src/components/portfolio/website-builder/website-portfolio-content-controls.tsx"), "utf8")
  const preview = readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8")

  assert.match(menu, /Add Gallery sections/)
  assert.match(menu, /One Gallery/)
  assert.match(menu, /New public portfolios added to this Gallery appear automatically/)
  assert.match(controls, /Automatically show that Gallery's public portfolios/)
  assert.match(preview, /selectedGalleries\.length === 0 && mode === "published"/)
})
