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

type DurationRow = {
  averageDurationMs: number | null
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

export async function getAdminAnalyticsSummary() {
  const prisma = getPrismaClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [visits, pageViews, exits, deviceRows, topPathRows, durationRows] = await Promise.all([
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
  ])

  const pageViewCount = numberFromBigInt(pageViews[0]?.count)
  const visitCount = numberFromBigInt(visits[0]?.count)
  const exitCount = numberFromBigInt(exits[0]?.count)
  const averageDurationMs = Math.round(durationRows[0]?.averageDurationMs ?? 0)

  return {
    averageDurationMs,
    deviceRows: deviceRows.map((row) => ({
      count: numberFromBigInt(row.count),
      deviceType: row.deviceType,
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
