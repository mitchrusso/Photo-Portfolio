import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import type { PortfolioGallery } from "../src/lib/gallery-utils.ts"

// Exercise the dashboard's actual submit handler without a browser or remote writes.
const dashboardSource = readFileSync(new URL("../src/components/portfolio/portfolio-dashboard.tsx", import.meta.url), "utf8")
const handlerStart = dashboardSource.indexOf("  async function addGallery(")
const handlerEnd = dashboardSource.indexOf("\n  function updateActiveGallery(", handlerStart)
assert.ok(handlerStart >= 0 && handlerEnd > handlerStart)
const handlerSource = ts.transpileModule(dashboardSource.slice(handlerStart, handlerEnd), {
  compilerOptions: { target: ts.ScriptTarget.ES2017 },
}).outputText

function creationHarness() {
  const existingPortfolio: PortfolioGallery = {
    id: "my-first-portfolio",
    name: "My First Portfolio",
    client: "Personal",
    status: "Draft",
    privacy: "Private link",
    images: 18,
    favorites: 0,
    revenue: "$0",
    cover: "/existing-cover.jpg",
    description: "Uploaded photographs",
  }
  const state = {
    galleries: [existingPortfolio],
    activeGalleryId: existingPortfolio.id,
    showNewGallery: true,
    resets: 0,
    alerts: [] as string[],
    requests: [] as PortfolioGallery[][],
  }
  const form = { reset: () => { state.resets += 1 } }
  const fields = new FormData()
  // Reusing a deleted portfolio's name must create a new, empty portfolio.
  fields.set("name", "Travel")
  fields.set("status", "Draft")
  let resolveSave!: () => void
  let rejectSave!: (error: Error) => void
  const save = new Promise<void>((resolve, reject) => {
    resolveSave = resolve
    rejectSave = reject
  })
  const handler = runInNewContext(`(${handlerSource})`, {
    FormData: class {
      constructor(submittedForm: unknown) {
        assert.equal(submittedForm, form)
        return fields
      }
    },
    galleries: state.galleries,
    activeGallery: existingPortfolio,
    workspaceSlug: "test-workspace",
    slugify: (value: string) => value.toLowerCase().replace(/\s+/g, "-"),
    createPortfolioGalleriesNow: async (galleries: PortfolioGallery[]) => {
      state.requests.push(galleries)
      await save
    },
    setGalleries: (update: (current: PortfolioGallery[]) => PortfolioGallery[]) => {
      state.galleries = update(state.galleries)
    },
    setActiveGalleryId: (id: string) => { state.activeGalleryId = id },
    setShowNewGallery: (show: boolean) => { state.showNewGallery = show },
    window: { alert: (message: string) => { state.alerts.push(message) } },
  }) as (event: { preventDefault: () => void; currentTarget: typeof form | null }) => Promise<void>

  const event = { preventDefault() {}, currentTarget: form as typeof form | null }
  const submitted = handler(event)
  // React clears currentTarget when the synchronous event dispatch ends.
  event.currentTarget = null

  return { state, existingPortfolio, submitted, resolveSave, rejectSave }
}

test("creating an empty portfolio after an upload completes without a false failure", async () => {
  const { state, existingPortfolio, submitted, resolveSave } = creationHarness()
  resolveSave()
  await submitted

  assert.deepEqual(state.alerts, [])
  assert.equal(state.resets, 1)
  assert.equal(state.showNewGallery, false)
  assert.equal(state.requests.length, 1)
  assert.equal(state.requests[0].length, 1)
  assert.equal(state.requests[0][0].id, "travel")
  assert.equal(state.galleries.length, 2)
  assert.equal(state.galleries[0].name, "Travel")
  assert.equal(state.galleries[0].images, 0)
  assert.equal(state.activeGalleryId, "travel")
  assert.equal(state.galleries[1], existingPortfolio)
  assert.equal(state.galleries[1].images, 18)
})

test("a failed portfolio creation keeps the form and existing portfolio intact", async () => {
  const { state, existingPortfolio, submitted, rejectSave } = creationHarness()
  rejectSave(new Error("The portfolio could not be saved."))
  await submitted

  assert.equal(state.alerts.length, 1)
  assert.equal(state.resets, 0)
  assert.equal(state.showNewGallery, true)
  assert.deepEqual(state.galleries, [existingPortfolio])
  assert.equal(state.activeGalleryId, existingPortfolio.id)
})
