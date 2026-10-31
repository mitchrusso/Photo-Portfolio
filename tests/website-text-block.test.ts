import assert from "node:assert/strict"
import test from "node:test"

import { normalizeWebsiteCustomBlocks } from "../src/lib/website-builder-rules.ts"

test("clearing a text-block heading stays cleared when website settings reload", () => {
  const blocks = [{
    body: "Wildlife photographs from the field.",
    galleryIds: [],
    id: "wildlife-intro",
    title: "",
    type: "text",
    visible: true,
  }]

  const restored = normalizeWebsiteCustomBlocks(JSON.parse(JSON.stringify(blocks)))

  assert.deepEqual(restored, blocks)
  assert.deepEqual(normalizeWebsiteCustomBlocks(JSON.parse(JSON.stringify(restored))), blocks)
})

test("text-block defaults apply only when a heading is missing, preserving edited and hidden blocks", () => {
  const blocks = normalizeWebsiteCustomBlocks([
    { id: "missing", type: "text" },
    { id: "edited", type: "text", title: "Wildlife", body: "Field notes." },
    { id: "hidden", type: "text", title: "", body: "Saved text.", visible: false },
  ])

  assert.equal(blocks[0].title, "Text block")
  assert.equal(blocks[1].title, "Wildlife")
  assert.equal(blocks[1].body, "Field notes.")
  assert.equal(blocks[2].title, "")
  assert.equal(blocks[2].body, "Saved text.")
  assert.equal(blocks[2].visible, false)
})
