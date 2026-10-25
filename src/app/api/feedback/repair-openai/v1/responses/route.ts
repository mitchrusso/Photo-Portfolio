import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const MAX_REQUEST_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization")
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  const sessionSecret = process.env.AUTONOMOUS_REPAIR_SESSION_SECRET?.trim()
  if (!token || !sessionSecret || sessionSecret.length < 32) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tokenBuffer = Buffer.from(token, "base64url")
    if (tokenBuffer.toString("base64url") !== token) throw new Error("Invalid token encoding")
    const signedToken = tokenBuffer.toString("utf8")
    const { payload } = await jwtVerify(signedToken, new TextEncoder().encode(sessionSecret), {
      audience: "photoview-repair-openai-proxy",
      issuer: "https://photoview.io",
    })
    if (payload.scope !== "openai:responses") throw new Error("Invalid scope")
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (!Number.isFinite(contentLength) || contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 })
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 })

  const body = await request.arrayBuffer()
  if (body.byteLength > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Request too large" }, { status: 413 })

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    body,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(request.headers.get("openai-beta") ? { "OpenAI-Beta": request.headers.get("openai-beta")! } : {}),
    },
    method: "POST",
  })

  const headers = new Headers()
  headers.set("Content-Type", upstream.headers.get("content-type") || "application/json")
  const requestId = upstream.headers.get("x-request-id")
  if (requestId) headers.set("X-Request-Id", requestId)
  return new Response(upstream.body, { headers, status: upstream.status })
}
