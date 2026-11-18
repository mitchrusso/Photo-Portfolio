import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { externalSupportWatchdogDispatchRequest } from "../src/lib/support-external-watchdog-request.ts"

test("external support watchdog dispatch targets the dedicated workflow on main", () => {
  const request = externalSupportWatchdogDispatchRequest({
    repository: "mitchrusso/Photo-Portfolio",
    token: "test-token",
  })

  assert.equal(
    request.url,
    "https://api.github.com/repos/mitchrusso/Photo-Portfolio/actions/workflows/support-engine-watchdog.yml/dispatches",
  )
  assert.equal(request.init.method, "POST")
  assert.deepEqual(JSON.parse(String(request.init.body)), { ref: "main" })
  assert.equal((request.init.headers as Record<string, string>).Authorization, "Bearer test-token")
})

test("external support watchdog dispatch rejects an unsafe repository name", () => {
  assert.throws(
    () => externalSupportWatchdogDispatchRequest({ repository: "mitchrusso/Photo-Portfolio?ref=bad", token: "test-token" }),
    /GITHUB_REPAIR_REPOSITORY is invalid/,
  )
})

test("support monitoring dispatches externally and records independent freshness", () => {
  const root = new URL("..", import.meta.url)
  const workflow = readFileSync(new URL(".github/workflows/support-engine-watchdog.yml", root), "utf8")
  const vercel = readFileSync(new URL("vercel.json", root), "utf8")
  const route = readFileSync(new URL("src/app/api/support/watchdog/route.ts", root), "utf8")
  const watchdog = readFileSync(new URL("src/lib/support-watchdog.ts", root), "utf8")

  assert.match(workflow, /workflow_dispatch:/)
  assert.match(vercel, /\/api\/support\/watchdog\/dispatch/)
  assert.match(route, /EXTERNAL_WORKER_NAME/)
  assert.match(route, /authorizeGitHubSupportWatchdogOidc/)
  assert.match(watchdog, /STALE_EXTERNAL_WORKER_MS = 45 \* 60 \* 1000/)
  assert.match(watchdog, /support:external-watchdog-stale/)
  assert.match(watchdog, /externalLastCompletedAt/)
})
