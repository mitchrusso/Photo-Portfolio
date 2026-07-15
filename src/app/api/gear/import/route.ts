import { NextResponse } from "next/server"
import OpenAI from "openai"

import { auth } from "@/auth"
import { hasAmazonCreatorsApiConfiguration, searchAmazonCreatorsCatalog } from "@/lib/amazon-creators"
import { mapWithConcurrency } from "@/lib/async-concurrency"
import {
  getAmazonGearSearchUrl,
  getRetailerProductImageFallback,
  normalizeGearSearchEntry,
  withRetailerAffiliateTracking,
} from "@/lib/gear-retailer"
import { validateGearProductImageUrl } from "@/lib/gear-image-validation"
import { assertPublicHttpUrl } from "@/lib/public-network-url"
import { checkRequestRateLimit } from "@/lib/request-rate-limit"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type Retailer = "adorama" | "amazon" | "bestbuy" | "bh" | "ebay" | "keh" | "moment" | "mpb" | "other" | "walmart"

const MAX_LINKS = 25
const MAX_QUERIES = 12
const MAX_PAGE_BYTES = 2_000_000
const MAX_RESULTS_PER_QUERY = 4
const retailerHosts: Record<Exclude<Retailer, "other">, string[]> = {
  adorama: ["adorama.com"],
  amazon: ["amazon.com", "amzn.to"],
  bestbuy: ["bestbuy.com"],
  bh: ["bhphotovideo.com", "bhpho.to"],
  ebay: ["ebay.com", "ebay.to"],
  keh: ["keh.com"],
  moment: ["shopmoment.com", "moment.com"],
  mpb: ["mpb.com"],
  walmart: ["walmart.com"],
}

const retailerLabels: Record<Retailer, string> = {
  adorama: "Adorama",
  amazon: "Amazon",
  bestbuy: "Best Buy",
  bh: "B&H Photo",
  ebay: "eBay",
  keh: "KEH Camera",
  moment: "Moment",
  mpb: "MPB",
  other: "Retailer",
  walmart: "Walmart",
}

function hostMatches(hostname: string, allowedHost: string) {
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
}

async function validateProductUrl(rawUrl: string, retailer: Retailer, customRetailerUrl: string) {
  const url = new URL(rawUrl)
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Use an http or https product link")

  const hostname = url.hostname.toLowerCase()
  const allowedHosts = retailer === "other"
    ? [new URL(customRetailerUrl).hostname.toLowerCase()]
    : retailerHosts[retailer]

  if (!allowedHosts.some((allowedHost) => hostMatches(hostname, allowedHost))) {
    throw new Error("The product link does not match the selected retailer")
  }

  await assertPublicHttpUrl(url)

  return url
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim()
}

function getMeta(html: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedKey}["'][^>]*>`, "i"),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1])
  }

  return ""
}

function findProductJson(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const product = findProductJson(candidate)
      if (product) return product
    }
    return null
  }

  if (!value || typeof value !== "object") return null
  const candidate = value as Record<string, unknown>
  const type = candidate["@type"]
  if (type === "Product" || Array.isArray(type) && type.includes("Product")) return candidate

  for (const child of Object.values(candidate)) {
    const product = findProductJson(child)
    if (product) return product
  }

  return null
}

function getProductJson(html: string) {
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of scripts) {
    try {
      const product = findProductJson(JSON.parse(match[1]))
      if (product) return product
    } catch {
      // Retailer pages sometimes contain non-JSON analytics blocks alongside valid JSON-LD.
    }
  }
  return null
}

function getProductImage(product: Record<string, unknown> | null, html: string) {
  const image = product?.image
  const candidates = Array.isArray(image) ? image : image ? [image] : []

  for (const candidate of candidates) {
    const value = typeof candidate === "string"
      ? candidate
      : candidate && typeof candidate === "object"
        ? (candidate as Record<string, unknown>).url ?? (candidate as Record<string, unknown>).contentUrl
        : null
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return decodeHtml(value)
  }

  const metaImage = getMeta(html, "og:image") || getMeta(html, "twitter:image")
  return /^https?:\/\//i.test(metaImage) ? metaImage : ""
}

