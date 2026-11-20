import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

test("saved website drafts are distinguished from the live publication", () => {
  const draftRoute = source("src/app/api/website/draft/route.ts")
  const toolbar = source("src/components/portfolio/website-builder/website-builder-toolbar.tsx")

  assert.match(draftRoute, /hasUnpublishedChanges = Boolean\(website\.draftBody && website\.draftBody !== website\.publishedBody\)/)
  assert.match(draftRoute, /hasUnpublishedChanges: serializedSettings !== website\.publishedBody/)
  assert.match(toolbar, /hasUnpublishedChanges \? "Draft saved—not live yet" : "Live site up to date"/)
})

test("the website builder exposes an explicit path to the real publish control", () => {
  const dashboard = source("src/components/portfolio/portfolio-dashboard.tsx")
  const toolbar = source("src/components/portfolio/website-builder/website-builder-toolbar.tsx")

  assert.match(toolbar, /onClick=\{onPreview\}/)
  assert.match(toolbar, /Preview &amp; publish/)
  assert.match(dashboard, /saveWebsiteDraft\(websiteSettings, \{ requireRemote: true \}\)/)
  assert.match(dashboard, /router\.push\(`\/website-preview\$\{websiteApiQuery\}`\)/)
})
