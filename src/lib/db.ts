import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"
import { normalizeDatabaseConnectionString } from "@/lib/database-connection"

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as GlobalWithPrisma

export function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is required before database records can be created.")
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: normalizeDatabaseConnectionString(connectionString),
    }),
  })

  globalForPrisma.prisma = prisma

  return prisma
}
