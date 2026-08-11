const RETRYABLE_DATABASE_MESSAGES = [
  "failed to acquire permit",
  "remaining connection slots are reserved",
  "timed out fetching a new connection",
  "too many database connection",
]

export function isRetryableDatabaseConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  return RETRYABLE_DATABASE_MESSAGES.some((candidate) => normalized.includes(candidate))
}

type DatabaseRetryOptions = {
  attempts?: number
  baseDelayMs?: number
  wait?: (milliseconds: number) => Promise<void>
}

export async function withDatabaseConnectionRetry<T>(
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
      if (attempt === attempts || !isRetryableDatabaseConnectionError(error)) throw error
      await wait(baseDelayMs * 2 ** (attempt - 1))
    }
  }

  throw new Error("Database retry attempts were exhausted.")
}
