import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { subscriberDeletionDate } from "../src/lib/subscriber-retention-policy.ts"
import { isInternalSubscriberEmail } from "../src/lib/internal-subscriber.ts"

test("subscriber deletion is scheduled exactly 30 days after access is disabled", () => {
  const now = new Date("2026-11-16T18:00:00.000Z")
  assert.equal(subscriberDeletionDate(now).toISOString(), "2026-12-16T18:00:00.000Z")
})

test("disabled subscriber workspaces cannot authenticate and are cleaned by the storage cron", () => {
  const access = readFileSync(join(process.cwd(), "src/lib/subscriber-access.ts"), "utf8")
  const cleanup = readFileSync(join(process.cwd(), "src/app/api/storage/cleanup/route.ts"), "utf8")
  assert.match(access, /workspace\.accessDisabledAt === null/)
  assert.match(cleanup, /processScheduledSubscriberDeletions/)
})

test("the internal owner subscriber account remains available and cannot enter retention cleanup", () => {
  assert.equal(isInternalSubscriberEmail(" MITCHRUSSO@YAHOO.COM "), true)
  assert.equal(isInternalSubscriberEmail("subscriber@example.com"), false)

  const access = readFileSync(join(process.cwd(), "src/lib/subscriber-access.ts"), "utf8")
  const retention = readFileSync(join(process.cwd(), "src/lib/subscriber-retention.ts"), "utf8")
  assert.match(access, /workspace\.accessDisabledAt === null \|\| isInternalSubscriberEmail\(user\.email\)/)
  assert.match(retention, /protected_internal_account/)
  assert.match(retention, /deletionScheduledAt: null/)
})
