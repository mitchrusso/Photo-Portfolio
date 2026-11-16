import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

test("website templates never hard-cap the selected portfolio collection", () => {
  const inspired = readFileSync(
    join(process.cwd(), "src/components/site/inspired-portfolio-experience.tsx"),
    "utf8",
  )
  const story = readFileSync(
    join(process.cwd(), "src/components/site/story-portfolio-experience.tsx"),
    "utf8",
  )

  assert.doesNotMatch(inspired, /visibleStories\.slice\(0,/)
  assert.doesNotMatch(inspired, /displayPhotos\.slice\(0,/)
  assert.doesNotMatch(story, /experienceStories\.slice\(0,/)
  assert.match(inspired, /portfolioDisplayEntries\.map/)
})
