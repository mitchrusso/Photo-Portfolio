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

for (const compact of [false, true]) {
  for (const [width, height] of [[6000, 4000], [2400, 3600]]) {
    test(`dark filmstrip bounds a ${width}x${height} photo to its ${compact ? "mobile" : "desktop"} viewer`, () => {
      const render = createExperience()
      const settings = props(compact)
      settings.stories = [{
        ...stories[0],
        photos: [{ ...stories[0].photos[0], width, height, displayLabel: "A saved wildlife caption" }],
      }]
      const tree = render(settings)
      const html = renderToStaticMarkup(tree)
      const figure = html.match(/<figure\b[^>]*>(.*?)<\/figure>/)?.[0] ?? ""
      const classes = figure.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? []

      assert.ok(classes.includes("min-h-0"), "the photo must shrink on short screens instead of keeping a fixed minimum height")
      assert.ok(classes.includes("min-w-0"), "the photo must shrink inside a narrow viewer")
      assert.ok(/<img\b[^>]*data-nimg="fill"/.test(figure), "the image must fit its frame without its natural dimensions enlarging the page")
      assert.ok(/<img\b[^>]*class="[^"]*object-contain/.test(figure), "the full photo must remain visible")
      assert.ok(/<figcaption\b[^>]*>A saved wildlife caption<\/figcaption>/.test(figure))

      if (compact) {
        assert.ok(classes.includes("h-[60svh]"), "mobile photos need a viewport-relative height")
      } else {
        const containers = elements(tree).filter((element) => element.type === "div")
        assert.ok(containers.some((element) => String(element.props.className).split(/\s+/).includes("h-svh")), "the desktop viewer must use the available screen height")
        assert.ok(containers.some((element) => String(element.props.className).includes("grid-cols-[210px_minmax(0,1fr)]")), "the image column must shrink below its content's natural width")
      }
    })
  }
}

test("dark filmstrip keeps many portfolio links within the desktop header", () => {
  const settings = props(false)
  settings.stories = Array.from({ length: 12 }, (_, index) => ({
    ...stories[0], id: `wildlife-${index}`, name: `Wildlife portfolio ${index + 1}`,
  }))
  const tree = createExperience()(settings)
  const navigation = elements(tree).find((element) => element.type === "nav" && element.props["aria-label"] === "Primary")
  assert.ok(navigation)
  const classes = String(navigation.props.className).split(/\s+/)
  assert.ok(classes.includes("flex-wrap"), "portfolio links must wrap rather than widen the website")
  assert.ok(classes.includes("min-w-0"), "the portfolio menu must shrink to the header width")
  const html = renderToStaticMarkup(tree)
  for (const story of settings.stories) assert.ok(html.includes(story.name))
})

test("dark filmstrip lets the contact sheet scroll and restores the bounded viewer after selection", () => {
  const render = createExperience()
  const settings = props(false)
  let tree = render(settings)
  const contactSheetButton = elements(tree).find((element) => element.type === "button" && element.props["aria-label"] === "Open contact sheet")
  assert.ok(contactSheetButton)
  const openContactSheet = contactSheetButton.props.onClick as () => void
  openContactSheet()
  tree = render(settings)

  const containerClasses = () => elements(tree)
    .filter((element) => element.type === "div")
    .flatMap((element) => String(element.props.className).split(/\s+/))
  assert.ok(!containerClasses().includes("h-svh"), "the contact sheet needs normal page scrolling")
  assert.ok(containerClasses().includes("h-[60svh]"), "the selected photo must stay bounded above the contact sheet")
  const photoButton = elements(tree).find((element) => element.type === "button" && String(element.props.className).includes("break-inside-avoid"))
  assert.ok(photoButton)
  const selectPhoto = photoButton.props.onClick as () => void
  selectPhoto()
  tree = render(settings)

  assert.ok(containerClasses().includes("h-svh"))
  assert.ok(renderToStaticMarkup(tree).includes("Caption 0-0"))
})
