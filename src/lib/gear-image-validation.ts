import { validatePublicImageUrl } from "./public-network-url.ts"

type GearImageRetailer = "adorama" | "amazon" | "bestbuy" | "bh" | "ebay" | "keh" | "moment" | "mpb" | "other" | "walmart"
type ImageFetcher = (input: string, init: RequestInit) => Promise<Response>
type AddressResolver = (hostname: string) => Promise<string[]>

const amazonImageHosts = new Set([
  "images-na.ssl-images-amazon.com",
  "m.media-amazon.com",
])

export async function validateGearProductImageUrl(
  value: string,
  retailer: GearImageRetailer,
  fetchImage: ImageFetcher = fetch,
  resolveAddresses?: AddressResolver,
) {
  const publicUrl = await validatePublicImageUrl(value, { resolveAddresses })
  if (!publicUrl) return ""

  const url = new URL(publicUrl)
  if (retailer !== "amazon") return publicUrl
  if (!amazonImageHosts.has(url.hostname.toLowerCase())) return ""

  try {
    const response = await fetchImage(publicUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        Range: "bytes=0-1023",
      },
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    })
    const isImage = response.headers.get("content-type")?.toLowerCase().startsWith("image/") ?? false
    await response.body?.cancel()
    return response.ok && isImage ? publicUrl : ""
  } catch {
    return ""
  }
}
