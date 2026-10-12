import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

import { hasAuthorizedBearerSecret } from "@/lib/bearer-auth"

const issuer = "https://token.actions.githubusercontent.com"
const audience = "photoview-autonomous-repair"
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`))

function bearerToken(request: Request) {
  const value = request.headers.get("authorization")
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : ""
}

export async function authorizeGitHubRepairOidc(request: Request): Promise<JWTPayload | null> {
  const token = bearerToken(request)
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, jwks, { audience, issuer })
    const repository = process.env.GITHUB_REPAIR_REPOSITORY?.trim() || "mitchrusso/Photo-Portfolio"
    const workflow = `${repository}/.github/workflows/autonomous-bug-repair.yml@refs/heads/main`
    if (payload.repository !== repository) return null
    if (payload.ref !== "refs/heads/main") return null
    if (payload.workflow_ref !== workflow) return null
    if (!["schedule", "workflow_dispatch"].includes(String(payload.event_name))) return null
    return payload
  } catch {
    return null
  }
}

export async function authorizeRepairRunnerRequest(request: Request) {
  if (hasAuthorizedBearerSecret(request, [process.env.BUG_REPAIR_WEBHOOK_SECRET])) return true
  return Boolean(await authorizeGitHubRepairOidc(request))
}
