import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { createOneTimeAccessCodeValue } from "../src/lib/one-time-access-code-value.ts"

test("one-time invitation codes are human-readable and generated with strong random inventory values", () => {
  const codes = new Set(Array.from({ length: 100 }, () => createOneTimeAccessCodeValue()))
  assert.equal(codes.size, 100)
  for (const code of codes) assert.match(code, /^PV-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
})

test("one-time invitation redemption is recipient-bound, transactional, and suppresses optional startup sequences", () => {
  const onboarding = readFileSync(join(process.cwd(), "src/lib/subscriber-onboarding.ts"), "utf8")
  const coupons = readFileSync(join(process.cwd(), "src/lib/coupons.ts"), "utf8")
  const automations = readFileSync(join(process.cwd(), "src/lib/email-automations.ts"), "utf8")
  const admin = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8")

  assert.match(onboarding, /UPDATE "OneTimeAccessCode"[\s\S]*"redeemedAt" IS NULL[\s\S]*"recipientEmail" = \$\{email\}/)
  assert.match(coupons, /oneTimeCode\.recipientEmail !== normalizedEmail/)
  assert.match(automations, /startupSequenceEnabled === false/)
  assert.match(admin, /assignedAt: null[\s\S]*redeemedAt: null/)
  assert.match(admin, /Enable startup email sequence/)
})
