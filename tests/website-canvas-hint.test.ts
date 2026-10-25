import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import type { WebsiteCanvasHintState } from "../src/components/website/website-canvas-hint.tsx"

const require = createRequire(import.meta.url)
const source = readFileSync(new URL("../src/components/website/website-canvas-hint.tsx", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText

function mountHint(hint: WebsiteCanvasHintState | null) {
  const events = new EventTarget()
  const listeners: { type: string; capture: boolean | undefined }[] = []
  const effects: (() => void | (() => void))[] = []
  let closeCount = 0
  const exports: Record<string, (props: object) => unknown> = {}

  // Run the component's effects without a browser renderer. Event delivery uses
  // a real EventTarget; capture registration is checked for nested scroll areas.
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      if (name === "react") return { useEffect: (effect: () => void | (() => void)) => effects.push(effect) }
      if (name === "react-dom") return { createPortal: (children: unknown) => children }
      return require(name)
    },
    document: { body: {} },
    window: {
      addEventListener: (type: string, listener: EventListener, capture?: boolean) => {
        listeners.push({ type, capture })
        events.addEventListener(type, listener, { capture })
      },
      removeEventListener: (type: string, listener: EventListener, capture?: boolean) => {
        events.removeEventListener(type, listener, { capture })
      },
    },
  })

  exports.WebsiteCanvasHint({ hint, onClose: () => { closeCount += 1 }, onShowMe: () => {} })
  const cleanups = effects.map((effect) => effect())
  return {
    closeCount: () => closeCount,
    listeners,
    scroll: () => events.dispatchEvent(new Event("scroll", { bubbles: false })),
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  }
}

const tripHint: WebsiteCanvasHintState = {
  control: "content",
  description: "Edit trip entries",
  left: 100,
  sectionKey: "page:blog",
  title: "Trips / Blog",
  top: 100,
}

test("Trips / Blog edit hint closes when the surrounding editor scrolls", () => {
  const hint = mountHint(tripHint)
  hint.scroll()
  assert.equal(hint.closeCount(), 1)
  assert.deepEqual(hint.listeners, [{ type: "scroll", capture: true }], "capture also handles non-bubbling nested scroll events")

  hint.unmount()
  hint.scroll()
  assert.equal(hint.closeCount(), 1, "unmount removes the scroll listener")
})

test("a hidden edit hint does not subscribe to scroll events", () => {
  const hint = mountHint(null)
  hint.scroll()
  assert.equal(hint.closeCount(), 0)
  assert.deepEqual(hint.listeners, [])
  hint.unmount()
})
