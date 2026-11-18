import assert from "node:assert/strict"
import test from "node:test"

import {
  addTestimonialRequestToSupportAnswer,
  SUPPORT_TESTIMONIAL_REQUEST,
} from "../src/lib/support-testimonial-request.ts"

test("answered subscriber questions include the Ring the Bell request before the signoff", () => {
  const body = [
    "Hi Steve,",
    "",
    "Here is the answer to your question.",
    "",
    "Best,",
    "PhotoView.io Support",
    "",
    "Reference: case-123",
  ].join("\n")

  const result = addTestimonialRequestToSupportAnswer(body, "ANSWERED")

  assert.match(result, new RegExp(`${SUPPORT_TESTIMONIAL_REQUEST.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n\\nBest,`))
  assert.equal(result.match(/Ring the Bell/g)?.length, 1)
})

test("testimonial request is not added to acknowledgments, alerts, or non-answer updates", () => {
  const body = "Thank you. We saved your report and will follow up."
  assert.equal(addTestimonialRequestToSupportAnswer(body, null), body)
  assert.equal(addTestimonialRequestToSupportAnswer(body, "FIXED"), body)
  assert.equal(addTestimonialRequestToSupportAnswer(body, "IMPLEMENTED"), body)
  assert.equal(addTestimonialRequestToSupportAnswer(body, "DECLINED"), body)
})

test("testimonial request is appended once when an answer has no standard signoff", () => {
  const first = addTestimonialRequestToSupportAnswer("Here is your answer.", "ANSWERED")
  const second = addTestimonialRequestToSupportAnswer(first, "ANSWERED")

  assert.equal(first, `Here is your answer.\n\n${SUPPORT_TESTIMONIAL_REQUEST}`)
  assert.equal(second, first)
})
