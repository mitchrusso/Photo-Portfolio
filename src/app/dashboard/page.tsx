import { auth } from "@/auth"
import { DashboardTelemetry } from "@/components/analytics/dashboard-telemetry"
import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <>
      {session?.user?.workspaceId ? <DashboardTelemetry workspaceId={session.user.workspaceId} /> : null}
      <PortfolioDashboard />
    </>
  )
}
