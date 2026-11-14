import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { runInNewContext } from "node:vm"
import * as React from "react"
import ts from "typescript"

import type { PublicGalleryView } from "../src/components/portfolio/public-gallery-view.tsx"
import type { PortfolioGallery } from "../src/lib/gallery-utils.ts"

const require = createRequire(import.meta.url)
const executable = ts.transpileModule(readFileSync(new URL("../src/components/portfolio/public-gallery-view.tsx", import.meta.url), "utf8"), {
  compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText

type Element = React.ReactElement<Record<string, unknown>>
function elements(node: React.ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!React.isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as React.ReactNode)]
}

function createViewer(overrides: Partial<PortfolioGallery> = {}) {
  const gallery: PortfolioGallery = {
    id: "portfolio", name: "Portfolio", client: "Photographer", status: "Draft",
    privacy: "Public", images: 2, favorites: 0, revenue: "$0", description: "",
    cover: "/portrait.jpg", coverPhotoId: "portrait", watermarkEnabled: true,
    watermarkText: "Photo credit", watermarkImageUrl: "/signature.png",
    photos: ["portrait", "landscape"].map((id) => ({
      id, title: id, fileName: `${id}.jpg`, bytes: 1, kind: "Image",
      width: 0, height: 0, blobUrl: `/${id}.jpg`, downloadUrl: `/${id}.jpg`,
      sourceUrl: `/${id}.jpg`, displayUrl: `/${id}.jpg`,
    })),
    ...overrides,
  }
  const state: unknown[] = []
  const refs: { current: unknown }[] = []
  const effects: { dependencies?: unknown[]; cleanup?: () => void }[] = []
  let stateIndex = 0
  let refIndex = 0
  let effectIndex = 0
  let pending: (() => void)[] = []
  const imageEvents = new Map<string, () => void>()
  const observers = new Set<() => void>()
  const image = {
    clientWidth: 1200, clientHeight: 600, naturalWidth: 800, naturalHeight: 1200, complete: true,
    addEventListener: (name: string, listener: () => void) => imageEvents.set(name, listener),
    removeEventListener: (name: string) => imageEvents.delete(name),
  }
  const Image = () => null
  const exports = {} as { PublicGalleryView: typeof PublicGalleryView }
  runInNewContext(executable, {
    exports,
    queueMicrotask: (callback: () => void) => callback(),
    window: {
      localStorage: { getItem: () => null, setItem: () => {} },
      location: { href: "" }, addEventListener: () => {}, removeEventListener: () => {},
    },
    ResizeObserver: class {
      callback: () => void
      constructor(callback: () => void) { this.callback = callback }
      observe(target: unknown) { assert.equal(target, image); observers.add(this.callback) }
      disconnect() { observers.delete(this.callback) }
    },
    require: (name: string) => {
      if (name === "react") return {
        ...React,
        useMemo: (create: () => unknown) => create(),
        useCallback: (callback: unknown) => callback,
        useState: (initial: unknown) => {
          const index = stateIndex++
          if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial
          return [state[index], (next: unknown) => {
            state[index] = typeof next === "function" ? next(state[index]) : next
          }]
        },
        useRef: (initial: unknown) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
        useEffect: (effect: () => (() => void) | undefined, dependencies?: unknown[]) => {
          const index = effectIndex++
          const previous = effects[index]
          if (previous && dependencies?.every((value, i) => Object.is(value, previous.dependencies?.[i]))) return
          pending.push(() => {
            previous?.cleanup?.()
            effects[index] = { dependencies, cleanup: effect() }
          })
        },
      }
      if (name === "next/image") return Image
      if (name === "next/link") return () => null
      if (name === "@/components/portfolio/safe-image") return { SafeImage: Image }
      if (name.startsWith("@/lib/")) return require(join(process.cwd(), "src", `${name.slice(2)}.ts`))
      return require(name)
    },
  })

  let tree: React.ReactNode
  function render() {
    stateIndex = refIndex = effectIndex = 0
    tree = exports.PublicGalleryView({ demoMode: true, gallery })
    const photo = elements(tree).find((element) => element.type === Image && element.props.fill)
    if (photo?.props.ref) (photo.props.ref as { current: unknown }).current = image
    const scheduled = pending
    pending = []
    scheduled.forEach((effect) => effect())
  }
  render()
  render()
  return {
    image,
    frame() {
      render()
      const mark = elements(tree).find((element) => (element.props.style as React.CSSProperties)?.opacity === 0.55)
      assert.ok(mark, "the watermark must remain visible")
      const frame = elements(tree).find((element) => [element.props.children].flat(Infinity).includes(mark))
      assert.ok(frame)
      assert.ok(String(frame.props.className).split(" ").includes("absolute"), "watermark bounds must position the mark over the photo")
      return { style: { ...frame.props.style as React.CSSProperties }, mark }
    },
    resize(width: number, height: number) {
      image.clientWidth = width
      image.clientHeight = height
      observers.forEach((callback) => callback())
    },
    load(width: number, height: number) {
      image.naturalWidth = width
      image.naturalHeight = height
      image.complete = true
      imageEvents.get("load")?.()
    },
    next() {
      const button = elements(tree).find((element) => element.props["aria-label"] === "Next photo")
      assert.ok(button)
      const onClick = button.props.onClick as () => void
      onClick()
      render()
    },
    unmount() { effects.forEach((effect) => effect.cleanup?.()); assert.equal(observers.size, 0) },
  }
}

for (const watermarkMode of ["text", "image", "both"] as const) {
  test(`${watermarkMode} watermark stays inside portrait, square, and landscape photo edges`, () => {
    const viewer = createViewer({ watermarkMode })
    assert.deepEqual(viewer.frame().style, { left: 400, top: 0, width: 400, height: 600 })
    assert.match(String(viewer.frame().mark.props.className), /bottom-5 right-5/)

    viewer.load(1000, 1000)
    assert.deepEqual(viewer.frame().style, { left: 300, top: 0, width: 600, height: 600 })
    viewer.load(2400, 800)
    assert.deepEqual(viewer.frame().style, { left: 0, top: 100, width: 1200, height: 400 })

    viewer.resize(300, 600)
    assert.deepEqual(viewer.frame().style, { left: 0, top: 250, width: 300, height: 100 })
    viewer.unmount()
  })
}

test("watermark bounds follow photo navigation and wait for an image to load", () => {
  const viewer = createViewer()
  viewer.image.complete = false
  viewer.next()
  assert.equal(viewer.frame().style.visibility, "hidden")
  viewer.load(1200, 800)
  assert.deepEqual(viewer.frame().style, { left: 150, top: 0, width: 900, height: 600 })
  viewer.unmount()
})

for (const [watermarkPosition, positionClass] of [
  ["top-left", "left-5 top-5"], ["top-right", "right-5 top-5"],
  ["bottom-left", "bottom-5 left-5"], ["center", "left-1/2 top-1/2"],
] as const) {
  test(`${watermarkPosition} placement uses the photo bounds`, () => {
    const viewer = createViewer({ watermarkPosition })
    assert.deepEqual(viewer.frame().style, { left: 400, top: 0, width: 400, height: 600 })
    assert.ok(String(viewer.frame().mark.props.className).includes(positionClass))
    viewer.unmount()
  })
}
