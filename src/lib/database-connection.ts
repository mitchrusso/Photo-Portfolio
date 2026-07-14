export function normalizeDatabaseConnectionString(connectionString: string) {
  return connectionString.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/,
    "$1sslmode=verify-full",
  )
}
