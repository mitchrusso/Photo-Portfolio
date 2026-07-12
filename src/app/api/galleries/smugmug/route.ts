import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"

type SmugMugGallery = {
  id: string
  name: string
  client: string
  status: "Delivered"
  privacy: "Public"
  images: number
  favorites: number
  revenue: "$0"
  cover: string
  description: string
  url: string
}

const DEFAULT_SMUGMUG_URL = "https://lenstraveler18.smugmug.com/Travel"
const FALLBACK_COVER =
  "https://photos.smugmug.com/Travel/Terlingua/i-nMNn54N/0/KnjNkQxrvWvNwbK2326S3j7JQHdBvJ3R2tx3xPPhP/XL/Chicago%20SM%20gallery-6-XL.jpg"

export const dynamic = "force-dynamic"
const MAX_GALLERIES = 100
const MAX_HTML_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 4

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const limit = checkRequestRateLimit(`smugmug:${session.user.id}:${requestClientKey(request)}`, 6, 10 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many import scans. Please wait before trying again." },
      { headers: { "Retry-After": String(limit.retryAfterSeconds) }, status: 429 },
    )
  }

  try {
    const sourceUrl = getSourceUrl(request)
    const smugmugHtml = await fetchText(sourceUrl)
    const links = extractSmugMugLinks(smugmugHtml, sourceUrl)
    const galleries =
      links.length > 0
        ? await Promise.all(links.slice(0, MAX_GALLERIES).map(toGallery))
        : [await toGallery({ name: getPageTitle(smugmugHtml, sourceUrl), url: sourceUrl })]

    return NextResponse.json({
      source: sourceUrl,
      syncedAt: new Date().toISOString(),
      galleries,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync SmugMug"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

function getSourceUrl(request: Request) {
  const requestUrl = new URL(request.url)
  const rawUrl = requestUrl.searchParams.get("url") || DEFAULT_SMUGMUG_URL
  const url = new URL(rawUrl)

  if (url.protocol !== "https:" || !isSmugMugHostname(url.hostname)) {
    throw new Error("Only public SmugMug URLs can be imported.")
  }

  url.hash = ""
  return url.toString()
}

async function fetchText(url: string) {
  let currentUrl = new URL(url)

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (currentUrl.protocol !== "https:" || !isSmugMugHostname(currentUrl.hostname)) {
      throw new Error("SmugMug redirected to an unsupported host.")
    }

    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: { "user-agent": "PhotoViewPro/1.0" },
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("SmugMug returned too many redirects.")
      currentUrl = new URL(location, currentUrl)
      continue
    }

    if (!response.ok) throw new Error(`SmugMug returned ${response.status}.`)

    const contentLength = Number(response.headers.get("content-length") ?? 0)
    if (contentLength > MAX_HTML_BYTES) throw new Error("The SmugMug page is too large to import safely.")
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("The SmugMug page is too large to import safely.")
    return new TextDecoder().decode(bytes)
  }

  throw new Error("Unable to fetch the SmugMug page.")
}

function isSmugMugHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "")
  return normalized === "smugmug.com" || normalized.endsWith(".smugmug.com")
}

function extractSmugMugLinks(html: string, sourceUrl: string) {
  const links: Array<{ name: string; url: string }> = []
  const source = new URL(sourceUrl)
  const sourcePath = source.pathname.replace(/\/$/, "")
  const pattern = /"label":"([^"]+)","url":"(https:\\\/\\\/[^"]*?smugmug\.com[^"]+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html))) {
    const name = decodeEntities(match[1].replace(/\\u0027/g, "'"))
    const url = match[2].replace(/\\\//g, "/")
    const parsedUrl = new URL(url)
    const parsedPath = parsedUrl.pathname.replace(/\/$/, "")

    if (
      parsedUrl.hostname === source.hostname &&
      parsedPath.length > 0 &&
      parsedPath !== sourcePath &&
      !["Home", "Blog", "About Me", "Portfolio"].includes(name)
    ) {
      links.push({ name, url })
    }
  }

  const seen = new Set<string>()
  return links.filter((link) => {
    const key = link.url.replace(/\/$/, "")

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

async function toGallery(link: { name: string; url: string }): Promise<SmugMugGallery> {
  let title = link.name
  let cover = FALLBACK_COVER
  let description = "Imported from a public SmugMug gallery."

  try {
    const html = await fetchText(link.url)
    title = getMeta(html, "og:title")?.replace(" - lenstraveler18", "") ?? link.name
    cover = getMeta(html, "og:image") || FALLBACK_COVER
    description = getMeta(html, "og:description") || description
  } catch {
    title = link.name
  }

  return {
    id: slugify(title),
    name: decodeEntities(title),
    client: getClientName(link.url),
    status: "Delivered",
    privacy: "Public",
    images: 0,
    favorites: 0,
    revenue: "$0",
    cover,
    description: decodeEntities(description),
    url: link.url,
  }
}

function getPageTitle(html: string, sourceUrl: string) {
  const title = getMeta(html, "og:title")?.replace(" - lenstraveler18", "")

  if (title) {
    return decodeEntities(title)
  }

  const url = new URL(sourceUrl)
  const fallback = url.pathname.split("/").filter(Boolean).at(-1) || url.hostname
  return decodeURIComponent(fallback).replace(/-/g, " ")
}

function getMeta(html: string, property: string) {
  const pattern = new RegExp(`<meta property="${property}" content="([^"]*)"`)
  return html.match(pattern)?.[1]
}

function decodeEntities(value: string) {
  return value
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getClientName(url: string) {
  const hostname = new URL(url).hostname
  const nickname = hostname.split(".")[0]

  return nickname ? `${nickname} SmugMug` : "SmugMug Import"
}
