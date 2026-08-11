import assert from "node:assert/strict"
import test from "node:test"

import { buildDatabasePoolConfig, databasePoolMax } from "../src/lib/database-connection.ts"
import { isRetryableDatabaseConnectionError, withDatabaseConnectionRetry } from "../src/lib/database-retry.ts"

test("database pools default to a serverless-safe size and accept bounded overrides", () => {
  assert.equal(databasePoolMax(undefined), 2)
  assert.equal(databasePoolMax("4"), 4)
  assert.equal(databasePoolMax("0"), 2)
  assert.equal(databasePoolMax("11"), 2)
  assert.equal(databasePoolMax("not-a-number"), 2)

  assert.deepEqual(buildDatabasePoolConfig("postgres://example.test/db?sslmode=require", "3"), {
    allowExitOnIdle: true,
    connectionString: "postgres://example.test/db?sslmode=verify-full",
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    max: 3,
  })
})

test("database connection retries recover from transient pool exhaustion", async () => {
  let calls = 0
  const waits: number[] = []
  const result = await withDatabaseConnectionRetry(async () => {
    calls++
    if (calls < 3) throw new Error("Too many database connections opened: Failed to acquire permit")
    return "connected"
  }, {
    baseDelayMs: 10,
    wait: async (milliseconds) => { waits.push(milliseconds) },
  })

  assert.equal(result, "connected")
  assert.equal(calls, 3)
  assert.deepEqual(waits, [10, 20])
})

test("database retries do not repeat non-connection failures", async () => {
  let calls = 0
  await assert.rejects(
    withDatabaseConnectionRetry(async () => {
      calls++
      throw new Error("Invalid CRM email step")
    }, { wait: async () => undefined }),
    /Invalid CRM email step/,
  )
  assert.equal(calls, 1)
  assert.equal(isRetryableDatabaseConnectionError(new Error("Failed to acquire permit to connect")), true)
})
