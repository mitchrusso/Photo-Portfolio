import { auth } from "@/auth"
import { DashboardTelemetry } from "@/components/analytics/dashboard-telemetry"
import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard"
import { getWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"

export default async function DashboardPage() {
  const session = await auth()
  const galleries = session?.user?.workspaceId
    ? await getWorkspacePortfolioGalleries(session.user.workspaceId)
    : []
  const entitlement = session?.user?.workspaceId
    ? await getWorkspaceEntitlement(session.user.workspaceId)
    : null

  return (
    <>
      {session?.user?.workspaceId ? <DashboardTelemetry workspaceId={session.user.workspaceId} /> : null}
      <PortfolioDashboard
        initialGalleries={galleries}
        readOnlyReason={entitlement && entitlement.mode !== "write" ? entitlement.message : null}
      />
    </>
  )
}
