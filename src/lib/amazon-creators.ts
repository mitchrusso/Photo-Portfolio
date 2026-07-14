import {
  ApiClient,
  SearchItemsRequestContent,
  SearchItemsResource,
  TypedDefaultApi,
  type SearchItemsResponseContent,
} from "amazon-creators-api"

export type AmazonCreatorsProduct = {
  asin: string
  description: string
  imageUrl: string
  name: string
  url: string
}

type AmazonCreatorsItemLike = {
  asin?: string
  detailPageURL?: string
  images?: {
    primary?: {
      highRes?: { url?: string }
      large?: { url?: string }
      medium?: { url?: string }
    }
  }
  itemInfo?: {
    features?: { displayValues?: string[] }
    title?: { displayValue?: string }
  }
}

function creatorsApiConfiguration() {
  return {
    credentialId: process.env.AMAZON_CREATORS_CREDENTIAL_ID?.trim() ?? "",
    credentialSecret: process.env.AMAZON_CREATORS_CREDENTIAL_SECRET?.trim() ?? "",
    credentialVersion: process.env.AMAZON_CREATORS_CREDENTIAL_VERSION?.trim() ?? "3.1",
  }
}

export function hasAmazonCreatorsApiConfiguration() {
  const configuration = creatorsApiConfiguration()
  return Boolean(configuration.credentialId && configuration.credentialSecret && configuration.credentialVersion)
}

export function getAmazonCreatorsProductData(item: AmazonCreatorsItemLike): AmazonCreatorsProduct | null {
  const name = item.itemInfo?.title?.displayValue?.trim() ?? ""
  const url = item.detailPageURL?.trim() ?? ""
  if (!name || !url) return null

  const features = item.itemInfo?.features?.displayValues ?? []
  const imageUrl = item.images?.primary?.large?.url
    ?? item.images?.primary?.highRes?.url
    ?? item.images?.primary?.medium?.url
    ?? ""

  return {
    asin: item.asin?.trim() ?? "",
    description: features.filter(Boolean).join(" ").slice(0, 280),
    imageUrl: imageUrl.trim(),
    name: name.slice(0, 180),
    url,
  }
}

export async function searchAmazonCreatorsCatalog(
  query: string,
  partnerTag: string,
  itemCount = 4,
) {
  const configuration = creatorsApiConfiguration()
  if (!configuration.credentialId || !configuration.credentialSecret) {
    throw new Error("Amazon Creators API is not configured")
  }
  if (!partnerTag.trim()) throw new Error("Add an Amazon Associates tracking ID")

  const client = new ApiClient()
  client.credentialId = configuration.credentialId
  client.credentialSecret = configuration.credentialSecret
  client.version = configuration.credentialVersion
  client.timeout = 20_000

  const request = new SearchItemsRequestContent()
  request.itemCount = Math.max(1, Math.min(itemCount, 10))
  request.keywords = query
  request.partnerTag = partnerTag.trim()
  request.resources = [
    "images.primary.large",
    "images.primary.highRes",
    "itemInfo.features",
    "itemInfo.title",
  ].map((resource) => SearchItemsResource.constructFromObject(resource))
  request.searchIndex = "Electronics"

  const response: SearchItemsResponseContent = await new TypedDefaultApi(client).searchItems("www.amazon.com", request)
  return (response.searchResult?.items ?? [])
    .map(getAmazonCreatorsProductData)
    .filter((item): item is AmazonCreatorsProduct => Boolean(item))
}
