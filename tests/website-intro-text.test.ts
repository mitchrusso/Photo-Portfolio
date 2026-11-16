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

function loadExperience(file: string, dependencies: Record<string, unknown> = {}) {
  const source = readFileSync(new URL(`../src/components/site/${file}.tsx`, import.meta.url), "utf8")
  const executable = ts.transpileModule(source, {
    compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText
  const exports = {}
  runInNewContext(executable, {
    exports,
    require: (name: string) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
  })
  return exports
}

const experience = loadExperience("story-portfolio-experience", {
  "@/components/site/inspired-portfolio-experience": loadExperience("inspired-portfolio-experience"),
}) as { StoryPortfolioExperience: typeof StoryPortfolioExperience }

function props(template: "commercial-casebook" | "object-stage", compact: boolean): ComponentProps<typeof StoryPortfolioExperience> {
  return {
    accentColor: "#222222", backgroundColor: "#ffffff", compact,
    featuredHeadline: "", featuredHeadlineAlignment: "left", featuredHeadlineStyle: {},
    filmStripHeadline: "", filmStripPhotos: [], footerSize: "standard",
    heroButtonHref: "#portfolios", heroButtonLabel: "", heroContentVerticalAlignment: "middle",
    heroEyebrow: "", heroHeadline: "Separate hero heading", heroHeadlineScrollDuration: 1,
    heroHeadlineScrollSlowdown: 1, heroHeadlineStyle: {}, heroImageFit: "contain",
    heroImagePosition: "center", heroLayout: "overlay", heroMediaSource: "",
    heroOverlayStrength: 0, heroSubhead: "Separate hero body", heroVideoUrl: "", homeBlockOrder: [],
    introBody: "Original introduction body", introHeadline: "Original introduction heading",
    introHeadlineAlignment: "right", introHeadlineStyle: { fontSize: "36px" },
    navItems: [], onNavigate: () => {}, portfolioGridHeadline: "",
    portfolioGridHeadlineAlignment: "left", portfolioGridHeadlineStyle: {},
    showFeaturedHeadline: false, showFeaturedPortfolio: false, showFilmStrip: false,
    showFilmStripHeadline: false, showHero: true, showHeroBody: true, showHeroButton: false,
    showHeroEyebrow: false, showHeroHeadline: true, showIntro: true, showIntroBody: true,
    showIntroHeadline: true, showPortfolioGrid: false, showPortfolioGridHeadline: false,
    siteName: "Photography", stories: [], template, textAlign: "left", textColor: "#222222",
  }
}

for (const template of ["commercial-casebook", "object-stage"] as const) {
  for (const compact of [false, true]) {
    test(`${template} applies Intro text edits and visibility on ${compact ? "mobile" : "desktop"}`, () => {
      const settings = props(template, compact)
      const render = () => renderToStaticMarkup(createElement(experience.StoryPortfolioExperience, settings))
      let html = render()
      assert.match(html, /Original introduction heading/)
      assert.match(html, /Original introduction body/)
      assert.doesNotMatch(html, /Separate hero (heading|body)/)

      settings.introHeadline = "Updated introduction heading"
      settings.introBody = "Updated introduction body"
      html = render()
      assert.match(html, /Updated introduction heading/)
      assert.match(html, /Updated introduction body/)
      assert.doesNotMatch(html, /Original introduction/)
      assert.match(html, /text-align:right/)
      assert.match(html, /font-size:36px/)

      settings.showIntroHeadline = false
      html = render()
      assert.doesNotMatch(html, /Updated introduction heading/)
      assert.match(html, /Updated introduction body/)

      settings.showIntroHeadline = true
      settings.showIntroBody = false
      html = render()
      assert.match(html, /Updated introduction heading/)
      assert.doesNotMatch(html, /Updated introduction body/)

      settings.showIntroBody = true
      settings.showIntro = false
      html = render()
      assert.doesNotMatch(html, /Updated introduction|Separate hero body|home:textBlock/)

      settings.showIntro = true
      assert.match(render(), /Updated introduction body/, "showing Intro again must restore the saved text")
      settings.introHeadline = ""
      settings.introBody = ""
      html = render()
      assert.doesNotMatch(html, /<h2\b|Separate hero body|Photography and image-led stories/)
    })
  }
}
