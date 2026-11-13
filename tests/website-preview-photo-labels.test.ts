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
import type { WebsiteDraftPreview } from "../src/components/site/website-draft-preview.tsx"
import { publicGalleryPath, type PortfolioGallery } from "../src/lib/gallery-utils.ts"

const require = createRequire(import.meta.url)
const gallery: PortfolioGallery = {
  id: "architecture", name: "Architecture", client: "Personal", status: "Draft",
  privacy: "Public", images: 1, favorites: 0, revenue: "$0", description: "",
  workspaceSlug: "photographer", cover: "/architecture.jpg", coverPhotoId: "cover",
  photos: [{
    id: "cover", title: "DSC_1234.jpg", fileName: "DSC_1234.jpg",
    caption: "An architectural study", kind: "Image", bytes: 1,
    blobUrl: "/architecture.jpg", displayUrl: "/architecture.jpg",
    sourceUrl: "/architecture.jpg", downloadUrl: "/architecture.jpg",
    width: 1200, height: 800,
  }],
}

const Image = ({ alt, src }: { alt: string; src: string }) => React.createElement("img", { alt, src })
const Link = ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children)

function loadComponent<T>(path: string, overrides: Record<string, unknown> = {}, globals: Record<string, unknown> = {}): T {
  const executable = ts.transpileModule(readFileSync(join(process.cwd(), path), "utf8"), {
    compilerOptions: {
      esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const exports = {}
  runInNewContext(executable, {
    exports, ...globals,
    require: (name: string) => {
      if (Object.hasOwn(overrides, name)) return overrides[name]
      if (name === "next/image") return Image
      if (name === "next/link") return Link
      if (name.startsWith("@/lib/") || name.startsWith("@/data/")) {
        return require(join(process.cwd(), "src", `${name.slice(2)}.ts`))
      }
      if (name.startsWith("@/components/")) {
        throw new Error(`Unexpected component dependency: ${name}`)
      }
      return require(name)
    },
  })
  return exports as T
}

const { PublicGalleryView: GalleryView } = loadComponent<{ PublicGalleryView: typeof PublicGalleryView }>(
  "src/components/portfolio/public-gallery-view.tsx",
  { "@/components/portfolio/safe-image": { SafeImage: Image } },
)

class ClickTarget {
  private href: string
  target: string
  constructor(href: string, target = "") { this.href = href; this.target = target }
  closest() { return this }
  getAttribute(name: string) { return name === "href" ? this.href : null }
  hasAttribute() { return false }
}

function elements(node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!React.isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as React.ReactNode)]
}

async function createPreview(settings: Record<string, unknown>, mode: "preview" | "published" = "preview", item = gallery) {
  const state: unknown[] = []
  const effects: (() => void)[] = []
  let cursor = 0
  let collectEffects = true
  const { WebsiteDraftPreview: Preview } = loadComponent<{ WebsiteDraftPreview: typeof WebsiteDraftPreview }>(
    "src/components/site/website-draft-preview.tsx",
    {
      react: {
        ...React,
        useMemo: (create: () => unknown) => create(),
        useEffect: (effect: () => void) => { if (collectEffects) effects.push(effect) },
        useState: (initial: unknown) => {
          const index = cursor++
          if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial
          return [state[index], (next: unknown) => {
            state[index] = typeof next === "function" ? next(state[index]) : next
          }]
        },
      },
      "@/components/portfolio/public-gallery-view": { PublicGalleryView: GalleryView },
      "@/components/contact/contact-form": { ContactForm: () => null },
      "@/components/site/email-signup-embed": { EmailSignupEmbed: () => null },
      "@/components/site/story-portfolio-experience": { StoryPortfolioExperience: () => null },
      "@/components/website/website-gear-grid": { WebsiteGearGrid: () => null },
      "@/components/website/website-story-accordion": { WebsiteStoryAccordion: () => null },
    },
    {
      Element: ClickTarget,
      URLSearchParams,
      queueMicrotask,
      window: {
        history: { scrollRestoration: "auto", replaceState: () => {} },
        location: { hash: "#home", search: "?websiteId=selected-website" },
        scrollTo: () => {}, addEventListener: () => {}, removeEventListener: () => {},
      },
      fetch: async (url: string) => {
        assert.ok(["/api/portfolio/galleries", "/api/website/draft?websiteId=selected-website"].includes(url))
        return { ok: true, json: async () => url.startsWith("/api/portfolio/") ? { galleries: [item] } : { settings } }
      },
    },
  )
  const render = () => {
    cursor = 0
    return Preview({ initialGalleries: [item], initialSettings: settings, mode })
  }
  let tree = render()
  collectEffects = false
  for (const effect of effects) effect()
  await new Promise<void>((resolve) => setImmediate(resolve))
  tree = render()
  return {
    tree: () => tree,
    click(href: string, options: { ctrlKey?: boolean; target?: string } = {}) {
      const event = {
        target: new ClickTarget(href, options.target), button: 0, defaultPrevented: false,
        ctrlKey: options.ctrlKey ?? false, metaKey: false, shiftKey: false, altKey: false,
        preventDefault() { this.defaultPrevented = true },
      }
      // The root sees clicks on nested images and links from every template.
      const onClickCapture = tree.props.onClickCapture as ((event: unknown) => void) | undefined
      onClickCapture?.(event)
      tree = render()
      return event.defaultPrevented
    },
    back() {
      const button = elements(tree).find((element) => element.type === "button"
        && element.props.children === "Back to website preview")
      assert.ok(button)
      const onClick = button.props.onClick as () => void
      onClick()
      tree = render()
    },
  }
}

for (const [hideWebsitePhotoFileNames, photoLabelMode, expectedLabel] of [
  [true, "file-name", ""],
  [false, "file-name", "DSC_1234.jpg"],
  [true, "caption", "An architectural study"],
  [true, "title", "DSC_1234.jpg"],
] as const) {
  test(`opening a draft portfolio preserves filename hiding=${hideWebsitePhotoFileNames} and ${photoLabelMode} labels`, async () => {
    const preview = await createPreview({ hideWebsitePhotoFileNames }, "preview", { ...gallery, photoLabelMode })
    assert.equal(preview.click(publicGalleryPath(gallery.id, gallery.workspaceSlug)), true,
      "opening a portfolio must stay in the saved draft preview")
    const view = elements(preview.tree()).find((element) => element.type === GalleryView)
    assert.ok(view, "the portfolio viewer must open")
    assert.equal(view.props.hidePhotoFileNames, hideWebsitePhotoFileNames)
    const html = renderToStaticMarkup(preview.tree())
    if (expectedLabel) assert.ok(html.includes(`>${expectedLabel}</p>`))
    else assert.doesNotMatch(html, />DSC_1234\.jpg<\/p>/)
    preview.back()
    assert.ok(!elements(preview.tree()).some((element) => element.type === GalleryView))
    assert.match(renderToStaticMarkup(preview.tree()), /Draft preview/)
  })
}

test("portfolio Home and Gallery grid return to the same draft preview", async () => {
  const preview = await createPreview({ hideWebsitePhotoFileNames: true })
  for (const href of ["#home", "#portfolios"]) {
    assert.equal(preview.click(publicGalleryPath(gallery.id, gallery.workspaceSlug)), true)
    assert.equal(preview.click(href), true)
    assert.ok(!elements(preview.tree()).some((element) => element.type === GalleryView))
  }
})

test("published, unrelated, and new-tab portfolio links keep their existing navigation", async () => {
  const path = publicGalleryPath(gallery.id, gallery.workspaceSlug)
  const published = await createPreview({ hideWebsitePhotoFileNames: true }, "published")
  assert.equal(published.click(path), false)
  const preview = await createPreview({ hideWebsitePhotoFileNames: true })
  assert.equal(preview.click("/g/another-workspace/architecture"), false)
  assert.equal(preview.click(path, { ctrlKey: true }), false)
  assert.equal(preview.click(path, { target: "_blank" }), false)
  assert.ok(!elements(preview.tree()).some((element) => element.type === GalleryView))
})

test("draft portfolio previews retain the existing protected Gallery gate", async () => {
  const preview = await createPreview({ hideWebsitePhotoFileNames: true }, "preview", {
    ...gallery, parentGalleryProtection: { id: "protected", name: "Protected work", twoFactorEnabled: false },
  })
  assert.equal(preview.click(publicGalleryPath(gallery.id, gallery.workspaceSlug)), true)
  const html = renderToStaticMarkup(preview.tree())
  assert.match(html, /Protected work/)
  assert.doesNotMatch(html, /alt="DSC_1234.jpg"/)
})

test("public galleries use the preserved original when the saved HDR preference is enabled", () => {
  const html = renderToStaticMarkup(React.createElement(GalleryView, {
    gallery: {
      ...gallery,
      preferHdrDisplay: true,
      photos: gallery.photos?.map((photo) => ({
        ...photo,
        deliveryUrl: "/api/media/gallery-id/photo-id",
      })),
    },
  }))

  assert.match(html, /variant=original/)
  assert.doesNotMatch(html, /variant=display/)
})
