import { randomUUID } from "node:crypto"
import type { Prisma } from "@/generated/prisma/client"

const DEFAULT_PROCESSING_LEASE_MS = 5 * 60 * 1000

type EmailDeliveryClaimInput = {
  automationKey: string
  deliveryKey: string
  email: string
  event: string
  metadata?: Prisma.InputJsonValue
  subscriptionId: string
  workspaceId: string
}

type ExistingEmailDelivery = {
  status: string
  updatedAt: Date
}

export type EmailDeliveryClaimStore = {
  find(deliveryKey: string): Promise<ExistingEmailDelivery | null>
  insert(input: EmailDeliveryClaimInput, now: Date): Promise<boolean>
  reclaim(
    input: EmailDeliveryClaimInput,
    existing: ExistingEmailDelivery,
    now: Date,
  ): Promise<boolean>
}

export type EmailDeliveryClaim = {
  acquired: boolean
  state: "already_sent" | "in_progress" | "new" | "retry"
}

async function createPrismaEmailDeliveryClaimStore(): Promise<EmailDeliveryClaimStore> {
  const { getPrismaClient } = await import("@/lib/db")
  const prisma = getPrismaClient()

  return {
    async find(deliveryKey) {
      return prisma.emailAutomationDelivery.findUnique({
        select: { status: true, updatedAt: true },
        where: { deliveryKey },
      })
    },
    async insert(input, now) {
      const metadata = input.metadata === undefined ? null : JSON.stringify(input.metadata)
      const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "EmailAutomationDelivery" (
          "id", "deliveryKey", "subscriptionId", "workspaceId", "email",
          "automationKey", "event", "status", "providerStatus", "metadata",
          "sentAt", "createdAt", "updatedAt"
        )
        VALUES (
          ${randomUUID()}, ${input.deliveryKey}, ${input.subscriptionId}, ${input.workspaceId},
          ${input.email}, ${input.automationKey}, ${input.event}, 'PENDING', NULL,
          CAST(${metadata} AS JSONB), NULL, ${now}, ${now}
        )
        ON CONFLICT ("deliveryKey") DO NOTHING
        RETURNING "id"
      `

      return inserted.length === 1
    },
    async reclaim(input, existing, now) {
      const reclaimed = await prisma.emailAutomationDelivery.updateMany({
        data: {
          automationKey: input.automationKey,
          email: input.email,
          event: input.event,
          metadata: input.metadata,
          providerStatus: null,
          sentAt: null,
          status: "PENDING",
          subscriptionId: input.subscriptionId,
          updatedAt: now,
          workspaceId: input.workspaceId,
        },
        where: {
          deliveryKey: input.deliveryKey,
          status: existing.status,
          updatedAt: existing.updatedAt,
        },
      })

      return reclaimed.count === 1
    },
  }
}

export async function claimEmailDelivery(
  input: EmailDeliveryClaimInput,
  options: {
    leaseMs?: number
    now?: Date
    store?: EmailDeliveryClaimStore
  } = {},
): Promise<EmailDeliveryClaim> {
  const now = options.now ?? new Date()
  const leaseMs = options.leaseMs ?? DEFAULT_PROCESSING_LEASE_MS
  const store = options.store ?? await createPrismaEmailDeliveryClaimStore()

  if (await store.insert(input, now)) return { acquired: true, state: "new" }

  const existing = await store.find(input.deliveryKey)
  if (!existing) throw new Error(`Email delivery ${input.deliveryKey} could not be claimed.`)
  if (existing.status === "SENT") return { acquired: false, state: "already_sent" }
  if (existing.status === "PENDING" && existing.updatedAt > new Date(now.getTime() - leaseMs)) {
    return { acquired: false, state: "in_progress" }
  }

  return await store.reclaim(input, existing, now)
    ? { acquired: true, state: "retry" }
    : { acquired: false, state: "in_progress" }
}

export async function finishEmailDelivery({
  deliveryKey,
  providerStatus,
}: {
  deliveryKey: string
  providerStatus: string
}) {
  const { getPrismaClient } = await import("@/lib/db")
  const sent = providerStatus === "sent"
  await getPrismaClient().emailAutomationDelivery.updateMany({
    data: {
      providerStatus,
      sentAt: sent ? new Date() : null,
      status: sent ? "SENT" : "FAILED",
    },
    where: { deliveryKey, status: "PENDING" },
  })
}
