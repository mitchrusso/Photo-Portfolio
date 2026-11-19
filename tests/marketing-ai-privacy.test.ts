import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("homepage uses the approved serious-photographer banner", () => {
  const hero = read("src/components/site/home-hero.tsx")

  assert.match(hero, />Portfolio websites for serious photographers</)
  assert.doesNotMatch(hero, /not photography businesses/i)
})

test("homepage and Privacy Policy state that subscriber work is not used to train AI models", () => {
  const homepage = read("src/app/page.tsx")
  const privacy = read("src/app/privacy/page.tsx")

  assert.match(homepage, /Your work is not AI training data\./)
  assert.match(homepage, /does not use subscriber data, photographs, or videos to train AI models/)
  assert.match(homepage, /href="\/privacy"/)
  assert.match(privacy, /title: "AI and model training"/)
  assert.match(privacy, /does not use subscriber data, uploaded photographs, videos, captions, or portfolio content to train AI models/)
  assert.match(privacy, /Last updated November 19, 2026/)
  assert.match(privacy, /dateModified: "2026-11-19"/)
})
