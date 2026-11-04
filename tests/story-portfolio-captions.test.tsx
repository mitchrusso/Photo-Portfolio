import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { DarkFilmstripActivePhoto, type StoryPortfolioPhoto } from "../src/components/site/story-portfolio-experience.tsx"

function photo(displayLabel?: string): StoryPortfolioPhoto {
  return {
    displayLabel,
    height: 900,
    id: "gary-photo",
    source: "https://example.com/gary-photo.jpg",
    title: "Gary photo",
    width: 1200,
  }
}

test("dark filmstrip visibly renders the selected photo caption on desktop and mobile", () => {
  for (const compact of [false, true]) {
    const html = renderToStaticMarkup(<DarkFilmstripActivePhoto compact={compact} photo={photo("Gary's wildlife caption")} />)
    assert.match(html, /<figcaption/)
    assert.match(html, /Gary&#x27;s wildlife caption/)
  }
})

test("dark filmstrip does not reserve caption space when display text is disabled", () => {
  const html = renderToStaticMarkup(<DarkFilmstripActivePhoto compact={false} photo={photo("   ")} />)
  assert.doesNotMatch(html, /<figcaption/)
})
