import assert from "node:assert/strict"
import test from "node:test"

import { ignoreSupportMailboxMessage } from "../src/lib/support-mail-filter.ts"
import { supportOwnerAlertExcerpt, supportOwnerAlertMessage, supportOwnerWatchdogMessage } from "../src/lib/support-owner-notification.ts"

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
  assert.match(notification.body, /Old reply/)
  assert.doesNotMatch(notification.body, /admin\/feedback/)
  assert.equal(supportOwnerAlertExcerpt("A short question"), "A short question")
})

test("owner alerts include the complete customer message without requiring a sign-in link", () => {
  const longMessage = `${"A".repeat(2_000)}\nTHE END OF THE CUSTOMER MESSAGE`
  const notification = supportOwnerAlertMessage({
    message: longMessage,
    reporterEmail: "larry@example.com",
    reporterName: "Larry Odom",
    reportId: "case-long",
    subject: "Website builder feedback",
    type: "improvement",
  })
  assert.match(notification.body, /THE END OF THE CUSTOMER MESSAGE/)
  assert.match(notification.html, /THE END OF THE CUSTOMER MESSAGE/)
  assert.doesNotMatch(notification.body, /Open this case/)
  assert.doesNotMatch(notification.html, /admin\/feedback/)
})

test("escalation watchdog emails enumerate every unresolved customer message inline", () => {
  const notification = supportOwnerWatchdogMessage({
    cases: [
      {
        message: "Please send me the webinar recording link.",
        reporterEmail: "peter@example.com",
        reporterName: "Peter",
        reportId: "case-peter",
        subject: "Re: Help getting started",
        type: "question",
      },
      {
        message: "My full second customer message.",
        reporterEmail: "second@example.com",
        reporterName: "Second Customer",
        reportId: "case-second",
        subject: "Another support request",
        type: "feedback",
      },
    ],
    summary: "2 escalated support cases remain unresolved after one hour.",
  })
  assert.equal(notification.subject, "[PhotoView.io Support] 2 unresolved customer cases")
  assert.match(notification.body, /Peter <peter@example\.com>/)
  assert.match(notification.body, /Please send me the webinar recording link\./)
  assert.match(notification.body, /My full second customer message\./)
  assert.doesNotMatch(notification.body, /Open PhotoView support/)
  assert.doesNotMatch(notification.html, /admin\/feedback/)
})
