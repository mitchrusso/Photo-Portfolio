import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

test("OpenAI Q pixel uses the supplied registration pixel configuration", () => {
  const pixel = read("src/components/analytics/openai-q-pixel.tsx")

  assert.match(pixel, /https:\/\/bzrcdn\.openai\.com\/sdk\/oaiq\.min\.js/)
  assert.match(pixel, /JR8198fWnQT7fpiNnCbtxB/)
  assert.match(pixel, /oaiq\(\"init\",\{pixelId:/)
  assert.match(pixel, /debug:true/)
})

test("OpenAI Q pixel is limited to consented registration visits and allowed by CSP", () => {
  const consentManager = read("src/components/privacy/privacy-consent-manager.tsx")
  const config = read("next.config.ts")
  const privacy = read("src/app/privacy/page.tsx")

  assert.match(consentManager, /consent === "granted"/)
  assert.match(consentManager, /pathname === "\/register" \? <OpenAiQPixel \/>/)
  assert.match(config, /script-src[^\n]+https:\/\/bzrcdn\.openai\.com/)
  assert.match(privacy, /OpenAI conversion pixel/)
})
