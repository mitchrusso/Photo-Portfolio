import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("desktop website editing keeps scroll overflow inside the controls panel", () => {
  const source = readFileSync(new URL("../src/components/portfolio/portfolio-dashboard.tsx", import.meta.url), "utf8")
  const workspace = source.slice(source.indexOf('data-testid="website-builder-workspace"'))
  const panelClasses = workspace.match(/<aside className=\{`([^`]+)`\}/)?.[1].split(/\s+/) ?? []

  assert.ok(panelClasses.includes("lg:overflow-y-auto"))
  assert.ok(panelClasses.includes("lg:overscroll-y-contain"), "wheel scrolling at the panel edge must not move the surrounding page")
  // On smaller screens the controls use normal page scrolling.
  assert.ok(!panelClasses.includes("overscroll-y-contain"))
})

test("website live canvas keeps scroll overflow inside its preview frame", () => {
  const source = readFileSync(new URL("../src/components/portfolio/website-builder/website-live-canvas.tsx", import.meta.url), "utf8")
  const canvasClasses = source.match(/data-testid="website-live-canvas"\s+className=\{`([^`]+)`\}/)?.[1].split(/\s+/) ?? []

  assert.ok(canvasClasses.includes("overflow-y-auto"))
  assert.ok(canvasClasses.includes("overscroll-y-contain"), "wheel scrolling at the canvas edge must not move the surrounding page")
})
