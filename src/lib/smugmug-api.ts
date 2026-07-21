import { createHmac, randomBytes } from "node:crypto"

const API_ORIGIN = "https://api.smugmug.com"
const REQUEST_TOKEN_URL = `${API_ORIGIN}/services/oauth/1.0a/getRequestToken`
const AUTHORIZE_URL = `${API_ORIGIN}/services/oauth/1.0a/authorize`
const ACCESS_TOKEN_URL = `${API_ORIGIN}/services/oauth/1.0a/getAccessToken`

export type SmugMugOAuthCredentials = {
  token: string
  tokenSecret: string
}

export type SmugMugAlbumSummary = {
  albumKey: string
  imageCount: number
  name: string
  privacy: string
  uri: string
  webUri: string
}

export type SmugMugImage = {
  Caption?: string
  Date?: string
  FileName?: string
  ImageKey?: string
  OriginalHeight?: number
  OriginalWidth?: number
  ThumbnailUrl?: string
  Title?: string
  Uris?: { ImageSizeDetails?: { Uri?: string } }
  WebUri?: string
}

type SmugMugUser = {
  Name?: string
  NickName?: string
  Uri?: string
  Uris?: { UserAlbums?: { Uri?: string } }
}

type ApiPayload = {
  Response?: Record<string, unknown> & {
    Album?: Record<string, unknown>
    ImageSizeDetails?: Record<string, unknown>
    Pages?: { NextPage?: string | null }
    User?: SmugMugUser
  }
}

export function getSmugMugConfig() {
  const apiKey = process.env.SMUGMUG_API_KEY?.trim()
  const apiSecret = process.env.SMUGMUG_API_SECRET?.trim()
  if (!apiKey || !apiSecret) return null
  return { apiKey, apiSecret }
}

export async function requestSmugMugToken(callbackUrl: string) {
  const response = await signedFetch(REQUEST_TOKEN_URL, {
    oauthParams: { oauth_callback: callbackUrl },
  })
  const params = new URLSearchParams(await response.text())
  if (!response.ok) throw new Error(`SmugMug authorization could not start (${response.status}).`)
  const token = params.get("oauth_token")
  const tokenSecret = params.get("oauth_token_secret")
  if (!token || !tokenSecret || params.get("oauth_callback_confirmed") !== "true") {
    throw new Error("SmugMug did not confirm the authorization callback.")
  }
  return { token, tokenSecret }
}

export function smugMugAuthorizationUrl(token: string) {
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set("oauth_token", token)
  url.searchParams.set("Access", "Full")
  url.searchParams.set("Permissions", "Read")
  return url.toString()
}

export async function exchangeSmugMugToken(input: SmugMugOAuthCredentials & { verifier: string }) {
  const response = await signedFetch(ACCESS_TOKEN_URL, {
    credentials: input,
    oauthParams: { oauth_verifier: input.verifier },
  })
  const params = new URLSearchParams(await response.text())
  if (!response.ok) throw new Error(`SmugMug authorization could not be completed (${response.status}).`)
  const token = params.get("oauth_token")
  const tokenSecret = params.get("oauth_token_secret")
  if (!token || !tokenSecret) throw new Error("SmugMug did not return account credentials.")
  return { token, tokenSecret }
}

export async function getSmugMugAuthenticatedUser(credentials: SmugMugOAuthCredentials) {
  const payload = await smugMugApiGet("/api/v2!authuser", credentials)
  const user = payload.Response?.User
  if (!user?.NickName || !user.Uris?.UserAlbums?.Uri) {
    throw new Error("SmugMug did not return the connected account.")
  }
  return user
}

export async function listSmugMugAlbums(credentials: SmugMugOAuthCredentials) {
  const user = await getSmugMugAuthenticatedUser(credentials)
  const albums = await collectPages(user.Uris!.UserAlbums!.Uri!, credentials, { count: "100" })
  return albums.flatMap((value) => {
    const album = asRecord(value)
    const uri = stringValue(album.Uri)
    const name = stringValue(album.Name)
    if (!uri || !name) return []
    return [{
      albumKey: stringValue(album.AlbumKey) || uri.split("/").filter(Boolean).at(-1) || uri,
      imageCount: numberValue(album.ImageCount),
      name,
      privacy: stringValue(album.Privacy) || "Unknown",
      uri,
      webUri: stringValue(album.WebUri),
    } satisfies SmugMugAlbumSummary]
  })
}

export async function getSmugMugAlbum(uri: string, credentials: SmugMugOAuthCredentials) {
  const payload = await smugMugApiGet(uri, credentials)
  const album = asRecord(payload.Response?.Album)
  if (!stringValue(album.Name)) throw new Error("The selected SmugMug gallery could not be found.")
  return album
}

export async function listSmugMugAlbumImages(album: Record<string, unknown>, credentials: SmugMugOAuthCredentials) {
  const imageUri = stringValue(asRecord(asRecord(album.Uris).AlbumImages).Uri)
  if (!imageUri) return []
  return (await collectPages(imageUri, credentials, { count: "100" })) as SmugMugImage[]
}