function titleFromUrl(url: URL) {
  const usefulSegment = url.pathname
    .split("/")
    .filter(Boolean)
    .find((segment) => segment.length > 5 && !/^(dp|product|gp|site|item)$/i.test(segment))

  if (!usefulSegment) return "Imported product"
  return decodeURIComponent(usefulSegment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function inferCategory(name: string) {
  const normalized = name.toLowerCase()
  if (/\b(camera|body|mirrorless|dslr|drone)\b/.test(normalized)) return "camera-bodies"
  if (/\b(lens|zoom|prime|telephoto|macro|mm f\/)\b/.test(normalized)) return "favorite-lenses"
  return "travel-accessories"
}

async function readLimitedResponse(response: Response) {
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_PAGE_BYTES) throw new Error("The retailer page is too large to scan")

  const html = await response.text()
  return html.slice(0, MAX_PAGE_BYTES)
}

async function fetchRetailerPage(initialUrl: URL, retailer: Retailer, customRetailerUrl: string, signal: AbortSignal) {
  let currentUrl = initialUrl

  for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "PhotoView.io Gear Importer/1.0",
      },
      redirect: "manual",
      signal,
    })

    if (response.status < 300 || response.status >= 400) return response
    const location = response.headers.get("location")
    if (!location) throw new Error("The retailer returned an invalid redirect")
    currentUrl = await validateProductUrl(new URL(location, currentUrl).toString(), retailer, customRetailerUrl)
  }

  throw new Error("The product link redirected too many times")
}

async function scanProduct(rawUrl: string, retailer: Retailer, customRetailerUrl: string, affiliateTag = "") {
  const url = await validateProductUrl(rawUrl, retailer, customRetailerUrl)
  if (retailer === "other") {
    const name = titleFromUrl(url)
    return {
      categoryId: inferCategory(name),
      description: "",
      error: "Review and complete the details for this custom retailer product.",
      imageUrl: "",
      name,
      retailer: retailerLabels[retailer],
      url: rawUrl,
    }
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  try {
    const response = await fetchRetailerPage(url, retailer, customRetailerUrl, controller.signal)

    if (!response.ok) throw new Error(`Retailer returned ${response.status}`)
    const html = await readLimitedResponse(response)
    const product = getProductJson(html)
    const name = typeof product?.name === "string"
      ? decodeHtml(product.name)
      : getMeta(html, "og:title") || getMeta(html, "twitter:title") || titleFromUrl(url)
    const description = typeof product?.description === "string"
      ? decodeHtml(product.description)
      : getMeta(html, "og:description") || getMeta(html, "description")
    const retailerImageUrl = getRetailerProductImageFallback(retailer, url.toString())

    return {
      categoryId: inferCategory(name),
      description: description.slice(0, 280),
      imageUrl: await validateExternalImageUrl(
        retailerImageUrl || getProductImage(product, html),
        retailer,
      ),
      name: name.slice(0, 180),
      retailer: retailerLabels[retailer],
      url: withRetailerAffiliateTracking(rawUrl, retailer, affiliateTag),
    }
  } catch (error) {
    return {
      categoryId: inferCategory(titleFromUrl(url)),
      description: "",
      error: error instanceof Error ? error.message : "This product page could not be scanned",
      imageUrl: "",
      name: titleFromUrl(url),
      retailer: retailerLabels[retailer],
      url: withRetailerAffiliateTracking(rawUrl, retailer, affiliateTag),
    }
  } finally {
    clearTimeout(timeout)
  }
}

type FirecrawlSearchItem = {
  description?: unknown
  html?: unknown
  markdown?: unknown
  metadata?: unknown
  rawHtml?: unknown
  title?: unknown
  url?: unknown
}

type AiProductMatch = {
  description?: unknown
  imageUrl?: unknown
  name?: unknown
  url?: unknown
}

function getSearchDomain(retailer: Retailer, customRetailerUrl: string) {
  if (retailer === "amazon") return "amazon.com"
  if (retailer === "bestbuy") return "bestbuy.com"
  if (retailer === "bh") return "bhphotovideo.com"
  if (retailer === "adorama") return "adorama.com"
  if (retailer === "ebay") return "ebay.com"
  if (retailer === "keh") return "keh.com"
  if (retailer === "moment") return "shopmoment.com"
  if (retailer === "mpb") return "mpb.com"
  if (retailer === "walmart") return "walmart.com"
  return new URL(customRetailerUrl).hostname.toLowerCase()
}

function getFirecrawlResults(value: unknown): FirecrawlSearchItem[] {
  if (!value || typeof value !== "object") return []
  const payload = value as Record<string, unknown>
  const data = payload.data
  if (Array.isArray(data)) return data as FirecrawlSearchItem[]
  if (!data || typeof data !== "object") return []
  const web = (data as Record<string, unknown>).web
  return Array.isArray(web) ? web as FirecrawlSearchItem[] : []
}

function parseJsonArray(value: string) {
  const trimmed = value.trim()
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")

  try {
    const parsed = JSON.parse(withoutFence)
    return Array.isArray(parsed) ? parsed as AiProductMatch[] : []
  } catch {
    const start = withoutFence.indexOf("[")
    const end = withoutFence.lastIndexOf("]")
    if (start < 0 || end <= start) return []

    try {
      const parsed = JSON.parse(withoutFence.slice(start, end + 1))
      return Array.isArray(parsed) ? parsed as AiProductMatch[] : []
    } catch {
      return []
    }
  }
}

function safeExternalImageUrl(value: unknown) {
  if (typeof value !== "string") return ""

  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return ""
    if (url.hostname === "www.bhphotovideo.com" && url.pathname.startsWith("/images/")) {
      url.hostname = "static.bhphoto.com"
    }
    return url.toString()
  } catch {
    return ""
  }
}

