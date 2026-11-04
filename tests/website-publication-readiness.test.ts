import assert from "node:assert/strict"
import test from "node:test"

import { prepareWebsiteForPublication } from "../src/lib/website-publication-readiness.ts"

const starterIntroduction = "Use this short introduction to tell visitors what kind of work they are about to see and why it matters."

function draft(template: string, introBody = starterIntroduction) {
  return JSON.stringify({
    template,
    enabledBlocks: { textBlock: true },
    enabledPages: { contact: false },
    pageCopy: { introBody },
  })
}

test("Dark Filmstrip publication does not warn about an introduction the template never displays", () => {
  const prepared = prepareWebsiteForPublication(draft("dark-filmstrip"))

  assert.deepEqual(prepared.issues, [])
  assert.deepEqual(prepared.adjustments, [])
  assert.equal(JSON.parse(prepared.body).enabledBlocks.textBlock, false)
})

test("templates displaying an introduction still omit starter copy and explain the adjustment", () => {
  for (const template of ["cinematic-home", "editorial-story"]) {
    const prepared = prepareWebsiteForPublication(draft(template))

    assert.deepEqual(prepared.adjustments, ["Home introduction"])
    assert.equal(JSON.parse(prepared.body).enabledBlocks.textBlock, false)
  }
})

test("publishing preserves a completed introduction without a setup warning", () => {
  const introduction = "Wildlife photographs and stories from the field."
  const prepared = prepareWebsiteForPublication(draft("editorial-story", introduction))
  const published = JSON.parse(prepared.body)

  assert.deepEqual(prepared.adjustments, [])
  assert.equal(published.enabledBlocks.textBlock, true)
  assert.equal(published.pageCopy.introBody, introduction)
})
