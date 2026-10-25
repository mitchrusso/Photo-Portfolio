import { NextResponse } from "next/server"
import { z } from "zod"

import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import {
  sendRegistrationEmailVerification,
  verifyRegistrationEmailCode,
} from "@/lib/registration-email-verification"

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send"), email: z.string().trim().email().max(320) }),
  z.object({ action: z.literal("verify"), code: z.string().regex(/^\d{6}$/), email: z.string().trim().email().max(320) }),
])

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email address and six-digit code." }, { status: 400 })

  const limit = parsed.data.action === "send" ? 5 : 10
  const rateLimit = await checkRequestRateLimit(`registration-email:${requestClientKey(request)}:${parsed.data.action}`, limit, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ message: "Please wait a few minutes before trying again." }, {
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      status: 429,
    })
  }

  try {
    if (parsed.data.action === "send") {
      const result = await sendRegistrationEmailVerification(parsed.data.email)
      return NextResponse.json({ message: "We sent a six-digit verification code.", ...result })
    }
    const verificationToken = await verifyRegistrationEmailCode(parsed.data.email, parsed.data.code)
    if (!verificationToken) return NextResponse.json({ message: "That code is incorrect or expired. Request a new code." }, { status: 400 })
    return NextResponse.json({ message: "Email verified.", verificationToken })
  } catch (error) {
    return NextResponse.json({
      message: error instanceof Error ? error.message : "Email verification is temporarily unavailable.",
    }, { status: 503 })
  }
}