async function validateExternalImageUrl(value: unknown, retailer: Retailer) {
  const imageUrl = safeExternalImageUrl(value)
  if (!imageUrl) return ""
  return validateGearProductImageUrl(imageUrl, retailer)
}

async function searchRetailerProductsWithOpenAI(
  query: string,
  retailer: Retailer,
  customRetailerUrl: string,
  affiliateTag: string,
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) throw new Error("AI product search is not configured yet")

  const domain = getSearchDomain(retailer, customRetailerUrl)
  const allowsUsedGear = retailer === "ebay" || retailer === "keh" || retailer === "mpb"
  const conditionGuidance = allowsUsedGear
    ? "Used products are allowed because this retailer specializes in resale. Prefer complete, currently available listings with a clearly stated condition."
    : "Use new retail products; exclude used products, open-box products, and marketplace resellers."
  const client = new OpenAI({ apiKey })
  const response = await client.responses.create({
    input: [
      {
        content: [
          {
            text: [
              `Search only site:${domain} for the exact photography product: ${query}.`,
              "Return JSON only as an array with at most 4 likely matches.",
              "Each object must have this shape:",
              '{"name":"Product name","url":"Direct product page URL","description":"Useful factual summary","imageUrl":"Direct product image URL or empty string"}',
              "Use direct product pages, not search results, category pages, editorial pages, or sponsored redirect pages.",
              conditionGuidance,
              "Do not invent specifications, links, or image URLs. Use an empty string when a field cannot be verified.",
            ].join("\n"),
            type: "input_text",
          },
        ],
        role: "user",
      },
    ],
    max_output_tokens: 900,
    model: process.env.OPENAI_GEAR_SEARCH_MODEL ?? "gpt-4.1-mini",
    tool_choice: "required",
    tools: [{ search_context_size: "low", type: "web_search_preview" }],
  })

  const matches = await Promise.all(parseJsonArray(response.output_text ?? "").slice(0, MAX_RESULTS_PER_QUERY).map(async (result) => {
    if (typeof result.url !== "string") return null

    try {
      const url = await validateProductUrl(result.url, retailer, customRetailerUrl)
      const name = typeof result.name === "string" ? decodeHtml(result.name).slice(0, 180) : titleFromUrl(url)
      const description = typeof result.description === "string" ? decodeHtml(result.description).slice(0, 280) : ""

      const retailerImageUrl = getRetailerProductImageFallback(retailer, url.toString())
      const imageUrl = await validateExternalImageUrl(retailerImageUrl || result.imageUrl, retailer)

      return {
        categoryId: inferCategory(`${query} ${name}`),
        description,
        imageUrl,
        name,
        query,
        retailer: retailerLabels[retailer],
        url: withRetailerAffiliateTracking(url.toString(), retailer, affiliateTag),
      }
    } catch {
      return null
    }
  }))

  return matches.filter((match): match is NonNullable<typeof match> => Boolean(match))
}

