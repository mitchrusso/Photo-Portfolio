import "server-only"

const BABYLOVEGROWTH_BASE_URL = "https://api.babylovegrowth.ai/api/integrations"
const DEFAULT_TIMEOUT_MS = 20_000
const MAX_RETRY_DELAY_MS = 5_000
const MAX_RETRIES = 3

export class BabyLoveGrowthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "BabyLoveGrowthApiError"
  }
}

export function isBabyLoveGrowthConfigured() {
  return Boolean(process.env.BABYLOVEGROWTH_API_KEY?.trim())
}

function getBabyLoveGrowthApiKey() {
  const apiKey = process.env.BABYLOVEGROWTH_API_KEY?.trim()

  if (!apiKey) {
    throw new Error("BabyLoveGrowth is not configured. Set BABYLOVEGROWTH_API_KEY on the server.")
  }

  return apiKey
}

function buildBabyLoveGrowthUrl(path: string) {
  const normalizedPath = path.trim().replace(/^\/+/, "")
  const url = new URL(normalizedPath ? `${BABYLOVEGROWTH_BASE_URL}/${normalizedPath}` : BABYLOVEGROWTH_BASE_URL)
  const baseUrl = new URL(BABYLOVEGROWTH_BASE_URL)

  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(`${baseUrl.pathname}/`) && url.pathname !== baseUrl.pathname) {
    throw new Error("BabyLoveGrowth request paths must stay inside the integrations API.")
  }

  return url
}

export async function babyLoveGrowthRequest<T>(path = "", init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  headers.set("X-API-Key", getBabyLoveGrowthApiKey())

  let response: Response | undefined
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
    response = await fetch(buildBabyLoveGrowthUrl(path), {
      ...init,
      cache: "no-store",
      headers,
      signal: init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal,
    })

    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === MAX_RETRIES) break

    const retryAfterSeconds = Number(response.headers.get("retry-after"))
    const retryDelay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
      ? retryAfterSeconds * 1_000
      : 250 * (2 ** attempt)
    await new Promise((resolve) => setTimeout(resolve, Math.min(retryDelay, MAX_RETRY_DELAY_MS)))
  }

  if (!response) {
    throw new BabyLoveGrowthApiError("BabyLoveGrowth request did not return a response.", 503)
  }

  if (!response.ok) {
    throw new BabyLoveGrowthApiError(
      `BabyLoveGrowth request failed with status ${response.status}.`,
      response.status,
    )
  }

  if (response.status === 204) return undefined as T

  const responseText = await response.text()
  if (!responseText) return undefined as T

  try {
    return JSON.parse(responseText) as T
  } catch {
    throw new BabyLoveGrowthApiError("BabyLoveGrowth returned an invalid JSON response.", response.status)
  }
}
