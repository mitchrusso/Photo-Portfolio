import "server-only"

const BABYLOVEGROWTH_BASE_URL = "https://api.babylovegrowth.ai/api/integrations"
const DEFAULT_TIMEOUT_MS = 20_000

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

  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  const response = await fetch(buildBabyLoveGrowthUrl(path), {
    ...init,
    cache: "no-store",
    headers,
    signal: init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal,
  })

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
