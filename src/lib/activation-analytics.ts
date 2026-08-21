import "server-only"

import { getPrismaClient } from "@/lib/db"

export const activationEventTypes = {
  destinationShared: "DESTINATION_SHARED",
  paidConversion: "PAID_CONVERSION",
  photoImported: "PHOTO_IMPORTED",
  portfolioPublished: "PORTFOLIO_PUBLISHED",
  registrationCaptured: "REGISTRATION_CAPTURED",
  sitePublished: "SITE_PUBLISHED",
  trialStarted: "TRIAL_STARTED",
} as const

type ActivationEventType = (typeof activationEventTypes)[keyof typeof activationEventTypes]

type ActivationMetadata = Record<string, boolean | number | string | null | undefined>

type GlobalWithActivationMilestones = typeof globalThis & {
  activationMilestones?: Set<string>
}

const globalForActivationMilestones = globalThis as GlobalWithActivationMilestones
const recordedMilestones = globalForActivationMilestones.activationMilestones ?? new Set<string>()
globalForActivationMilestones.activationMilestones = recordedMilestones

function cleanMetadata(metadata: ActivationMetadata) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .slice(0, 20)
      .map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? value.slice(0, 500) : value]),
  )
}

/**
 * Activation analytics must never interrupt a subscriber action. These events
 * are written on the server so ad blockers and page navigation cannot erase
 * the product milestones used by the 30-day acquisition scorecard.
 */
export async function recordActivationEvent(input: {
  eventType: ActivationEventType
  metadata?: ActivationMetadata
  path: string
  workspaceId?: string | null
}) {
  const milestoneKey = input.workspaceId ? `${input.workspaceId}:${input.eventType}` : null
  if (milestoneKey && recordedMilestones.has(milestoneKey)) return

  if (milestoneKey) recordedMilestones.add(milestoneKey)

  try {
    await getPrismaClient().analyticsEvent.create({
      data: {
        deviceType: "SERVER",
        eventType: input.eventType,
        metadata: cleanMetadata({
          ...input.metadata,
          workspaceId: input.workspaceId,
        }),
        path: input.path,
      },
    })
  } catch (error) {
    if (milestoneKey) recordedMilestones.delete(milestoneKey)
    console.error("Activation analytics write failed", {
      error,
      eventType: input.eventType,
      path: input.path,
    })
  }
}
