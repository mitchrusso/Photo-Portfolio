import { getPrismaClient } from "@/lib/db"

const PROCESSING_LEASE_MS = 5 * 60 * 1000

export type StripeWebhookClaim = {
  acquired: boolean
  state: "duplicate" | "in_progress" | "new" | "retry"
}

export async function claimStripeWebhookEvent({
  id,
  livemode,
  type,
}: {
  id: string
  livemode: boolean
  type: string
}): Promise<StripeWebhookClaim> {
  const prisma = getPrismaClient()
  const now = new Date()
  const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "StripeWebhookEvent" (
      "id", "eventType", "livemode", "status", "attempts", "createdAt", "updatedAt"
    )
    VALUES (${id}, ${type}, ${livemode}, 'PROCESSING', 1, ${now}, ${now})
    ON CONFLICT ("id") DO NOTHING
    RETURNING "id"
  `

  if (inserted.length === 1) return { acquired: true, state: "new" }

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { id },
  })

  if (!existing) throw new Error(`Stripe webhook event ${id} could not be claimed.`)
  if (existing.status === "COMPLETED") return { acquired: false, state: "duplicate" }
  if (existing.status === "PROCESSING" && existing.updatedAt > new Date(now.getTime() - PROCESSING_LEASE_MS)) {
    return { acquired: false, state: "in_progress" }
  }

  const reclaimed = await prisma.stripeWebhookEvent.updateMany({
    data: {
      attempts: { increment: 1 },
      eventType: type,
      lastError: null,
      livemode,
      processedAt: null,
      status: "PROCESSING",
      updatedAt: now,
    },
    where: {
      id,
      status: existing.status,
      updatedAt: existing.updatedAt,
    },
  })

  return reclaimed.count === 1
    ? { acquired: true, state: "retry" }
    : { acquired: false, state: "in_progress" }
}

export async function completeStripeWebhookEvent(id: string) {
  await getPrismaClient().stripeWebhookEvent.updateMany({
    data: {
      lastError: null,
      processedAt: new Date(),
      status: "COMPLETED",
    },
    where: { id, status: "PROCESSING" },
  })
}

export async function failStripeWebhookEvent(id: string, error: string) {
  await getPrismaClient().stripeWebhookEvent.updateMany({
    data: {
      lastError: error.slice(0, 2000),
      status: "FAILED",
    },
    where: { id, status: "PROCESSING" },
  })
}
