import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession, hasSameOrigin } from "@/lib/partnership-crm/access"
import { fallbackSequence, parseGeneratedSequence, scheduleSequence } from "@/lib/partnership-crm/email-sequences"

const requestSchema = z.object({
  contactId: z.string().min(1),
  count: z.number().int().min(1).max(5).default(3),
  goal: z.string().trim().min(3).max(1_000),
  partnerId: z.string().min(1),
  spacingBusinessDays: z.number().int().min(1).max(20).default(3),
  startAt: z.string().datetime(),
  timezone: z.string().trim().min(1).max(100).default("America/New_York"),
  tone: z.string().trim().min(2).max(100).default("Professional and consultative"),
})

export async function POST(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Administrator access and current verification are required." }, { status: 403 })
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Check the sequence goal, contact, and schedule." }, { status: 400 })

  const prisma = getPrismaClient()
  const [partner, contact] = await Promise.all([
    prisma.crmPartner.findUnique({ where: { id: parsed.data.partnerId } }),
    prisma.crmContact.findUnique({ where: { id: parsed.data.contactId } }),
  ])
  if (!partner || !contact || contact.partnerId !== partner.id) return NextResponse.json({ error: "The selected company or contact could not be found." }, { status: 404 })
  if (!contact.email) return NextResponse.json({ error: "Add a verified contact email before generating outreach." }, { status: 409 })
  const runningSequence = await prisma.crmEmailSequence.findFirst({ where: { partnerId: partner.id, status: { in: ["ACTIVE", "PAUSED"] } } })
  if (runningSequence) return NextResponse.json({ error: "Edit, resume, or cancel the existing sequence instead of creating a competing sequence." }, { status: 409 })

  const fallback = fallbackSequence({ company: partner.company, contactName: contact.name, goal: parsed.data.goal, opportunity: partner.opportunity })
  let messages = fallback
  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await client.responses.create({
        input: [{
          role: "user",
          content: [{
            type: "input_text",
            text: [
              "Write a concise B2B partnership email sequence for PhotoView.io.",
              `Company: ${partner.company}`,
              `Contact: ${contact.name}, ${contact.role}`,
              `Goal: ${parsed.data.goal}`,
              `Tone: ${parsed.data.tone}`,
              `Opportunity: ${partner.opportunity}`,
              `Pain points: ${(Array.isArray(partner.painPoints) ? partner.painPoints : []).join("; ")}`,
              `Integration concept: ${(Array.isArray(partner.integration) ? partner.integration : []).join("; ")}`,
              `Return exactly ${parsed.data.count} messages as JSON only: [{"subject":"...","body":"..."}].`,
              "Each message must be specific, useful, under 180 words, and signed Best, Mitch Russo.",
              "Do not invent customer results, commitments, personal history, or a recipient email.",
              "The first message introduces the fit, the middle message adds value, and the final message is a courteous close-the-loop note.",
            ].join("\n"),
          }],
        }],
        max_output_tokens: 2_400,
        model: process.env.OPENAI_CRM_MODEL ?? "gpt-4.1-mini",
      })
      messages = parseGeneratedSequence(response.output_text || "", fallback)
    } catch (error) {
      console.error("CRM sequence generation failed; using the reviewed fallback sequence.", error)
    }
  }

  const selectedMessages = messages.slice(0, parsed.data.count)
  const scheduledAt = scheduleSequence(new Date(parsed.data.startAt), selectedMessages.length, parsed.data.spacingBusinessDays)
  const sequence = await prisma.$transaction(async (tx) => {
    await tx.crmEmailSequence.deleteMany({ where: { partnerId: partner.id, status: "DRAFT" } })
    return tx.crmEmailSequence.create({
      data: {
        contactId: contact.id,
        createdById: session.user.id,
        goal: parsed.data.goal,
        partnerId: partner.id,
        timezone: parsed.data.timezone,
        tone: parsed.data.tone,
        steps: { create: selectedMessages.map((message, index) => ({ ...message, position: index + 1, scheduledAt: scheduledAt[index] })) },
      },
      include: { contact: true, steps: { orderBy: { position: "asc" } } },
    })
  })
  return NextResponse.json({ sequence })
}
