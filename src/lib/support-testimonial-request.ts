export const SUPPORT_TESTIMONIAL_REQUEST =
  "If you are enjoying PhotoView, would you be willing to leave us a short testimonial? Share your experience here: https://photoview.io/dashboard?testimonial=1"

export function addTestimonialRequestToSupportAnswer(
  body: string,
  targetReportStatus?: string | null,
) {
  if (targetReportStatus !== "ANSWERED" || /dashboard\?testimonial=1|leave us a short testimonial/i.test(body)) return body

  const signoff = /\n{2,}((?:Best|Kind regards),\nPhotoView\.io Support\b)/i
  if (signoff.test(body)) {
    return body.replace(signoff, `\n\n${SUPPORT_TESTIMONIAL_REQUEST}\n\n$1`)
  }

  return `${body.trimEnd()}\n\n${SUPPORT_TESTIMONIAL_REQUEST}`
}
