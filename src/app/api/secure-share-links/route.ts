import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import {
  createSecureShareToken,
  secureSharePath,
  secureShareTargetKey,
  type SecureShareTarget,
} from "@/lib/secure-share-links"

const requestedTargetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("workspace") }),
  z.object({ gallerySlug: z.string().trim().min(1).max(160), type: z.literal("gallery") }),
  z.object({
    gallerySlug: z.string().trim().min(1).max(160),
    photoId: z.string().trim().min(1).max(220),
    type: z.literal("photo"),
  }),
])

const requestSchema = z.object({ targets: z.array(requestedTargetSchema).min(1).max(200) })

function externalPhotoId(photo: { id: string; metadata: unknown }) {
  const metadata = photo.metadata && typeof photo.metadata === "object" && !Array.isArray(photo.metadata)
    ? photo.metadata as Record<string, unknown>
    : {}
  return typeof metadata.externalId === "string" && metadata.externalId ? metadata.externalId : photo.id
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !session.user.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid share targets" }, { status: 400 })

  const requestedGallerySlugs = Array.from(new Set(parsed.data.targets.flatMap((target) =>
    target.type === "workspace" ? [] : [target.gallerySlug],
  )))
  const galleries = requestedGallerySlugs.length > 0
    ? await getPrismaClient().gallery.findMany({
        include: { photos: { select: { id: true, isHidden: true, metadata: true } } },
        where: {
          privacy: { in: ["PUBLIC", "UNLISTED", "PASSWORD"] },
          slug: { in: requestedGallerySlugs },
          status: { not: "ARCHIVED" },
          workspaceId: session.user.workspaceId,
        },
      })
    : []
  const galleryBySlug = new Map(galleries.map((gallery) => [gallery.slug, gallery]))
  const urls: Record<string, string> = {}

  for (const requestedTarget of parsed.data.targets) {
    let target: SecureShareTarget | null = null
    if (requestedTarget.type === "workspace") {
      target = { type: "workspace", workspaceSlug: session.user.workspaceSlug }
    } else {
      const gallery = galleryBySlug.get(requestedTarget.gallerySlug)
      if (!gallery) continue
      if (requestedTarget.type === "gallery") {
        target = {
          gallerySlug: gallery.slug,
          type: "gallery",
          workspaceSlug: session.user.workspaceSlug,
        }
      } else {
        const photo = gallery.photos.find((candidate) =>
          !candidate.isHidden && externalPhotoId(candidate) === requestedTarget.photoId,
        )
        if (!photo) continue
        target = {
          gallerySlug: gallery.slug,
          photoId: externalPhotoId(photo),
          type: "photo",
          workspaceSlug: session.user.workspaceSlug,
        }
      }
    }

    const token = createSecureShareToken(target)
    urls[secureShareTargetKey(target)] = `${getAppUrl(request)}${secureSharePath(token)}`
  }

  return NextResponse.json({ urls })
}
