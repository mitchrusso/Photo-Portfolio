import { NextResponse } from "next/server"

import { unsubscribeAutoresponder } from "@/lib/autoresponder"
import { getPrismaClient } from "@/lib/db"
import { emailRecipientHash } from "@/lib/email-suppression"
import { verifyEmailUnsubscribeToken } from "@/lib/email-unsubscribe-token"

async function tokenFromRequest(request: Request) {
  const urlToken = new URL(request.url).searchParams.get("token")
  if (urlToken) return urlToken

  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as { token?: unknown } | null
    return typeof body?.token === "string" ? body.token : undefined
  }

  const form = await request.formData().catch(() => null)
  const formToken = form?.get("token")
  return typeof formToken === "string" ? formToken : undefined
}

export async function POST(request: Request) {
  const claims = verifyEmailUnsubscribeToken(await tokenFromRequest(request))
  if (!claims) {
    return NextResponse.json({ error: "This unsubscribe link is invalid or has expired." }, { status: 400 })
  }

  await getPrismaClient().emailSuppression.upsert({
    create: {
      reason: "USER_UNSUBSCRIBED",
      recipientHash: emailRecipientHash(claims.email),
      source: "unsubscribe_link",
    },
    update: {
      reason: "USER_UNSUBSCRIBED",
      source: "unsubscribe_link",
    },
    where: { recipientHash: emailRecipientHash(claims.email) },
  })

  const autoresponderStatus = await unsubscribeAutoresponder(claims.email)
  if (autoresponderStatus === "failed") {
    console.error("[email-unsubscribe] External autoresponder opt-out failed after local suppression was saved.")
  }

  return NextResponse.json({ ok: true })
}
