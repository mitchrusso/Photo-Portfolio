import assert from "node:assert/strict"
import test from "node:test"
import { getSubscriberRegistrationReadiness } from "../src/lib/subscriber-registration-config.ts"

const registrationEnvNames = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "EMAIL_FROM",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "STRIPE_SECRET_KEY",
] as const

function withRegistrationEnv(values: Partial<Record<typeof registrationEnvNames[number], string>>, run: () => void) {
  const original = Object.fromEntries(registrationEnvNames.map((name) => [name, process.env[name]]))

  try {
    registrationEnvNames.forEach((name) => delete process.env[name])
    Object.assign(process.env, values)
    run()
  } finally {
    registrationEnvNames.forEach((name) => {
      const value = original[name]
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    })
  }
}

const baseConfig = {
  AUTH_SECRET: "test-auth-secret",
  DATABASE_URL: "postgresql://example.test/db",
  EMAIL_FROM: "PhotoView.io <hello@example.test>",
  RESEND_API_KEY: "re_test",
}

test("paid registration fails closed when Stripe is unavailable", () => {
  withRegistrationEnv(baseConfig, () => {
    const readiness = getSubscriberRegistrationReadiness({ couponApplied: false })

    assert.equal(readiness.ready, false)
    assert.deepEqual(readiness.missing, ["Stripe billing", "selected plan price"])
  })
})

test("paid registration is ready only with billing and the selected price", () => {
  withRegistrationEnv({ ...baseConfig, STRIPE_SECRET_KEY: "sk_test_example" }, () => {
    const readiness = getSubscriberRegistrationReadiness({ couponApplied: false, priceId: "price_starter" })

    assert.equal(readiness.ready, true)
    assert.deepEqual(readiness.missing, [])
  })
})

test("coupon registration bypasses Stripe but still requires login email", () => {
  withRegistrationEnv({ AUTH_SECRET: "test-auth-secret", DATABASE_URL: "postgresql://example.test/db" }, () => {
    const readiness = getSubscriberRegistrationReadiness({ couponApplied: true })

    assert.equal(readiness.ready, false)
    assert.deepEqual(readiness.missing, ["subscriber email"])
  })
})

test("coupon registration is ready without Stripe when core subscriber services exist", () => {
  withRegistrationEnv(baseConfig, () => {
    const readiness = getSubscriberRegistrationReadiness({ couponApplied: true })

    assert.equal(readiness.ready, true)
    assert.deepEqual(readiness.missing, [])
  })
})
