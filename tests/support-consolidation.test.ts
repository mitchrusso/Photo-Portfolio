import assert from "node:assert/strict"
import test from "node:test"

import { ignoreSupportMailboxMessage } from "../src/lib/support-mail-filter.ts"
import { supportOwnerAlertExcerpt, supportOwnerAlertMessage } from "../src/lib/support-owner-notification.ts"

test("bulk newsletters are ignored before a support case is created", () => {
  assert.equal(ignoreSupportMailboxMessage({
    fromEmail: "hello@newsletter.launchbuff.com",
    isBulkAutomated: true,
    subject: "LaunchBuff Pulse #5 - We put every founder on a map - literally.",
  }), true)
  assert.equal(ignoreSupportMailboxMessage({
    fromEmail: "gary@example.com",
    subject: "How do I reorder my portfolios?",
  }), false)
  assert.equal(ignoreSupportMailboxMessage({
    fromEmail: "mailer-daemon@googlemail.com",
    subject: "Delivery Status Notification (Failure)",
  }), true)
})

test("owner alerts identify the person and show the original question", () => {
  const notification = supportOwnerAlertMessage({
    adminUrl: "https://photoview.io/admin/feedback?report=case123",
    message: "Where can I change my custom domain?\n\nOn Nov 1, PhotoView.io Support wrote:\nOld reply",
    reporterEmail: "gary@example.com",
    reporterName: "Gary Meyer",
    reportId: "case123",
    subject: "Custom domain setup",
    type: "question",
  })
  assert.equal(notification.subject, "[PhotoView.io Support] Gary Meyer — Question")
  assert.match(notification.body, /Gary Meyer <gary@example\.com>/)
  assert.match(notification.body, /Email subject: Custom domain setup/)
  assert.match(notification.body, /Where can I change my custom domain\?/)
  assert.match(notification.body, /admin\/feedback\?report=case123/)
  assert.doesNotMatch(notification.body, /Old reply/)
  assert.equal(supportOwnerAlertExcerpt("A short question"), "A short question")
})
