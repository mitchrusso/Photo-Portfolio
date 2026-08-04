import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { ensureWorkspaceForSession } from "@/lib/dev-workspace"
import {
  createSignedDomainConnectApplyUrl,
  getDomainConnectCapability,
} from "@/lib/domain-connect"
import { createDomainConnectState } from "@/lib/domain-connect-state"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { getCustomDomainProviderStatus } from "@/lib/vercel-domains"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = await ensureWorkspaceForSession(session.user.workspaceId)
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock

  const stored = await getPrismaClient().workspace.findUnique({
    select: { customDomain: true },
    where: { id: workspace.id },
  })
  if (!stored?.customDomain) {
    return NextResponse.json({ error: "Connect a domain before starting automatic setup." }, { status: 404 })
  }

  try {
    const status = await getCustomDomainProviderStatus(stored.customDomain)
    const capability = await getDomainConnectCapability(stored.customDomain, status.apexName)
    if (!capability) {
      return NextResponse.json({
        error: "Automatic setup is not yet approved by this DNS provider. Use the guided DNS steps shown in Address.",
      }, { status: 409 })
    }

    const connectionRecord = status.dnsRecords.find(
      (record): record is { name: string; type: "A" | "CNAME"; value: string } =>
        record.type === "A" || record.type === "CNAME",
    )
    if (!connectionRecord) {
      return NextResponse.json({ error: "PhotoView could not determine the required connection record." }, { status: 502 })
    }

    const appUrl = getAppUrl(request)
    const state = createDomainConnectState(workspace.id, stored.customDomain)
    const setupUrl = createSignedDomainConnectApplyUrl({
      apexName: status.apexName,
      capability,
      connectionRecord,
      domain: stored.customDomain,
      redirectUri: `${appUrl}/api/website/domain/domain-connect/callback`,
      state,
    })
    return NextResponse.json({ setupUrl })
  } catch (error) {
    console.error("Domain Connect setup could not start", error)
    return NextResponse.json({ error: "Automatic DNS setup could not be started. Use the guided setup for now." }, { status: 502 })
  }
}
