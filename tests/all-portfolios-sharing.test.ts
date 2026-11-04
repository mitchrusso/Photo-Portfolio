import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInNewContext } from "node:vm"
import { createElement, type ComponentType, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

import * as galleryUtils from "../src/lib/gallery-utils.ts"
import { cn } from "../src/lib/utils.ts"

const require = createRequire(import.meta.url)

// Render the actual page and grid with local data, without loading server services.
function loadComponent<T>(path: string, dependencies: Record<string, unknown>): T {
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
  const executable = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const exports = {}
  runInNewContext(executable, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
  })
  return exports as T
}

const runtime = {
  react: require("react"),
  "react/jsx-runtime": require("react/jsx-runtime"),
}
const { PublicPortfolioGrid } = loadComponent<{ PublicPortfolioGrid: ComponentType<{
  allowLocalOverrides?: boolean
  galleries: galleryUtils.PortfolioGallery[]
  visibilityMode?: "public" | "shareable"
}> }>("../src/components/portfolio/public-portfolio-grid.tsx", {
  ...runtime,
  "@/lib/gallery-utils": galleryUtils,
  "@/lib/utils": { cn },
  "lucide-react": require("lucide-react"),
  "next/image": ({ alt, src }: { alt: string; src: string }) => createElement("img", { alt, src }),
  "next/link": ({ children, href }: { children: ReactNode; href: string }) => createElement("a", { href }, children),
})

function gallery(overrides: Partial<galleryUtils.PortfolioGallery> = {}): galleryUtils.PortfolioGallery {
  return {
    id: "landscapes",
    name: "Landscape photographs",
    client: "Personal",
    status: "Draft",
    privacy: "Public",
    images: 3,
    favorites: 0,
    revenue: "$0",
    cover: "/landscape-cover.jpg",
    description: "Landscapes from the field",
    workspaceSlug: "photographer",
    ...overrides,
  }
}

async function renderAllPortfolios(galleries: galleryUtils.PortfolioGallery[]) {
  const { default: SecureSharePage } = loadComponent<{
    default: (props: { params: Promise<{ token: string }> }) => Promise<ReactElement>
  }>("../src/app/s/[token]/page.tsx", {
    ...runtime,
    "next/headers": {},
    "next/navigation": { notFound: () => { throw new Error("Share not found") } },
    "@/components/portfolio/public-gallery-view": {},
    "@/components/portfolio/public-portfolio-grid": { PublicPortfolioGrid },
    "@/lib/gallery-access": {},
    "@/lib/portfolio-persistence": { getPublicWorkspacePortfolioGalleries: async () => galleries },
    "@/lib/secure-share-links": {
      parseSecureShareToken: () => ({ type: "workspace", workspaceSlug: "photographer" }),
    },
  })
  return renderToStaticMarkup(await SecureSharePage({ params: Promise.resolve({ token: "test-share" }) }))
}

test("All portfolios sharing displays public Draft portfolios with working gallery links", async () => {
  const html = await renderAllPortfolios([gallery()])

  assert.match(html, /Landscape photographs/)
  assert.match(html, /href="\/g\/photographer\/landscapes"/)
  assert.match(html, /alt="Landscape photographs cover"/)
})

test("All portfolios sharing preserves protected Gallery placeholders", async () => {
  const html = await renderAllPortfolios([gallery({
    parentGalleryProtection: { id: "protected-group", name: "Protected work", twoFactorEnabled: false },
  })])

  assert.match(html, /Landscape photographs/)
  assert.match(html, /Protected Gallery/)
  assert.doesNotMatch(html, /<img/)
})

test("All portfolios sharing shows the empty state when no portfolios are returned", async () => {
  assert.match(await renderAllPortfolios([]), /No portfolios are published yet\./)
})
