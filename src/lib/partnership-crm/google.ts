import crypto from "node:crypto"
import { cookies } from "next/headers"
import { getPrismaClient } from "@/lib/db"

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
const OAUTH_COOKIE = "photoview_crm_google_oauth"
export const GMAIL_SCOPES = ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.readonly"]

function required(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "PARTNERSHIP_CRM_ENCRYPTION_KEY") {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

export function googleRedirectUri() {
  if (process.env.VERCEL_ENV === "production") return "https://photoview.io/api/google/callback"
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")}/api/google/callback`
}

function encryptionKey() {
  return crypto.createHash("sha256").update(required("PARTNERSHIP_CRM_ENCRYPTION_KEY"), "utf8").digest()
}

export function encryptGoogleSecret(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url")
}

export function decryptGoogleSecret(value: string) {
  const payload = Buffer.from(value, "base64url")
  if (payload.length < 29) throw new Error("Invalid encrypted Google credential.")
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), payload.subarray(0, 12))
  decipher.setAuthTag(payload.subarray(12, 28))
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8")
}

export function googleAuthorizationUrl(state: string) {
  const url = new URL(AUTH_URL)
  url.searchParams.set("client_id", required("GOOGLE_CLIENT_ID"))
  url.searchParams.set("redirect_uri", googleRedirectUri())
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", GMAIL_SCOPES.join(" "))
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent")
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("state", state)
  return url.toString()
}

export async function createGoogleOAuthState(userId: string) {
  const state = crypto.randomBytes(32).toString("base64url")
  const store = await cookies()
  store.set(OAUTH_COOKIE, JSON.stringify({ state, userId }), { httpOnly: true, maxAge: 600, path: "/api/google", sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  return state
}

export async function consumeGoogleOAuthState() {
  const store = await cookies()
  const raw = store.get(OAUTH_COOKIE)?.value
  store.delete(OAUTH_COOKIE)
  if (!raw) return null
  try { return JSON.parse(raw) as { state: string; userId: string } } catch { return null }
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch(TOKEN_URL, { body: new URLSearchParams(params), headers: { "Content-Type": "application/x-www-form-urlencoded" }, method: "POST", cache: "no-store" })
  if (!response.ok) throw new Error("Google rejected the authorization request. Reconnect Gmail and try again.")
  return response.json() as Promise<{ access_token: string; expires_in: number; refresh_token?: string; scope?: string }>
}

export async function exchangeGoogleCode(code: string) {
  const token = await tokenRequest({ client_id: required("GOOGLE_CLIENT_ID"), client_secret: required("GOOGLE_CLIENT_SECRET"), code, grant_type: "authorization_code", redirect_uri: googleRedirectUri() })
  const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" })
  if (!response.ok) throw new Error("Google account details could not be verified.")
  const profile = await response.json() as { email?: string }
  if (!profile.email) throw new Error("Google did not return an email address.")
  return { accessToken: token.access_token, email: profile.email, expiresAt: new Date(Date.now() + token.expires_in * 1000), refreshToken: token.refresh_token, scopes: (token.scope || GMAIL_SCOPES.join(" ")).split(" ") }
}

export async function saveGoogleConnection(userId: string, token: Awaited<ReturnType<typeof exchangeGoogleCode>>) {
  const prisma = getPrismaClient()
  const previous = await prisma.crmGoogleConnection.findUnique({ where: { userId } })
  const refreshTokenEncrypted = token.refreshToken ? encryptGoogleSecret(token.refreshToken) : previous?.refreshTokenEncrypted
  if (!refreshTokenEncrypted) throw new Error("Google did not issue a refresh token. Remove PhotoView from Google account access, then reconnect.")
  return prisma.crmGoogleConnection.upsert({
    create: { accessTokenEncrypted: encryptGoogleSecret(token.accessToken), email: token.email, refreshTokenEncrypted, scopes: token.scopes, tokenExpiresAt: token.expiresAt, userId },
    update: { accessTokenEncrypted: encryptGoogleSecret(token.accessToken), email: token.email, refreshTokenEncrypted, scopes: token.scopes, tokenExpiresAt: token.expiresAt },
    where: { userId },
  })
}

export async function getGoogleAccess(userId: string) {
  const prisma = getPrismaClient()
  const connection = await prisma.crmGoogleConnection.findUnique({ where: { userId } })
  if (!connection) return null
  if (connection.tokenExpiresAt.getTime() > Date.now() + 60_000) return { accessToken: decryptGoogleSecret(connection.accessTokenEncrypted), email: connection.email }
  if (!connection.refreshTokenEncrypted) return null
  const token = await tokenRequest({ client_id: required("GOOGLE_CLIENT_ID"), client_secret: required("GOOGLE_CLIENT_SECRET"), grant_type: "refresh_token", refresh_token: decryptGoogleSecret(connection.refreshTokenEncrypted) })
  await prisma.crmGoogleConnection.update({ data: { accessTokenEncrypted: encryptGoogleSecret(token.access_token), tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000) }, where: { userId } })
  return { accessToken: token.access_token, email: connection.email }
}

export function googleIsConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.PARTNERSHIP_CRM_ENCRYPTION_KEY)
}
