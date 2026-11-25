import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const dashboardSource = readFileSync(
  join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"),
  "utf8",
)
const releaseNotificationsSource = readFileSync(
  join(process.cwd(), "src/components/portfolio/release-notifications.tsx"),
  "utf8",
)

test("Library photos enlarge on double-click and collapse with one click", () => {
  assert.match(dashboardSource, /onClick=\{\(\) => selectLibraryItemAfterClick\(item\)\}/)
  assert.match(dashboardSource, /onDoubleClick=\{\(\) => enlargeLibraryItem\(item\)\}/)
  assert.match(dashboardSource, /window\.setTimeout\(\(\) => \{[\s\S]*?openLibraryItem\(item\)[\s\S]*?\}, 220\)/)
  assert.match(dashboardSource, /function enlargeLibraryItem\(item: LibraryPhotoItem\)[\s\S]*?setLibraryPreviewKey\(item\.key\)/)
  assert.match(dashboardSource, /title=\{isVideoAsset\(photo\) \? "Select video" : "Double-click to enlarge photo"\}/)
  assert.match(dashboardSource, /aria-label="Return enlarged Library photo to thumbnail size"/)
  assert.match(dashboardSource, /onClick=\{\(\) => setLibraryPreviewKey\(null\)\}/)
  assert.match(dashboardSource, /if \(event\.key === "Escape"\) setLibraryPreviewKey\(null\)/)
  assert.match(dashboardSource, /src=\{getThumbnailUrl\(libraryPreviewItem\.photo\)\}/)
  assert.match(dashboardSource, /onLoad=\{\(\) => setLibraryPreviewFullLoaded\(true\)\}/)
  assert.match(dashboardSource, /aria-label="Previous Library photo"/)
  assert.match(dashboardSource, /aria-label="Next Library photo"/)
  assert.match(dashboardSource, /if \(event\.key === "ArrowLeft"\) showAdjacentLibraryPreview\(-1\)/)
  assert.match(dashboardSource, /if \(event\.key === "ArrowRight"\) showAdjacentLibraryPreview\(1\)/)
})

test("Portfolio photos enlarge on double-click and collapse to the grid with one click", () => {
  assert.match(dashboardSource, /onDoubleClick=\{\(\) => openPhotoViewer\(photo\.id\)\}/)
  assert.match(dashboardSource, /if \(event\.detail === 0\) openPhotoViewer\(photo\.id\)/)
  assert.match(dashboardSource, /aria-label="Return to thumbnail grid"/)
  assert.match(dashboardSource, /onClick=\{\(\) => setPortfolioViewMode\("grid"\)\}/)
  assert.match(dashboardSource, /title="Click once to return to thumbnails"/)
  assert.match(dashboardSource, /src=\{activeThumbnailSource\}/)
  assert.match(dashboardSource, /onLoad=\{\(\) => setPortfolioViewerFullLoaded\(true\)\}/)
})

test("What's new announces the faster enlarged photo viewer", () => {
  assert.match(releaseNotificationsSource, /2026-11-25-faster-photo-viewing/)
  assert.match(releaseNotificationsSource, /Review photographs faster/)
  assert.match(releaseNotificationsSource, /See an immediate preview while the sharper display image loads/)
  assert.match(releaseNotificationsSource, /Use the left and right controls—or your keyboard arrows—to browse/)
})
