export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      const requestUrl = new URL(request.url)
      const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
      const host = forwardedHost || request.headers.get("host")?.trim()
      const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
      const protocol = forwardedProtocol ? `${forwardedProtocol}:` : requestUrl.protocol
      const effectiveOrigin = host ? `${protocol}//${host}` : requestUrl.origin

      return new URL(origin).origin === new URL(effectiveOrigin).origin
    } catch {
      return false
    }
  }

  const fetchSite = request.headers.get("sec-fetch-site")
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none"
}
