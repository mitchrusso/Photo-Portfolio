import {
  ApiClient,
  GetItemsRequestContent,
  GetItemsResource,
  SearchItemsRequestContent,
  SearchItemsResource,
  TypedDefaultApi,
  type GetItemsResponseContent,
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

const supportedCredentialVersions = new Set(["2.1", "2.2", "2.3", "3.1", "3.2", "3.3"])

export function normalizeAmazonCreatorsCredentialVersion(value?: string | null) {
  const normalized = value?.trim() ?? ""
  return supportedCredentialVersions.has(normalized) ? normalized : "3.1"
}

function creatorsApiConfiguration() {
  return {
    credentialId: process.env.AMAZON_CREATORS_CREDENTIAL_ID?.trim() ?? "",
    credentialSecret: process.env.AMAZON_CREATORS_CREDENTIAL_SECRET?.trim() ?? "",
    credentialVersion: normalizeAmazonCreatorsCredentialVersion(process.env.AMAZON_CREATORS_CREDENTIAL_VERSION),
  }
}

function createCreatorsApiClient() {
  const configuration = creatorsApiConfiguration()
  if (!configuration.credentialId || !configuration.credentialSecret) {
    throw new Error("Amazon Creators API is not configured")
  }

  const client = new ApiClient()
  client.credentialId = configuration.credentialId
  client.credentialSecret = configuration.credentialSecret
  client.version = configuration.credentialVersion
  client.timeout = 20_000
  return new TypedDefaultApi(client)
}

const amazonProductResources = [
  "images.primary.large",
  "images.primary.highRes",
  "images.primary.medium",
  "itemInfo.features",
  "itemInfo.title",
]

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
  if (!partnerTag.trim()) throw new Error("Add an Amazon Associates tracking ID")

  const request = new SearchItemsRequestContent()
  request.itemCount = Math.max(1, Math.min(itemCount, 10))
  request.keywords = query
  request.partnerTag = partnerTag.trim()
  request.resources = amazonProductResources.map((resource) => SearchItemsResource.constructFromObject(resource))
  request.searchIndex = "Electronics"

  const response: SearchItemsResponseContent = await createCreatorsApiClient().searchItems("www.amazon.com", request)
  return (response.searchResult?.items ?? [])
    .map(getAmazonCreatorsProductData)
    .filter((item): item is AmazonCreatorsProduct => Boolean(item))
}

export async function getAmazonCreatorsCatalogItems(
  itemIds: string[],
  partnerTag: string,
) {
  const normalizedItemIds = itemIds
    .map((itemId) => itemId.trim().toUpperCase())
    .filter((itemId) => /^[A-Z0-9]{10}$/.test(itemId))
    .slice(0, 10)
  if (normalizedItemIds.length === 0) return []
  if (!partnerTag.trim()) throw new Error("Add an Amazon Associates tracking ID")

  const request = new GetItemsRequestContent(partnerTag.trim(), normalizedItemIds)
  request.resources = amazonProductResources.map((resource) => GetItemsResource.constructFromObject(resource))

  const response: GetItemsResponseContent = await createCreatorsApiClient().getItems("www.amazon.com", request)
  return (response.itemsResult?.items ?? [])
    .map(getAmazonCreatorsProductData)
    .filter((item): item is AmazonCreatorsProduct => Boolean(item))
}
