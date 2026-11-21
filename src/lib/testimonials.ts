export const TESTIMONIAL_BODY_MIN_LENGTH = 20
export const TESTIMONIAL_BODY_MAX_LENGTH = 1_000
export const TESTIMONIAL_HEADSHOT_MAX_BYTES = 5 * 1024 * 1024
export const TESTIMONIAL_CAROUSEL_MINIMUM = 2

export function normalizeTestimonialFirstName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 60)
}

export function normalizeTestimonialLastInitial(value: string) {
  const initial = Array.from(value.trim()).find((character) => /\p{L}/u.test(character)) ?? ""
  return initial.toLocaleUpperCase()
}

export function normalizeTestimonialBody(value: string) {
  return value.trim().replace(/\r\n/g, "\n")
}

export function testimonialDisplayName(firstName: string, lastInitial: string) {
  return `${normalizeTestimonialFirstName(firstName)} ${normalizeTestimonialLastInitial(lastInitial)}.`
}

export function shouldShowTestimonialCarousel(count: number) {
  return count >= TESTIMONIAL_CAROUSEL_MINIMUM
}
