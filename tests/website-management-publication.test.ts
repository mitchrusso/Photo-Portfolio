import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { runInNewContext } from "node:vm"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

import type { WebsiteManagementPanel } from "../src/components/portfolio/website-management-panel.tsx"

const require = createRequire(import.meta.url)
const executable = ts.transpileModule(readFileSync(join(process.cwd(), "src/components/portfolio/website-management-panel.tsx"), "utf8"), {
  compilerOptions: {
    esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  },
}).outputText

async function renderWebsite(status: string, isPrimary = true) {
  const state: unknown[] = []
  const effects: (() => void)[] = []
  let cursor = 0
  const exports: { WebsiteManagementPanel?: typeof WebsiteManagementPanel } = {}
  runInNewContext(executable, {
    exports,
    fetch: async (url: string, options: RequestInit) => {
      assert.equal(url, "/api/websites")
      assert.equal(options.credentials, "same-origin")
      return {
        ok: true,
        json: async () => ({
          billing: { additionalWebsiteQuantity: 0, billingCycle: "MONTHLY", lifetimeAccess: false },
          websites: [{
            id: "selected-website", name: "My website", isPrimary, status,
            billingType: isPrimary ? "INCLUDED" : "ADD_ON",
            customDomain: null, subdomain: null, url: null,
          }],
        }),
      }
    },
    require: (name: string) => name === "react" ? {
      ...React,
      useCallback: (callback: unknown) => callback,
      useEffect: (effect: () => void) => { effects.push(effect) },
      useState: (initial: unknown) => {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [state[index], (next: unknown) => { state[index] = next }]
      },
    } : require(name),
  })
  const Panel = exports.WebsiteManagementPanel!
  const render = () => {
    cursor = 0
    return Panel({ fieldClass: "", mutedTextClass: "", surfaceClass: "" })
  }
  render()
  for (const effect of effects) effect()
  await new Promise<void>((resolve) => setImmediate(resolve))
  return renderToStaticMarkup(render())
}

test("My Websites gives the included draft a way to preview and publish the selected website", async () => {
  const html = await renderWebsite("DRAFT")
  assert.match(html, /Publish this website/)
  assert.match(html, /href="\/website-preview\?websiteId=selected-website"[^>]*>[\s\S]*?Preview and publish<\/a>/)
  assert.match(html, /save.*Edit website.*Publish website/)
  assert.doesNotMatch(html, /Activate for \$1\.29\/month/)
})

test("the included draft publishing action does not appear for an active or disabled primary website", async () => {
  for (const status of ["ACTIVE", "DISABLED"]) {
    const html = await renderWebsite(status)
    assert.doesNotMatch(html, /Preview and publish/)
  }
})

test("additional drafts keep their existing activation action", async () => {
  const html = await renderWebsite("DRAFT", false)
  assert.match(html, /Activate this website/)
  assert.match(html, /Activate for \$1\.29\/month/)
  assert.doesNotMatch(html, /Preview and publish/)
})
