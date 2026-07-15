const PRODUCTION_APP_URL = "https://photoview.io"

function normalizeHttpUrl(value: string, environment: string | undefined) {
  const url = new URL(value)

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use http or https.")
  }

  if (environment === "production" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use https in production.")
  }

  url.hash = ""
  url.pathname = url.pathname.replace(/\/+$/, "") || "/"
  url.search = ""
  return url.toString().replace(/\/$/, "")
}

export function getAppUrl(request?: Request, environment = process.env.NODE_ENV) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configuredUrl) return normalizeHttpUrl(configuredUrl, environment)
  if (environment === "production") return PRODUCTION_APP_URL
  if (request) return normalizeHttpUrl(new URL(request.url).origin, environment)
  return "http://localhost:3000"
}
