import assert from "node:assert/strict"
import test from "node:test"

import { getPublicWebsiteHomeHref } from "../src/lib/public-site-navigation.ts"

test("gallery Home returns to the custom-domain website root", () => {
  assert.equal(getPublicWebsiteHomeHref("mitchrussophotos.com", "melbendium-press"), "/")
  assert.equal(getPublicWebsiteHomeHref("www.mitchrussophotos.com", "melbendium-press"), "/")
})

test("gallery Home returns to the subdomain website root", () => {
  assert.equal(getPublicWebsiteHomeHref("melbendium-press.photoview.io", "melbendium-press"), "/")
})

test("gallery Home keeps the workspace route on the main PhotoView host", () => {
  assert.equal(
    getPublicWebsiteHomeHref("photoview.io", "melbendium press"),
    "/site/melbendium%20press",
  )
})
