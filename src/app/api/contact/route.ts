import { NextResponse } from "next/server"
import { z } from "zod"

import { getPrismaClient } from "@/lib/db"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { normalizePublicSiteSubdomain } from "@/lib/site-domain"
import { WEBSITE_PUBLISHED_SLUG } from "@/lib/website-publication"

export const dynamic = "force-dynamic"

const contactRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(10).max(4_000),
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().max(160).optional().default(""),
  website: z.string().max(0).optional().default(""),
  workspaceSlug: z.string().trim().max(63).optional(),
})

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

async function resolvePublishedContact(workspaceSlug: string) {
  const normalizedSlug = normalizePublicSiteSubdomain(workspaceSlug)
  if (!normalizedSlug) return null

  const published = await getPrismaClient().contentPost.findFirst({
    select: {
      body: true,
      workspace: {
        select: {
          id: true,
          name: true,
          supportEmail: true,
        },
      },
    },
    where: {
      slug: WEBSITE_PUBLISHED_SLUG,
      status: "PUBLISHED",
      workspace: { slug: normalizedSlug },
    },
  })

  if (!published?.body) return null

  try {
    const settings = JSON.parse(published.body) as { contactEmail?: unknown }
    const configuredEmail = z.string().email().safeParse(settings.contactEmail)
    const supportEmail = z.string().email().safeParse(published.workspace.supportEmail)
    const destination = configuredEmail.success
      ? configuredEmail.data
      : supportEmail.success
        ? supportEmail.data
        : null

    return destination
      ? {
          destination,
          workspaceId: published.workspace.id,
          workspaceName: published.workspace.name,
        }
      : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const parsed = contactRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete every required contact field." }, { status: 400 })
  }

  const rateLimit = await checkRequestRateLimit(`contact:${requestClientKey(request)}`, 5, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many messages were submitted. Please try again shortly." },
      { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
    )
  }

  const publishedContact = parsed.data.workspaceSlug
    ? await resolvePublishedContact(parsed.data.workspaceSlug)
    : null

  if (parsed.data.workspaceSlug && !publishedContact) {
    return NextResponse.json({ error: "This website is not accepting messages yet." }, { status: 404 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return NextResponse.json({ error: "Message delivery is temporarily unavailable." }, { status: 503 })
  }

  const destination =
    publishedContact?.destination ??
    (process.env.CONTACT_EMAIL?.trim() || "hello@mitchrusso.com")
  const context = publishedContact?.workspaceName ?? "PhotoViewPro website"
  const subject = parsed.data.subject || "Website contact request"
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: `
        <h1>New ${escapeHtml(context)} message</h1>
        <p><strong>From:</strong> ${escapeHtml(parsed.data.name)} &lt;${escapeHtml(parsed.data.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>
      `,
      reply_to: parsed.data.email,
      subject: `[PhotoViewPro contact] ${subject}`,
      text: `From: ${parsed.data.name} <${parsed.data.email}>\nSubject: ${subject}\n\n${parsed.data.message}`,
      to: destination,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    console.error("Contact delivery failed", { status: response.status })
    return NextResponse.json({ error: "The message could not be delivered. Please try again." }, { status: 502 })
  }

  if (publishedContact) {
    try {
      await getPrismaClient().contactMessage.create({
        data: {
          email: parsed.data.email,
          message: parsed.data.message,
          name: parsed.data.name,
          subject,
          workspaceId: publishedContact.workspaceId,
        },
      })
    } catch (error) {
      console.error("Contact message persistence failed after delivery", error)
    }
  }

  return NextResponse.json({ delivered: true })
}
