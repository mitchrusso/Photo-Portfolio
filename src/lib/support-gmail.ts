import crypto from "node:crypto"
import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/db"
import { buildGmailRawMessage } from "@/lib/partnership-crm/gmail-message"
import { decryptGoogleSecret, encryptGoogleSecret, googleRedirectUri, GMAIL_READ_SCOPE, GMAIL_SEND_SCOPE, hasRequiredGmailScopes } from "@/lib/partnership-crm/google"

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
const OAUTH_COOKIE = "photoview_support_google_oauth"
const SUPPORT_GMAIL_SCOPES = ["openid", "email", "profile", GMAIL_READ_SCOPE, GMAIL_SEND_SCOPE]

function required(name: "SUPPORT_GOOGLE_CLIENT_ID" | "SUPPORT_GOOGLE_CLIENT_SECRET") {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

export function supportGmailAddress() {
  return (process.env.SUPPORT_GMAIL_ADDRESS || process.env.SUPPORT_EMAIL || "support@photoview.io").trim().toLowerCase()
}

export function supportGmailIsConfigured() {
  return Boolean(process.env.SUPPORT_GOOGLE_CLIENT_ID && process.env.SUPPORT_GOOGLE_CLIENT_SECRET && process.env.PARTNERSHIP_CRM_ENCRYPTION_KEY)
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch(TOKEN_URL, {
    body: new URLSearchParams(params),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  })
  if (!response.ok) throw new Error("Google rejected the support mailbox authorization. Reconnect support Gmail and try again.")
  return response.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string; scope?: string }>
}

export function supportGoogleAuthorizationUrl(state: string) {
  const url = new URL(AUTH_URL)
  url.searchParams.set("client_id", required("SUPPORT_GOOGLE_CLIENT_ID"))
  url.searchParams.set("redirect_uri", googleRedirectUri())
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", SUPPORT_GMAIL_SCOPES.join(" "))
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("login_hint", supportGmailAddress())
  url.searchParams.set("state", state)
  return url.toString()
}

export async function createSupportGoogleOAuthState(userId: string) {
  const state = crypto.randomBytes(32).toString("base64url")
  const store = await cookies()
  store.set(OAUTH_COOKIE, JSON.stringify({ state, userId }), { httpOnly: true, maxAge: 600, path: "/api/google", sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  return state
}

export async function consumeSupportGoogleOAuthState() {
  const store = await cookies()
  const raw = store.get(OAUTH_COOKIE)?.value
  store.delete(OAUTH_COOKIE)
  if (!raw) return null
  try { return JSON.parse(raw) as { state: string; userId: string } } catch { return null }
}

export async function exchangeSupportGoogleCode(code: string) {
  const token = await tokenRequest({
    client_id: required("SUPPORT_GOOGLE_CLIENT_ID"),
    client_secret: required("SUPPORT_GOOGLE_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: googleRedirectUri(),
  })
  const response = await fetch(USERINFO_URL, { cache: "no-store", headers: { Authorization: `Bearer ${token.access_token}` } })
  if (!response.ok) throw new Error("Google account details could not be verified.")
  const profile = await response.json() as { email?: string }
  const email = profile.email?.trim().toLowerCase()
  if (!email || email !== supportGmailAddress()) throw new Error(`Choose ${supportGmailAddress()} when Google asks which account to authorize.`)
  return {
    accessToken: token.access_token,
    email,
    expiresAt: new Date(Date.now() + token.expires_in * 1000),
    refreshToken: token.refresh_token,
    scopes: (token.scope || SUPPORT_GMAIL_SCOPES.join(" ")).split(" "),
  }
}

export async function saveSupportGoogleConnection(userId: string, token: Awaited<ReturnType<typeof exchangeSupportGoogleCode>>) {
  const prisma = getPrismaClient()
  const previous = await prisma.supportGoogleConnection.findUnique({ where: { email: token.email } })
  const refreshTokenEncrypted = token.refreshToken ? encryptGoogleSecret(token.refreshToken) : previous?.refreshTokenEncrypted
  if (!refreshTokenEncrypted) throw new Error("Google did not issue a refresh token. Remove PhotoView from Google account access, then reconnect.")
  return prisma.supportGoogleConnection.upsert({
    create: {
      accessTokenEncrypted: encryptGoogleSecret(token.accessToken),
      connectedById: userId,
      email: token.email,
      refreshTokenEncrypted,
      scopes: token.scopes,
      tokenExpiresAt: token.expiresAt,
    },
    update: {
      accessTokenEncrypted: encryptGoogleSecret(token.accessToken),
      connectedById: userId,
      refreshTokenEncrypted,
      scopes: token.scopes,
      tokenExpiresAt: token.expiresAt,
    },
    where: { email: token.email },
  })
}

export async function getSupportGoogleAccess() {
  const prisma = getPrismaClient()
  const email = supportGmailAddress()
  const connection = await prisma.supportGoogleConnection.findUnique({ where: { email } })
  if (!connection || !hasRequiredGmailScopes(connection.scopes)) return null
  if (connection.tokenExpiresAt.getTime() > Date.now() + 60_000) {
    return { accessToken: decryptGoogleSecret(connection.accessTokenEncrypted), email }
  }
  if (!connection.refreshTokenEncrypted) return null
  const token = await tokenRequest({
    client_id: required("SUPPORT_GOOGLE_CLIENT_ID"),
    client_secret: required("SUPPORT_GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: decryptGoogleSecret(connection.refreshTokenEncrypted),
  })
  await prisma.supportGoogleConnection.update({
    data: { accessTokenEncrypted: encryptGoogleSecret(token.access_token), tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000) },
    where: { email },
  })
  return { accessToken: token.access_token, email }
}

export function supportGmailMessageId(deliveryKey: string) {
  const digest = crypto.createHash("sha256").update(deliveryKey, "utf8").digest("hex")
  return `photoview-support-${digest}@photoview.io`
}

async function findSentMessage(accessToken: string, messageId: string) {
  const query = encodeURIComponent(`in:sent rfc822msgid:${messageId}`)
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=1`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error(`Gmail idempotency check failed (${response.status}).`)
  const result = await response.json() as { messages?: Array<{ id: string }> }
  return result.messages?.[0]?.id ?? null
}

export async function sendSupportGmail(input: { body: string; deliveryKey: string; html: string; subject: string; to: string }) {
  const google = await getSupportGoogleAccess()
  if (!google) return { messageId: null, state: "not_configured" as const }
  const messageId = supportGmailMessageId(input.deliveryKey)
  const existingId = await findSentMessage(google.accessToken, messageId)
  if (existingId) return { messageId: existingId, state: "sent" as const }

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    body: JSON.stringify({ raw: buildGmailRawMessage({
      body: input.body,
      from: google.email,
      html: input.html,
      messageId,
      replyTo: google.email,
      senderName: "PhotoView.io Support",
      subject: input.subject,
      to: input.to,
    }) }),
    cache: "no-store",
    headers: { Authorization: `Bearer ${google.accessToken}`, "Content-Type": "application/json" },
    method: "POST",
  })
  if (!response.ok) throw new Error(`Google rejected the support email (${response.status}).`)
  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error("Google accepted the support email without returning a message identifier.")
  return { messageId: result.id, state: "sent" as const }
}
