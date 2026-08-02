export type EmailQuotaLevel = "critical" | "healthy" | "warning"

const DEFAULT_DAILY_LIMIT = 100
const DEFAULT_MONTHLY_LIMIT = 3_000

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function getEmailQuotaLimits() {
  return {
    daily: positiveInteger(process.env.RESEND_DAILY_EMAIL_LIMIT, DEFAULT_DAILY_LIMIT),
    monthly: positiveInteger(process.env.RESEND_MONTHLY_EMAIL_LIMIT, DEFAULT_MONTHLY_LIMIT),
  }
}

export function getEmailQuotaLevel(sent: number, limit: number): EmailQuotaLevel {
  if (limit <= 0 || sent / limit >= 0.9) return "critical"
  if (sent / limit >= 0.7) return "warning"
  return "healthy"
}

export function getEmailQuotaWindowStarts(now: Date) {
  return {
    day: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
    month: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  }
}

export function isRetryableEmailStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

export function emailRetryDelayMs(attempt: number, retryAfterHeader?: string | null) {
  const retryAfterSeconds = Number(retryAfterHeader)
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(Math.round(retryAfterSeconds * 1_000), 2_000)
  }
  return Math.min(250 * (2 ** Math.max(0, attempt - 1)), 2_000)
}
