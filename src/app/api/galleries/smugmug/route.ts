import { NextResponse } from "next/server"

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

const TRAVEL_URL = "https://lenstraveler18.smugmug.com/Travel"
const FALLBACK_COVER =
  "https://photos.smugmug.com/Travel/Terlingua/i-nMNn54N/0/KnjNkQxrvWvNwbK2326S3j7JQHdBvJ3R2tx3xPPhP/XL/Chicago%20SM%20gallery-6-XL.jpg"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const travelHtml = await fetchText(TRAVEL_URL)
    const links = extractTravelLinks(travelHtml)
    const galleries = await Promise.all(links.map(toGallery))

    return NextResponse.json({
      source: TRAVEL_URL,
      syncedAt: new Date().toISOString(),
      galleries,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync SmugMug"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "Photo-Portfolio/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`SmugMug returned ${response.status} for ${url}`)
  }

  return response.text()
}

function extractTravelLinks(html: string) {
  const links: Array<{ name: string; url: string }> = []
  const pattern = /"label":"([^"]+)","url":"(https:\\\/\\\/lenstraveler18\.smugmug\.com[^"]+)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html))) {
    const name = decodeEntities(match[1].replace(/\\u0027/g, "'"))
    const url = match[2].replace(/\\\//g, "/")

    if ((url.includes("/Travel/") || url.endsWith("/Iceland")) && name !== "Portfolio") {
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
  let description = "Imported from the public SmugMug Travel gallery."

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
    client: "Mitch Russo Travels",
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
