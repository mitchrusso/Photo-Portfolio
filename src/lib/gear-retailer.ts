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
