const RETRYABLE_DATABASE_MESSAGES = [
  "deadlock",
  "failed to acquire permit",
  "remaining connection slots are reserved",
  "timed out fetching a new connection",
  "too many database connection",
  "transaction failed due to a write conflict",
  "write conflict",
]

export function isRetryableDatabaseError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : ""
  if (code === "P2034") return true
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  return RETRYABLE_DATABASE_MESSAGES.some((candidate) => normalized.includes(candidate))
}

export function isRetryableDatabaseConnectionError(error: unknown) {
  return isRetryableDatabaseError(error)
}

type DatabaseRetryOptions = {
  attempts?: number
  baseDelayMs?: number
  wait?: (milliseconds: number) => Promise<void>
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: DatabaseRetryOptions = {},
) {
  const attempts = Math.max(1, options.attempts ?? 3)
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250)
  const wait = options.wait ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)))

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === attempts || !isRetryableDatabaseError(error)) throw error
      await wait(baseDelayMs * 2 ** (attempt - 1))
    }
  }

  throw new Error("Database retry attempts were exhausted.")
}

export async function withDatabaseConnectionRetry<T>(
  operation: () => Promise<T>,
  options: DatabaseRetryOptions = {},
) {
  return withDatabaseRetry(operation, options)
}
