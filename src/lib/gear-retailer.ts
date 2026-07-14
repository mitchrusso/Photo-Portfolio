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
