import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
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

test("testimonial form escapes dashboard clipping and scrolls on short screens", () => {
  const source = readFileSync(join(process.cwd(), "src/components/testimonials/testimonial-bell.tsx"), "utf8")

  assert.match(source, /createPortal\(/)
  assert.match(source, /document\.body/)
  assert.match(source, /fixed inset-0 z-\[1000\] overflow-y-auto/)
  assert.match(source, /Account email/)
  assert.match(source, /readOnly type="email" value=\{subscriberEmail\}/)
  assert.match(source, /maxLength=\{1\} name="lastInitial" pattern="\[A-Za-z\]"/)
  assert.match(source, /sm:grid-cols-\[minmax\(0,1fr\)_160px\]/)
  assert.doesNotMatch(source, /max-h-\[calc\(100vh-1\.5rem\)\]/)
})
