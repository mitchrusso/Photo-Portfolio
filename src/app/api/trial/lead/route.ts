import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { ABANDONED_CHECKOUT_SOURCE } from "@/lib/abandoned-checkout"
import { autoresponderAudiences, autoresponderTags, notifyAutoresponder } from "@/lib/autoresponder"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"

const RESUME_LINK_DAYS = 14

const leadSchema = z.object({
  email: z.string().trim().email().max(320),
  firstName: z.string().trim().min(1).max(80),
  marketingConsent: z.boolean().default(false),
  useCase: z.enum(["personal_portfolio", "client_work", "lightroom_publishing"]),
  attribution: z.record(z.string(), z.string().trim().max(500)).default({}),
})

function hashResumeToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function resumeExpiry() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + RESUME_LINK_DAYS)
  return expiresAt
}

export async function POST(request: Request) {
  const rateLimit = await checkRequestRateLimit(`trial-lead:${requestClientKey(request)}`, 12, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ message: "Please wait a few minutes before trying again." }, {
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      status: 429,
    })
  }

  const parsed = leadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid first name and email address." }, { status: 400 })
  }

  const prisma = getPrismaClient()
  const prospect = parsed.data
  const email = prospect.email.toLowerCase()
  const token = randomBytes(32).toString("base64url")
  const resumeTokenHash = hashResumeToken(token)
  const resumeExpiresAt = resumeExpiry()
  const existing = await prisma.leadCapture.findFirst({
    orderBy: { updatedAt: "desc" },
    where: { email, source: ABANDONED_CHECKOUT_SOURCE, status: { in: ["CAPTURED", "CHECKOUT_STARTED"] } },
  })
  const metadata = {
    attribution: prospect.attribution,
    useCase: prospect.useCase,
  }

  const lead = existing
    ? await prisma.leadCapture.update({
        data: {
          firstName: prospect.firstName,
          marketingConsent: prospect.marketingConsent,
          metadata,
          resumeExpiresAt,
          resumeTokenHash,
          status: "CAPTURED",
        },
        where: { id: existing.id },
      })
    : await prisma.leadCapture.create({
        data: {
          email,
          firstName: prospect.firstName,
          marketingConsent: prospect.marketingConsent,
          metadata,
          resumeExpiresAt,
          resumeTokenHash,
          source: ABANDONED_CHECKOUT_SOURCE,
          status: "CAPTURED",
        },
      })

  const resumeUrl = `${getAppUrl(request)}/register?resume=${encodeURIComponent(token)}`
  const autoresponderStatus = prospect.marketingConsent
    ? await notifyAutoresponder({
        addTags: [
          autoresponderTags.abandonedCheckout,
          `photoviewpro:use-case:${prospect.useCase.replaceAll("_", "-")}`,
        ],
        email,
        event: "checkout_contact_captured",
        firstName: prospect.firstName,
        list: autoresponderAudiences.abandonedCheckout,
        metadata: { resumeUrl },
        source: "PhotoView.io registration",
      })
    : "consent_not_granted"

  return NextResponse.json({
    autoresponderStatus,
    leadId: lead.id,
    resumeUrl,
  })
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim()
  if (!token || token.length > 100) {
    return NextResponse.json({ message: "This checkout link is invalid." }, { status: 400 })
  }

  const lead = await getPrismaClient().leadCapture.findFirst({
    where: {
      resumeExpiresAt: { gt: new Date() },
      resumeTokenHash: hashResumeToken(token),
      source: ABANDONED_CHECKOUT_SOURCE,
      status: { in: ["CAPTURED", "CHECKOUT_STARTED"] },
    },
  })

  if (!lead) {
    return NextResponse.json({ message: "This checkout link has expired. Start again to receive a new one." }, { status: 404 })
  }

  const metadata = lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata)
    ? lead.metadata as Record<string, unknown>
    : {}

  return NextResponse.json({
    attribution: metadata.attribution ?? {},
    email: lead.email,
    firstName: lead.firstName,
    leadId: lead.id,
    marketingConsent: lead.marketingConsent,
    useCase: metadata.useCase ?? "personal_portfolio",
  })
}
