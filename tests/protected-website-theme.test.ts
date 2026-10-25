import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("published websites include protected Galleries so visitors can reach their password gate", () => {
  const source = readFileSync(new URL("../src/lib/website-publication.ts", import.meta.url), "utf8")

  assert.equal(
    source.match(/includeProtectedGroups: true, includeVisiblePhotos: true/g)?.length,
    4,
  )
})

test("the subscriber dashboard restores and persists the selected theme", () => {
  const source = readFileSync(new URL("../src/components/portfolio/portfolio-dashboard.tsx", import.meta.url), "utf8")

  assert.match(source, /const DASHBOARD_THEME_STORAGE_KEY = "photoview-dashboard-theme"/)
  assert.match(source, /window\.localStorage\.getItem\(DASHBOARD_THEME_STORAGE_KEY\)/)
  assert.match(source, /if \(savedTheme === "dark" \|\| savedTheme === "light"\) setTheme\(savedTheme\)/)
  assert.match(source, /if \(!themeStorageReady\) return/)
  assert.match(source, /window\.localStorage\.setItem\(DASHBOARD_THEME_STORAGE_KEY, theme\)/)
})
