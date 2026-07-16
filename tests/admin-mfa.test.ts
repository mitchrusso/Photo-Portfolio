import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import {
  ADMIN_MFA_MAX_AGE_SECONDS,
  createAdminMfaApprovalValue,
  verifyAdminMfaApprovalValue,
} from "../src/lib/admin-mfa-token.ts"
import { getAdminSmsMfaConfig } from "../src/lib/twilio-verify.ts"

function withEnv(values: Record<string, string | undefined>, assertion: () => void) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]))
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    assertion()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test("SuperAdmin MFA approval is signed, login-bound, and expiring", () => {
  withEnv({ AUTH_SECRET: "test-secret-with-enough-randomness" }, () => {
    const now = Date.UTC(2026, 6, 16, 12)
    const identity = { id: "owner-1", loginSessionId: "login-1" }
    const approval = createAdminMfaApprovalValue(identity, now)

    assert.equal(verifyAdminMfaApprovalValue(approval, identity, now + 1_000), true)
    assert.equal(verifyAdminMfaApprovalValue(`${approval}x`, identity, now + 1_000), false)
    assert.equal(verifyAdminMfaApprovalValue(approval, { ...identity, loginSessionId: "login-2" }, now + 1_000), false)
    assert.equal(verifyAdminMfaApprovalValue(approval, { ...identity, id: "owner-2" }, now + 1_000), false)
    assert.equal(verifyAdminMfaApprovalValue(approval, identity, now + ADMIN_MFA_MAX_AGE_SECONDS * 1_000), false)
  })
})

test("SuperAdmin SMS configuration stays off by default and requires complete private settings", () => {
  withEnv({
    ADMIN_SMS_MFA_ENABLED: undefined,
    SUPERADMIN_MFA_PHONE_E164: undefined,
    TWILIO_API_KEY_SECRET: undefined,
    TWILIO_API_KEY_SID: undefined,
    TWILIO_ACCOUNT_SID: undefined,
    TWILIO_AUTH_TOKEN: undefined,
    TWILIO_VERIFY_SERVICE_SID: undefined,
  }, () => {
    const config = getAdminSmsMfaConfig()
    assert.equal(config.enabled, false)
    assert.equal(config.ready, false)
    assert.equal(config.phone, null)
  })

  withEnv({
    ADMIN_SMS_MFA_ENABLED: "true",
    SUPERADMIN_MFA_PHONE_E164: "+12025550123",
    TWILIO_API_KEY_SECRET: "private-test-secret",
    TWILIO_API_KEY_SID: `SK${"a".repeat(32)}`,
    TWILIO_VERIFY_SERVICE_SID: `VA${"b".repeat(32)}`,
  }, () => {
    const config = getAdminSmsMfaConfig()
    assert.equal(config.enabled, true)
    assert.equal(config.ready, true)
    assert.equal(config.maskedPhone, "••• ••• 0123")
  })
})

test("all privileged SuperAdmin entry points enforce the second factor", () => {
  const adminPage = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8")
  const subscribersPage = readFileSync(join(process.cwd(), "src/app/admin/subscribers/page.tsx"), "utf8")
  const catalogPage = readFileSync(join(process.cwd(), "src/app/admin/stripe-catalog/page.tsx"), "utf8")
  const catalogRoute = readFileSync(join(process.cwd(), "src/app/api/admin/stripe/catalog/route.ts"), "utf8")

  assert.equal((adminPage.match(/hasValidSuperAdminMfa\(session\)/g) ?? []).length, 5)
  assert.match(subscribersPage, /hasValidSuperAdminMfa\(session\)/)
  assert.match(catalogPage, /hasValidSuperAdminMfa\(session\)/)
  assert.match(catalogRoute, /hasValidSuperAdminMfa\(session\)/)
})
