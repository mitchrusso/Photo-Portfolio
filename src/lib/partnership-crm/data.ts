import { getPrismaClient } from "@/lib/db"
import { partnershipCrmSeed } from "@/lib/partnership-crm/seed"

export async function seedPartnershipCrm() {
  const prisma = getPrismaClient()
  for (const row of partnershipCrmSeed) {
    await prisma.crmPartner.upsert({
      create: {
        category: row.category,
        company: row.company,
        integration: [...row.integration],
        nextStep: row.nextStep,
        opportunity: row.opportunity,
        painPoints: [...row.painPoints],
        score: row.score,
        slug: row.slug,
        stage: row.stage,
        summary: row.summary,
        valueCents: row.valueCents,
        website: row.website,
        contacts: { create: { isPrimary: true, linkedin: "linkedin" in row ? row.linkedin : null, name: row.contact, role: row.role } },
        activities: { create: row.activities.map((activity) => ({ ...activity })) },
      },
      update: {},
      where: { slug: row.slug },
    })
  }
}

export async function getPartnershipCrmData(userId: string) {
  const prisma = getPrismaClient()
  if ((await prisma.crmPartner.count()) < partnershipCrmSeed.length) await seedPartnershipCrm()
  if ((await prisma.crmTask.count()) === 0) {
    const partnerIds = new Map((await prisma.crmPartner.findMany({ select: { id: true, slug: true } })).map((partner) => [partner.slug, partner.id]))
    await prisma.crmTask.createMany({ data: [
      { createdById: userId, dueAt: new Date("2026-07-22T16:00:00.000Z"), partnerId: partnerIds.get("dxo"), priority: "HIGH", title: "Send integration one-pager" },
      { createdById: userId, dueAt: new Date("2026-07-23T16:00:00.000Z"), partnerId: partnerIds.get("topaz-labs"), priority: "HIGH", title: "Confirm current partnership contact" },
      { createdById: userId, dueAt: new Date("2026-07-24T16:00:00.000Z"), partnerId: partnerIds.get("imagen-ai"), priority: "NORMAL", title: "Prepare edited-to-gallery workflow mockup" },
    ] })
  }
  const [partners, tasks, meetings, outreach] = await Promise.all([
    prisma.crmPartner.findMany({ include: { activities: { orderBy: { createdAt: "desc" } }, contacts: true, notes: { orderBy: { createdAt: "desc" } } }, orderBy: [{ score: "desc" }, { company: "asc" }] }),
    prisma.crmTask.findMany({ include: { partner: { select: { company: true, slug: true } } }, orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }] }),
    prisma.crmMeeting.findMany({ include: { partner: { select: { company: true, slug: true } } }, orderBy: { startsAt: "desc" } }),
    prisma.crmOutreach.findMany({ include: { partner: { select: { company: true, slug: true } } }, orderBy: { createdAt: "desc" } }),
  ])
  return { meetings, outreach, partners, tasks }
}
