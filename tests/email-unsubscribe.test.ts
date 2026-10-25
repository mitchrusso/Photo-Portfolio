import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import {
  createEmailUnsubscribeToken,
  verifyEmailUnsubscribeToken,
} from "../src/lib/email-unsubscribe-token.ts"

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("email unsubscribe tokens are signed, scoped, normalized, and expire", () => {
  const previousSecret = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = "unsubscribe-test-secret"
  try {
    const token = createEmailUnsubscribeToken("  Subscriber@Example.COM ")
    const claims = verifyEmailUnsubscribeToken(token)
    assert.equal(claims?.email, "subscriber@example.com")
    assert.equal(claims?.purpose, "email_unsubscribe")

    const [payload, signature] = token.split(".")
    assert.equal(verifyEmailUnsubscribeToken(`${payload}.${signature}x`), null)
    assert.equal(verifyEmailUnsubscribeToken(createEmailUnsubscribeToken("subscriber@example.com", -1)), null)
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = previousSecret
  }
})

test("nonessential messages include visible and provider-native unsubscribe controls", () => {
  const lifecycle = source("src/lib/lifecycle-email.ts")
  const delivery = source("src/lib/email-delivery-health.ts")

  assert.match(lifecycle, /Unsubscribe from tips and product education/)
  assert.match(lifecycle, /"List-Unsubscribe"/)
  assert.match(lifecycle, /"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"/)
  assert.match(lifecycle, /if \(options\.essential\) return sendTransactionalEmail/)
  assert.match(delivery, /payload\.headers \? \{ headers: payload\.headers \} : \{\}/)
})

test("unsubscribe persists local suppression and opts out of the external autoresponder", () => {
  const route = source("src/app/api/email/unsubscribe/route.ts")
  const autoresponder = source("src/lib/autoresponder.ts")
  const automations = source("src/lib/email-automations.ts")

  assert.match(route, /reason: "USER_UNSUBSCRIBED"/)
  assert.match(route, /source: "unsubscribe_link"/)
  assert.match(route, /unsubscribeAutoresponder\(claims\.email\)/)
  assert.match(autoresponder, /status: "Unsubscribed"/)
  assert.match(automations, /await isEmailSuppressed\(email\)/)
})
