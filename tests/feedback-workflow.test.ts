import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("bug repair completion is authenticated, tracked, and sends a deduplicated fixed email", () => {
  const completionRoute = read("src/app/api/feedback/repair-complete/route.ts")
  const workflow = read("src/lib/feedback-workflow.ts")

  assert.match(completionRoute, /hasAuthorizedBearerSecret\(request, \[process\.env\.BUG_REPAIR_WEBHOOK_SECRET\]\)/)
  assert.match(completionRoute, /finalizeBugRepair/)
  assert.match(workflow, /feedback-bug-fixed:/)
  assert.match(workflow, /claimEmailDelivery/)
  assert.match(workflow, /Your PhotoView\.io bug report has been fixed/)
  assert.match(workflow, /status: "FIXED"/)
})

test("feature requests remain approval-gated in the protected SuperAdmin queue", () => {
  const adminPage = read("src/app/admin/feedback/page.tsx")
  const workflow = read("src/lib/feedback-workflow.ts")

  assert.match(workflow, /improvement: "AWAITING_APPROVAL"/)
  assert.match(adminPage, /isSuperAdminSession/)
  assert.match(adminPage, /hasValidSuperAdminMfa/)
  assert.match(adminPage, /Only feature requests can be approved/)
  assert.match(adminPage, /value="approve"/)
  assert.match(adminPage, /Mark fixed and email subscriber/)
})
