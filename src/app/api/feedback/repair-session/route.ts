import { SignJWT } from "jose"
import { NextResponse } from "next/server"

import { authorizeGitHubRepairOidc } from "@/lib/github-actions-oidc"

export async function POST(request: Request) {
  const identity = await authorizeGitHubRepairOidc(request)
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const secret = process.env.AUTONOMOUS_REPAIR_SESSION_SECRET?.trim()
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Repair session signing is unavailable" }, { status: 503 })
  }

  const token = await new SignJWT({
    runId: identity.run_id,
    scope: "openai:responses",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("https://photoview.io")
    .setAudience("photoview-repair-openai-proxy")
    .setIssuedAt()
    .setExpirationTime("45m")
    .setJti(crypto.randomUUID())
    .sign(new TextEncoder().encode(secret))

  return NextResponse.json({ expiresIn: 2_700, token })
}
