import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { isSmugMugAlbumUri, isSmugMugMediaUrl } from "../src/lib/smugmug-api.ts"

test("SmugMug import accepts only official album identifiers and SmugMug media hosts", () => {
  assert.equal(isSmugMugAlbumUri("/api/v2/album/abc_123-Z"), true)
  assert.equal(isSmugMugAlbumUri("https://api.smugmug.com/api/v2/album/abc"), false)
  assert.equal(isSmugMugAlbumUri("/api/v2/user/someone!albums"), false)
  assert.equal(isSmugMugAlbumUri("/api/v2/album/../../user"), false)

  assert.equal(isSmugMugMediaUrl("https://photos.smugmug.com/Travel/i-key/0/X5/file.jpg"), true)
  assert.equal(isSmugMugMediaUrl("https://api.smugmug.com/photo.jpg"), true)
  assert.equal(isSmugMugMediaUrl("http://photos.smugmug.com/photo.jpg"), false)
  assert.equal(isSmugMugMediaUrl("https://smugmug.com.example.com/photo.jpg"), false)
  assert.equal(isSmugMugMediaUrl("https://example.com/photo.jpg"), false)
})

test("SmugMug OAuth and imports remain server-side, scoped, encrypted, and resumable", () => {
  const root = process.cwd()
  const callbackSource = readFileSync(join(root, "src/app/api/import/smugmug/callback/route.ts"), "utf8")
  const importSource = readFileSync(join(root, "src/app/api/import/smugmug/route.ts"), "utf8")
  const cookieSource = readFileSync(join(root, "src/lib/smugmug-oauth-cookie.ts"), "utf8")
  const legacySource = readFileSync(join(root, "src/app/api/galleries/smugmug/route.ts"), "utf8")

  assert.match(callbackSource, /oauthToken !== cookie\.requestToken/)
  assert.match(callbackSource, /cookie\.workspaceId !== session\.user\.workspaceId/)
  assert.match(callbackSource, /encryptSocialToken\(credentials\.token\)/)
  assert.match(callbackSource, /encryptSocialToken\(credentials\.tokenSecret\)/)
  assert.match(cookieSource, /httpOnly|encryptSocialToken/)
  assert.match(importSource, /That gallery does not belong to the connected SmugMug account/)
  assert.match(importSource, /smugmug:\$\{image\.ImageKey\}/)
  assert.match(importSource, /privacy: "PRIVATE"/)
  assert.match(importSource, /status: "DRAFT"/)
  assert.match(importSource, /readResponseBytesLimited/)
  assert.match(importSource, /limitInputPixels: 100_000_000/)
  assert.match(importSource, /if \(!sameOrigin\(request\)\)/)
  assert.match(importSource, /storageLimitBytes: entitlement\.storageLimitBytes/)
  assert.match(legacySource, /public-page SmugMug scanner has been retired/)
})

test("Imports settings provide five focused systems and no public SmugMug URL form", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")

  for (const label of ["Lightroom", "Phone", "Smart Folders", "SmugMug Import", "Photo Upload"]) {
    assert.match(dashboardSource, new RegExp(`"${label}"`))
  }
  assert.match(dashboardSource, /Connect SmugMug/)
  assert.match(dashboardSource, /No SmugMug developer key, secret, or public URL is required from you/)
  assert.doesNotMatch(dashboardSource, />SmugMug URL</)
  assert.match(helpSource, /five focused pages: Lightroom, Phone, Smart Folders, SmugMug Import, and Photo Upload/)
  assert.match(helpSource, /select Phone from the five-option bar across the top/)
})

test("Import choices stay in the settings header and the main settings navigation does not depend on hints", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(dashboardSource, /data-testid="import-system-tabs"/)
  assert.match(dashboardSource, /activePanel === "settings" && settingsTab === "imports"/)
  assert.match(dashboardSource, /aria-controls=\{`import-panel-\$\{tabId\}`\}/)
  assert.match(dashboardSource, /role="tabpanel"/)
  assert.doesNotMatch(dashboardSource, /activePanel === "settings" && websiteEditHintsEnabled && \(\s*<nav\s+aria-label="Portfolio settings sections"/)
})
