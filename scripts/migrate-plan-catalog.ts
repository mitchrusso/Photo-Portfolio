import { getPrismaClient } from "../src/lib/db"
import { subscriberPlans } from "../src/lib/plans"

const prisma = getPrismaClient()

async function main() {
  try {
  await prisma.$transaction(async (tx) => {
    for (const plan of subscriberPlans) {
      const existingPlan = await tx.plan.findUnique({ where: { slug: plan.slug } })
      const subscriptions = existingPlan
        ? await tx.subscription.findMany({
            select: { workspace: { select: { id: true, storageLimitBytes: true } } },
            where: { planId: existingPlan.id },
          })
        : []

      const persistedPlan = await tx.plan.upsert({
        create: {
          annualPriceCents: plan.annualPriceCents,
          monthlyPriceCents: plan.monthlyPriceCents,
          name: plan.name,
          slug: plan.slug,
          storageLimitBytes: BigInt(plan.storageLimitBytes),
          trialDays: plan.trialDays,
        },
        update: {
          annualPriceCents: plan.annualPriceCents,
          monthlyPriceCents: plan.monthlyPriceCents,
          name: plan.name,
          storageLimitBytes: BigInt(plan.storageLimitBytes),
          trialDays: plan.trialDays,
        },
        where: { slug: plan.slug },
      })

      if (!existingPlan) continue
      for (const subscription of subscriptions) {
        const earnedBonusBytes = subscription.workspace.storageLimitBytes > existingPlan.storageLimitBytes
          ? subscription.workspace.storageLimitBytes - existingPlan.storageLimitBytes
          : BigInt(0)
        await tx.workspace.update({
          data: { storageLimitBytes: persistedPlan.storageLimitBytes + earnedBonusBytes },
          where: { id: subscription.workspace.id },
        })
      }
    }
  })

  console.log("Plan catalog and existing workspace storage allowances were updated.")
  } finally {
    await prisma.$disconnect()
  }
}

void main()
