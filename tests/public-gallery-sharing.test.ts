import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { runInNewContext } from "node:vm"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

import type { PublicGalleryView } from "../src/components/portfolio/public-gallery-view.tsx"
import type { PortfolioGallery } from "../src/lib/gallery-utils.ts"

const require = createRequire(import.meta.url)
const executable = ts.transpileModule(readFileSync(new URL("../src/components/portfolio/public-gallery-view.tsx", import.meta.url), "utf8"), {
  compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText

function elements(node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!React.isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as React.ReactNode)]
}

function createViewer(portfolioOpenMode: "viewer" | "thumbnail-grid") {
  const gallery: PortfolioGallery = {
    id: "landscapes", name: "Landscapes", client: "Personal", status: "Delivered",
    privacy: "Public", images: 23, favorites: 0, revenue: "$0", description: "Landscape photographs",
    cover: "/photo-0.jpg", coverPhotoId: "photo-0", portfolioOpenMode,
    photos: Array.from({ length: 23 }, (_, index) => ({
      id: `photo-${index}`, title: `Photo ${index}`, fileName: `photo-${index}.jpg`,
      kind: "Image", bytes: 1, width: 1200, height: 800,
      blobUrl: `/photo-${index}.jpg`, displayUrl: `/photo-${index}.jpg`,
      sourceUrl: `/photo-${index}.jpg`, downloadUrl: `/photo-${index}.jpg`,
    })),
  }
  const state: unknown[] = []
  const effects: (() => unknown)[] = []
  let cursor = 0
  let collectEffects = true
  const Image = ({ alt, src }: { alt: string; src: string }) => React.createElement("img", { alt, src })
  const exports = {} as { PublicGalleryView: typeof PublicGalleryView }
  runInNewContext(executable, {
    exports,
    queueMicrotask: (callback: () => void) => callback(),
    window: {
      location: { href: "https://gallery.example/g/photographer/landscapes", search: "" },
      localStorage: { getItem: () => null },
      addEventListener: () => {}, removeEventListener: () => {},
    },
    require: (name: string) => {
      if (name === "react") return {
        ...React,
        useMemo: (create: () => unknown) => create(),
        useCallback: (callback: unknown) => callback,
        useRef: (initial: unknown) => ({ current: initial }),
        useEffect: (effect: () => unknown) => { if (collectEffects) effects.push(effect) },
        useState: (initial: unknown) => {
          const index = cursor++
          if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial
          return [state[index], (next: unknown) => {
            state[index] = typeof next === "function" ? next(state[index]) : next
          }]
        },
      }
      if (name === "next/image") return Image
      if (name === "next/link") return ({ children, href }: React.ComponentProps<"a">) => React.createElement("a", { href }, children)
      if (name === "@/components/portfolio/safe-image") return { SafeImage: Image }
      if (name.startsWith("@/lib/")) return require(join(process.cwd(), "src", `${name.slice(2)}.ts`))
      return require(name)
    },
  })
  const render = () => {
    cursor = 0
    return exports.PublicGalleryView({ gallery })
  }
  render()
  collectEffects = false
  effects.forEach((effect) => effect())
  let tree = render()
  return {
    html: () => renderToStaticMarkup(tree),
    click(label: string) {
      const button = elements(tree).find((element) => element.type === "button"
        && (element.props["aria-label"] === label || [element.props.children].flat().includes(label)))
      assert.ok(button, `${label} must remain available`)
      const onClick = button.props.onClick as (event: unknown) => void
      onClick({ currentTarget: {} })
      tree = render()
    },
  }
}

for (const mode of ["viewer", "thumbnail-grid"] as const) {
  test(`${mode} hides sharing guidance while browsing and keeps sharing available`, () => {
    const viewer = createViewer(mode)
    assert.match(viewer.html(), /Share gallery/)
    assert.match(viewer.html(), /QR code/)
    assert.doesNotMatch(viewer.html(), /Sharing shows one cover preview/)
    assert.doesNotMatch(viewer.html(), /What social media receives/)

    viewer.click("Share gallery")
    assert.match(viewer.html(), /role="dialog"/)
    assert.match(viewer.html(), /What social media receives/)
    assert.match(viewer.html(), /In the post:<\/span> one cover preview/)
    assert.match(viewer.html(), /After clicking:<\/span> all 23 images/)

    viewer.click("Close sharing dialog")
    assert.doesNotMatch(viewer.html(), /role="dialog"/)
    assert.doesNotMatch(viewer.html(), /Sharing shows one cover preview/)
  })
}
