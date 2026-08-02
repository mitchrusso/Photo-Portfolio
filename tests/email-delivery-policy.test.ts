import assert from "node:assert/strict"
import test from "node:test"

import {
  emailRetryDelayMs,
  getEmailQuotaLevel,
  getEmailQuotaWindowStarts,
  isRetryableEmailStatus,
} from "../src/lib/email-delivery-policy.ts"

test("email quota levels warn at 70 percent and become critical at 90 percent", () => {
  assert.equal(getEmailQuotaLevel(69, 100), "healthy")
  assert.equal(getEmailQuotaLevel(70, 100), "warning")
  assert.equal(getEmailQuotaLevel(89, 100), "warning")
  assert.equal(getEmailQuotaLevel(90, 100), "critical")
  assert.equal(getEmailQuotaLevel(100, 100), "critical")
})

test("email retry policy covers temporary provider failures only", () => {
  for (const status of [408, 425, 429, 500, 503]) {
    assert.equal(isRetryableEmailStatus(status), true)
  }
  for (const status of [400, 401, 403, 404, 422]) {
    assert.equal(isRetryableEmailStatus(status), false)
  }
})

test("email retry delays back off and respect a short Retry-After header", () => {
  assert.equal(emailRetryDelayMs(1), 250)
  assert.equal(emailRetryDelayMs(2), 500)
  assert.equal(emailRetryDelayMs(3), 1_000)
  assert.equal(emailRetryDelayMs(1, "1"), 1_000)
  assert.equal(emailRetryDelayMs(1, "30"), 2_000)
})

test("email usage windows use UTC day and month boundaries", () => {
  const starts = getEmailQuotaWindowStarts(new Date("2026-08-02T23:59:59.000-04:00"))
  assert.equal(starts.day.toISOString(), "2026-08-03T00:00:00.000Z")
  assert.equal(starts.month.toISOString(), "2026-08-01T00:00:00.000Z")
})
