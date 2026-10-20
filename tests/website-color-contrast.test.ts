import assert from "node:assert/strict"
import test from "node:test"
import { getAccessibleWebsiteTextColor } from "../src/lib/website-color-contrast.ts"

test("website chrome corrects unreadable dark text on dark backgrounds", () => {
  assert.equal(getAccessibleWebsiteTextColor("#000106", "#171814"), "#ffffff")
  assert.equal(getAccessibleWebsiteTextColor("#fffdf8", "#ffffff"), "#171814")
})

test("website chrome preserves a subscriber color when it has sufficient contrast", () => {
  assert.equal(getAccessibleWebsiteTextColor("#000106", "#d8a84f"), "#d8a84f")
  assert.equal(getAccessibleWebsiteTextColor("#ffffff", "#171814"), "#171814")
})
