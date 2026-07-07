import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"

const cancellationSurveySchema = z.object({
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  reason: z.string().trim().min(1).max(120),
  subscriptionId: z.string().trim().optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const parsed = cancellationSurveySchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a reason before submitting." }, { status: 400 })
  }

  const session = await auth()
  const prisma = getPrismaClient()
  const requestedSubscriptionId = parsed.data.subscriptionId || undefined
  const sessionWorkspaceId = session?.user?.workspaceId

  const subscription = requestedSubscriptionId || sessionWorkspaceId
    ? await prisma.subscription.findFirst({
        include: {
          workspace: {
            include: {
              members: {
                include: {
                  user: true,
                },
                where: {
                  role: "OWNER",
                },
              },
            },
          },
        },
        where: {
          ...(requestedSubscriptionId ? { id: requestedSubscriptionId } : {}),
          ...(sessionWorkspaceId ? { workspaceId: sessionWorkspaceId } : {}),
        },
      })
    : null

  const ownerEmail = subscription?.workspace.members[0]?.user.email
  const email = parsed.data.email || session?.user?.email || ownerEmail

  if (!email) {
    return NextResponse.json({ error: "Please enter an email address so we can attach the feedback." }, { status: 400 })
  }

  await prisma.cancellationSurvey.create({
    data: {
      email,
      notes: parsed.data.notes || null,
      reason: parsed.data.reason,
      source: session?.user ? "ACCOUNT_CANCEL_SURVEY" : "EMAIL_CANCEL_SURVEY",
      subscriptionId: subscription?.id ?? requestedSubscriptionId ?? null,
      workspaceId: subscription?.workspaceId ?? sessionWorkspaceId ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}
