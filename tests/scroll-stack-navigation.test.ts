import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

test("Scroll Stack gives the default hero action a portfolio anchor", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/site/story-portfolio-experience.tsx"),
    "utf8",
  )

  assert.match(
    source,
    /data-scroll-stack-featured-work\s+id="portfolios"/,
    "the primary Scroll Stack portfolio cards need the #portfolios anchor",
  )
  assert.match(
    source,
    /data-scroll-stack-portfolio-grid\s+id=\{showFeaturedPortfolio \? undefined : "portfolios"\}/,
    "the archive needs to own the anchor when Featured Work is hidden",
  )
})
