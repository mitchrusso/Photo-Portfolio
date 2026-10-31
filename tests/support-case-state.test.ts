import assert from "node:assert/strict"
import test from "node:test"

import { canAdvanceSupportStatus, classifySupportMessage, isBenignClosingReply, supportReplyTransition } from "../src/lib/support-case-state.ts"

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

test("subscriber bug replies re-enter repair and navigation questions stay questions", () => {
  assert.equal(classifySupportMessage("Re: Domain setup", 'Cannot find "Address" in the top toolbar.'), "question")
  assert.equal(classifySupportMessage("Re: Fixed", "The Home link still returns a 404."), "bug")
  const now = new Date("2026-10-31T20:22:52.000Z")
  const transition = supportReplyTransition(
    { message: "The Home link returned 404.", type: "bug" },
    { body: "The Home link still returns a 404.", subject: "Re: Fixed" },
    now,
  )
  assert.equal(transition.status, "PENDING_REPAIR")
  assert.equal(transition.lifecycleState, "QUEUED")
  assert.equal(transition.leaseId, null)
  assert.equal(transition.fixedAt, null)
  assert.equal(transition.nextAttemptAt, now)
  assert.match(transition.message, /Latest subscriber follow-up:/)
})
