import assert from "node:assert/strict"
import test from "node:test"

import { planMediaBackup } from "../src/lib/media-backup.ts"

test("media backup copies missing objects and skips same-size immutable objects", () => {
  const plan = planMediaBackup(
    [
      { Key: "galleries/a/original.jpg", Size: 120 },
      { Key: "galleries/b/display.webp", Size: 80 },
    ],
    [{ Key: "galleries/a/original.jpg", Size: 120 }],
  )

  assert.deepEqual(plan, {
    conflicts: [],
    copies: [{ key: "galleries/b/display.webp", size: 80 }],
    skipped: 1,
  })
})

test("media backup reports a size conflict instead of overwriting a locked object", () => {
  const plan = planMediaBackup(
    [{ Key: "galleries/a/original.jpg", Size: 120 }],
    [{ Key: "galleries/a/original.jpg", Size: 119 }],
  )

  assert.deepEqual(plan, {
    conflicts: [{ backupSize: 119, key: "galleries/a/original.jpg", sourceSize: 120 }],
    copies: [],
    skipped: 0,
  })
})
