export function getRetailerProductImageFallback(retailer: string, rawUrl: string) {
  if (retailer !== "bh") return ""

  try {
    const url = new URL(rawUrl)
    const hostname = url.hostname.toLowerCase()
    if (hostname !== "bhphotovideo.com" && hostname !== "www.bhphotovideo.com") return ""

    const match = url.pathname.match(/^\/c\/product\/(\d+)(?:-[^/]+)?\/([a-z0-9_-]+)\.html$/i)
    if (!match) return ""

    const [, productId, productSlug] = match
    return `https://static.bhphoto.com/images/images500x500/${productSlug}_${productId}.jpg`
  } catch {
    return ""
  }
}

export function withRetailerAffiliateTracking(rawUrl: string, retailer: string, affiliateTag: string) {
  if (retailer !== "amazon" || !affiliateTag.trim()) return rawUrl

  try {
    const url = new URL(rawUrl)
    url.searchParams.set("tag", affiliateTag.trim())
    return url.toString()
  } catch {
    return rawUrl
  }
}

export function normalizeGearSearchEntry(value: string) {
  return value.trim().replace(/[\s,.;]+$/g, "").trim()
}

export function getAmazonGearSearchUrl(query: string, affiliateTag: string) {
  const normalizedQuery = normalizeGearSearchEntry(query)
  const searchUrl = new URL("https://www.amazon.com/s")
  searchUrl.searchParams.set("k", normalizedQuery)
  return withRetailerAffiliateTracking(searchUrl.toString(), "amazon", affiliateTag)
}

export function getAmazonAsin(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    const pathMatch = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i)
    const queryAsin = url.searchParams.get("asin") ?? url.searchParams.get("ASIN") ?? ""
    const asin = pathMatch?.[1] ?? queryAsin
    return /^[A-Z0-9]{10}$/i.test(asin) ? asin.toUpperCase() : ""
  } catch {
    return ""
  }
}

export function getAmazonProductNameFromMetadata(
  currentName: string,
  description: string,
  resolvedUrl: string,
) {
  let url: URL | null = null
  try {
    url = new URL(resolvedUrl)
  } catch {
    // Keep using metadata when the resolved URL cannot be parsed.
  }

  const shortCode = url?.hostname.toLowerCase().endsWith("amzn.to")
    ? url.pathname.split("/").filter(Boolean).at(-1) ?? ""
    : ""
  const normalizedName = currentName.trim()
  const isWeakName = !normalizedName
    || normalizedName === "Imported product"
    || Boolean(shortCode && normalizedName.toLowerCase() === shortCode.toLowerCase())
    || (/^[a-z0-9]{6,10}$/i.test(normalizedName) && /^Amazon(?:\.com)?\s*:/i.test(description))

  if (!isWeakName) return normalizedName

  const amazonDescription = description
    .replace(/^Amazon(?:\.com)?\s*:\s*/i, "")
    .replace(/\s*:\s*(?:Amazon Devices & Accessories|Electronics|Camera & Photo|Computers|Home & Kitchen|Sports & Outdoors)\s*$/i, "")
    .trim()
  if (amazonDescription && amazonDescription.length > 8) return amazonDescription

  if (url) {
    const slug = url.pathname.split("/").filter(Boolean)[0] ?? ""
    if (slug && !/^(dp|gp|product)$/i.test(slug)) {
      return decodeURIComponent(slug)
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    }
  }

  return normalizedName || "Imported product"
}
