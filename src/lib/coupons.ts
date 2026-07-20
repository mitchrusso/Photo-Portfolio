import { getPrismaClient } from "@/lib/db"
import { getSubscriberPlan } from "@/lib/plans"

export type AppliedCoupon = {
  code: string
  couponId: string | null
  freeDays: number
  kind: "reusable" | "one_time"
  leadMagnetNote: string | null
  leadMagnetTitle: string | null
  name: string
  oneTimeAccessCodeId: string | null
  planSlug: string
  startupSequenceEnabled: boolean
}

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "")
}

export function cleanCouponCode(code: string | null | undefined) {
  return normalizeCouponCode(code ?? "")
}

export async function validateCouponCode(
  code: string | null | undefined,
  email?: string | null,
): Promise<AppliedCoupon | null> {
  const normalizedCode = cleanCouponCode(code)
  if (!normalizedCode) return null

  const prisma = getPrismaClient()
  const [coupon, oneTimeCode] = await Promise.all([
    prisma.couponCode.findUnique({ where: { code: normalizedCode } }),
    prisma.oneTimeAccessCode.findUnique({ where: { code: normalizedCode } }),
  ])

  if (oneTimeCode) {
    const normalizedEmail = email?.trim().toLowerCase()
    if (
      !oneTimeCode.isActive ||
      !oneTimeCode.assignedAt ||
      oneTimeCode.redeemedAt ||
      !oneTimeCode.recipientEmail ||
      !normalizedEmail ||
      oneTimeCode.recipientEmail !== normalizedEmail
    ) return null

    const plan = getSubscriberPlan(oneTimeCode.planSlug)
    return {
      code: oneTimeCode.code,
      couponId: null,
      freeDays: Math.max(1, oneTimeCode.freeDays),
      kind: "one_time",
      leadMagnetNote: null,
      leadMagnetTitle: null,
      name: `One-time invitation for ${oneTimeCode.recipientName ?? oneTimeCode.recipientEmail}`,
      oneTimeAccessCodeId: oneTimeCode.id,
      planSlug: plan.slug,
      startupSequenceEnabled: oneTimeCode.startupSequenceEnabled,
    }
  }

  if (!coupon || !coupon.isActive) return null
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return null
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) return null

  const plan = getSubscriberPlan(coupon.planSlug)

  return {
    code: coupon.code,
    couponId: coupon.id,
    freeDays: Math.max(1, coupon.freeDays),
    kind: "reusable",
    leadMagnetNote: coupon.leadMagnetNote,
    leadMagnetTitle: coupon.leadMagnetTitle,
    name: coupon.name,
    oneTimeAccessCodeId: null,
    planSlug: plan.slug,
    startupSequenceEnabled: true,
  }
}

export async function recordCouponLead({
  coupon,
  email,
  firstName,
  lastName,
}: {
  coupon: AppliedCoupon
  email: string
  firstName: string
  lastName?: string
}) {
  if (!coupon.couponId) return
  const prisma = getPrismaClient()
  await prisma.leadCapture.create({
    data: {
      couponCodeId: coupon.couponId,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      metadata: {
        couponCode: coupon.code,
        planSlug: coupon.planSlug,
      },
      source: "coupon",
    },
  })
}
