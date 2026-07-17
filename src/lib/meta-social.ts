import { encryptSocialToken } from "@/lib/social-token-crypto"

type MetaAccount = {
  access_token?: string
  id: string
  instagram_business_account?: {
    id: string
    name?: string
    username?: string
  }
  name: string
}

type MetaAccountsResponse = {
  data?: MetaAccount[]
  error?: { message?: string }
}

export function getMetaSocialConfig() {
  const appId = process.env.META_APP_ID?.trim()
  const appSecret = process.env.META_APP_SECRET?.trim()
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim()
  if (!appId || !appSecret || !graphVersion) return null
  return { appId, appSecret, graphVersion }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(body.error?.message || `Meta request failed with ${response.status}.`)
  return body
}

async function postMetaForm<T>(path: string, values: Record<string, string>) {
  const config = getMetaSocialConfig()
  if (!config) throw new Error("Meta social publishing is not configured.")
  return readJson<T>(await fetch(`https://graph.facebook.com/${config.graphVersion}/${path}`, {
    body: new URLSearchParams(values),
    cache: "no-store",
    method: "POST",
  }))
}

export function metaAuthorizationUrl(redirectUri: string, state: string) {
  const config = getMetaSocialConfig()
  if (!config) throw new Error("Meta social publishing is not configured.")
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`)
  url.searchParams.set("client_id", config.appId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("state", state)
  url.searchParams.set("scope", [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(","))
  return url.toString()
}

export async function exchangeMetaAuthorizationCode(code: string, redirectUri: string) {
  const config = getMetaSocialConfig()
  if (!config) throw new Error("Meta social publishing is not configured.")

  const shortUrl = new URL(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token`)
  shortUrl.searchParams.set("client_id", config.appId)
  shortUrl.searchParams.set("client_secret", config.appSecret)
  shortUrl.searchParams.set("redirect_uri", redirectUri)
  shortUrl.searchParams.set("code", code)
  const shortToken = await readJson<{ access_token: string }>(await fetch(shortUrl, { cache: "no-store" }))

  const longUrl = new URL(`https://graph.facebook.com/${config.graphVersion}/oauth/access_token`)
  longUrl.searchParams.set("grant_type", "fb_exchange_token")
  longUrl.searchParams.set("client_id", config.appId)
  longUrl.searchParams.set("client_secret", config.appSecret)
  longUrl.searchParams.set("fb_exchange_token", shortToken.access_token)
  return readJson<{ access_token: string; expires_in?: number }>(await fetch(longUrl, { cache: "no-store" }))
}

export async function getMetaPublishingAccounts(userAccessToken: string) {
  const config = getMetaSocialConfig()
  if (!config) throw new Error("Meta social publishing is not configured.")
  const url = new URL(`https://graph.facebook.com/${config.graphVersion}/me/accounts`)
  url.searchParams.set("access_token", userAccessToken)
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username,name}")
  const response = await readJson<MetaAccountsResponse>(await fetch(url, { cache: "no-store" }))

  return (response.data ?? []).flatMap((account) => {
    if (!account.access_token) return []
    const token = encryptSocialToken(account.access_token)
    const facebook = {
      accessTokenEncrypted: token,
      metadata: { pageId: account.id },
      network: "facebook",
      providerAccountId: account.id,
      providerAccountName: account.name,
    }
    const instagram = account.instagram_business_account
      ? {
          accessTokenEncrypted: token,
          metadata: { pageId: account.id },
          network: "instagram",
          providerAccountId: account.instagram_business_account.id,
          providerAccountName: account.instagram_business_account.username || account.instagram_business_account.name || account.name,
        }
      : null
    return instagram ? [facebook, instagram] : [facebook]
  })
}

export async function publishFacebookPhoto(input: {
  accessToken: string
  caption: string
  imageUrl: string
  pageId: string
}) {
  const result = await postMetaForm<{ id?: string; post_id?: string }>(`${input.pageId}/photos`, {
    access_token: input.accessToken,
    caption: input.caption,
    url: input.imageUrl,
  })
  const id = result.post_id || result.id
  if (!id) throw new Error("Facebook accepted the request without returning a post id.")
  return id
}

export async function publishInstagramPhoto(input: {
  accessToken: string
  caption: string
  imageUrl: string
  instagramAccountId: string
}) {
  const container = await postMetaForm<{ id?: string }>(`${input.instagramAccountId}/media`, {
    access_token: input.accessToken,
    caption: input.caption,
    image_url: input.imageUrl,
  })
  if (!container.id) throw new Error("Instagram did not create a media container.")
  const result = await postMetaForm<{ id?: string }>(`${input.instagramAccountId}/media_publish`, {
    access_token: input.accessToken,
    creation_id: container.id,
  })
  if (!result.id) throw new Error("Instagram accepted the request without returning a media id.")
  return result.id
}
