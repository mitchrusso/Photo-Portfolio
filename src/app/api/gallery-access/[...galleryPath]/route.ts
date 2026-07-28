import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getPrismaClient } from "@/lib/db"
import {
  galleryAccessCookieName,
  portfolioGroupAccessCookieName,
  verifyGalleryAccessToken,
  verifyPortfolioGroupAccessToken,
} from "@/lib/gallery-access"
import { resolvePublicGallerySegments } from "@/lib/gallery-utils"
import { getPortfolioGroupProtection } from "@/lib/portfolio-group-protection"
import { handleVisitorAccessPost, type VisitorAccessResource } from "@/lib/visitor-access-handler"

type RouteProps = { params: Promise<{ galleryPath: string[] }> }

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

async function findGallery(segments: string[]) {
  const route = resolvePublicGallerySegments(segments)
  if (!route?.workspaceSlug) return null

  return getPrismaClient().gallery.findFirst({
    select: {
      id: true,
      name: true,
      passwordHash: true,
      privacy: true,
      settings: true,
      twoFactorEnabled: true,
      workspaceId: true,
    },
    where: {
      slug: route.gallerySlug,
      workspace: { slug: route.workspaceSlug },
    },
  })
}

async function resourcesForGallery(gallery: NonNullable<Awaited<ReturnType<typeof findGallery>>>) {
  const resources: VisitorAccessResource[] = []
  const parent = await getPortfolioGroupProtection(gallery.workspaceId, gallery.settings)
  if (parent) {
    resources.push({
      id: parent.id,
      name: parent.name,
      passwordHash: parent.passwordHash,
      twoFactorEnabled: parent.twoFactorEnabled,
      type: "gallery",
    })
  }
  if (gallery.privacy === "PASSWORD" && gallery.passwordHash) {
    const settings = asRecord(gallery.settings)
    resources.push({
      id: gallery.id,
      legacyPassword: typeof settings.password === "string" ? settings.password : undefined,
      name: gallery.name,
      passwordHash: gallery.passwordHash,
      twoFactorEnabled: gallery.twoFactorEnabled,
      type: "portfolio",
    })
  }
  return resources
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { galleryPath } = await params
  const gallery = await findGallery(galleryPath)
  if (!gallery) return NextResponse.json({ unlocked: false }, { status: 404 })

  const session = await auth()
  const isOwner = session?.user?.workspaceId === gallery.workspaceId
  const resources = await resourcesForGallery(gallery)
  const parent = resources.find((resource) => resource.type === "gallery")
  const portfolio = resources.find((resource) => resource.type === "portfolio")
  const galleryUnlocked = !parent || isOwner || verifyPortfolioGroupAccessToken(
    request.cookies.get(portfolioGroupAccessCookieName(parent.id))?.value,
    parent.id,
  )
  const portfolioUnlocked = !portfolio || isOwner || verifyGalleryAccessToken(
    request.cookies.get(galleryAccessCookieName(portfolio.id))?.value,
    portfolio.id,
  )

  return NextResponse.json({
    galleryUnlocked,
    portfolioUnlocked,
    unlocked: galleryUnlocked && portfolioUnlocked,
  })
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { galleryPath } = await params
  const gallery = await findGallery(galleryPath)
  if (!gallery) return NextResponse.json({ error: "Portfolio not found." }, { status: 404 })

  const resources = await resourcesForGallery(gallery)
  return handleVisitorAccessPost(request, resources, galleryPath.join(":"))
}
