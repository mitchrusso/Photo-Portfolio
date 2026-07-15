import { getPrismaClient } from "@/lib/db"

export type ReferralProgramSummary = {
  convertedCount: number
  earnedStorageBytes: number
  pendingCount: number
  referralCode: string
  referralUrl: string
  rewardDescription: string
}

const REFERRAL_SOURCE = "REFERRAL"
const REWARD_STORAGE_BYTES_PER_CONVERSION = 1024 ** 3

function cleanReferralCode(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
}

function getReferralMetadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === "string" ? value : null
}

export function buildReferralUrl({
  appUrl,
  referralCode,
}: {
  appUrl: string
  referralCode: string
}) {
  return `${appUrl.replace(/\/$/, "")}/register?ref=${encodeURIComponent(referralCode)}`
}

export function createReferralProgramSummary({
  appUrl,
  convertedCount = 0,
  pendingCount = 0,
  workspaceSlug,
}: {
  appUrl: string
  convertedCount?: number
  pendingCount?: number
  workspaceSlug: string
}): ReferralProgramSummary {
  const referralCode = cleanReferralCode(workspaceSlug)

  return {
    convertedCount,
    earnedStorageBytes: convertedCount * REWARD_STORAGE_BYTES_PER_CONVERSION,
    pendingCount,
    referralCode,
    referralUrl: buildReferralUrl({ appUrl, referralCode }),
    rewardDescription: "Each referral earns one permanent 1 GB storage bonus when their trial becomes a paid subscription. The bonus is awarded once, does not renew each year, and never adds free subscription months. It remains available while your PhotoView.io account is active.",
  }
}

export async function getReferralProgramSummary({
  appUrl,
  workspaceSlug,
}: {
  appUrl: string
  workspaceSlug: string
}) {
  const referralCode = cleanReferralCode(workspaceSlug)

  if (!process.env.DATABASE_URL) {
    return createReferralProgramSummary({ appUrl, workspaceSlug: referralCode })
  }

  const prisma = getPrismaClient()
  const referralLeads = await prisma.leadCapture.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      source: REFERRAL_SOURCE,
    },
  })
  const matchingLeads = referralLeads.filter((lead) => cleanReferralCode(getReferralMetadataValue(lead.metadata, "referralCode")) === referralCode)
  const convertedCount = matchingLeads.filter((lead) => lead.status === "CONVERTED").length
  const pendingCount = matchingLeads.filter((lead) => lead.status !== "CONVERTED").length

  return createReferralProgramSummary({
    appUrl,
    convertedCount,
    pendingCount,
    workspaceSlug: referralCode,
  })
}

export async function recordReferralLead({
  email,
  firstName,
  lastName,
  referralCode,
}: {
  email: string
  firstName: string
  lastName?: string
  referralCode: string | null | undefined
}) {
  const code = cleanReferralCode(referralCode)
  if (!code || !process.env.DATABASE_URL) return null

  const prisma = getPrismaClient()
  const referringWorkspace = await prisma.workspace.findUnique({
    select: { id: true, slug: true },
    where: { slug: code },
  })

  if (!referringWorkspace) return null

  return prisma.leadCapture.create({
    data: {
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      metadata: {
        referralCode: code,
        referringWorkspaceId: referringWorkspace.id,
        referringWorkspaceSlug: referringWorkspace.slug,
      },
      source: REFERRAL_SOURCE,
      status: "TRIAL_STARTED",
    },
  })
}

export async function markReferralTrialingByEmail(email: string | null | undefined) {
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail || !process.env.DATABASE_URL) return

  const prisma = getPrismaClient()
  await prisma.leadCapture.updateMany({
    data: { status: "TRIALING" },
    where: {
      email: cleanEmail,
      source: REFERRAL_SOURCE,
      status: "TRIAL_STARTED",
    },
  })
}

export async function markReferralConvertedByEmail(email: string | null | undefined) {
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail || !process.env.DATABASE_URL) return

  const prisma = getPrismaClient()
  const uncreditedLeads = await prisma.leadCapture.findMany({
    where: {
      email: cleanEmail,
      source: REFERRAL_SOURCE,
      status: {
        not: "CONVERTED",
      },
    },
  })

  for (const lead of uncreditedLeads) {
    const referringWorkspaceId = getReferralMetadataValue(lead.metadata, "referringWorkspaceId")

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.leadCapture.updateMany({
        data: { status: "CONVERTED" },
        where: {
          id: lead.id,
          status: { not: "CONVERTED" },
        },
      })

      if (claimed.count !== 1 || !referringWorkspaceId) return

      await tx.subscription.updateMany({
        data: {
          storagePurchasedBytes: {
            increment: BigInt(REWARD_STORAGE_BYTES_PER_CONVERSION),
          },
        },
        where: {
          workspaceId: referringWorkspaceId,
        },
      })
    }, { isolationLevel: "Serializable" })
  }
}
