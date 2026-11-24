import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

test("Yahoo magic login links prefer verified support Gmail and retain Resend fallback", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/lifecycle-email.ts"), "utf8")

  assert.match(source, /endsWith\("@yahoo\.com"\)/)
  assert.match(source, /await sendSupportGmail\(/)
  assert.match(source, /if \(gmail\.state === "sent"\) return "sent"/)
  assert.match(source, /falling back to Resend/)
  assert.match(source, /return sendLifecycleEmail\(payload, \{ essential: true/)
})
