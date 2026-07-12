import { auth } from "@/auth"
import { DashboardTelemetry } from "@/components/analytics/dashboard-telemetry"
import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard"
import { getWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"

export default async function DashboardPage() {
  const session = await auth()
  const galleries = session?.user?.workspaceId
    ? await getWorkspacePortfolioGalleries(session.user.workspaceId)
    : []

  return (
    <>
      {session?.user?.workspaceId ? <DashboardTelemetry workspaceId={session.user.workspaceId} /> : null}
      <PortfolioDashboard initialGalleries={galleries} />
    </>
  )
}
