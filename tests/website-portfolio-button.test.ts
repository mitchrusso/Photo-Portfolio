import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

import type { WebsiteDraftPreview } from "../src/components/site/website-draft-preview.tsx"
import type { PortfolioGallery } from "../src/lib/gallery-utils.ts"

const require = createRequire(import.meta.url)
const componentCache = new Map<string, unknown>()

function loadComponent(path: string): unknown {
  if (componentCache.has(path)) return componentCache.get(path)
  const executable = ts.transpileModule(readFileSync(join(process.cwd(), path), "utf8"), {
    compilerOptions: {
      esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const exports = {}
  runInNewContext(executable, {
    exports,
    require: (name: string) => {
      if (name.startsWith("@/components/")) return loadComponent(`src/${name.slice(2)}.tsx`)
      if (name.startsWith("@/lib/") || name.startsWith("@/data/")) {
        return require(join(process.cwd(), "src", `${name.slice(2)}.ts`))
      }
      return require(name)
    },
  })
  componentCache.set(path, exports)
  return exports
}

const { WebsiteDraftPreview: Preview } = loadComponent("src/components/site/website-draft-preview.tsx") as {
  WebsiteDraftPreview: typeof WebsiteDraftPreview
}

const galleries: PortfolioGallery[] = [{
  id: "landscapes", name: "Landscapes", client: "Personal", status: "Draft",
  privacy: "Public", images: 1, favorites: 0, revenue: "$0", description: "",
  workspaceSlug: "photographer", cover: "/landscape.jpg", coverPhotoId: "landscape",
  photos: [{
    id: "landscape", title: "Mountain light", fileName: "landscape.jpg", kind: "Image",
    bytes: 1, blobUrl: "/landscape.jpg", displayUrl: "/landscape.jpg",
    downloadUrl: "/landscape.jpg", sourceUrl: "/landscape.jpg", width: 1200, height: 800,
  }],
}]

function render(template: string, featuredPortfolio = true, portfolioGrid = true) {
  return renderToStaticMarkup(createElement<NonNullable<Parameters<typeof Preview>[0]>>(Preview, {
    initialGalleries: galleries,
    initialSettings: {
      template,
      heroButtonLabel: "View portfolios",
      heroButtonUrl: "#portfolios",
      enabledBlocks: { hero: true, callToAction: true, featuredPortfolio, portfolioGrid },
      enabledPages: { home: true, about: false, articles: false, blog: false, contact: false, custom: false, gear: false },
    },
    mode: "published",
  }))
}

function assertPortfolioDestination(html: string) {
  assert.match(html, /<a\b[^>]*href="#portfolios"[^>]*>View portfolios(?:<svg\b[^]*?<\/svg>)?<\/a>/,
    "the home page must display the portfolio button")
  assert.equal([...html.matchAll(/\bid="portfolios"/g)].length, 1,
    "the portfolio button must have exactly one visible destination")
  const target = html.match(/<(section|div|nav|main)\b[^>]*\bid="portfolios"[^>]*>/)
  assert.ok(target, "the destination must be a rendered work section")
  const content = html.slice(target.index! + target[0].length).split(`</${target[1]}>`)[0]
  assert.match(content, /Landscapes|Mountain light|\/landscape\.jpg/,
    "the destination must contain portfolio content")
}

for (const template of ["cinematic-home", "editorial-story", "cinematic-chapters", "museum-index", "dark-filmstrip", "scroll-stack"]) {
  test(`${template} connects the home page portfolio button to the rendered work`, () => {
    assertPortfolioDestination(render(template))
  })
}

for (const [featured, grid] of [[true, true], [true, false], [false, true]]) {
  test(`home page portfolio button has a destination with featured=${featured} and grid=${grid}`, () => {
    assertPortfolioDestination(render("cinematic-home", featured, grid))
  })
}
