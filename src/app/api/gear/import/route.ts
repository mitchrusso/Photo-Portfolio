import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { NextResponse } from "next/server"

import { auth } from "@/auth"

type Retailer = "adorama" | "amazon" | "bh" | "other"

const MAX_LINKS = 25
const MAX_PAGE_BYTES = 2_000_000
const retailerHosts: Record<Exclude<Retailer, "other">, string[]> = {
  adorama: ["adorama.com"],
  amazon: ["amazon.com", "amzn.to"],
  bh: ["bhphotovideo.com", "bhpho.to"],
}

function hostMatches(hostname: string, allowedHost: string) {
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
}

function isPrivateAddress(address: string) {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true
  if (!address.includes(".")) return false

  const octets = address.split(".").map(Number)
  return octets[0] === 10
    || octets[0] === 127
    || (octets[0] === 169 && octets[1] === 254)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168)
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

  if (hostname === "localhost" || isIP(hostname) && isPrivateAddress(hostname)) {
    throw new Error("Private network addresses are not supported")
  }

  const addresses = await lookup(hostname, { all: true })
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network addresses are not supported")
  }

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
        "User-Agent": "PhotoViewPro Gear Importer/1.0",
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

async function scanProduct(rawUrl: string, retailer: Retailer, customRetailerUrl: string) {
  const url = await validateProductUrl(rawUrl, retailer, customRetailerUrl)
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

    return {
      categoryId: inferCategory(name),
      description: description.slice(0, 280),
      name: name.slice(0, 180),
      url: rawUrl,
    }
  } catch (error) {
    return {
      categoryId: inferCategory(titleFromUrl(url)),
      description: "",
      error: error instanceof Error ? error.message : "This product page could not be scanned",
      name: titleFromUrl(url),
      url: rawUrl,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json() as {
      customRetailerUrl?: string
      retailer?: Retailer
      urls?: string[]
    }
    const retailer = body.retailer
    const urls = Array.isArray(body.urls) ? body.urls.map((url) => url.trim()).filter(Boolean) : []
    const customRetailerUrl = body.customRetailerUrl?.trim() ?? ""

    if (!retailer || !["amazon", "bh", "adorama", "other"].includes(retailer)) {
      return NextResponse.json({ error: "Choose a retailer" }, { status: 400 })
    }
    if (urls.length === 0 || urls.length > MAX_LINKS) {
      return NextResponse.json({ error: `Add between 1 and ${MAX_LINKS} product links` }, { status: 400 })
    }
    if (retailer === "other") {
      try {
        const customUrl = new URL(customRetailerUrl)
        if (customUrl.protocol !== "https:" && customUrl.protocol !== "http:") throw new Error()
      } catch {
        return NextResponse.json({ error: "Add the website address for the other retailer" }, { status: 400 })
      }
    }

    const items = await Promise.all(urls.map((url) => scanProduct(url, retailer, customRetailerUrl)))
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "The product links could not be scanned" }, { status: 400 })
  }
}
