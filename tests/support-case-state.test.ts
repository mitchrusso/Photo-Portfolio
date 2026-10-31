import assert from "node:assert/strict"
import test from "node:test"

import { canAdvanceSupportStatus, isBenignClosingReply } from "../src/lib/support-case-state.ts"

test("support delivery reconciliation never regresses a completed case", () => {
  assert.equal(canAdvanceSupportStatus("ANSWERED", "RECEIVED"), false)
  assert.equal(canAdvanceSupportStatus("FIXED", "ANSWERED"), false)
  assert.equal(canAdvanceSupportStatus("CLOSED", "FIXED"), false)
  assert.equal(canAdvanceSupportStatus("RECEIVED", "ANSWERED"), true)
  assert.equal(canAdvanceSupportStatus("ANSWERED", "FIXED"), true)
})

test("brief positive confirmations close resolved threads without reopening them", () => {
  assert.equal(isBenignClosingReply("Thank you, everything looks good now."), true)
  assert.equal(isBenignClosingReply("Thank you!"), true)
  assert.equal(isBenignClosingReply("Thanks, it is working now.\n\nOn Tuesday Support wrote:\n> previous reply"), true)
  assert.equal(isBenignClosingReply("Thank you, but it still does not work."), false)
  assert.equal(isBenignClosingReply("Thanks. Can you also help with billing?"), false)
})
