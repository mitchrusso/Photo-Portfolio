import { getPrismaClient } from "@/lib/db"
import { getSubscriberPlan } from "@/lib/plans"

export type AppliedCoupon = {
  code: string
  couponId: string
  freeDays: number
  leadMagnetNote: string | null
  leadMagnetTitle: string | null
  name: string
  planSlug: string
}

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "")
}

export function cleanCouponCode(code: string | null | undefined) {
  return normalizeCouponCode(code ?? "")
}

export async function validateCouponCode(code: string | null | undefined): Promise<AppliedCoupon | null> {
  const normalizedCode = cleanCouponCode(code)
  if (!normalizedCode) return null

  const prisma = getPrismaClient()
  const coupon = await prisma.couponCode.findUnique({
    where: {
      code: normalizedCode,
    },
  })

  if (!coupon || !coupon.isActive) return null
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return null
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) return null

  const plan = getSubscriberPlan(coupon.planSlug)

  return {
    code: coupon.code,
    couponId: coupon.id,
    freeDays: Math.max(1, coupon.freeDays),
    leadMagnetNote: coupon.leadMagnetNote,
    leadMagnetTitle: coupon.leadMagnetTitle,
    name: coupon.name,
    planSlug: plan.slug,
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
