export function normalizeDatabaseConnectionString(connectionString: string) {
  return connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/,
    "$1sslmode=verify-full",
  )
}

const DEFAULT_DATABASE_POOL_MAX = 2
const MAX_DATABASE_POOL_MAX = 10

export function databasePoolMax(configuredValue = process.env.DATABASE_POOL_MAX) {
  const parsed = Number(configuredValue)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DATABASE_POOL_MAX) {
    return DEFAULT_DATABASE_POOL_MAX
  }
  return parsed
}

export function buildDatabasePoolConfig(
  connectionString: string,
  configuredPoolMax = process.env.DATABASE_POOL_MAX,
) {
  return {
    allowExitOnIdle: true,
    connectionString: normalizeDatabaseConnectionString(connectionString),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    max: databasePoolMax(configuredPoolMax),
  }
}
