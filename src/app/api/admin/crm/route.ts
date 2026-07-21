import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession, hasSameOrigin } from "@/lib/partnership-crm/access"

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("partner.update"), id: z.string().min(1), nextStep: z.string().trim().min(1).max(500), stage: z.enum(["Research", "Contacted", "Conversation", "Proposal"]) }),
  z.object({ action: z.literal("task.create"), partnerId: z.string().nullable(), title: z.string().trim().min(1).max(500), dueAt: z.string().nullable(), priority: z.enum(["HIGH", "NORMAL", "LOW"]) }),
  z.object({ action: z.literal("task.toggle"), id: z.string().min(1), completed: z.boolean() }),
  z.object({ action: z.literal("task.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("meeting.create"), partnerId: z.string().nullable(), title: z.string().trim().min(1).max(500), startsAt: z.string().datetime(), notes: z.string().max(10_000) }),
  z.object({ action: z.literal("meeting.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("note.create"), partnerId: z.string().min(1), body: z.string().trim().min(1).max(20_000) }),
  z.object({ action: z.literal("note.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("outreach.create"), partnerId: z.string().min(1), subject: z.string().trim().min(1).max(500), body: z.string().trim().min(1).max(30_000) }),
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
    return NextResponse.json(await prisma.crmPartner.update({ data: { nextStep: input.nextStep, stage: input.stage }, where: { id: input.id } }))
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
  return NextResponse.json(await prisma.crmOutreach.create({ data: { body: input.body, createdById: session.user.id, partnerId: input.partnerId, subject: input.subject } }))
}
