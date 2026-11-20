import assert from "node:assert/strict"
import test from "node:test"

import {
  extractEmbeddedPhotoCaption,
  extractIptcCaption,
  resolveImportedCaption,
} from "../src/lib/photo-caption-metadata.ts"

test("extracts Adobe Bridge Description from XMP and decodes XML entities", () => {
  const xmp = `
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:description><rdf:Alt><rdf:li xml:lang="x-default">Winter &amp; spring at Mount Washington</rdf:li></rdf:Alt></dc:description>
      </rdf:Description>
    </rdf:RDF>`

  assert.equal(
    extractEmbeddedPhotoCaption({ xmpAsString: xmp }),
    "Winter & spring at Mount Washington",
  )
})

test("extracts IPTC Caption/Abstract dataset 2:120", () => {
  const caption = Buffer.from("A heron above the marsh", "utf8")
  const iptc = Buffer.concat([
    Buffer.from([0x1c, 0x02, 0x05, 0x00, 0x04]),
    Buffer.from("Test"),
    Buffer.from([0x1c, 0x02, 0x78, caption.length >> 8, caption.length & 0xff]),
    caption,
  ])

  assert.equal(extractIptcCaption(iptc), "A heron above the marsh")
  assert.equal(extractEmbeddedPhotoCaption({ iptc }), "A heron above the marsh")
})

test("uses embedded captions only for Bridge and preserves an explicit caption", () => {
  assert.equal(resolveImportedCaption("", "Bridge metadata caption", "bridge"), "Bridge metadata caption")
  assert.equal(resolveImportedCaption("", "Bridge metadata caption", "lightroom"), "")
  assert.equal(resolveImportedCaption("Entered caption", "Bridge metadata caption", "bridge"), "Entered caption")
})

test("normalizes and limits imported captions to PhotoView's caption length", () => {
  const caption = `  ${"word ".repeat(80)}  `
  const result = resolveImportedCaption("", caption, "bridge")
  assert.equal(result.length, 240)
  assert.doesNotMatch(result, /\s{2,}/)
})
