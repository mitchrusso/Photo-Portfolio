import { randomUUID } from "node:crypto"
import { getPrismaClient } from "@/lib/db"
import { getPlanPriceId, type SubscriberPlan } from "@/lib/plans"

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
  acceptableUseAcceptedAt: Date
  acceptableUseVersion: string
  autoresponderStatus?: string
  initialStatus?: "INCOMPLETE" | "TRIALING"
  plan: SubscriberPlan
  prospect: TrialProspect
  subscriberLicenseAcceptedAt: Date
  subscriberLicenseSignerName: string
  subscriberLicenseVersion: string
  trialEndsAt: Date
  trialStartedAt: Date
  termsAcceptedAt: Date
  termsVersion: string
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

export type ExistingSubscriberRegistration = {
  status: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export class CouponUnavailableError extends Error {
  constructor() {
    super("The coupon is no longer available.")
    this.name = "CouponUnavailableError"
  }
}

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

export async function findExistingSubscriberRegistration(email: string): Promise<ExistingSubscriberRegistration | null> {
  if (!process.env.DATABASE_URL) return null

  const user = await getPrismaClient().user.findUnique({
    select: {
      memberships: {
        select: {
          role: true,
          workspace: {
            select: {
              subscription: {
                select: {
                  status: true,
                  stripeCustomerId: true,
                  stripeSubscriptionId: true,
                },
              },
            },
          },
        },
      },
    },
    where: { email: email.trim().toLowerCase() },
  })
  const ownerMembership = user?.memberships.find((membership) => membership.role === "OWNER")
  return ownerMembership?.workspace.subscription ?? null
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
  acceptableUseAcceptedAt,
  acceptableUseVersion,
  autoresponderStatus = "PENDING",
  initialStatus = "TRIALING",
  plan,
  prospect,
  subscriberLicenseAcceptedAt,
  subscriberLicenseSignerName,
  subscriberLicenseVersion,
  trialEndsAt,
  trialStartedAt,
  termsAcceptedAt,
  termsVersion,
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
  const stripePriceId = clean(getPlanPriceId(plan, prospect.billingCycle))
  const prisma = getPrismaClient()
  const billingCycle = toBillingCycle(prospect.billingCycle)

  return prisma.$transaction(async (tx) => {
    if (prospect.couponCodeId) {
      const now = new Date()
      const redeemed = await tx.$executeRaw`
        UPDATE "CouponCode"
        SET "redemptionCount" = "redemptionCount" + 1,
            "updatedAt" = ${now}
        WHERE "id" = ${prospect.couponCodeId}
          AND "isActive" = true
          AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
          AND ("maxRedemptions" IS NULL OR "redemptionCount" < "maxRedemptions")
      `

      if (redeemed !== 1) throw new CouponUnavailableError()
    }

    const dbPlan = await tx.plan.upsert({
      create: {
        annualPriceCents: plan.annualPriceCents,
        isActive: true,
        monthlyPriceCents: plan.monthlyPriceCents,
        name: plan.name,
        slug: plan.slug,
        storageLimitBytes: BigInt(plan.storageLimitBytes),
        stripePriceId,
        trialDays: plan.trialDays,
      },
      update: {
        annualPriceCents: plan.annualPriceCents,
        isActive: true,
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
        billingCycle,
        planId: dbPlan.id,
        status: initialStatus,
        trialEndsAt,
        trialStartedAt,
        workspaceId: workspace.id,
        stripePriceId,
      },
      update: {
        billingCycle,
        planId: dbPlan.id,
        stripePriceId,
        status: initialStatus,
        trialEndsAt,
        trialStartedAt,
      },
      where: { workspaceId: workspace.id },
    })

    const trialSignup = await tx.trialSignup.create({
      data: {
        acceptableUseAcceptedAt,
        acceptableUseVersion,
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
        subscriberLicenseAcceptedAt,
        subscriberLicenseSignerName,
        subscriberLicenseVersion,
        couponCodeId: prospect.couponCodeId,
        trialEndsAt,
        trialStartedAt,
        termsAcceptedAt,
        termsVersion,
        userId: user.id,
        website: clean(prospect.website),
        workspaceId: workspace.id,
      },
    })

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
