import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const root = process.cwd()

test("Library details can be resized, expanded, and restored with accessible controls", () => {
  const dashboard = readFileSync(join(root, "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(dashboard, /aria-label="Resize photo details panel"/)
  assert.match(dashboard, /role="separator"/)
  assert.match(dashboard, /--library-details-width/)
  assert.match(dashboard, /Expand photo details to full width/)
  assert.match(dashboard, /Restore Library split view/)
  assert.match(dashboard, /handleLibraryDetailsResizeKey/)
})

test("the newest alerts and tours explain the photographer-facing workflow improvements", () => {
  const notifications = readFileSync(join(root, "src/components/portfolio/release-notifications.tsx"), "utf8")
  const walkthroughs = readFileSync(join(root, "src/lib/website-walkthroughs.ts"), "utf8")

  assert.match(notifications, /2026-11-08-adobe-bridge-publish/)
  assert.match(notifications, /November 2026 release/)
  assert.match(notifications, /A roomier workspace for photo details/)
  assert.match(notifications, /Choose when website editing highlights appear/)
  assert.doesNotMatch(notifications, /Register for the free training/)
  assert.match(walkthroughs, /goal: "library-details"/)
  assert.match(walkthroughs, /drag the divider beside Details left or right/i)
  assert.match(walkthroughs, /new-library-details/)
  assert.match(walkthroughs, /new-highlights/)
  assert.match(walkthroughs, /new-lead-capture/)
})

test("tutorials and AI help carry the recent website and Library controls", () => {
  const tutorials = readFileSync(join(root, "src/data/product-tutorials.ts"), "utf8")
  const help = readFileSync(join(root, "src/lib/ai-help-knowledge.ts"), "utf8")
  const recipes = readFileSync(join(root, "src/lib/ai-help-recipes.ts"), "utf8")

  assert.match(tutorials, /Set the portfolio sequence and viewer navigation/)
  assert.match(tutorials, /Add an email signup form when you want to grow a list/)
  assert.match(tutorials, /Featured Work and All portfolios use independent selections/)
  assert.match(tutorials, /Hidden onscreen arrows do not disable desktop keyboard navigation or mobile swiping/)
  assert.match(help, /November 2026 workflow updates/)
  assert.match(help, /Select Save changes and wait for Changes saved/)
  assert.match(recipes, /resize-library-details/)
})
