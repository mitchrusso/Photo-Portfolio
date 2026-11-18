export const SUPPORT_TESTIMONIAL_REQUEST =
  'If you are enjoying PhotoView, would you be willing to leave us a short testimonial? Click the "Ring the Bell" button at the top of the site.'

export function addTestimonialRequestToSupportAnswer(
  body: string,
  targetReportStatus?: string | null,
) {
  if (targetReportStatus !== "ANSWERED" || /\bRing the Bell\b/i.test(body)) return body

  const signoff = /\n{2,}((?:Best|Kind regards),\nPhotoView\.io Support\b)/i
  if (signoff.test(body)) {
    return body.replace(signoff, `\n\n${SUPPORT_TESTIMONIAL_REQUEST}\n\n$1`)
  }

  return `${body.trimEnd()}\n\n${SUPPORT_TESTIMONIAL_REQUEST}`
}
