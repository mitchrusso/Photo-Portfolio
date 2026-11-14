import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("website builder distinguishes a saved draft from the live publication", () => {
  const source = readFileSync(
    new URL("../src/components/portfolio/website-builder/website-builder-toolbar.tsx", import.meta.url),
    "utf8",
  )

  assert.match(source, /Saved draft changes are not live until you open Preview and select Publish website\./)
  assert.match(source, /saveStatus === "saved" \? "Draft saved—publish it" : "Live version exists"/)
  assert.doesNotMatch(source, /\{publishedAt \? "Published" : "Draft—not live"\}/)
})
