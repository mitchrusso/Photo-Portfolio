import { NextResponse } from "next/server"
import sharp from "sharp"
import { z } from "zod"
import { auth } from "@/auth"
import { mapWithConcurrency } from "@/lib/async-concurrency"
import { getPrismaClient } from "@/lib/db"
import { readResponseBytesLimited } from "@/lib/limited-response"
import { persistImportedPhoto } from "@/lib/photo-import-handler"
import { deleteManagedPhotoObject, uploadPhotoObject } from "@/lib/photo-storage"
import { TECHNICAL_UPLOAD_SAFETY_BYTES } from "@/lib/plans"
import { checkRequestRateLimit, requestClientKey } from "@/lib/request-rate-limit"
import { decryptSocialToken } from "@/lib/social-token-crypto"
import {
  getSmugMugAlbum,
  getSmugMugBestImageSource,
  getSmugMugConfig,
  isSmugMugAlbumUri,
  isSmugMugMediaUrl,
  listSmugMugAlbumImages,
  listSmugMugAlbums,
  type SmugMugOAuthCredentials,
} from "@/lib/smugmug-api"
import { getSubscriptionWriteBlock } from "@/lib/subscription-api"
import { getWorkspaceEntitlement } from "@/lib/subscription-entitlements"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const importSchema = z.object({ albumUri: z.string().max(300) })
const IMPORT_BATCH_SIZE = 8
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff"])

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const configured = Boolean(getSmugMugConfig())
  const connection = await findConnection(session.user.workspaceId)
  if (!connection) return NextResponse.json({ albums: [], configured, connected: false })
  if (!configured) return NextResponse.json({ albums: [], configured, connected: true, connection: connectionSummary(connection) })

  try {
    const albums = await listSmugMugAlbums(connectionCredentials(connection))
    return NextResponse.json({ albums, configured, connected: true, connection: connectionSummary(connection) })
  } catch (error) {
    console.error("SmugMug gallery list failed", error)
    return NextResponse.json({
      albums: [],
      configured,
      connected: true,
      connection: connectionSummary(connection),
      error: "PhotoView.io could not read this SmugMug account. Reconnect it and try again.",
    }, { status: 502 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const result = await getPrismaClient().socialConnection.updateMany({
    data: { status: "REVOKED" },
    where: { network: "smugmug", status: "ACTIVE", workspaceId: session.user.workspaceId },
  })
  return NextResponse.json({ disconnected: result.count > 0 })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const writeBlock = await getSubscriptionWriteBlock(session.user.workspaceId)
  if (writeBlock) return writeBlock
  const parsed = importSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isSmugMugAlbumUri(parsed.data.albumUri)) {
    return NextResponse.json({ error: "Choose a valid gallery from the connected SmugMug account." }, { status: 400 })
  }
  const limit = await checkRequestRateLimit(`smugmug-import:${session.user.id}:${requestClientKey(request)}`, 40, 10 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ error: "SmugMug import is moving too quickly. Please wait briefly and resume." }, { status: 429 })

  const connection = await findConnection(session.user.workspaceId)
  if (!connection || !getSmugMugConfig()) return NextResponse.json({ error: "Connect SmugMug before importing." }, { status: 409 })
  const credentials = connectionCredentials(connection)

  try {
    const accountAlbums = await listSmugMugAlbums(credentials)
    const selectedSummary = accountAlbums.find((album) => album.uri === parsed.data.albumUri)
    if (!selectedSummary) return NextResponse.json({ error: "That gallery does not belong to the connected SmugMug account." }, { status: 403 })

    const entitlement = await getWorkspaceEntitlement(session.user.workspaceId)
    const album = await getSmugMugAlbum(selectedSummary.uri, credentials)
    const gallery = await ensureDestinationGallery({
      albumKey: selectedSummary.albumKey,
      albumUri: selectedSummary.uri,
      description: stringValue(album.Description),
      entitlementGalleryLimit: entitlement.galleryLimit,
      name: selectedSummary.name,
      webUri: selectedSummary.webUri,
      workspaceId: session.user.workspaceId,
    })
    const images = await listSmugMugAlbumImages(album, credentials)
    const existingPhotos = await getPrismaClient().photo.findMany({ select: { metadata: true }, where: { galleryId: gallery.id } })
    const importedIds = new Set(existingPhotos.flatMap((photo) => {
      const metadata = asRecord(photo.metadata)
      return typeof metadata.externalId === "string" ? [metadata.externalId] : []
    }))
    const pending = images.filter((image) => image.ImageKey && !importedIds.has(`smugmug:${image.ImageKey}`))
    const batch = pending.slice(0, IMPORT_BATCH_SIZE)
    const results = await mapWithConcurrency(batch, 2, (image) => importImage({
      credentials,
      galleryName: gallery.name,
      gallerySlug: gallery.slug,
      image,
      workspaceId: session.user.workspaceId!,
    }))
    const imported = results.filter((result) => result.ok).length
    const failed = results.length - imported
    return NextResponse.json({
      album: { name: gallery.name, uri: selectedSummary.uri },
      failed,
      imported,
      importedTotal: importedIds.size + imported,
      remaining: Math.max(0, pending.length - imported),
      total: images.length,
    })
  } catch (error) {
    console.error("SmugMug import failed", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "SmugMug import failed." }, { status: 400 })
  }
}

