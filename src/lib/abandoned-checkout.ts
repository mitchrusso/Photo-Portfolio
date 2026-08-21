import { getPrismaClient } from "@/lib/db"

export const ABANDONED_CHECKOUT_SOURCE = "photoview_abandoned_checkout"

export async function markAbandonedCheckoutStatus(
  email: string,
  status: "CAPTURED" | "CHECKOUT_STARTED" | "CONVERTED",
) {
  const convertedAt = status === "CONVERTED" ? new Date() : null
  return getPrismaClient().leadCapture.updateMany({
    data: { convertedAt, status },
    where: {
      email: email.trim().toLowerCase(),
      source: ABANDONED_CHECKOUT_SOURCE,
      status: { in: ["CAPTURED", "CHECKOUT_STARTED"] },
    },
  })
}