export async function getSmugMugBestImageSource(image: SmugMugImage, credentials: SmugMugOAuthCredentials) {
  const detailsUri = image.Uris?.ImageSizeDetails?.Uri
  if (!detailsUri) return null
  const payload = await smugMugApiGet(detailsUri, credentials)
  const details = asRecord(payload.Response?.ImageSizeDetails)
  const usable = Array.isArray(details.UsableSizes) ? details.UsableSizes.filter((value): value is string => typeof value === "string") : []
  const rank = [
    "ImageSizeTiny", "ImageSizeThumb", "ImageSizeSmall", "ImageSizeMedium", "ImageSizeLarge",
    "ImageSizeXLarge", "ImageSizeX2Large", "ImageSizeX3Large", "ImageSizeX4Large",
    "ImageSizeX5Large", "ImageSize4K", "ImageSize5K", "ImageSizeOriginal",
  ]
  const bestName = usable.sort((a, b) => rank.indexOf(b) - rank.indexOf(a))[0]
  const best = asRecord(bestName ? details[bestName] : null)
  const url = stringValue(best.Url)
  if (!url) return null
  return {
    height: numberValue(best.Height) || image.OriginalHeight || null,
    url,
    width: numberValue(best.Width) || image.OriginalWidth || null,
  }
}

export function isSmugMugAlbumUri(value: string) {
  return /^\/api\/v2\/album\/[A-Za-z0-9_-]+$/.test(value)
}

export function isSmugMugMediaUrl(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "")
    return url.protocol === "https:" && (hostname === "smugmug.com" || hostname.endsWith(".smugmug.com"))
  } catch {
    return false
  }
}

async function collectPages(uri: string, credentials: SmugMugOAuthCredentials, query: Record<string, string>) {
  const items: unknown[] = []
  let nextUri: string | null = uri
  let pages = 0
  while (nextUri && pages < 100) {
    const payload = await smugMugApiGet(nextUri, credentials, pages === 0 ? query : {})
    const response = payload.Response ?? {}
    const key = Object.keys(response).find((name) => Array.isArray(response[name]))
    if (key) items.push(...(response[key] as unknown[]))
    nextUri = response.Pages?.NextPage || null
    pages += 1
  }
  return items
}

async function smugMugApiGet(uri: string, credentials: SmugMugOAuthCredentials, query: Record<string, string> = {}) {
  const url = new URL(uri.startsWith("https://") ? uri : `${API_ORIGIN}${uri}`)
  if (url.origin !== API_ORIGIN) throw new Error("SmugMug returned an unsupported API address.")
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  const response = await signedFetch(url.toString(), { credentials })
  const text = await response.text()
  if (!response.ok) throw new Error(`SmugMug API request failed (${response.status}).`)
  try {
    return JSON.parse(text) as ApiPayload
  } catch {
    throw new Error("SmugMug returned an unreadable API response.")
  }
}

async function signedFetch(url: string, input: { credentials?: SmugMugOAuthCredentials; oauthParams?: Record<string, string> }) {
  const config = getSmugMugConfig()
  if (!config) throw new Error("SmugMug import is not configured.")
  const requestUrl = new URL(url)
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...input.oauthParams,
  }
  if (input.credentials?.token) oauthParams.oauth_token = input.credentials.token
  oauthParams.oauth_signature = signOAuthRequest({
    consumerSecret: config.apiSecret,
    method: "GET",
    oauthParams,
    tokenSecret: input.credentials?.tokenSecret || "",
    url: requestUrl,
  })
  return fetch(requestUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `OAuth ${Object.entries(oauthParams).map(([key, value]) => `${rfc3986(key)}="${rfc3986(value)}"`).join(", ")}`,
    },
    redirect: "error",
  })
}

function signOAuthRequest(input: { consumerSecret: string; method: string; oauthParams: Record<string, string>; tokenSecret: string; url: URL }) {
  const params: Array<[string, string]> = [...input.url.searchParams.entries()]
  for (const [key, value] of Object.entries(input.oauthParams)) if (key !== "oauth_signature") params.push([key, value])
  params.sort(([aKey, aValue], [bKey, bValue]) => {
    const a = `${rfc3986(aKey)}=${rfc3986(aValue)}`
    const b = `${rfc3986(bKey)}=${rfc3986(bValue)}`
    return a < b ? -1 : a > b ? 1 : 0
  })
  const baseUrl = `${input.url.protocol}//${input.url.host}${input.url.pathname}`
  const baseString = [input.method.toUpperCase(), rfc3986(baseUrl), rfc3986(params.map(([key, value]) => `${rfc3986(key)}=${rfc3986(value)}`).join("&"))].join("&")
  return createHmac("sha1", `${rfc3986(input.consumerSecret)}&${rfc3986(input.tokenSecret)}`).update(baseString).digest("base64")
}

function rfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}
