import assert from "node:assert/strict"
import test from "node:test"

import { ignoreSupportMailboxMessage } from "../src/lib/support-mail-filter.ts"
import { supportAttachmentIsSafe } from "../src/lib/support-attachment-policy.ts"
import { supportOwnerAlertExcerpt, supportOwnerAlertMessage, supportOwnerWatchdogMessage } from "../src/lib/support-owner-notification.ts"
import { supportOwnerFeatureDecision, supportOwnerReplyText } from "../src/lib/support-owner-reply.ts"

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

test("PhotoView operational alerts sent to the support mailbox do not become customer cases", () => {
  assert.equal(ignoreSupportMailboxMessage({
    fromEmail: "support@photoview.io",
    subject: "[PhotoView.io] SYSTEM incident",
  }), true)
  assert.equal(ignoreSupportMailboxMessage({
    fromEmail: "support@photoview.io",
    subject: "[PhotoView.io] EMAIL incident",
  }), true)
  assert.equal(ignoreSupportMailboxMessage({
    fromEmail: "subscriber@example.com",
    subject: "[PhotoView.io] SYSTEM incident on my website",
  }), false)
})

test("only bounded display-safe support attachments are relayed to owner email", () => {
  assert.equal(supportAttachmentIsSafe({ contentType: "image/jpeg", sizeBytes: 428_529 }), true)
  assert.equal(supportAttachmentIsSafe({ contentType: "application/zip", sizeBytes: 10_000 }), false)
  assert.equal(supportAttachmentIsSafe({ contentType: "image/png", sizeBytes: 4 * 1024 * 1024 }), false)
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
    attachments: [{ filename: "section-highlight.jpg", sizeBytes: 428_529 }],
    message: longMessage,
    reporterEmail: "larry@example.com",
    reporterName: "Larry Odom",
    reportId: "case-long",
    subject: "Website builder feedback",
    type: "improvement",
  })
  assert.match(notification.body, /THE END OF THE CUSTOMER MESSAGE/)
  assert.match(notification.html, /THE END OF THE CUSTOMER MESSAGE/)
  assert.equal(notification.subject, "[PhotoView.io Support] Approval needed: Larry Odom — Feature suggestion")
  assert.match(notification.body, /Your approval is required/)
  assert.match(notification.body, /APPROVE on the first line/)
  assert.match(notification.body, /does not send it to the subscriber/)
  assert.match(notification.body, /section-highlight\.jpg/)
  assert.doesNotMatch(notification.body, /Open this case/)
  assert.doesNotMatch(notification.html, /admin\/feedback/)
})

test("feature approval replies become internal workflow decisions instead of subscriber messages", () => {
  assert.deepEqual(supportOwnerFeatureDecision("APPROVE\nPlease implement the simplest version."), {
    action: "approve",
    note: "Please implement the simplest version.",
  })
  assert.deepEqual(supportOwnerFeatureDecision("DECLINE: Not a fit right now."), {
    action: "decline",
    note: "Not a fit right now.",
  })
  assert.equal(supportOwnerFeatureDecision("Thanks, Larry. We will review this."), null)
})

test("owner email replies preserve only the new answer", () => {
  const reply = supportOwnerReplyText([
    "Thanks, Larry. This is a thoughtful suggestion and I have shared it for review.",
    "",
    "On Nov 3, 2026, PhotoView.io Support <support@photoview.io> wrote:",
    "> Complete customer message",
    "> Would it be possible to add a toggle?",
  ].join("\n"))
  assert.equal(reply, "Thanks, Larry. This is a thoughtful suggestion and I have shared it for review.")
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
