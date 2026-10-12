import { NextResponse } from "next/server"
import { z } from "zod"

import { authorizeRepairRunnerRequest } from "@/lib/github-actions-oidc"

const requestSchema = z.object({
  action: z.enum(["start", "status"]),
  sha: z.string().regex(/^[a-f0-9]{40}$/),
})

export async function POST(request: Request) {
  if (!(await authorizeRepairRunnerRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid deployment request" }, { status: 400 })

  if (parsed.data.action === "start") {
    const hookValue = process.env.AUTONOMOUS_REPAIR_DEPLOY_HOOK?.trim()
    if (!hookValue) return NextResponse.json({ error: "Repair deployment is unavailable" }, { status: 503 })
    let hook: URL
    try {
      hook = new URL(hookValue)
    } catch {
      return NextResponse.json({ error: "Repair deployment is misconfigured" }, { status: 503 })
    }
    if (hook.origin !== "https://api.vercel.com" || !hook.pathname.startsWith("/v1/integrations/deploy/")) {
      return NextResponse.json({ error: "Repair deployment is misconfigured" }, { status: 503 })
    }
    const response = await fetch(hook, { method: "POST" })
    if (!response.ok) return NextResponse.json({ error: "Production deployment could not start" }, { status: 502 })
    return NextResponse.json({ accepted: true })
  }

  const token = process.env.VERCEL_API_TOKEN?.trim()
  const projectId = (process.env.PHOTOVIEW_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID)?.trim()
  const teamId = (process.env.PHOTOVIEW_VERCEL_TEAM_ID || process.env.VERCEL_TEAM_ID)?.trim()
  if (!token || !projectId || !teamId) {
    return NextResponse.json({ error: "Deployment verification is unavailable" }, { status: 503 })
  }
  const url = new URL("https://api.vercel.com/v7/deployments")
  url.searchParams.set("limit", "5")
  url.searchParams.set("projectId", projectId)
  url.searchParams.set("sha", parsed.data.sha)
  url.searchParams.set("target", "production")
  url.searchParams.set("teamId", teamId)
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) return NextResponse.json({ error: "Deployment verification failed" }, { status: 502 })
  const payload = await response.json() as { deployments?: Array<{ id?: string; readyState?: string; state?: string; url?: string }> }
  const deployment = payload.deployments?.[0]
  if (!deployment) return NextResponse.json({ state: "NOT_FOUND" })
  return NextResponse.json({
    deploymentId: deployment.id,
    state: deployment.readyState || deployment.state || "UNKNOWN",
    url: deployment.url ? `https://${deployment.url}` : null,
  })
}
