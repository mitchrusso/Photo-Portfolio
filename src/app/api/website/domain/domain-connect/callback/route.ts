import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { verifyDomainConnectState } from "@/lib/domain-connect-state"
import { verifyCustomDomainWithVercel } from "@/lib/vercel-domains"

function dashboardRedirect(appUrl: string, result: string) {
  const url = new URL("/dashboard", appUrl)
  url.searchParams.set("panel", "website")
  url.searchParams.set("address", "1")
  url.searchParams.set("domainConnect", result)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const appUrl = getAppUrl(request)
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.redirect(`${appUrl}/login`)

  const url = new URL(request.url)
  const state = verifyDomainConnectState(url.searchParams.get("state"))
  if (!state || state.workspaceId !== session.user.workspaceId) {
    return dashboardRedirect(appUrl, "invalid-state")
  }

  const workspace = await getPrismaClient().workspace.findUnique({
    select: { customDomain: true },
    where: { id: state.workspaceId },
  })
  if (!workspace?.customDomain || workspace.customDomain !== state.domain) {
    return dashboardRedirect(appUrl, "domain-changed")
  }

  if (url.searchParams.has("error")) {
    const description = url.searchParams.get("error_description") ?? ""
    return dashboardRedirect(
      appUrl,
      url.searchParams.get("error") === "access_denied" || description.startsWith("user_cancel")
        ? "cancelled"
        : "provider-error",
    )
  }

  try {
    // The provider callback is only a signal to check DNS. DNS and Vercel,
    // not the callback parameters, remain authoritative for connection state.
    const status = await verifyCustomDomainWithVercel(state.domain)
    const checkedAt = new Date()
    await getPrismaClient().workspace.update({
      data: {
        customDomainLastCheckedAt: checkedAt,
        customDomainVerifiedAt: status.active ? checkedAt : null,
      },
      where: { id: state.workspaceId },
    })
    return dashboardRedirect(appUrl, status.active ? "connected" : "pending")
  } catch (error) {
    console.error("Domain Connect callback verification failed", error)
    return dashboardRedirect(appUrl, "verification-error")
  }
}
