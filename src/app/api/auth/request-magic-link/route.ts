import { requestMagicLogin } from "@/lib/magic-login"
import { NextResponse } from "next/server"
import { z } from "zod"

const requestMagicLinkSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const parsed = requestMagicLinkSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
  }

  const result = await requestMagicLogin(parsed.data.email)

  return NextResponse.json({
    email: result.email,
    sent: result.sent,
    status: result.status,
  }, {
    status: result.sent ? 200 : result.status === "invalid_subscriber" ? 404 : 502,
  })
}
