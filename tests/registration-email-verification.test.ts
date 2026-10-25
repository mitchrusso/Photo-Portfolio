import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("registration requires mailbox verification before lead capture and account activation", () => {
  const leadRoute = source("src/app/api/trial/lead/route.ts")
  const registrationRoute = source("src/app/api/trial/register/route.ts")
  const registrationPage = source("src/app/register/page.tsx")

  assert.match(leadRoute, /emailVerificationToken: z\.string\(\)\.trim\(\)\.min\(32\)/)
  assert.match(leadRoute, /validateRegistrationEmailVerification\(email, emailVerificationToken\)/)
  assert.match(leadRoute, /issueVerifiedRegistrationToken\(lead\.email\)/)

  assert.match(registrationRoute, /emailVerificationToken: z\.string\(\)\.trim\(\)\.min\(32\)/)
  assert.match(registrationRoute, /validateRegistrationEmailVerification\(prospect\.email, emailVerificationToken\)/)
  assert.match(registrationRoute, /consumeRegistrationEmailVerification\(emailVerification\.id\)/)
  assert.doesNotMatch(registrationRoute, /const prospect = parsed\.data/)

  assert.match(registrationPage, /"contact" \| "verify" \| "details"/)
  assert.match(registrationPage, /action: "send"/)
  assert.match(registrationPage, /action: "verify"/)
  assert.match(registrationPage, /emailVerificationToken/)
  assert.match(registrationPage, /Six-digit verification code/)
})

test("verification tokens are hashed, expire, have attempt limits, and are single-use", () => {
  const verification = source("src/lib/registration-email-verification.ts")

  assert.match(verification, /createHash\("sha256"\)/)
  assert.match(verification, /timingSafeEqual/)
  assert.match(verification, /const MAX_ATTEMPTS = 6/)
  assert.match(verification, /expiresAt: \{ gt: new Date\(\) \}/)
  assert.match(verification, /consumedAt: null/)
  assert.match(verification, /data: \{ consumedAt: new Date\(\) \}/)
})

test("hard delivery failures suppress marketing while essential account mail can bypass suppression", () => {
  const delivery = source("src/lib/email-delivery-health.ts")
  const autoresponder = source("src/lib/autoresponder.ts")
  const lifecycle = source("src/lib/lifecycle-email.ts")
  const schema = source("prisma/schema.prisma")

  assert.match(delivery, /if \(!options\.essential && await isEmailSuppressed\(payload\.to\)\)/)
  assert.match(delivery, /status: "SUPPRESSED"/)
  assert.match(autoresponder, /await isEmailSuppressed\(payload\.email\)/)
  assert.match(lifecycle, /messageType: "sequence"/)
  assert.match(lifecycle, /essential: true, idempotencyKey, messageType: "magic_login"/)
  assert.match(lifecycle, /essential: true, idempotencyKey, messageType: "payment_failed"/)
  assert.match(schema, /model EmailSuppression/)
  assert.match(schema, /model RegistrationEmailVerification/)
})
