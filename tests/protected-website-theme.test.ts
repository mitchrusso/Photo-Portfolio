import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  dashboardThemeCookie,
  dashboardThemeFromCookie,
} from "../src/lib/dashboard-theme-preference.ts"
import { publishedWebsiteIncludesGallery } from "../src/lib/website-public-cover.ts"

test("published websites include protected Galleries so visitors can reach their password gate", () => {
  const source = readFileSync(new URL("../src/lib/website-publication.ts", import.meta.url), "utf8")

  assert.equal(
    source.match(/includeProtectedGroups: true, includeVisiblePhotos: true/g)?.length,
    4,
  )
})

test("a published website may display only the selected protected Gallery cover", () => {
  assert.equal(publishedWebsiteIncludesGallery(JSON.stringify({ workSourceMode: "all" }), ["landscapes"]), true)
  assert.equal(publishedWebsiteIncludesGallery(JSON.stringify({ workSourceMode: "single", selectedGalleryId: "landscapes" }), ["landscapes"]), true)
  assert.equal(publishedWebsiteIncludesGallery(JSON.stringify({ workSourceMode: "single", selectedGalleryId: "birds" }), ["landscapes"]), false)
  assert.equal(publishedWebsiteIncludesGallery(JSON.stringify({ workSourceMode: "featured", featuredGalleryIds: ["landscapes"] }), ["landscapes"]), true)
  assert.equal(publishedWebsiteIncludesGallery(JSON.stringify({ workSourceMode: "featured", featuredGalleryIds: ["birds"] }), ["landscapes"]), false)
})

test("the public media route exempts a published cover without opening the protected portfolio", () => {
  const source = readFileSync(new URL("../src/app/api/media/[galleryId]/[photoId]/route.ts", import.meta.url), "utf8")
  assert.match(source, /gallery\.coverPhotoId === photo\.id/)
  assert.match(source, /parentProtection && !isWebsiteCover/)
  assert.match(source, /gallery\.privacy === "PASSWORD" && !isWebsiteCover/)
  assert.match(source, /variant === "display" \|\| variant === "thumbnail"/)
})

test("the subscriber dashboard restores and persists the selected theme", () => {
  const source = readFileSync(new URL("../src/components/portfolio/portfolio-dashboard.tsx", import.meta.url), "utf8")

  assert.match(source, /const savedTheme = restoreDashboardTheme\(\)/)
  assert.match(source, /if \(savedTheme\) setTheme\(savedTheme\)/)
  assert.match(source, /if \(!themeStorageReady\) return/)
  assert.match(source, /persistDashboardTheme\(theme\)/)
})

test("the dashboard theme cookie is shared across PhotoView hosts for Edge sign-ins", () => {
  assert.equal(dashboardThemeFromCookie("session=abc; photoview-dashboard-theme=dark"), "dark")
  assert.equal(dashboardThemeFromCookie("photoview-dashboard-theme=light; session=abc"), "light")
  assert.equal(dashboardThemeFromCookie("photoview-dashboard-theme=unknown"), null)

  assert.match(dashboardThemeCookie("dark", "www.photoview.io", true), /Domain=\.photoview\.io/)
  assert.match(dashboardThemeCookie("dark", "www.photoview.io", true), /SameSite=Lax; Secure/)
  assert.doesNotMatch(dashboardThemeCookie("light", "localhost", false), /Domain=/)
})
