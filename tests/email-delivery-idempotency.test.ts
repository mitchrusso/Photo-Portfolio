import assert from "node:assert/strict"
import test from "node:test"
import {
  claimEmailDelivery,
  type EmailDeliveryClaimStore,
} from "../src/lib/email-delivery-idempotency.ts"

function createMemoryStore() {
  const deliveries = new Map<string, { status: string; updatedAt: Date }>()
  const store: EmailDeliveryClaimStore = {
    async find(deliveryKey) {
      return deliveries.get(deliveryKey) ?? null
    },
    async insert(input, now) {
      if (deliveries.has(input.deliveryKey)) return false
      deliveries.set(input.deliveryKey, { status: "PENDING", updatedAt: now })
      return true
    },
    async reclaim(input, existing, now) {
      const current = deliveries.get(input.deliveryKey)
      if (!current || current.status !== existing.status || current.updatedAt !== existing.updatedAt) return false
      deliveries.set(input.deliveryKey, { status: "PENDING", updatedAt: now })
      return true
    },
  }

  return {
    set(deliveryKey: string, status: string, updatedAt: Date) {
      deliveries.set(deliveryKey, { status, updatedAt })
    },
    store,
  }
}

const input = {
  automationKey: "payment_failed",
  deliveryKey: "subscription-1:payment_failed:invoice-1",
  email: "photographer@example.com",
  event: "billing_lifecycle",
  subscriptionId: "subscription-1",
  workspaceId: "workspace-1",
}

test("simultaneous email delivery claims allow exactly one sender", async () => {
  const memory = createMemoryStore()
  const now = new Date("2026-07-14T20:00:00.000Z")
  const claims = await Promise.all([
    claimEmailDelivery(input, { now, store: memory.store }),
    claimEmailDelivery(input, { now, store: memory.store }),
  ])

  assert.equal(claims.filter((claim) => claim.acquired).length, 1)
  assert.deepEqual(claims.map((claim) => claim.state).sort(), ["in_progress", "new"])
})

test("sent email deliveries stay deduplicated while failed and stale claims can retry", async () => {
  const memory = createMemoryStore()
  const now = new Date("2026-07-14T20:10:00.000Z")

  memory.set(input.deliveryKey, "SENT", new Date("2026-07-14T20:00:00.000Z"))
  assert.deepEqual(await claimEmailDelivery(input, { now, store: memory.store }), {
    acquired: false,
    state: "already_sent",
  })

  memory.set(input.deliveryKey, "FAILED", new Date("2026-07-14T20:01:00.000Z"))
  assert.deepEqual(await claimEmailDelivery(input, { now, store: memory.store }), {
    acquired: true,
    state: "retry",
  })

  memory.set(input.deliveryKey, "PENDING", new Date("2026-07-14T20:09:00.000Z"))
  assert.deepEqual(await claimEmailDelivery(input, { now, store: memory.store }), {
    acquired: false,
    state: "in_progress",
  })

  memory.set(input.deliveryKey, "PENDING", new Date("2026-07-14T20:00:00.000Z"))
  assert.deepEqual(await claimEmailDelivery(input, { now, store: memory.store }), {
    acquired: true,
    state: "retry",
  })
})
