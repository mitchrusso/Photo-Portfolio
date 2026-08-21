import { getPrismaClient } from "@/lib/db"

type CountRow = {
  count: bigint
}

type DeviceRow = {
  count: bigint
  deviceType: string
}

type PathRow = {
  count: bigint
  path: string
}

type EventTypeRow = {
  count: bigint
  eventType: string
}

type DurationRow = {
  averageDurationMs: number | null
}

type CampaignRow = {
  count: bigint
  utmContent: string
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

export async function getAdminAnalyticsSummary() {
  const prisma = getPrismaClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [visits, pageViews, exits, deviceRows, topPathRows, durationRows, conversionRows, activationRows, campaignRows] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT "sessionId")::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since} AND "eventType" = 'PAGE_VIEW'
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since} AND "eventType" = 'PAGE_VIEW'
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since} AND "eventType" = 'PAGE_EXIT'
    `,
    prisma.$queryRaw<DeviceRow[]>`
      SELECT "deviceType", COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since} AND "eventType" = 'PAGE_VIEW'
      GROUP BY "deviceType"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<PathRow[]>`
      SELECT path, COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since} AND "eventType" = 'PAGE_VIEW'
      GROUP BY path
      ORDER BY count DESC
      LIMIT 8
    `,
    prisma.$queryRaw<DurationRow[]>`
      SELECT AVG("durationMs")::float AS "averageDurationMs"
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since} AND "eventType" = 'PAGE_EXIT' AND "durationMs" IS NOT NULL
    `,
    prisma.$queryRaw<EventTypeRow[]>`
      SELECT "eventType", COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since}
        AND "eventType" IN ('SIGNUP_CLICK', 'PRICING_CLICK', 'CHECKOUT_START', 'SHARE_CLICK', 'DOWNLOAD_CLICK', 'COUPON_APPLY', 'LEAD_CAPTURE')
      GROUP BY "eventType"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<EventTypeRow[]>`
      SELECT "eventType", COUNT(DISTINCT COALESCE(metadata->>'workspaceId', id))::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since}
        AND "eventType" IN ('REGISTRATION_CAPTURED', 'TRIAL_STARTED', 'PHOTO_IMPORTED', 'PORTFOLIO_PUBLISHED', 'SITE_PUBLISHED', 'DESTINATION_SHARED', 'PAID_CONVERSION')
      GROUP BY "eventType"
      ORDER BY count DESC
    `,
    prisma.$queryRaw<CampaignRow[]>`
      SELECT COALESCE(NULLIF(metadata->>'utmContent', ''), 'unattributed') AS "utmContent",
        COUNT(DISTINCT COALESCE(metadata->>'workspaceId', id))::bigint AS count
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${since}
        AND "eventType" IN ('REGISTRATION_CAPTURED', 'TRIAL_STARTED')
      GROUP BY "utmContent"
      ORDER BY count DESC
      LIMIT 12
    `,
  ])

  const pageViewCount = numberFromBigInt(pageViews[0]?.count)
  const visitCount = numberFromBigInt(visits[0]?.count)
  const exitCount = numberFromBigInt(exits[0]?.count)
  const averageDurationMs = Math.round(durationRows[0]?.averageDurationMs ?? 0)

  return {
    activationRows: activationRows.map((row) => ({
      count: numberFromBigInt(row.count),
      eventType: row.eventType,
    })),
    averageDurationMs,
    campaignRows: campaignRows.map((row) => ({
      count: numberFromBigInt(row.count),
      utmContent: row.utmContent,
    })),
    deviceRows: deviceRows.map((row) => ({
      count: numberFromBigInt(row.count),
      deviceType: row.deviceType,
    })),
    conversionRows: conversionRows.map((row) => ({
      count: numberFromBigInt(row.count),
      eventType: row.eventType,
    })),
    exitCount,
    pageViewCount,
    topPaths: topPathRows.map((row) => ({
      count: numberFromBigInt(row.count),
      path: row.path,
    })),
    visitCount,
  }
}
