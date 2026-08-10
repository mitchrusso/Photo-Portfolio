import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const source = readFileSync(join(process.cwd(), "src/lib/babylovegrowth-api.ts"), "utf8")
const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8")

test("BabyLoveGrowth requests stay server-only and use the required authentication contract", () => {
  assert.match(source, /import "server-only"/)
  assert.match(source, /https:\/\/api\.babylovegrowth\.ai\/api\/integrations/)
  assert.match(source, /process\.env\.BABYLOVEGROWTH_API_KEY/)
  assert.match(source, /headers\.set\("X-API-Key", getBabyLoveGrowthApiKey\(\)\)/)
  assert.match(source, /headers\.set\("Content-Type", "application\/json"\)/)
  assert.doesNotMatch(source, /NEXT_PUBLIC_BABYLOVEGROWTH/)
  assert.doesNotMatch(envExample, /BABYLOVEGROWTH_API_KEY="(?!blg_example)[^"]+"/)
})

test("BabyLoveGrowth requests cannot escape the integrations API or leak provider responses", () => {
  assert.match(source, /url\.origin !== baseUrl\.origin/)
  assert.match(source, /url\.pathname\.startsWith/)
  assert.match(source, /cache: "no-store"/)
  assert.match(source, /AbortSignal\.timeout/)
  assert.doesNotMatch(source, /responseText[^\n]*throw/)
})
