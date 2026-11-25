import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const dashboardSource = readFileSync(
  join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"),
  "utf8",
)

test("Library photos enlarge on double-click and collapse with one click", () => {
  assert.match(dashboardSource, /onDoubleClick=\{\(\) => \{[\s\S]*?setLibraryPreviewKey\(item\.key\)/)
  assert.match(dashboardSource, /title=\{isVideoAsset\(photo\) \? "Select video" : "Double-click to enlarge photo"\}/)
  assert.match(dashboardSource, /aria-label="Return enlarged Library photo to thumbnail size"/)
  assert.match(dashboardSource, /onClick=\{\(\) => setLibraryPreviewKey\(null\)\}/)
  assert.match(dashboardSource, /if \(event\.key === "Escape"\) setLibraryPreviewKey\(null\)/)
})

test("Portfolio photos enlarge on double-click and collapse to the grid with one click", () => {
  assert.match(dashboardSource, /onDoubleClick=\{\(\) => openPhotoViewer\(photo\.id\)\}/)
  assert.match(dashboardSource, /if \(event\.detail === 0\) openPhotoViewer\(photo\.id\)/)
  assert.match(dashboardSource, /aria-label="Return to thumbnail grid"/)
  assert.match(dashboardSource, /onClick=\{\(\) => setPortfolioViewMode\("grid"\)\}/)
  assert.match(dashboardSource, /title="Click once to return to thumbnails"/)
})
