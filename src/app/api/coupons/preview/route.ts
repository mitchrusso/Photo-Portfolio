import { NextResponse } from "next/server"
import { z } from "zod"
import { getCouponCodeFailureMessage, validateCouponCode } from "@/lib/coupons"
import { formatPlanStorage, getSubscriberPlan } from "@/lib/plans"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"

const couponPreviewSchema = z.object({
  code: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const rateLimit = await checkRequestRateLimit(`coupon-preview:${requestClientKey(request)}`, 30, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Too many code checks. Please wait a few minutes and try again." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  const payload = await request.json().catch(() => null)
  const parsed = couponPreviewSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid coupon code and email address." }, { status: 400 })
  }

  const coupon = await validateCouponCode(parsed.data.code, parsed.data.email)
  if (!coupon) {
    return NextResponse.json(
      { message: await getCouponCodeFailureMessage(parsed.data.code, parsed.data.email) },
      { status: 400 },
    )
  }

  const plan = getSubscriberPlan(coupon.planSlug)
  return NextResponse.json({
    freeDays: coupon.freeDays,
    planName: plan.name,
    planSlug: plan.slug,
    storage: formatPlanStorage(plan.storageLimitBytes),
  })
}
