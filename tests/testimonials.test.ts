import assert from "node:assert/strict"
import test from "node:test"
import {
  normalizeTestimonialBody,
  normalizeTestimonialFirstName,
  normalizeTestimonialLastInitial,
  shouldShowTestimonialCarousel,
  testimonialDisplayName,
} from "../src/lib/testimonials.ts"

test("normalizes public testimonial identity without exposing a surname", () => {
  assert.equal(normalizeTestimonialFirstName("  Hans   Dieter  "), "Hans Dieter")
  assert.equal(normalizeTestimonialLastInitial(" pujock "), "P")
  assert.equal(testimonialDisplayName("Hans-Dieter", "pujock"), "Hans-Dieter P.")
})

test("normalizes testimonial body line endings and outer whitespace", () => {
  assert.equal(normalizeTestimonialBody("  First line\r\nSecond line  "), "First line\nSecond line")
})

test("keeps the public carousel hidden until three featured testimonials exist", () => {
  assert.equal(shouldShowTestimonialCarousel(0), false)
  assert.equal(shouldShowTestimonialCarousel(2), false)
  assert.equal(shouldShowTestimonialCarousel(3), true)
})
