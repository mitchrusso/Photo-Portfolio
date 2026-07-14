export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
) {
  if (items.length === 0) return []

  const normalizedLimit = Number.isFinite(limit) ? Math.floor(limit) : 1
  const workerLimit = Math.max(1, Math.min(normalizedLimit, items.length))
  const results = new Array<R>(items.length)
  let nextIndex = 0

  const workers = Array.from({ length: workerLimit }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index], index)
    }
  })

  await Promise.all(workers)
  return results
}
