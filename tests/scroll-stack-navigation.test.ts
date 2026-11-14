import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { createElement, type ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

import type { StoryPortfolioExperience } from "../src/components/site/story-portfolio-experience.tsx"

const require = createRequire(import.meta.url)
const source = readFileSync(new URL("../src/components/site/story-portfolio-experience.tsx", import.meta.url), "utf8")
const executable = ts.transpileModule(source, {
  compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText
const exports = {} as { StoryPortfolioExperience: typeof StoryPortfolioExperience }
runInNewContext(executable, {
  exports,
  require: (name: string) => {
    if (name === "@/components/site/inspired-portfolio-experience") return {}
    return require(name)
  },
})

function props(compact: boolean, showFeaturedPortfolio: boolean, showPortfolioGrid: boolean): ComponentProps<typeof StoryPortfolioExperience> {
  return {
    accentColor: "#d7ef45", backgroundColor: "#eef0e7", compact,
    featuredHeadline: "Featured portfolios", featuredHeadlineAlignment: "left", featuredHeadlineStyle: {},
    filmStripHeadline: "", filmStripPhotos: [], footerSize: "compact",
    heroButtonHref: "#portfolios", heroButtonLabel: "View portfolios", heroContentVerticalAlignment: "middle",
    heroEyebrow: "", heroHeadline: "Photography", heroHeadlineScrollDuration: 1,
    heroHeadlineScrollSlowdown: 1, heroHeadlineStyle: {}, heroImageFit: "cover",
    heroImagePosition: "center", heroLayout: "overlay", heroMediaSource: "",
    heroOverlayStrength: 0, heroSubhead: "", heroVideoUrl: "",
    homeBlockOrder: ["hero", "featuredPortfolio", "filmStrip", "textBlock", "portfolioGrid"],
    introBody: "", introHeadline: "", introHeadlineAlignment: "left", introHeadlineStyle: {},
    navItems: [], onNavigate: () => {}, portfolioGridHeadline: "More portfolios",
    portfolioGridHeadlineAlignment: "left", portfolioGridHeadlineStyle: {},
    showFeaturedHeadline: true, showFeaturedPortfolio, showFilmStrip: false,
    showFilmStripHeadline: false, showHero: true, showHeroBody: false, showHeroButton: true,
    showHeroEyebrow: false, showHeroHeadline: true, showIntro: false, showIntroBody: false,
    showIntroHeadline: false, showPortfolioGrid, showPortfolioGridHeadline: true,
    siteName: "Photography", template: "scroll-stack", textAlign: "left", textColor: "#11140f",
    stories: Array.from({ length: 4 }, (_, index) => ({
      cover: `/portfolio-${index}.jpg`, href: `/g/photographer/portfolio-${index}`,
      id: `portfolio-${index}`, imageCount: 1, name: `Portfolio ${index + 1}`, photos: [],
    })),
  }
}

for (const compact of [false, true]) {
  for (const [featured, grid] of [[true, true], [true, false], [false, true]]) {
    test(`Scroll Stack hero links to visible portfolios on ${compact ? "mobile" : "desktop"} with featured=${featured} and grid=${grid}`, () => {
      const html = renderToStaticMarkup(createElement(exports.StoryPortfolioExperience, props(compact, featured, grid)))
      const heroLink = html.match(/<a\b[^>]*href="(#[^"]+)"[^>]*>View portfolios[\s\S]*?<\/a>/)
      assert.ok(heroLink, "the opening screen must render the View portfolios link")
      const targetId = heroLink[1].slice(1)
      const targets = [...html.matchAll(new RegExp(`<section\\b[^>]*\\bid="${targetId}"[^>]*>`, "g"))]
      assert.equal(targets.length, 1, "the hero link must resolve to exactly one visible section")
      assert.ok(targets[0][0].includes(featured ? "data-scroll-stack-featured-work" : "data-scroll-stack-portfolio-grid"),
        "the link must reach the portfolio cards, falling back to the grid when cards are hidden")
    })
  }
}
