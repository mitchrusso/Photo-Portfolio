import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { runInNewContext } from "node:vm"
import * as React from "react"
import ts from "typescript"

import type { WebsiteDraftPreview } from "../src/components/site/website-draft-preview.tsx"

const require = createRequire(import.meta.url)
const executable = ts.transpileModule(readFileSync(join(process.cwd(), "src/components/site/website-draft-preview.tsx"), "utf8"), {
  compilerOptions: {
    esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  },
}).outputText

type Element = React.ReactElement<Record<string, unknown>>

function elements(node: React.ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!React.isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as React.ReactNode)]
}

function pathTo(node: React.ReactNode, target: Element): Element[] | undefined {
  if (node === target) return [target]
  if (Array.isArray(node)) return node.map((child) => pathTo(child, target)).find(Boolean)
  if (!React.isValidElement<Record<string, unknown>>(node)) return undefined
  const path = pathTo(node.props.children as React.ReactNode, target)
  return path ? [node, ...path] : undefined
}

function publishedWebsite() {
  const state: unknown[] = []
  let cursor = 0
  const submenu = {
    open: false,
    removeAttribute(name: string) { if (name === "open") this.open = false },
  }
  class ClickTarget {
    private insideSubmenu: boolean
    constructor(insideSubmenu: boolean) { this.insideSubmenu = insideSubmenu }
    closest(selector: string) {
      return selector === "[data-articles-submenu]" && this.insideSubmenu ? submenu : null
    }
  }
  const exports: { WebsiteDraftPreview?: typeof WebsiteDraftPreview } = {}
  runInNewContext(executable, {
    exports,
    Element: ClickTarget,
    document: { querySelector: () => submenu },
    window: { history: { replaceState: () => {} }, scrollTo: () => {} },
    require: (name: string) => {
      if (name === "react") return {
        ...React,
        useMemo: (create: () => unknown) => create(),
        useEffect: () => {},
        useState: (initial: unknown) => {
          const index = cursor++
          if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial
          return [state[index], (next: unknown) => { state[index] = next }]
        },
      }
      if (name === "next/image" || name === "next/link") return () => null
      if (name.startsWith("@/components/")) return new Proxy({}, { get: () => () => null })
      if (name.startsWith("@/lib/") || name.startsWith("@/data/")) {
        return require(join(process.cwd(), "src", `${name.slice(2)}.ts`))
      }
      return require(name)
    },
  })
  const Preview = exports.WebsiteDraftPreview!
  const render = () => {
    cursor = 0
    return Preview({
      mode: "published",
      initialGalleries: [],
      initialSettings: {
        template: "minimal-white",
        heroImageMode: "upload",
        heroImageUrl: "/hero.jpg",
        customPages: ["second", "first"].map((id) => ({
          id, navigationLabel: `Article ${id}`, title: `Title ${id}`, body: `Body ${id}`,
          navigationParent: "articles", navigationPlacement: "top",
          showInNavigation: true, visible: false,
        })),
      },
    })
  }
  let tree = render()
  return {
    tree: () => tree,
    submenu,
    click(element: Element, insideSubmenu = false) {
      const event = {
        target: new ClickTarget(insideSubmenu),
        currentTarget: { querySelector: () => submenu },
        button: 0, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true },
      }
      const capture = tree.props.onClickCapture as (event: unknown) => void
      const click = element.props.onClick as ((event: unknown) => void) | undefined
      capture(event)
      click?.(event)
      tree = render()
    },
  }
}

function articleMenu(tree: React.ReactNode) {
  const menu = elements(tree).find((element) => element.type === "details"
    && Object.hasOwn(element.props, "data-articles-submenu"))
  assert.ok(menu)
  return menu
}

test("the Articles dropdown stays opaque above the enabled Hero", () => {
  const website = publishedWebsite()
  const tree = website.tree()
  const menu = articleMenu(tree)
  const hero = elements(tree).find((element) => element.props.id === "home")
  assert.ok(hero, "the Hero must be enabled for this regression")
  const header = elements(tree).find((element) => element.type === "header")
  assert.match(String(header?.props.className), /\brelative z-40\b/)
  for (const ancestor of pathTo(tree, menu)!) {
    assert.doesNotMatch(String(ancestor.props.className), /\bopacity-(?:[0-9]|[1-9][0-9])\b/,
      "ancestor opacity makes the Hero bleed through the entire dropdown")
  }
  const panel = elements(menu).find((element) => element.type === "div")
  assert.ok((panel?.props.style as React.CSSProperties).backgroundColor)
})

test("the published Articles dropdown dismisses when a visitor clicks outside it", () => {
  const website = publishedWebsite()
  website.submenu.open = true
  const summary = elements(articleMenu(website.tree())).find((element) => element.type === "summary")!
  website.click(summary, true)
  assert.equal(website.submenu.open, true, "the summary must retain its native toggle behavior")
  const hero = elements(website.tree()).find((element) => element.props.id === "home")!
  website.click(hero)
  assert.equal(website.submenu.open, false)
})

test("Articles lists only assigned pages in order and opens hidden pages only when selected", () => {
  const website = publishedWebsite()
  const menuItems = elements(articleMenu(website.tree())).filter((element) => element.type === "button")
  assert.deepEqual(menuItems.map((item) => item.props.children), ["Article second", "Article first"])
  assert.ok(!elements(website.tree()).some((element) => String(element.props.id).startsWith("custom-")))

  website.submenu.open = true
  website.click(menuItems[0], true)
  assert.equal(website.submenu.open, false)
  assert.ok(elements(website.tree()).some((element) => element.props.id === "custom-second"))
  assert.ok(!elements(website.tree()).some((element) => element.props.id === "custom-first"))

  website.submenu.open = true
  const about = elements(website.tree()).find((element) => element.type === "a" && element.props.href === "#about")!
  website.click(about)
  assert.equal(website.submenu.open, false)
  assert.ok(elements(website.tree()).some((element) => element.props.id === "about"))
  assert.ok(!elements(website.tree()).some((element) => element.props.id === "custom-second"))
})
