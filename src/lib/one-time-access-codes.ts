import { getPrismaClient } from "@/lib/db"
import { createOneTimeAccessCodeValue } from "@/lib/one-time-access-code-value"

export async function generateOneTimeAccessCodes(quantity: number) {
  const prisma = getPrismaClient()
  const count = Math.max(1, Math.min(100, Math.floor(quantity)))
  const created: string[] = []

  while (created.length < count) {
    const code = createOneTimeAccessCodeValue()
    const reusableCollision = await prisma.couponCode.findUnique({ select: { id: true }, where: { code } })
    if (reusableCollision) continue
    try {
      await prisma.oneTimeAccessCode.create({ data: { code } })
      created.push(code)
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") continue
      throw error
    }
  }

  return created
}
