import assert from "node:assert/strict"
import test from "node:test"

import {
  getEasternReportDate,
  isDailyOperationsReportTime,
} from "../src/lib/daily-report-schedule.ts"

test("the report runs at 6 AM Eastern in both daylight and standard time", () => {
  assert.equal(isDailyOperationsReportTime(new Date("2026-07-15T10:00:00.000Z")), true)
  assert.equal(isDailyOperationsReportTime(new Date("2026-07-15T11:00:00.000Z")), false)
  assert.equal(isDailyOperationsReportTime(new Date("2026-01-15T11:00:00.000Z")), true)
  assert.equal(isDailyOperationsReportTime(new Date("2026-01-15T10:00:00.000Z")), false)
})

test("the report date follows the Eastern calendar", () => {
  assert.equal(getEasternReportDate(new Date("2026-07-15T03:30:00.000Z")), "2026-07-14")
  assert.equal(getEasternReportDate(new Date("2026-01-15T05:30:00.000Z")), "2026-01-15")
})