async function searchRetailerProductsWithAmazonCreators(
  query: string,
  affiliateTag: string,
) {
  const products = await searchAmazonCreatorsCatalog(query, affiliateTag, MAX_RESULTS_PER_QUERY)
  const matches = await Promise.all(products.map(async (product) => {
    try {
      const url = await validateProductUrl(product.url, "amazon", "")
      return {
        categoryId: inferCategory(`${query} ${product.name}`),
        description: product.description,
        imageUrl: await validateExternalImageUrl(product.imageUrl, "amazon"),
        name: product.name,
        query,
        retailer: retailerLabels.amazon,
        url: withRetailerAffiliateTracking(url.toString(), "amazon", affiliateTag),
      }
    } catch {
      return null
    }
  }))

  return matches.filter((match): match is NonNullable<typeof match> => Boolean(match))
}

async function searchRetailerProductsWithFirecrawl(
  query: string,
  retailer: Retailer,
  customRetailerUrl: string,
  affiliateTag: string,
) {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim()
  if (!apiKey) throw new Error("Product search is not configured yet")

  const domain = getSearchDomain(retailer, customRetailerUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      body: JSON.stringify({
        country: "US",
        includeDomains: [domain],
        limit: MAX_RESULTS_PER_QUERY,
        query,
        scrapeOptions: { formats: ["html"], onlyMainContent: false },
        sources: ["web"],
        timeout: 15_000,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    })

    if (!response.ok) throw new Error("The retailer search service is temporarily unavailable")
    const results = getFirecrawlResults(await response.json())
    const matches = await Promise.all(results.map(async (result) => {
      if (typeof result.url !== "string") return null

      try {
        const url = await validateProductUrl(result.url, retailer, customRetailerUrl)
        const html = typeof result.html === "string"
          ? result.html
          : typeof result.rawHtml === "string"
            ? result.rawHtml
            : ""
        const product = getProductJson(html)
        const metadata = result.metadata && typeof result.metadata === "object"
          ? result.metadata as Record<string, unknown>
          : null
        const name = typeof product?.name === "string"
          ? decodeHtml(product.name)
          : typeof result.title === "string"
            ? decodeHtml(result.title)
            : typeof metadata?.title === "string"
              ? decodeHtml(metadata.title)
              : titleFromUrl(url)
        const description = typeof product?.description === "string"
          ? decodeHtml(product.description)
          : typeof result.description === "string"
            ? decodeHtml(result.description)
            : typeof metadata?.description === "string"
              ? decodeHtml(metadata.description)
              : ""
        const retailerImageUrl = getRetailerProductImageFallback(retailer, url.toString())

        return {
          categoryId: inferCategory(`${query} ${name}`),
          description: description.slice(0, 280),
          imageUrl: await validateExternalImageUrl(
            retailerImageUrl || getProductImage(product, html),
            retailer,
          ),
          name: name.slice(0, 180),
          query,
          retailer: retailerLabels[retailer],
          url: withRetailerAffiliateTracking(url.toString(), retailer, affiliateTag),
        }
      } catch {
        return null
      }
    }))

    return matches.filter((match): match is NonNullable<typeof match> => Boolean(match))
  } finally {
    clearTimeout(timeout)
  }
}

