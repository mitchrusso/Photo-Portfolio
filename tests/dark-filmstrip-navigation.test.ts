import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInNewContext } from "node:vm"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

import type {
  StoryPortfolioExperience,
  StoryPortfolioItem,
} from "../src/components/site/story-portfolio-experience.tsx"

const require = createRequire(import.meta.url)
const source = readFileSync(new URL("../src/components/site/story-portfolio-experience.tsx", import.meta.url), "utf8")
const executable = ts.transpileModule(source, {
  compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText

function createExperience() {
  const state: unknown[] = []
  let cursor = 0
  const exports = {} as { StoryPortfolioExperience: typeof StoryPortfolioExperience }
  runInNewContext(executable, {
    exports,
    require: (name: string) => {
      if (name === "react") return {
        ...React,
        useEffect: () => {},
        useState: (initial: unknown) => {
          const index = cursor++
          if (!(index in state)) state[index] = initial
          return [state[index], (next: unknown) => {
            state[index] = typeof next === "function" ? next(state[index]) : next
          }]
        },
      }
      if (name === "@/components/site/inspired-portfolio-experience") return {}
      return require(name)
    },
  })
  return (props: React.ComponentProps<typeof StoryPortfolioExperience>) => {
    cursor = 0
    return exports.StoryPortfolioExperience(props)
  }
}

function elements(node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!React.isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as React.ReactNode)]
}

const stories: StoryPortfolioItem[] = [2, 3, 1].map((count, storyIndex) => ({
  cover: `/portfolio-${storyIndex}/cover.jpg`,
  href: "#",
  id: `portfolio-${storyIndex}`,
  imageCount: count,
  name: `Portfolio ${storyIndex + 1}`,
  photos: Array.from({ length: count }, (_, photoIndex) => ({
    displayLabel: `Caption ${storyIndex}-${photoIndex}`,
    height: 900,
    id: `photo-${storyIndex}-${photoIndex}`,
    source: `/portfolio-${storyIndex}/photo-${photoIndex}.jpg`,
    title: `Photo ${storyIndex}-${photoIndex}`,
    width: 1200,
  })),
}))

function props(compact: boolean): React.ComponentProps<typeof StoryPortfolioExperience> {
  return {
    accentColor: "#b4a083", backgroundColor: "#101010", compact,
    featuredHeadline: "", featuredHeadlineAlignment: "left", featuredHeadlineStyle: {},
    filmStripHeadline: "", filmStripPhotos: stories[1].photos, footerSize: "compact",
    heroButtonHref: "#", heroButtonLabel: "", heroContentVerticalAlignment: "middle",
    heroEyebrow: "", heroHeadline: "", heroHeadlineScrollDuration: 1,
    heroHeadlineScrollSlowdown: 1, heroHeadlineStyle: {}, heroImageFit: "contain",
    heroImagePosition: "center", heroLayout: "overlay", heroMediaSource: "",
    heroOverlayStrength: 0, heroSubhead: "", heroVideoUrl: "", homeBlockOrder: [],
    introBody: "", introHeadline: "", introHeadlineAlignment: "left", introHeadlineStyle: {},
    navItems: [], onNavigate: () => {}, portfolioGridHeadline: "",
    portfolioGridHeadlineAlignment: "left", portfolioGridHeadlineStyle: {},
    showFeaturedHeadline: false, showFeaturedPortfolio: false, showFilmStrip: true,
    showFilmStripHeadline: false, showHero: true, showHeroBody: false, showHeroButton: false,
    showHeroEyebrow: false, showHeroHeadline: false, showIntro: false, showIntroBody: false,
    showIntroHeadline: false, showPortfolioGrid: false, showPortfolioGridHeadline: false,
    siteName: "Wildlife", stories, template: "dark-filmstrip", textAlign: "left",
    textColor: "#f4f1eb",
  }
}

for (const compact of [false, true]) {
  test(`dark filmstrip preserves its independent portfolio and opens the selected photo on ${compact ? "mobile" : "desktop"}`, () => {
    const render = createExperience()
    const settings = props(compact)
    let tree = render(settings)

    function click(label: string) {
      const button = elements(tree).find((element) => element.type === "button"
        && (element.props["aria-label"] === label || element.props.children === label))
      assert.ok(button, `Missing button: ${label}`)
      const onClick = button.props.onClick as () => void
      onClick()
      tree = render(settings)
    }

    click("Show Photo 1-2")
    let html = renderToStaticMarkup(tree)
    assert.match(html, /src="\/portfolio-1\/photo-2\.jpg"/)
    assert.match(html, /<figcaption[^>]*>Caption 1-2<\/figcaption>/)

    click("Previous image")
    html = renderToStaticMarkup(tree)
    assert.match(html, /src="\/portfolio-1\/photo-1\.jpg"/)
    assert.match(html, /<figcaption[^>]*>Caption 1-1<\/figcaption>/)

    if (compact) {
      click("Wildlife")
      const storyButton = elements(tree).find((element) => element.type === "button"
        && elements(element).some((child) => child.type === "span" && child.props.children === "Portfolio 3"))
      assert.ok(storyButton)
      const onClick = storyButton.props.onClick as () => void
      onClick()
      tree = render(settings)
    } else {
      click("Portfolio 3")
    }

    html = renderToStaticMarkup(tree)
    assert.match(html, /src="\/portfolio-2\/photo-0\.jpg"/)
    assert.match(html, /<figcaption[^>]*>Caption 2-0<\/figcaption>/)
    for (const photo of stories[1].photos) assert.match(html, new RegExp(`aria-label="Show ${photo.title}"`))
  })
}
