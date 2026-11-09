import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { isSmugMugAlbumUri, isSmugMugMediaUrl } from "../src/lib/smugmug-api.ts"
import {
  isSafeZipEntryPath,
  portfolioNameFromSmugMugZip,
  smugMugZipEntryKind,
  validateSmugMugZipEntries,
} from "../src/lib/smugmug-zip-import.ts"

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

test("Imports settings provide focused systems including Adobe Bridge and an API-independent SmugMug ZIP path", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const zipImportSource = readFileSync(join(process.cwd(), "src/components/uploads/smugmug-zip-import.tsx"), "utf8")
  const helpSource = readFileSync(join(process.cwd(), "src/lib/ai-help-knowledge.ts"), "utf8")

  for (const label of ["Lightroom", "Adobe Bridge", "Phone", "Smart Folders", "SmugMug Import", "Photo & Video"]) {
    assert.match(dashboardSource, new RegExp(`"${label}"`))
  }
  assert.match(dashboardSource, /Connect SmugMug/)
  assert.match(zipImportSource, /Import a SmugMug gallery ZIP/)
  assert.match(dashboardSource, /needs no SmugMug connection, developer key, or synchronization/)
  assert.doesNotMatch(dashboardSource, />SmugMug URL</)
  assert.match(helpSource, /focused pages for Lightroom, Adobe Bridge, Phone, Smart Folders, SmugMug Import, and Photo & Video Upload/)
  assert.match(helpSource, /select Phone from the import choices across the top/)
})

test("Adobe Bridge extension is downloadable, authenticated, source-scoped, and documented", () => {
  const root = process.cwd()
  const dashboardSource = readFileSync(join(root, "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")
  const bridgeSource = readFileSync(join(root, "extensions/adobe-bridge/PhotoViewIoBridge.jsx"), "utf8")
  const bridgeRoute = readFileSync(join(root, "src/app/api/bridge/import/route.ts"), "utf8")
  const initiateRoute = readFileSync(join(root, "src/app/api/bridge/import/initiate/route.ts"), "utf8")
  const finalizeRoute = readFileSync(join(root, "src/app/api/bridge/import/finalize/route.ts"), "utf8")
  const importHandler = readFileSync(join(root, "src/lib/photo-import-handler.ts"), "utf8")
  const helpSource = readFileSync(join(root, "src/lib/ai-help-knowledge.ts"), "utf8")

  assert.match(dashboardSource, /Download extension/)
  assert.match(dashboardSource, /Tools &gt; PhotoView\.io &gt; Publish selected photos/)
  assert.match(bridgeSource, /MenuElement\.create\("command", "Publish selected photos…"/)
  assert.match(bridgeSource, /\/api\/bridge\/import\/initiate/)
  assert.match(bridgeSource, /\/api\/bridge\/import\/finalize/)
  assert.match(bridgeSource, /MAX_BYTES = 50 \* 1024 \* 1024/)
  assert.doesNotMatch(bridgeSource, /--fail-with-body/)
  assert.match(bridgeSource, /Show key/)
  assert.match(bridgeSource, /decodeURI\(file\.name\)/)
  assert.match(dashboardSource, /Current extension: v\{LATEST_ADOBE_BRIDGE_EXTENSION_VERSION\}/)
  assert.match(bridgeRoute, /listImportPortfolios/)
  assert.match(initiateRoute, /initiateDirectBridgeImport/)
  assert.match(finalizeRoute, /finalizeDirectBridgeImport/)
  assert.match(importHandler, /source: "bridge" \| "lightroom"/)
  assert.match(importHandler, /imports\/\$\{access\.credential\.workspaceId\}\/\$\{source\}/)
  assert.match(helpSource, /Tools > PhotoView\.io > Publish selected photos/)
})

test("SmugMug ZIP planning accepts supported photos, skips videos, and rejects unsafe archives", () => {
  assert.equal(portfolioNameFromSmugMugZip("Iceland-Download.zip"), "Iceland")
  assert.equal(portfolioNameFromSmugMugZip("Family Portraits.zip"), "Family Portraits")
  assert.equal(isSafeZipEntryPath("gallery/photo.jpg"), true)
  assert.equal(isSafeZipEntryPath("../photo.jpg"), false)
  assert.equal(isSafeZipEntryPath("C:/photo.jpg"), false)
  assert.equal(smugMugZipEntryKind("gallery/photo.HEIC"), "photo")
  assert.equal(smugMugZipEntryKind("gallery/clip.mp4"), "video")
  assert.equal(smugMugZipEntryKind("__MACOSX/._photo.jpg"), "ignored")

  assert.deepEqual(validateSmugMugZipEntries([
    { compressedSize: 500, directory: false, encrypted: false, filename: "gallery/photo.jpg", symlink: false, uncompressedSize: 1_000 },
    { compressedSize: 500, directory: false, encrypted: false, filename: "gallery/clip.mp4", symlink: false, uncompressedSize: 1_000 },
    { compressedSize: 50, directory: false, encrypted: false, filename: "gallery/readme.txt", symlink: false, uncompressedSize: 100 },
  ]), { expandedBytes: 2_100, photoCount: 1, skippedFiles: 1, skippedVideos: 1 })

  assert.throws(() => validateSmugMugZipEntries([
    { compressedSize: 1, directory: false, encrypted: false, filename: "../photo.jpg", symlink: false, uncompressedSize: 10 },
  ]), /unsafe file path/)
  assert.throws(() => validateSmugMugZipEntries([
    { compressedSize: 1, directory: false, encrypted: true, filename: "photo.jpg", symlink: false, uncompressedSize: 10 },
  ]), /Password-protected/)
  assert.throws(() => validateSmugMugZipEntries([
    { compressedSize: 1, directory: false, encrypted: false, filename: "photo.jpg", symlink: false, uncompressedSize: 10_000 },
  ]), /unsafe compression ratio/)
})

test("Import choices stay in the settings header and the main settings navigation does not depend on hints", () => {
  const dashboardSource = readFileSync(join(process.cwd(), "src/components/portfolio/portfolio-dashboard.tsx"), "utf8")

  assert.match(dashboardSource, /data-testid="import-system-tabs"/)
  assert.match(dashboardSource, /activePanel === "settings" && settingsTab === "imports"/)
  assert.match(dashboardSource, /aria-controls=\{`import-panel-\$\{tabId\}`\}/)
  assert.match(dashboardSource, /role="tabpanel"/)
  assert.doesNotMatch(dashboardSource, /activePanel === "settings" && websiteEditHintsEnabled && \(\s*<nav\s+aria-label="Portfolio settings sections"/)
})
