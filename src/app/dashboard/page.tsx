import { auth } from "@/auth"
import { DashboardTelemetry } from "@/components/analytics/dashboard-telemetry"
import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard"
import { getWorkspacePortfolioGalleries } from "@/lib/portfolio-persistence"
import { getSubscriberOnboardingProgress } from "@/lib/onboarding-progress"
import { getSubscriberServiceNotice } from "@/lib/operational-monitoring"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"

export default async function DashboardPage() {
  const session = await auth()
  const galleries = session?.user?.workspaceId
    ? await getWorkspacePortfolioGalleries(session.user.workspaceId)
    : []
  const entitlement = session?.user?.workspaceId
    ? await getWorkspaceEntitlement(session.user.workspaceId)
    : null
  const onboardingProgress = session?.user?.workspaceId
    ? await getSubscriberOnboardingProgress(session.user.workspaceId)
    : null
  const serviceNotice = session?.user?.workspaceId
    ? await getSubscriberServiceNotice()
    : null

  return (
    <>
      {session?.user?.workspaceId ? <DashboardTelemetry workspaceId={session.user.workspaceId} /> : null}
      <PortfolioDashboard
        initialGalleries={galleries}
        initialOnboardingProgress={onboardingProgress}
        readOnlyReason={entitlement && entitlement.mode !== "write" ? entitlement.message : null}
        serviceNotice={serviceNotice}
      />
    </>
  )
}
