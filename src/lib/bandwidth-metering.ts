import { getPrismaClient } from "@/lib/db"
import { checkSubscriberUsageThresholds } from "@/lib/usage-alerts"

type BandwidthAsset = {
  bytes: number
  galleryId?: string | null
  photoId?: string | null
  pathname?: string | null
  workspaceId: string
}

type BandwidthGateResult =
  | {
      allowed: true
      limitBytes: number
      remainingBytes: number
      usedBytes: number
    }
  | {
      allowed: false
      limitBytes: number
      usedBytes: number
    }

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

function getNextBandwidthPeriod(now: Date) {
  const periodEndsAt = new Date(now)
  periodEndsAt.setMonth(periodEndsAt.getMonth() + 1)
  return periodEndsAt
}

export async function recordBandwidthUsage(asset: BandwidthAsset): Promise<BandwidthGateResult> {
  const prisma = getPrismaClient()
  const now = new Date()
  const bytes = Math.max(0, Math.round(asset.bytes))

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      select: {
        bandwidthAlertLevel: true,
        bandwidthLimitBytes: true,
        bandwidthPeriodEndsAt: true,
        bandwidthUsedBytes: true,
        id: true,
        status: true,
      },
      where: {
        workspaceId: asset.workspaceId,
      },
    })

    if (!subscription || !["ACTIVE", "TRIALING", "PAST_DUE"].includes(subscription.status)) {
      return {
        allowed: true,
        limitBytes: 0,
        remainingBytes: Number.MAX_SAFE_INTEGER,
        usedBytes: 0,
      } satisfies BandwidthGateResult
    }

    const periodExpired = !subscription.bandwidthPeriodEndsAt || subscription.bandwidthPeriodEndsAt <= now
    const usedBytes = periodExpired ? 0 : numberFromBigInt(subscription.bandwidthUsedBytes)
    const limitBytes = numberFromBigInt(subscription.bandwidthLimitBytes)

    if (limitBytes > 0 && usedBytes + bytes > limitBytes) {
      const remainingBeforeLimit = Math.max(0, limitBytes - usedBytes)

      await tx.subscription.update({
        data: {
          bandwidthPeriodEndsAt: periodExpired ? getNextBandwidthPeriod(now) : undefined,
          bandwidthPeriodStartedAt: periodExpired ? now : undefined,
          bandwidthUsedBytes: BigInt(limitBytes),
        },
        where: {
          id: subscription.id,
        },
      })

      if (remainingBeforeLimit > 0) {
        await tx.storageUsageEvent.create({
          data: {
            bytesDelta: BigInt(remainingBeforeLimit),
            galleryId: asset.galleryId ?? null,
            pathname: asset.pathname ?? null,
            photoId: asset.photoId ?? null,
            type: "ADJUSTMENT",
            workspaceId: asset.workspaceId,
          },
        })
      }

      return {
        allowed: false,
        limitBytes,
        usedBytes: limitBytes,
      } satisfies BandwidthGateResult
    }

    await tx.subscription.update({
      data: {
        bandwidthPeriodEndsAt: periodExpired ? getNextBandwidthPeriod(now) : undefined,
        bandwidthPeriodStartedAt: periodExpired ? now : undefined,
        bandwidthUsedBytes: BigInt(usedBytes + bytes),
      },
      where: {
        id: subscription.id,
      },
    })

    await tx.storageUsageEvent.create({
      data: {
        bytesDelta: BigInt(bytes),
        galleryId: asset.galleryId ?? null,
        pathname: asset.pathname ?? null,
        photoId: asset.photoId ?? null,
        type: "ADJUSTMENT",
        workspaceId: asset.workspaceId,
      },
    })

    return {
      allowed: true,
      limitBytes,
      remainingBytes: limitBytes > 0 ? Math.max(0, limitBytes - usedBytes - bytes) : Number.MAX_SAFE_INTEGER,
      usedBytes: usedBytes + bytes,
    } satisfies BandwidthGateResult
  })

  const shouldCheckThresholds =
    !result.allowed ||
    (result.limitBytes > 0 && result.usedBytes / result.limitBytes >= 0.75)

  if (shouldCheckThresholds) {
    await checkSubscriberUsageThresholds({ workspaceId: asset.workspaceId }).catch(() => null)
  }

  return result
}
