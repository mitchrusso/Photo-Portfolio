import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { verifyDomainConnectState } from "@/lib/domain-connect-state"
import { verifyCustomDomainWithVercel } from "@/lib/vercel-domains"
import { getOwnedWebsite } from "@/lib/multi-website"

function dashboardRedirect(appUrl: string, result: string, websiteId?: string) {
  const url = new URL("/dashboard", appUrl)
  url.searchParams.set("panel", "website")
  url.searchParams.set("address", "1")
  url.searchParams.set("domainConnect", result)
  if (websiteId) url.searchParams.set("websiteId", websiteId)
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

  const website = await getOwnedWebsite(state.workspaceId, state.websiteId)
  if (!website?.customDomain || website.customDomain !== state.domain) {
    return dashboardRedirect(appUrl, "domain-changed", state.websiteId)
  }

  if (url.searchParams.has("error")) {
    const description = url.searchParams.get("error_description") ?? ""
    return dashboardRedirect(
      appUrl,
      url.searchParams.get("error") === "access_denied" || description.startsWith("user_cancel")
        ? "cancelled"
        : "provider-error",
      website.id,
    )
  }

  try {
    // The provider callback is only a signal to check DNS. DNS and Vercel,
    // not the callback parameters, remain authoritative for connection state.
    const status = await verifyCustomDomainWithVercel(state.domain)
    const checkedAt = new Date()
    const data = {
        customDomainLastCheckedAt: checkedAt,
        customDomainVerifiedAt: status.active ? checkedAt : null,
      }
    await getPrismaClient().website.update({ data, where: { id: website.id } })
    if (website.isPrimary) await getPrismaClient().workspace.update({ data, where: { id: state.workspaceId } })
    return dashboardRedirect(appUrl, status.active ? "connected" : "pending", website.id)
  } catch (error) {
    console.error("Domain Connect callback verification failed", error)
    return dashboardRedirect(appUrl, "verification-error", website.id)
  }
}
