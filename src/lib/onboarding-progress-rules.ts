export const subscriberOnboardingStepCount = 6

export type SubscriberOnboardingSignals = {
  hasCover: boolean
  hasPhotos: boolean
  hasPortfolio: boolean
  hasPreviewed: boolean
  hasShared: boolean
  hasVisibility: boolean
}

export type SubscriberOnboardingProgress = SubscriberOnboardingSignals & {
  completedSteps: number
  percent: number
  totalSteps: number
}

export function calculateSubscriberOnboardingProgress(
  signals: SubscriberOnboardingSignals,
): SubscriberOnboardingProgress {
  const completedSteps = Object.values(signals).filter(Boolean).length

  return {
    ...signals,
    completedSteps,
    percent: Math.round((completedSteps / subscriberOnboardingStepCount) * 100),
    totalSteps: subscriberOnboardingStepCount,
  }
}

function workspaceIdFromMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const workspaceId = (value as Record<string, unknown>).workspaceId
  return typeof workspaceId === "string" ? workspaceId : null
}

export function previewedWorkspaceIds(events: Array<{ metadata: unknown }>) {
  return new Set(
    events
      .map((event) => workspaceIdFromMetadata(event.metadata))
      .filter((workspaceId): workspaceId is string => Boolean(workspaceId)),
  )
}
