import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

test("oversized images receive the safe-dimension error instead of the invalid-image error", () => {
  const uploadRoute = readFileSync(join(process.cwd(), "src/app/api/storage/upload/route.ts"), "utf8")

  assert.match(
    uploadRoute,
    /error instanceof Error && error\.message\.includes\("Input image exceeds pixel limit"\)/,
  )
  assert.match(
    uploadRoute,
    /throw new Error\("The image dimensions exceed the safe processing limit\."\)/,
  )
})
