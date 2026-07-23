import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getPrismaClient } from "@/lib/db"
import { getAuthorizedCrmSession, hasSameOrigin } from "@/lib/partnership-crm/access"
import { buildGmailRawMessage } from "@/lib/partnership-crm/gmail-message"
import { crmGmailAddress, getGoogleAccess } from "@/lib/partnership-crm/google"

const sendSchema = z.object({
  body: z.string().trim().min(1).max(30_000),
  outreachId: z.string().min(1),
  subject: z.string().trim().min(1).max(500).refine((value) => !/[\r\n]/.test(value), "Subject cannot contain line breaks."),
  to: z.string().trim().toLowerCase().email().max(320),
})

export async function POST(request: NextRequest) {
  const session = await getAuthorizedCrmSession()
  if (!session) return NextResponse.json({ error: "Administrator access and current verification are required." }, { status: 403 })
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })

  const parsed = sendSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Check the recipient, subject, and message before sending.", details: parsed.error.flatten() }, { status: 400 })

  const prisma = getPrismaClient()
  const outreach = await prisma.crmOutreach.findUnique({ select: { id: true, partnerId: true, status: true }, where: { id: parsed.data.outreachId } })
  if (!outreach) return NextResponse.json({ error: "The outreach draft could not be found." }, { status: 404 })
  if (outreach.status === "SENT") return NextResponse.json({ error: "This outreach draft has already been sent." }, { status: 409 })

  const google = await getGoogleAccess(session.user.id)
  if (!google) return NextResponse.json({ error: `Connect or reconnect ${crmGmailAddress()} in the Gmail tab before sending.` }, { status: 409 })

  const claim = await prisma.crmOutreach.updateMany({ data: { status: "SENDING" }, where: { id: outreach.id, status: "DRAFT" } })
  if (claim.count !== 1) return NextResponse.json({ error: "This message is already sending or has been sent." }, { status: 409 })

  const sender = crmGmailAddress()
  let gmailResponse: Response
  try {
    gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      body: JSON.stringify({ raw: buildGmailRawMessage({ ...parsed.data, from: sender }) }),
      cache: "no-store",
      headers: { Authorization: `Bearer ${google.accessToken}`, "Content-Type": "application/json" },
      method: "POST",
    })
  } catch {
    await prisma.crmOutreach.updateMany({ data: { status: "DRAFT" }, where: { id: outreach.id, status: "SENDING" } })
    return NextResponse.json({ error: "Gmail could not be reached. The draft was not marked as sent." }, { status: 502 })
  }
  if (!gmailResponse.ok) {
    await prisma.crmOutreach.updateMany({ data: { status: "DRAFT" }, where: { id: outreach.id, status: "SENDING" } })
    return NextResponse.json({ error: "Google could not send the message. Reconnect Gmail and try again." }, { status: 502 })
  }

  const gmailMessage = await gmailResponse.json() as { id?: string }
  const sentAt = new Date()
  await prisma.$transaction([
    prisma.crmOutreach.update({ data: { body: parsed.data.body, gmailMessageId: gmailMessage.id ?? null, sentAt, status: "SENT", subject: parsed.data.subject }, where: { id: outreach.id } }),
    prisma.crmActivity.create({ data: { detail: `Sent “${parsed.data.subject}” to ${parsed.data.to} from ${sender}.`, occurredAt: sentAt, partnerId: outreach.partnerId, title: "Partnership email sent", type: "email" } }),
  ])

  return NextResponse.json({ id: gmailMessage.id ?? null, sent: true, sentAt: sentAt.toISOString() })
}
