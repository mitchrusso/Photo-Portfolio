import { createHash } from "node:crypto"
import { getAppUrl } from "@/lib/app-url"
import { getPrismaClient } from "@/lib/db"
import { publishFacebookPhoto, publishInstagramPhoto } from "@/lib/meta-social"
import { getPhotoDeliveryUrl } from "@/lib/photo-storage"
import { normalizeSocialCampaignDesign } from "@/lib/social-campaign-design"
import { socialRenderUrl } from "@/lib/social-render-signing"
import { buildSocialQueue, normalizeSocialSchedule, socialScheduleIssue, type SocialSchedule } from "@/lib/social-scheduler"
import { decryptSocialToken } from "@/lib/social-token-crypto"

function objectRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function photoExternalId(photo: { id: string; metadata: unknown }) {
  const metadata = objectRecord(photo.metadata)
  return typeof metadata.externalId === "string" && metadata.externalId ? metadata.externalId : photo.id
}

function deliveryKey(parts: string[]) {
  return createHash("sha256").update(parts.join("|")).digest("hex")
}

export async function activateSocialSchedule(input: {
  gallerySlug: string
  request?: Request
  schedule: SocialSchedule
  workspaceId: string
}) {
  const prisma = getPrismaClient()
  const schedule = normalizeSocialSchedule({ ...input.schedule, status: "active", updatedAt: new Date().toISOString() })
  const gallery = await prisma.gallery.findUnique({
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      workspace: { select: { slug: true } },
    },
    where: { workspaceId_slug: { slug: input.gallerySlug, workspaceId: input.workspaceId } },
  })
  if (!gallery) throw new Error("Portfolio not found.")
  if (gallery.privacy === "PRIVATE" || gallery.privacy === "CLIENT_PORTAL" || gallery.privacy === "PASSWORD") {
    throw new Error("Choose Public or Unlisted visibility before scheduling social posts.")
  }
  if (schedule.connectionIds.length === 0) throw new Error("Choose at least one authorized social account.")

  const connections = await prisma.socialConnection.findMany({
    where: {
      id: { in: schedule.connectionIds },
      status: "ACTIVE",
      workspaceId: input.workspaceId,
    },
  })
  if (connections.length !== schedule.connectionIds.length) throw new Error("One or more selected social accounts must be reconnected.")

  const appUrl = getAppUrl(input.request)
  const portfolioUrl = `${appUrl}/g/${encodeURIComponent(gallery.workspace.slug)}/${encodeURIComponent(gallery.slug)}`
  const photos = gallery.photos.map((photo) => ({
    caption: photo.caption ?? undefined,
    hidden: photo.isHidden,
    id: photoExternalId(photo),
    imageUrl: `${appUrl}/api/media/${encodeURIComponent(gallery.id)}/${encodeURIComponent(photoExternalId(photo))}?variant=display`,
    title: photo.title || photo.fileName,
  }))
  const selectedCount = photos.filter((photo) =>
    !photo.hidden && (schedule.selectedPhotoIds === null || schedule.selectedPhotoIds.includes(photo.id)),
  ).length
  const issue = socialScheduleIssue(schedule, selectedCount)
  if (issue) throw new Error(issue)

  const queue = buildSocialQueue(schedule, photos, 500, portfolioUrl)
  const photoIdsByExternalId = new Map(gallery.photos.map((photo) => [photoExternalId(photo), photo.id]))
  const deliveries = queue.flatMap((post) => connections
    .filter((connection) => post.networks.includes(connection.network as (typeof post.networks)[number]))
    .map((connection) => ({
      caption: post.caption,
      connectionId: connection.id,
      design: post.design,
      galleryId: gallery.id,
      idempotencyKey: deliveryKey([gallery.id, post.photoId, connection.id, post.publishAt, schedule.updatedAt]),
      imageUrl: post.imageUrl,
      linkUrl: post.linkUrl,
      network: connection.network,
      photoId: photoIdsByExternalId.get(post.photoId)!,
      scheduledFor: new Date(post.publishAt),
      workspaceId: input.workspaceId,
    })))
  if (deliveries.length === 0) throw new Error("The selected platforms do not match the authorized social accounts.")

  const settings = { ...objectRecord(gallery.settings), socialSchedule: schedule }
  await prisma.$transaction([
    prisma.socialDelivery.deleteMany({ where: { galleryId: gallery.id, status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.socialDelivery.createMany({ data: deliveries, skipDuplicates: true }),
    prisma.gallery.update({ data: { settings }, where: { id: gallery.id } }),
  ])
  return { deliveries: deliveries.length, firstPostAt: queue[0]?.publishAt ?? null, schedule }
}

export async function runSocialPublishing(now = new Date(), limit = 20) {
  const prisma = getPrismaClient()
  const claimed = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE "SocialDelivery"
    SET "status" = 'PROCESSING', "attemptCount" = "attemptCount" + 1, "updatedAt" = NOW()
    WHERE "id" IN (
      SELECT "id" FROM "SocialDelivery"
      WHERE "status" = 'PENDING'
        AND "scheduledFor" <= ${now}
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= ${now})
      ORDER BY "scheduledFor" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING "id"
  `
  let failed = 0
  let published = 0

  for (const { id } of claimed) {
    const delivery = await prisma.socialDelivery.findUnique({
      include: { connection: true, photo: true },
      where: { id },
    })
    if (!delivery) continue

    try {
      if (delivery.connection.status !== "ACTIVE") throw new Error("Social account is disconnected.")
      if (delivery.connection.tokenExpiresAt && delivery.connection.tokenExpiresAt <= now) {
        throw new Error("Social account authorization expired. Reconnect the account.")
      }
      const accessToken = decryptSocialToken(delivery.connection.accessTokenEncrypted)
      const design = normalizeSocialCampaignDesign(delivery.design)
      const source = delivery.photo.displayUrl ?? delivery.photo.originalUrl
      const imageUrl = design.templateId === "original"
        ? await getPhotoDeliveryUrl(source, { expiresIn: 10 * 60 })
        : socialRenderUrl(getAppUrl(), delivery.id)
      const providerPostId = delivery.network === "facebook"
        ? await publishFacebookPhoto({
            accessToken,
            caption: delivery.caption,
            imageUrl,
            pageId: delivery.connection.providerAccountId,
          })
        : delivery.network === "instagram"
          ? await publishInstagramPhoto({
              accessToken,
              caption: delivery.caption,
              imageUrl,
              instagramAccountId: delivery.connection.providerAccountId,
            })
          : (() => { throw new Error(`Automatic publishing is not implemented for ${delivery.network}.`) })()
      await prisma.socialDelivery.update({
        data: { lastError: null, providerPostId, publishedAt: new Date(), status: "PUBLISHED" },
        where: { id },
      })
      published += 1
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Social publishing failed."
      const retry = delivery.attemptCount < 5
      const retryMinutes = [5, 15, 60, 240][Math.max(0, delivery.attemptCount - 1)] ?? 240
      await prisma.socialDelivery.update({
        data: {
          lastError: message,
          nextAttemptAt: retry ? new Date(Date.now() + retryMinutes * 60 * 1000) : null,
          status: retry ? "PENDING" : "FAILED",
        },
        where: { id },
      })
      failed += 1
    }
  }

  return { claimed: claimed.length, failed, published }
}
