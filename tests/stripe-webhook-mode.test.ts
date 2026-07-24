import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test from "node:test"
import {
  isStripeWebhookModeAllowed,
  matchStripeWebhookSecret,
} from "../src/lib/stripe-webhook-signature.ts"

function signatureHeader(payload: string, secret: string) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")
  return `t=${timestamp},v1=${signature}`
}

test("matches primary and test Stripe endpoint secrets independently", () => {
  const payload = JSON.stringify({ id: "evt_test", livemode: false })
  const primarySecret = "whsec_primary"
  const testSecret = "whsec_test"

  assert.equal(matchStripeWebhookSecret({
    payload,
    primarySecret,
    signatureHeader: signatureHeader(payload, primarySecret),
    testSecret,
  }), "primary")
  assert.equal(matchStripeWebhookSecret({
    payload,
    primarySecret,
    signatureHeader: signatureHeader(payload, testSecret),
    testSecret,
  }), "test")
  assert.equal(matchStripeWebhookSecret({
    payload,
    primarySecret,
    signatureHeader: signatureHeader(payload, "whsec_wrong"),
    testSecret,
  }), null)
})

test("keeps live and sandbox webhook credentials isolated", () => {
  assert.equal(isStripeWebhookModeAllowed({
    livemode: true,
    matchedSecret: "primary",
    testSecretConfigured: true,
  }), true)
  assert.equal(isStripeWebhookModeAllowed({
    livemode: true,
    matchedSecret: "test",
    testSecretConfigured: true,
  }), false)
  assert.equal(isStripeWebhookModeAllowed({
    livemode: false,
    matchedSecret: "test",
    testSecretConfigured: true,
  }), true)
  assert.equal(isStripeWebhookModeAllowed({
    livemode: false,
    matchedSecret: "primary",
    testSecretConfigured: true,
  }), false)
})

test("retains single-secret test-mode compatibility until a test secret is configured", () => {
  assert.equal(isStripeWebhookModeAllowed({
    livemode: false,
    matchedSecret: "primary",
    testSecretConfigured: false,
  }), true)
})
