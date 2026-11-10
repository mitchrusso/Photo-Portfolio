import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const homepage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
const pricingPage = readFileSync(new URL("../src/app/pricing/page.tsx", import.meta.url), "utf8")
const validationStrip = readFileSync(new URL("../src/components/site/third-party-validation-strip.tsx", import.meta.url), "utf8")

test("homepage repeats a dated, linked third-party validation near the hero and pricing", () => {
  assert.match(homepage, /<ThirdPartyValidationStrip placement="hero" \/>/)
  assert.match(pricingPage, /<ThirdPartyValidationStrip placement="pricing" \/>/)
  assert.match(validationStrip, /Featured by f\.64 Academy · October 2026/)
  assert.match(validationStrip, /A new way to share photos!/) 
  assert.match(validationStrip, /https:\/\/www\.youtube\.com\/watch\?v=E9KcX6vF2-g/)
  assert.match(validationStrip, /target="_blank"/)
  assert.match(validationStrip, /rel="noopener noreferrer"/)
})
