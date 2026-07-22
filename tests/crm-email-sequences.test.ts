import assert from "node:assert/strict"
import test from "node:test"
import { addBusinessDays, fallbackSequence, parseGeneratedSequence, scheduleSequence } from "../src/lib/partnership-crm/email-sequences.ts"

test("CRM email sequences skip weekends and preserve their requested spacing", () => {
  const friday = new Date("2026-07-24T14:00:00.000Z")
  assert.equal(addBusinessDays(friday, 1).toISOString(), "2026-07-27T14:00:00.000Z")
  assert.deepEqual(scheduleSequence(friday, 3, 2).map((date) => date.toISOString()), [
    "2026-07-24T14:00:00.000Z",
    "2026-07-28T14:00:00.000Z",
    "2026-07-30T14:00:00.000Z",
  ])
})

test("CRM sequence generation accepts safe JSON and has a useful deterministic fallback", () => {
  const parsed = parseGeneratedSequence('[{"subject":"Hello","body":"A useful introduction."}]', [])
  assert.equal(parsed?.[0].subject, "Hello")
  assert.deepEqual(parseGeneratedSequence("not json", []), [])
  const fallback = fallbackSequence({ company: "ACDSee", contactName: "Taylor", goal: "Book a discovery call", opportunity: "Publish finished collections" })
  assert.equal(fallback.length, 3)
  assert.match(fallback[0].body, /Taylor/)
  assert.match(fallback[2].body, /Mitch Russo/)
})
