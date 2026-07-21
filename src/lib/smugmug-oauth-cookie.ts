import { decryptSocialToken, encryptSocialToken } from "@/lib/social-token-crypto"

export const SMUGMUG_OAUTH_COOKIE = "photoview_smugmug_oauth"

type SmugMugOAuthCookie = {
  expiresAt: number
  requestToken: string
  requestTokenSecret: string
  userId: string
  workspaceId: string
}

export function createSmugMugOAuthCookie(input: Omit<SmugMugOAuthCookie, "expiresAt">) {
  return encryptSocialToken(JSON.stringify({
    ...input,
    expiresAt: Math.floor(Date.now() / 1000) + 10 * 60,
  } satisfies SmugMugOAuthCookie))
}

export function readSmugMugOAuthCookie(value: string | undefined) {
  if (!value) return null
  try {
    const parsed = JSON.parse(decryptSocialToken(value)) as SmugMugOAuthCookie
    if (
      !parsed.requestToken ||
      !parsed.requestTokenSecret ||
      !parsed.userId ||
      !parsed.workspaceId ||
      parsed.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null
    return parsed
  } catch {
    return null
  }
}
