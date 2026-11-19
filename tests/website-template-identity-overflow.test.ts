import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("narrow template identity rails wrap long website names instead of clipping them", () => {
  const story = read("src/components/site/story-portfolio-experience.tsx")
  const inspired = read("src/components/site/inspired-portfolio-experience.tsx")

  assert.match(story, /md:grid-cols-\[248px_1fr\][\s\S]*?min-h-screen min-w-0 flex-col border-r/)
  assert.match(story, /text-base font-semibold uppercase tracking-\[0\.18em\][^>]*\[overflow-wrap:anywhere\][^>]*xl:text-xl/)
  assert.match(story, /compact \? "block shrink-0 whitespace-nowrap" : "block w-full min-w-0 whitespace-normal break-words \[overflow-wrap:anywhere\]"/)
  assert.match(story, /data-scroll-stack-experience[\s\S]*?max-w-\[55%\][^>]*\[overflow-wrap:anywhere\]/)
  assert.match(story, /MasonryJournal|isMasonryJournal/)
  assert.match(story, /text-2xl font-light uppercase tracking-\[0\.2em\] \[overflow-wrap:anywhere\]/)
  assert.match(story, /tracking-\[-0\.065em\] \[overflow-wrap:anywhere\]/)
  assert.match(inspired, /tracking-\[0\.28em\] opacity-65 \[overflow-wrap:anywhere\]/)
  assert.match(inspired, /tracking-\[0\.18em\] text-white\/65 \[overflow-wrap:anywhere\]/)
})

test("shared compact and sidebar template identities retain safe wrapping or deliberate truncation", () => {
  const inspired = read("src/components/site/inspired-portfolio-experience.tsx")
  const story = read("src/components/site/story-portfolio-experience.tsx")

  assert.match(inspired, /whitespace-normal break-words text-xs font-semibold uppercase leading-5 tracking-\[0\.24em\]/)
  assert.match(inspired, /max-w-full text-xl font-light uppercase tracking-\[0\.18em\] \[overflow-wrap:anywhere\]/)
  assert.match(inspired, /max-w-full text-2xl font-light uppercase tracking-\[0\.12em\] \[overflow-wrap:anywhere\]/)
  assert.equal((story.match(/max-w-\[(?:38|42|55)%\] truncate/g) ?? []).length, 3)
})

test("every selectable website template is covered by the identity overflow audit", () => {
  const rules = read("src/lib/website-builder-rules.ts")
  const selectableBlock = rules.match(/SELECTABLE_WEBSITE_TEMPLATE_IDS = \[([\s\S]*?)\] as const/)
  assert.ok(selectableBlock, "selectable template registry must remain discoverable")
  const selectableTemplates = [...selectableBlock[1].matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1])
  const hardenedNarrowIdentities = new Set([
    "atelier-split",
    "coral-panorama",
    "editorial-rail",
    "masonry-journal",
    "scroll-stack",
    "studio-split",
  ])
  const previouslySafeIdentities = new Set([
    "acclaim-portfolio",
    "blank-canvas",
    "bold-color",
    "cinematic-chapters",
    "cinematic-home",
    "clean-grid",
    "commercial-casebook",
    "dark-filmstrip",
    "editorial-magazine",
    "editorial-story",
    "gallery-wall",
    "gear-notebook",
    "kinetic-headline",
    "museum-index",
    "museum-wall",
    "object-stage",
    "panorama-scroll",
    "portrait-card",
    "quiet-sequence",
    "specimen-wall",
    "split-hero",
    "story-journal",
    "swiss-sequence",
    "travel-atlas",
    "triptych-stage",
  ])

  assert.equal(selectableTemplates.length, 31)
  assert.deepEqual(
    selectableTemplates.filter((template) => !hardenedNarrowIdentities.has(template) && !previouslySafeIdentities.has(template)),
    [],
    "new selectable templates must receive an explicit identity-overflow review",
  )
})
