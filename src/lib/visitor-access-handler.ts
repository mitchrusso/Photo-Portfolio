import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  createGalleryAccessToken,
  createPortfolioGroupAccessToken,
  galleryAccessCookieName,
  portfolioGroupAccessCookieName,
  verifyGalleryPassword,
} from "@/lib/gallery-access"
import { sendVisitorAccessCodeEmail } from "@/lib/lifecycle-email"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import {
  createVisitorTwoFactorChallenge,
  verifyVisitorTwoFactorChallenge,
} from "@/lib/visitor-two-factor"

export type VisitorAccessResource = {
  id: string
  legacyPassword?: string
  name: string
  passwordHash: string
  twoFactorEnabled: boolean
  type: "gallery" | "portfolio"
}

const unlockSchema = z.object({
  challenge: z.string().max(2_000).optional(),
  code: z.string().trim().regex(/^\d{6}$/).optional(),
  email: z.string().trim().email().max(254).optional(),
  level: z.enum(["gallery", "portfolio"]).optional(),
  password: z.string().max(300).optional(),
})

function safePlaintextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function setAccessCookie(response: NextResponse, resource: VisitorAccessResource) {
  const isGallery = resource.type === "gallery"
  response.cookies.set(
    isGallery ? portfolioGroupAccessCookieName(resource.id) : galleryAccessCookieName(resource.id),
    isGallery ? createPortfolioGroupAccessToken(resource.id) : createGalleryAccessToken(resource.id),
    {
      httpOnly: true,
      maxAge: 12 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  )
}

export async function handleVisitorAccessPost(
  request: NextRequest,
  resources: VisitorAccessResource[],
  routeKey: string,
) {
  const parsed = unlockSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the required access information." }, { status: 400 })
  }

  const requestedLevel = parsed.data.level ?? "portfolio"
  const resource = resources.find((candidate) => candidate.type === requestedLevel)
  if (!resource) return NextResponse.json({ error: "Protected item not found." }, { status: 404 })

  const limit = await checkRequestRateLimit(
    `visitor-unlock:${routeKey}:${resource.type}:${requestClientKey(request)}`,
    10,
    15 * 60 * 1000,
  )
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many access attempts. Please wait and try again." },
      { headers: { "Retry-After": String(limit.retryAfterSeconds) }, status: 429 },
    )
  }

  if (parsed.data.challenge || parsed.data.code) {
    if (
      !parsed.data.challenge ||
      !parsed.data.code ||
      !verifyVisitorTwoFactorChallenge(parsed.data.challenge, parsed.data.code, {
        resourceId: resource.id,
        resourceType: resource.type,
      })
    ) {
      return NextResponse.json({ error: "That verification code is invalid or expired." }, { status: 401 })
    }
    const response = NextResponse.json({ unlocked: true })
    setAccessCookie(response, resource)
    return response
  }

  const password = parsed.data.password?.trim() ?? ""
  if (!password) return NextResponse.json({ error: "A password is required." }, { status: 400 })
  const valid = verifyGalleryPassword(password, resource.passwordHash) ||
    Boolean(resource.legacyPassword && safePlaintextEqual(password, resource.legacyPassword))
  if (!valid) return NextResponse.json({ error: "That password did not match." }, { status: 401 })

  if (resource.twoFactorEnabled) {
    if (!parsed.data.email) {
      return NextResponse.json({ error: "Enter the email address that should receive the verification code." }, { status: 400 })
    }
    const challenge = createVisitorTwoFactorChallenge(resource.type, resource.id, parsed.data.email)
    const status = await sendVisitorAccessCodeEmail(parsed.data.email, {
      code: challenge.code,
      resourceName: resource.name,
      resourceType: resource.type === "gallery" ? "Gallery" : "Portfolio",
    })
    if (status !== "sent") {
      return NextResponse.json({ error: "The verification email could not be sent. Please try again shortly." }, { status: 503 })
    }
    return NextResponse.json({
      challenge: challenge.challenge,
      email: parsed.data.email,
      requiresTwoFactor: true,
    })
  }

  const response = NextResponse.json({ unlocked: true })
  setAccessCookie(response, resource)
  return response
}
