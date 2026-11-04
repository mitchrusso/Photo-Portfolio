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

test("Gary's caption follow-up is treated as a reopened bug, not general feedback", () => {
  const body = "photo display text does not show up must be buried in there somewhere\nIs the template i am using the photos showing too big the problem\nalthough on mobile had some captions showing now not something is not working right"
  assert.equal(classifySupportMessage("Re: Photo display text", body), "bug")
  const transition = supportReplyTransition(
    { message: "Photo captions were not visible.", type: "bug" },
    { body, subject: "Re: Photo display text" },
    new Date("2026-11-04T16:26:00.000Z"),
  )
  assert.equal(transition.lifecycleState, "QUEUED")
  assert.equal(transition.status, "PENDING_REPAIR")
  assert.match(transition.message ?? "", /photo display text does not show up/)
})

test("Gary's second caption follow-up reopens the repair when most portfolios show nothing", () => {
  const body = "Hello ok well the first portfolio is fine looks good the rest of them\nsame old nothing showing\nexcept old information from other websites which I have turned off"
  assert.equal(classifySupportMessage("Re: Photo captions are now working on your website", body), "bug")
  const transition = supportReplyTransition(
    { message: "Photo captions were repaired in the first portfolio.", type: "bug" },
    { body, subject: "Re: Photo captions are now working on your website" },
    new Date("2026-11-04T23:34:37.000Z"),
  )
  assert.equal(transition.lifecycleState, "QUEUED")
  assert.equal(transition.status, "PENDING_REPAIR")
  assert.match(transition.message ?? "", /same old nothing showing/)
})

test("polite requests for a new optional control are feature suggestions", () => {
  assert.equal(classifySupportMessage(
    "Sectional highlight feedback",
    "Would it be possible to place a toggle somewhere that would turn the highlighting off and on as desired?",
  ), "improvement")
})
