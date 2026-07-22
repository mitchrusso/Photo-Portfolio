import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession, hasSameOrigin } from "@/lib/partnership-crm/access"

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("partner.update"), id: z.string().min(1), nextStep: z.string().trim().min(1).max(500), score: z.number().int().min(0).max(100).optional(), stage: z.enum(["Research", "Contacted", "Conversation", "Proposal"]), valueCents: z.number().int().min(0).optional() }),
  z.object({ action: z.literal("task.create"), partnerId: z.string().nullable(), title: z.string().trim().min(1).max(500), dueAt: z.string().nullable(), priority: z.enum(["HIGH", "NORMAL", "LOW"]) }),
  z.object({ action: z.literal("task.toggle"), id: z.string().min(1), completed: z.boolean() }),
  z.object({ action: z.literal("task.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("meeting.create"), partnerId: z.string().nullable(), title: z.string().trim().min(1).max(500), startsAt: z.string().datetime(), notes: z.string().max(10_000) }),
  z.object({ action: z.literal("meeting.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("note.create"), partnerId: z.string().min(1), body: z.string().trim().min(1).max(20_000) }),
  z.object({ action: z.literal("note.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("outreach.create"), partnerId: z.string().min(1), subject: z.string().trim().min(1).max(500), body: z.string().trim().min(1).max(30_000) }),
  z.object({ action: z.literal("contact.update"), id: z.string().min(1), name: z.string().trim().min(1).max(200), role: z.string().trim().min(1).max(200), email: z.string().trim().toLowerCase().email().max(320), linkedin: z.string().trim().url().max(2_000).nullable() }),
  z.object({ action: z.literal("sequence.update"), id: z.string().min(1), goal: z.string().trim().min(3).max(1_000), tone: z.string().trim().min(2).max(100), stopOnReply: z.boolean() }),
  z.object({ action: z.literal("sequence.step.update"), id: z.string().min(1), subject: z.string().trim().min(1).max(500).refine((value) => !/[\r\n]/.test(value)), body: z.string().trim().min(1).max(30_000), scheduledAt: z.string().datetime() }),
  z.object({ action: z.literal("sequence.approve"), id: z.string().min(1) }),
  z.object({ action: z.literal("sequence.pause"), id: z.string().min(1) }),
  z.object({ action: z.literal("sequence.resume"), id: z.string().min(1) }),
  z.object({ action: z.literal("sequence.cancel"), id: z.string().min(1) }),
])

export async function POST(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Administrator access and current verification are required." }, { status: 403 })
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid CRM request.", details: parsed.error.flatten() }, { status: 400 })
  const prisma = getPrismaClient()
  const input = parsed.data

  if (input.action === "partner.update") {
    return NextResponse.json(await prisma.crmPartner.update({ data: { nextStep: input.nextStep, score: input.score, stage: input.stage, valueCents: input.valueCents }, where: { id: input.id } }))
  }
  if (input.action === "task.create") {
    return NextResponse.json(await prisma.crmTask.create({ data: { createdById: session.user.id, dueAt: input.dueAt ? new Date(input.dueAt) : null, partnerId: input.partnerId, priority: input.priority, title: input.title } }))
  }
  if (input.action === "task.toggle") {
    const task = await prisma.crmTask.findUnique({ where: { id: input.id } })
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 })
    return NextResponse.json(await prisma.crmTask.update({ data: { completedAt: input.completed ? new Date() : null }, where: { id: input.id } }))
  }
  if (input.action === "task.delete") {
    await prisma.crmTask.delete({ where: { id: input.id } }); return NextResponse.json({ deleted: true })
  }
  if (input.action === "meeting.create") {
    return NextResponse.json(await prisma.crmMeeting.create({ data: { createdById: session.user.id, notes: input.notes || null, partnerId: input.partnerId, startsAt: new Date(input.startsAt), title: input.title } }))
  }
  if (input.action === "meeting.delete") {
    await prisma.crmMeeting.delete({ where: { id: input.id } }); return NextResponse.json({ deleted: true })
  }
  if (input.action === "note.create") {
    return NextResponse.json(await prisma.crmNote.create({ data: { body: input.body, createdById: session.user.id, partnerId: input.partnerId } }))
  }
  if (input.action === "note.delete") {
    const note = await prisma.crmNote.findUnique({ where: { id: input.id } })
    if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 })
    await prisma.crmNote.delete({ where: { id: input.id } }); return NextResponse.json({ deleted: true })
  }
  if (input.action === "contact.update") {
    return NextResponse.json(await prisma.crmContact.update({
      data: { email: input.email, linkedin: input.linkedin || null, name: input.name, role: input.role },
      where: { id: input.id },
    }))
  }
  if (input.action === "sequence.update") {
    const sequence = await prisma.crmEmailSequence.findUnique({ where: { id: input.id } })
    if (!sequence || sequence.createdById !== session.user.id) return NextResponse.json({ error: "Sequence not found." }, { status: 404 })
    if (sequence.status !== "DRAFT" && sequence.status !== "PAUSED") return NextResponse.json({ error: "Pause this sequence before changing its settings." }, { status: 409 })
    return NextResponse.json(await prisma.crmEmailSequence.update({ data: { goal: input.goal, stopOnReply: input.stopOnReply, tone: input.tone }, where: { id: input.id } }))
  }
  if (input.action === "sequence.step.update") {
    const step = await prisma.crmEmailStep.findUnique({ include: { sequence: true }, where: { id: input.id } })
    if (!step || step.sequence.createdById !== session.user.id) return NextResponse.json({ error: "Sequence step not found." }, { status: 404 })
    if (step.status === "SENT" || step.status === "SENDING") return NextResponse.json({ error: "A sent or sending email cannot be edited." }, { status: 409 })
    if (step.sequence.status === "ACTIVE") return NextResponse.json({ error: "Pause this sequence before editing a scheduled email." }, { status: 409 })
    return NextResponse.json(await prisma.crmEmailStep.update({ data: { body: input.body, scheduledAt: new Date(input.scheduledAt), subject: input.subject }, where: { id: input.id } }))
  }
  if (input.action === "sequence.approve") {
    const sequence = await prisma.crmEmailSequence.findUnique({ include: { contact: true, partner: true, steps: { orderBy: { position: "asc" } } }, where: { id: input.id } })
    if (!sequence || sequence.createdById !== session.user.id) return NextResponse.json({ error: "Sequence not found." }, { status: 404 })
    if (sequence.status !== "DRAFT") return NextResponse.json({ error: "Only a draft sequence can be approved." }, { status: 409 })
    if (!sequence.contact.email) return NextResponse.json({ error: "Add a verified contact email before approving this sequence." }, { status: 409 })
    if (!sequence.steps.length) return NextResponse.json({ error: "Generate at least one email before approval." }, { status: 409 })
    const invalidStep = sequence.steps.find((step) => !step.subject.trim() || !step.body.trim())
    if (invalidStep) return NextResponse.json({ error: "Every scheduled email needs a subject and message." }, { status: 409 })
    const followUpAt = new Date(Math.max(...sequence.steps.map((step) => step.scheduledAt.getTime())) + 24 * 60 * 60 * 1000)
    const approvedAt = new Date()
    const [approved] = await prisma.$transaction([
      prisma.crmEmailSequence.update({ data: { approvedAt, pausedAt: null, status: "ACTIVE" }, where: { id: sequence.id } }),
      prisma.crmEmailStep.updateMany({ data: { lastError: null, status: "SCHEDULED" }, where: { sequenceId: sequence.id, status: { in: ["DRAFT", "FAILED"] } } }),
      prisma.crmTask.create({ data: { createdById: session.user.id, dueAt: followUpAt, partnerId: sequence.partnerId, priority: "HIGH", title: `Review ${sequence.partner.company} outreach sequence` } }),
      prisma.crmActivity.create({ data: { detail: `${sequence.steps.length} emails approved for automatic delivery to ${sequence.contact.email}.`, occurredAt: approvedAt, partnerId: sequence.partnerId, title: "Email sequence approved", type: "email" } }),
    ])
    return NextResponse.json(approved)
  }
  if (input.action === "sequence.pause" || input.action === "sequence.resume" || input.action === "sequence.cancel") {
    const sequence = await prisma.crmEmailSequence.findUnique({ where: { id: input.id } })
    if (!sequence || sequence.createdById !== session.user.id) return NextResponse.json({ error: "Sequence not found." }, { status: 404 })
    if (input.action === "sequence.pause") {
      if (sequence.status !== "ACTIVE") return NextResponse.json({ error: "Only an active sequence can be paused." }, { status: 409 })
      return NextResponse.json(await prisma.crmEmailSequence.update({ data: { pausedAt: new Date(), status: "PAUSED" }, where: { id: input.id } }))
    }
    if (input.action === "sequence.resume") {
      if (sequence.status !== "PAUSED") return NextResponse.json({ error: "Only a paused sequence can be resumed." }, { status: 409 })
      const retryAt = new Date(Date.now() + 5 * 60 * 1000)
      const [resumed] = await prisma.$transaction([
        prisma.crmEmailSequence.update({ data: { pausedAt: null, status: "ACTIVE" }, where: { id: input.id } }),
        prisma.crmEmailStep.updateMany({ data: { lastError: null, scheduledAt: retryAt, status: "SCHEDULED" }, where: { sequenceId: input.id, status: "FAILED" } }),
      ])
      return NextResponse.json(resumed)
    }
    await prisma.$transaction([
      prisma.crmEmailSequence.update({ data: { completedAt: new Date(), status: "CANCELLED" }, where: { id: input.id } }),
      prisma.crmEmailStep.updateMany({ data: { status: "SKIPPED" }, where: { sequenceId: input.id, status: { in: ["DRAFT", "SCHEDULED", "FAILED"] } } }),
    ])
    return NextResponse.json({ cancelled: true })
  }
  return NextResponse.json(await prisma.crmOutreach.create({ data: { body: input.body, createdById: session.user.id, partnerId: input.partnerId, subject: input.subject } }))
}