async function searchRetailerProducts(
  query: string,
  retailer: Retailer,
  customRetailerUrl: string,
  affiliateTag: string,
) {
  if (retailer === "amazon" && hasAmazonCreatorsApiConfiguration()) {
    try {
      return await searchRetailerProductsWithAmazonCreators(query, affiliateTag)
    } catch (error) {
      const amazonError = error as Error & { body?: { error?: string }; status?: number }
      console.warn("[gear-import] Amazon Creators API search failed", {
        code: amazonError.body?.error ?? "unknown",
        message: amazonError.message,
        status: amazonError.status ?? null,
      })
    }
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      return await searchRetailerProductsWithOpenAI(query, retailer, customRetailerUrl, affiliateTag)
    } catch (error) {
      if (!process.env.FIRECRAWL_API_KEY?.trim()) throw error
    }
  }

  return searchRetailerProductsWithFirecrawl(query, retailer, customRetailerUrl, affiliateTag)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimit = await checkRequestRateLimit(`gear-import:${session.user.workspaceId}`, 6, 10 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many product searches. Please wait a few minutes and try again." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  try {
    const body = await request.json() as {
      affiliateTag?: string
      customRetailerUrl?: string
      queries?: string[]
      retailer?: Retailer
      urls?: string[]
    }
    const retailer = body.retailer
    const urls = Array.isArray(body.urls) ? body.urls.map((url) => url.trim()).filter(Boolean) : []
    const queries = Array.isArray(body.queries) ? body.queries.map(normalizeGearSearchEntry).filter(Boolean) : []
    const customRetailerUrl = body.customRetailerUrl?.trim() ?? ""
    const affiliateTag = body.affiliateTag?.trim().slice(0, 120) ?? ""

    if (!retailer || !["adorama", "amazon", "bestbuy", "bh", "ebay", "keh", "moment", "mpb", "other", "walmart"].includes(retailer)) {
      return NextResponse.json({ error: "Choose a retailer" }, { status: 400 })
    }
    if (urls.length === 0 && queries.length === 0) {
      return NextResponse.json({ error: "List at least one product or add a product link" }, { status: 400 })
    }
    if (urls.length > MAX_LINKS || queries.length > MAX_QUERIES) {
      return NextResponse.json({ error: `Search for up to ${MAX_QUERIES} products or scan up to ${MAX_LINKS} links at a time` }, { status: 400 })
    }
    if (retailer === "other") {
      try {
        const customUrl = new URL(customRetailerUrl)
        if (customUrl.protocol !== "https:" && customUrl.protocol !== "http:") throw new Error()
      } catch {
        return NextResponse.json({ error: "Add the website address for the other retailer" }, { status: 400 })
      }
    }

    const [resultGroups, scannedItems] = await Promise.all([
      mapWithConcurrency(queries, 2, (query) => (
        searchRetailerProducts(query.slice(0, 180), retailer, customRetailerUrl, affiliateTag)
      )),
      mapWithConcurrency(urls, 4, (url) => scanProduct(url, retailer, customRetailerUrl, affiliateTag)),
    ])
    const searchableResults = resultGroups.flatMap((items, index) => {
      if (items.length > 0 || retailer !== "amazon") return items

      const query = queries[index]
      return [{
        categoryId: inferCategory(query),
        description: "Open this Amazon search, choose the exact product, then replace this search link with the product-page link before approving.",
        error: "Amazon did not provide a verifiable direct product match. Use Open to find the exact item, then paste its product-page link into this row.",
        imageUrl: "",
        name: query,
        query,
        retailer: retailerLabels.amazon,
        url: getAmazonGearSearchUrl(query, affiliateTag),
      }]
    })
    return NextResponse.json({ items: [...searchableResults, ...scannedItems] })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "The products could not be found",
    }, { status: 400 })
  }
}