async function importImage(input: {
  credentials: SmugMugOAuthCredentials
  galleryName: string
  gallerySlug: string
  image: Awaited<ReturnType<typeof listSmugMugAlbumImages>>[number]
  workspaceId: string
}) {
  let stored: Awaited<ReturnType<typeof uploadPhotoObject>> | null = null
  try {
    const source = await getSmugMugBestImageSource(input.image, input.credentials)
    if (!source || !isSmugMugMediaUrl(source.url)) throw new Error("SmugMug did not provide a safe image download.")
    const response = await fetch(source.url, { cache: "no-store", redirect: "follow" })
    if (!response.ok || !isSmugMugMediaUrl(response.url)) throw new Error("SmugMug image download failed.")
    const contentType = (response.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase()
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) throw new Error(`Unsupported SmugMug image type: ${contentType}`)
    const bytes = await readResponseBytesLimited(response, TECHNICAL_UPLOAD_SAFETY_BYTES)
    const metadata = await sharp(bytes, { limitInputPixels: 100_000_000 }).metadata()
    if (!metadata.width || !metadata.height) throw new Error("The SmugMug image is invalid.")
    const fileName = sanitizeFileName(input.image.FileName || `${input.image.ImageKey || "photo"}.jpg`)
    stored = await uploadPhotoObject({
      addRandomSuffix: true,
      body: bytes,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      contentType,
      pathname: `imports/${input.workspaceId}/smugmug/${input.gallerySlug}/${fileName}`,
    })
    await persistImportedPhoto({
      caption: input.image.Caption || "",
      captureTime: input.image.Date || "",
      clientName: "",
      destinationMode: "existing",
      externalId: `smugmug:${input.image.ImageKey}`,
      fileName,
      galleryLimit: null,
      galleryName: input.galleryName,
      gallerySlug: input.gallerySlug,
      height: metadata.height,
      makePublic: false,
      photoTitle: input.image.Title || "",
      size: stored.size,
      source: "smugmug",
      sourceUrl: input.image.WebUri || source.url,
      storageLimitBytes: (await getWorkspaceEntitlement(input.workspaceId)).storageLimitBytes,
      storedUrl: stored.url,
      width: metadata.width,
      workspaceId: input.workspaceId,
    })
    return { ok: true as const }
  } catch (error) {
    if (stored) await deleteManagedPhotoObject(stored.url).catch(() => undefined)
    console.error("SmugMug image import failed", { error, imageKey: input.image.ImageKey })
    return { ok: false as const }
  }
}

async function ensureDestinationGallery(input: {
  albumKey: string
  albumUri: string
  description: string
  entitlementGalleryLimit: number | null
  name: string
  webUri: string
  workspaceId: string
}) {
  const prisma = getPrismaClient()
  const existing = await prisma.gallery.findFirst({
    where: { settings: { path: ["smugmugAlbumUri"], equals: input.albumUri }, workspaceId: input.workspaceId },
  })
  if (existing) return existing
  if (input.entitlementGalleryLimit !== null) {
    const galleryCount = await prisma.gallery.count({ where: { workspaceId: input.workspaceId } })
    if (galleryCount >= input.entitlementGalleryLimit) throw new Error(`This plan allows ${input.entitlementGalleryLimit} portfolios. Upgrade before importing another SmugMug gallery.`)
  }
  const slug = await uniqueSlug(input.workspaceId, input.name, input.albumKey)
  return prisma.gallery.create({
    data: {
      description: input.description || null,
      name: input.name,
      privacy: "PRIVATE",
      settings: { smugmugAlbumKey: input.albumKey, smugmugAlbumUri: input.albumUri, smugmugWebUri: input.webUri },
      slug,
      status: "DRAFT",
      workspaceId: input.workspaceId,
    },
  })
}

async function uniqueSlug(workspaceId: string, name: string, albumKey: string) {
  const prisma = getPrismaClient()
  const base = slugify(name) || `smugmug-${slugify(albumKey)}`
  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`
    const existing = await prisma.gallery.findUnique({ select: { id: true }, where: { workspaceId_slug: { slug: candidate, workspaceId } } })
    if (!existing) return candidate
  }
  return `${base}-${Date.now()}`
}

async function findConnection(workspaceId: string) {
  return getPrismaClient().socialConnection.findFirst({
    orderBy: { updatedAt: "desc" },
    where: { network: "smugmug", status: "ACTIVE", workspaceId },
  })
}

function connectionCredentials(connection: NonNullable<Awaited<ReturnType<typeof findConnection>>>) {
  if (!connection.refreshTokenEncrypted) throw new Error("The SmugMug connection is incomplete.")
  return { token: decryptSocialToken(connection.accessTokenEncrypted), tokenSecret: decryptSocialToken(connection.refreshTokenEncrypted) }
}

function connectionSummary(connection: NonNullable<Awaited<ReturnType<typeof findConnection>>>) {
  return { id: connection.id, name: connection.providerAccountName, verifiedAt: connection.lastVerifiedAt }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function sanitizeFileName(value: string) {
  const match = value.match(/\.([A-Za-z0-9]{2,5})$/)
  const extension = match?.[1]?.toLowerCase() || "jpg"
  const base = value.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "smugmug-photo"
  return `${base}.${extension}`
}
