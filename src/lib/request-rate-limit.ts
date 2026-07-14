import { createHash } from "node:crypto"
import { getPrismaClient } from "@/lib/db"

type RateLimitEntry = {
  count: number
  resetAt: number
}

export type RequestRateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

const localRateLimitStore = new Map<string, RateLimitEntry>()

export function requestClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown"
}

function checkLocalRateLimit(key: string, limit: number, windowMs: number): RequestRateLimitResult {
  const now = Date.now()
  if (localRateLimitStore.size > 10_000) {
    for (const [storedKey, entry] of localRateLimitStore) {
      if (entry.resetAt <= now) localRateLimitStore.delete(storedKey)
    }
  }
  const current = localRateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    localRateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  current.count += 1
  localRateLimitStore.set(key, current)

  return {
    allowed: current.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

export async function checkRequestRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RequestRateLimitResult> {
  if (!process.env.DATABASE_URL) return checkLocalRateLimit(key, limit, windowMs)

  const now = Date.now()
  const windowStartMs = Math.floor(now / windowMs) * windowMs
  const windowStart = new Date(windowStartMs)
  const expiresAt = new Date(windowStartMs + windowMs)
  const keyHash = createHash("sha256").update(key).digest("hex")

  try {
    const prisma = getPrismaClient()
    const entry = await prisma.requestRateLimit.upsert({
      create: {
        count: 1,
        expiresAt,
        keyHash,
        windowStart,
      },
      update: {
        count: { increment: 1 },
        expiresAt,
      },
      where: {
        keyHash_windowStart: {
          keyHash,
          windowStart,
        },
      },
    })

    // Periodically remove expired windows without adding a cleanup query to
    // every request. The shared database counter remains authoritative across
    // all serverless instances and deployments.
    if (keyHash.startsWith("00")) {
      await prisma.requestRateLimit.deleteMany({
        where: { expiresAt: { lt: new Date(now) } },
      })
    }

    return {
      allowed: entry.count <= limit,
      retryAfterSeconds: entry.count <= limit
        ? 0
        : Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
    }
  } catch (error) {
    console.error("Durable request rate limit failed; using local fallback", error)
    return checkLocalRateLimit(key, limit, windowMs)
  }
}
