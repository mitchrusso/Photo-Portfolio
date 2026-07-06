import { randomUUID } from "node:crypto"
import { getPrismaClient } from "@/lib/db"
import type { SubscriberPlan } from "@/lib/plans"

export type TrialProspect = {
  billingCycle: "monthly" | "annual"
  couponCode?: string
  couponCodeId?: string
  email: string
  firstName: string
  lastName: string
  marketingConsent: boolean
  phone?: string
  planSlug: string
  storageRequested?: string
  studioName?: string
  website?: string
}

type PersistTrialRegistrationInput = {
  autoresponderStatus?: string
  plan: SubscriberPlan
  prospect: TrialProspect
  trialEndsAt: Date
  trialStartedAt: Date
}

export type PersistedTrialRegistration = {
  persisted: true
  planId: string
  subscriptionId: string
  trialSignupId: string
  userId: string
  workspaceId: string
}

export type SkippedTrialRegistration = {
  persisted: false
  reason: string
}

export type TrialRegistrationRecord = PersistedTrialRegistration | SkippedTrialRegistration

function clean(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function toBillingCycle(value: "monthly" | "annual") {
  return value === "monthly" ? "MONTHLY" : "ANNUAL"
}

async function createUniqueWorkspaceSlug(baseName: string) {
  const prisma = getPrismaClient()
  const baseSlug = slugify(baseName) || `workspace-${randomUUID().slice(0, 8)}`

  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`
    const existing = await prisma.workspace.findUnique({
      select: { id: true },
      where: { slug: candidate },
    })

    if (!existing) return candidate
  }

  return `${baseSlug}-${randomUUID().slice(0, 8)}`
}

export async function persistTrialRegistration({
  autoresponderStatus = "PENDING",
  plan,
  prospect,
  trialEndsAt,
  trialStartedAt,
}: PersistTrialRegistrationInput): Promise<TrialRegistrationRecord> {
  if (!process.env.DATABASE_URL) {
    return {
      persisted: false,
      reason: "DATABASE_URL is not configured, so subscriber records were not written.",
    }
  }

  const email = prospect.email.trim().toLowerCase()
  const firstName = prospect.firstName.trim()
  const lastName = prospect.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()
  const studioName = clean(prospect.studioName)
  const workspaceName = studioName ?? `${fullName} Photography`
  const workspaceSlug = await createUniqueWorkspaceSlug(workspaceName)
  const stripePriceId = clean(process.env[prospect.billingCycle === "monthly" ? plan.stripeMonthlyPriceEnv : plan.stripeAnnualPriceEnv])
  const prisma = getPrismaClient()
  const billingCycle = toBillingCycle(prospect.billingCycle)

  return prisma.$transaction(async (tx) => {
    const dbPlan = await tx.plan.upsert({
      create: {
        annualPriceCents: plan.annualPriceCents,
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        isActive: true,
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        monthlyPriceCents: plan.monthlyPriceCents,
        name: plan.name,
        slug: plan.slug,
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        stripePriceId,
        trialDays: plan.trialDays,
      },
      update: {
        annualPriceCents: plan.annualPriceCents,
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        isActive: true,
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        name: plan.name,
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        stripePriceId,
        trialDays: plan.trialDays,
      },
      where: { slug: plan.slug },
    })

    const user = await tx.user.upsert({
      create: {
        email,
        firstName,
        lastName,
        name: fullName,
        phone: clean(prospect.phone),
      },
      update: {
        firstName,
        lastName,
        name: fullName,
        phone: clean(prospect.phone),
      },
      where: { email },
    })

    const existingOwnerMembership = await tx.workspaceMember.findFirst({
      include: {
        workspace: {
          select: { id: true },
        },
      },
      where: {
        role: "OWNER",
        userId: user.id,
      },
    })

    const workspace = existingOwnerMembership
      ? await tx.workspace.update({
          data: {
            publicDomain: clean(prospect.website),
            storageLimitBytes: BigInt(plan.storageLimitBytes),
            supportEmail: email,
          },
          where: { id: existingOwnerMembership.workspace.id },
        })
      : await tx.workspace.create({
          data: {
            members: {
              create: {
                role: "OWNER",
                userId: user.id,
              },
            },
            name: workspaceName,
            ownerName: fullName,
            publicBrandName: studioName ?? workspaceName,
            publicDomain: clean(prospect.website),
            slug: workspaceSlug,
            storageLimitBytes: BigInt(plan.storageLimitBytes),
            supportEmail: email,
          },
        })

    const subscription = await tx.subscription.upsert({
      create: {
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        billingCycle,
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        planId: dbPlan.id,
        status: "TRIALING",
        trialEndsAt,
        trialStartedAt,
        workspaceId: workspace.id,
        stripePriceId,
      },
      update: {
        bandwidthLimitBytes: BigInt(plan.bandwidthLimitBytes),
        billingCycle,
        maxUploadBytes: BigInt(plan.maxUploadBytes),
        planId: dbPlan.id,
        stripePriceId,
        trialEndsAt,
        trialStartedAt,
      },
      where: { workspaceId: workspace.id },
    })

    const trialSignup = await tx.trialSignup.create({
      data: {
        autoresponderStatus,
        email,
        firstName,
        lastName,
        billingCycle,
        marketingConsent: prospect.marketingConsent,
        phone: clean(prospect.phone),
        planSlug: plan.slug,
        storageRequested: clean(prospect.storageRequested),
        studioName,
        couponCodeId: prospect.couponCodeId,
        trialEndsAt,
        trialStartedAt,
        userId: user.id,
        website: clean(prospect.website),
        workspaceId: workspace.id,
      },
    })

    if (prospect.couponCodeId) {
      await tx.couponCode.update({
        data: {
          redemptionCount: {
            increment: 1,
          },
        },
        where: {
          id: prospect.couponCodeId,
        },
      })
    }

    return {
      persisted: true,
      planId: dbPlan.id,
      subscriptionId: subscription.id,
      trialSignupId: trialSignup.id,
      userId: user.id,
      workspaceId: workspace.id,
    }
  })
}

export async function updateTrialRegistrationExternalStatus(
  record: TrialRegistrationRecord,
  {
    autoresponderStatus,
    checkoutSessionId,
  }: {
    autoresponderStatus?: string
    checkoutSessionId?: string | null
  },
) {
  if (!record.persisted) return
  const prisma = getPrismaClient()

  await prisma.$transaction(async (tx) => {
    await tx.trialSignup.update({
      data: {
        autoresponderStatus,
        stripeCheckoutSessionId: checkoutSessionId,
      },
      where: { id: record.trialSignupId },
    })

    if (checkoutSessionId) {
      await tx.subscription.update({
        data: {
          stripeCheckoutSessionId: checkoutSessionId,
        },
        where: { id: record.subscriptionId },
      })
    }
  })
}
