import assert from "node:assert/strict"
import test from "node:test"

import { isSupportEngineAllClear, isSupportEngineOperational, type SupportOperationalState } from "../src/lib/support-health.ts"

function healthyState(overrides: Partial<SupportOperationalState> = {}): SupportOperationalState {
  return {
    counts: {
      expiredLeases: 0,
      failedAlerts: 0,
      overdueCases: 0,
      overdueResponses: 0,
      stalledRepairs: 0,
      unresolvedEscalations: 0,
    },
    externalWorkerFresh: true,
    workerFresh: true,
    ...overrides,
  }
}

test("an open escalation remains visible without declaring the support system unavailable", () => {
  const state = healthyState({
    counts: { ...healthyState().counts, unresolvedEscalations: 1 },
  })

  assert.equal(isSupportEngineOperational(state), true)
  assert.equal(isSupportEngineAllClear(state), false)
})

test("stale workers and delivery failures make the support system unavailable", () => {
  assert.equal(isSupportEngineOperational(healthyState({ workerFresh: false })), false)
  assert.equal(isSupportEngineOperational(healthyState({
    counts: { ...healthyState().counts, overdueResponses: 1 },
  })), false)
})
