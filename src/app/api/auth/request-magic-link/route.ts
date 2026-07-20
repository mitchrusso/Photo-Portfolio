import { requestMagicLogin } from "@/lib/magic-login"
import { NextResponse } from "next/server"
import { z } from "zod"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"

const requestMagicLinkSchema = z.object({
  email: z.string().trim().email().max(320),
  resend: z.boolean().optional(),
})

export async function POST(request: Request) {
  const limit = await checkRequestRateLimit(`magic:${requestClientKey(request)}`, 8, 10 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login requests. Please wait a few minutes and try again." },
      { headers: { "Retry-After": String(limit.retryAfterSeconds) }, status: 429 },
    )
  }

  const payload = await request.json().catch(() => null)
  const parsed = requestMagicLinkSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
  }

  const result = await requestMagicLogin(parsed.data.email, {
    forceResend: parsed.data.resend === true,
  })

  if (result.status === "email_failed") {
    return NextResponse.json(
      { error: "The login email could not be sent. Please try again shortly." },
      { status: 503 },
    )
  }

  return NextResponse.json({
    message: "If that email belongs to an eligible PhotoView.io account, a secure login link is on its way.",
    sent: true,
  }, {
    status: 200,
  })
}
