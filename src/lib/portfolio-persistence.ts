import { getPrismaClient } from "@/lib/db"
import {
  getPhotoCover,
  isVisibleRenderableImage,
  type PortfolioGallery,
  type PortfolioPhoto,
} from "@/lib/gallery-utils"
import { normalizeSocialSchedule } from "@/lib/social-scheduler"
import { hashGalleryPassword } from "@/lib/gallery-access"

type DbGallery = Awaited<ReturnType<typeof getWorkspaceGalleriesFromDb>>[number]

const fallbackCover = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"

const statusToDb = {
  "Delivered": "DELIVERED",
  "Draft": "DRAFT",
  "For sale": "FOR_SALE",
  "Proofing": "PROOFING",
} as const

const statusFromDb = {
  "ARCHIVED": "Draft",
  "DELIVERED": "Delivered",
  "DRAFT": "Draft",
  "FOR_SALE": "For sale",
  "PROOFING": "Proofing",
} as const

const privacyToDb = {
  "Client portal": "CLIENT_PORTAL",
  "Password": "PASSWORD",
  "Private link": "UNLISTED",
  "Public": "PUBLIC",
} as const

const privacyFromDb = {
  "CLIENT_PORTAL": "Client portal",
  "PASSWORD": "Password",
  "PRIVATE": "Private link",
  "PUBLIC": "Public",
  "UNLISTED": "Private link",
} as const

const watermarkPositionToDb = {
  "bottom-left": "BOTTOM_LEFT",
  "bottom-right": "BOTTOM_RIGHT",
  "center": "CENTER",
  "top-left": "TOP_LEFT",
  "top-right": "TOP_RIGHT",
} as const

const watermarkPositionFromDb = {
  "BOTTOM_LEFT": "bottom-left",
  "BOTTOM_RIGHT": "bottom-right",
  "CENTER": "center",
  "TOP_LEFT": "top-left",
  "TOP_RIGHT": "top-right",
} as const

const watermarkModeToDb = {
  "both": "BOTH",
  "image": "IMAGE",
  "text": "TEXT",
} as const

const watermarkModeFromDb = {
  "BOTH": "both",
  "IMAGE": "image",
  "TEXT": "text",
} as const

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function asStringRecord(value: unknown) {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {}
}

function numberFromBigInt(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value)
  return value ?? 0
}

function cleanNullable(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function gallerySettings(gallery: PortfolioGallery) {
  return {
    allowFavorites: gallery.allowFavorites,
    embedEnabled: gallery.embedEnabled,
    favorites: gallery.favorites,
    infoDate: gallery.infoDate,
    infoLocation: gallery.infoLocation,
    infoNotes: gallery.infoNotes,
    infoPaneEnabled: gallery.infoPaneEnabled ?? false,
    infoTime: gallery.infoTime,
    photoLabelMode: gallery.photoLabelMode ?? (gallery.showFileNames === false ? "none" : "file-name"),
    revenue: gallery.revenue,
    seoDescription: gallery.seoDescription,
    seoTitle: gallery.seoTitle,
    showFileNames: gallery.showFileNames ?? true,
    socialImageUrl: gallery.socialImageUrl,
    socialSchedule: gallery.socialSchedule,
    url: gallery.url,
  }
}

function photoMetadata(photo: PortfolioPhoto, externalId: string) {
  return {
    externalId,
    ...(photo.camera?.trim() ? { camera: photo.camera.trim() } : {}),
    ...(photo.category?.trim() ? { category: photo.category.trim() } : {}),
    ...(photo.capturedDate?.trim() ? { capturedDate: photo.capturedDate.trim() } : {}),
    ...(photo.lens?.trim() ? { lens: photo.lens.trim() } : {}),
    ...(photo.location?.trim() ? { location: photo.location.trim() } : {}),
    ...(photo.notes?.trim() ? { notes: photo.notes.trim() } : {}),
    ...(photo.story?.trim() ? { story: photo.story.trim() } : {}),
    ...(photo.tags?.length ? { tags: photo.tags.map((tag) => tag.trim()).filter(Boolean) } : {}),
    ...(photo.trip?.trim() ? { trip: photo.trip.trim() } : {}),
  }
}

async function uniqueGallerySlug(workspaceId: string, preferredSlug: string, existingSlug?: string) {
  const prisma = getPrismaClient()
  const base = slugify(preferredSlug) || `gallery-${Date.now()}`

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`
    const existing = await prisma.gallery.findUnique({
      select: { id: true, slug: true },
      where: {
        workspaceId_slug: {
          slug: candidate,
          workspaceId,
        },
      },
    })

    if (!existing || existing.slug === existingSlug) return candidate
  }

  return `${base}-${Date.now()}`
}

async function ensureClient(workspaceId: string, clientName: string) {
  const trimmed = clientName.trim()
  if (!trimmed || trimmed === "Personal") return null

  const prisma = getPrismaClient()
  const existing = await prisma.client.findFirst({
    select: { id: true },
    where: {
      name: trimmed,
      workspaceId,
    },
  })

  if (existing) return existing.id

  const client = await prisma.client.create({
    data: {
      name: trimmed,
      workspaceId,
    },
    select: {
      id: true,
    },
  })

  return client.id
}

async function getWorkspaceGalleriesFromDb(workspaceId: string) {
  const prisma = getPrismaClient()

  return prisma.gallery.findMany({
    include: {
      client: true,
      coverPhoto: true,
      photos: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    where: {
      workspaceId,
    },
  })
}

function photoFromDb(photo: DbGallery["photos"][number]): PortfolioPhoto {
  const metadata = asStringRecord(photo.metadata)

  return {
    blobUrl: photo.originalUrl,
    bytes: numberFromBigInt(photo.bytes) || null,
    camera: typeof metadata.camera === "string" ? metadata.camera : undefined,
    caption: photo.caption ?? undefined,
    category: typeof metadata.category === "string" ? metadata.category : undefined,
    capturedDate: typeof metadata.capturedDate === "string" ? metadata.capturedDate : undefined,
    displayBytes: numberFromBigInt(photo.displayBytes) || null,
    displayUrl: photo.displayUrl ?? undefined,
    downloadUrl: photo.downloadUrl ?? photo.originalUrl,
    fileName: photo.fileName,
    height: photo.height,
    hidden: photo.isHidden,
    id: String(metadata.externalId ?? photo.id),
    kind: photo.kind === "RAW" ? "Raw" : "Image",
    lens: typeof metadata.lens === "string" ? metadata.lens : undefined,
    location: typeof metadata.location === "string" ? metadata.location : undefined,
    notes: typeof metadata.notes === "string" ? metadata.notes : undefined,
    sourceUrl: photo.sourceUrl ?? photo.originalUrl,
    story: typeof metadata.story === "string" ? metadata.story : undefined,
    tags: Array.isArray(metadata.tags) ? metadata.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
    thumbnailBytes: numberFromBigInt(photo.thumbnailBytes) || null,
    thumbnailUrl: photo.thumbnailUrl ?? undefined,
    title: photo.title,
    trip: typeof metadata.trip === "string" ? metadata.trip : undefined,
    width: photo.width,
  }
}

function galleryFromDb(gallery: DbGallery): PortfolioGallery {
  const settings = asStringRecord(gallery.settings)
  const photos = gallery.photos.map(photoFromDb)
  const legacyShowFileNames = typeof settings.showFileNames === "boolean" ? settings.showFileNames : true
  const photoLabelMode =
    settings.photoLabelMode === "caption" || settings.photoLabelMode === "file-name" || settings.photoLabelMode === "none"
      ? settings.photoLabelMode
      : legacyShowFileNames
        ? "file-name"
        : "none"
  const coverImage =
    gallery.coverImageUrl ??
    (gallery.coverPhoto ? getPhotoCover(photoFromDb(gallery.coverPhoto)) : undefined) ??
    getPhotoCover(photos.find(isVisibleRenderableImage)) ??
    fallbackCover

  return {
    allowDownloads: gallery.allowDownloads,
    allowFavorites: settings.allowFavorites as boolean | undefined,
    allowSocialSharing: gallery.allowSocialSharing,
    client: gallery.client?.name ?? "Personal",
    cover: coverImage,
    description: gallery.description ?? "",
    embedEnabled: settings.embedEnabled as boolean | undefined,
    favorites: typeof settings.favorites === "number" ? settings.favorites : 0,
    id: gallery.slug,
    images: photos.filter(isVisibleRenderableImage).length,
    infoDate: settings.infoDate as string | undefined,
    infoLocation: settings.infoLocation as string | undefined,
    infoNotes: settings.infoNotes as string | undefined,
    infoPaneEnabled: typeof settings.infoPaneEnabled === "boolean" ? settings.infoPaneEnabled : false,
    infoTime: settings.infoTime as string | undefined,
    name: gallery.name,
    password: undefined,
    photoLabelMode,
    photos,
    privacy: privacyFromDb[gallery.privacy],
    revenue: typeof settings.revenue === "string" ? settings.revenue : "$0",
    seoDescription: settings.seoDescription as string | undefined,
    seoTitle: settings.seoTitle as string | undefined,
    showFileNames: typeof settings.showFileNames === "boolean" ? settings.showFileNames : true,
    socialImageUrl: settings.socialImageUrl as string | undefined,
    socialSchedule: settings.socialSchedule ? normalizeSocialSchedule(settings.socialSchedule) : undefined,
    status: statusFromDb[gallery.status],
    url: settings.url as string | undefined,
    watermarkEnabled: gallery.watermarkEnabled,
    watermarkImageUrl: gallery.watermarkImageUrl ?? undefined,
    watermarkMode: watermarkModeFromDb[gallery.watermarkMode],
    watermarkOpacity: gallery.watermarkOpacity,
    watermarkPosition: watermarkPositionFromDb[gallery.watermarkPosition],
    watermarkSize: gallery.watermarkSize,
    watermarkText: gallery.watermarkText ?? undefined,
  }
}

export async function getWorkspacePortfolioGalleries(workspaceId: string) {
  const galleries = await getWorkspaceGalleriesFromDb(workspaceId)
  return galleries.map(galleryFromDb)
}

export async function replaceWorkspacePortfolioGalleries(workspaceId: string, galleries: PortfolioGallery[]) {
  const prisma = getPrismaClient()
  const incomingSlugs = new Set<string>()

  for (const gallery of galleries) {
    const existing = await prisma.gallery.findUnique({
      include: {
        photos: true,
      },
      where: {
        workspaceId_slug: {
          slug: gallery.id,
          workspaceId,
        },
      },
    })
    const slug = await uniqueGallerySlug(workspaceId, gallery.id || gallery.name, existing?.slug)
    incomingSlugs.add(slug)
    const clientId = await ensureClient(workspaceId, gallery.client)
    const existingSettings = asStringRecord(existing?.settings)
    const suppliedPassword = gallery.password?.trim() || (typeof existingSettings.password === "string" ? existingSettings.password : "")
    const passwordHash = gallery.privacy === "Password"
      ? suppliedPassword
        ? hashGalleryPassword(suppliedPassword)
        : existing?.passwordHash ?? null
      : null
    if (gallery.privacy === "Password" && !passwordHash) {
      throw new Error(`Set a password before publishing ${gallery.name} as password protected.`)
    }

    const dbGallery = await prisma.gallery.upsert({
      create: {
        allowDownloads: gallery.allowDownloads ?? true,
        allowSocialSharing: gallery.allowSocialSharing ?? true,
        clientId,
        coverImageUrl: cleanNullable(gallery.cover),
        description: cleanNullable(gallery.description),
        name: gallery.name,
        passwordHash,
        privacy: privacyToDb[gallery.privacy],
        settings: gallerySettings(gallery),
        slug,
        status: statusToDb[gallery.status],
        storageUsedBytes: BigInt((gallery.photos ?? []).reduce((sum, photo) =>
          sum + numberFromBigInt(photo.bytes) + numberFromBigInt(photo.displayBytes) + numberFromBigInt(photo.thumbnailBytes), 0)),
        watermarkEnabled: gallery.watermarkEnabled ?? false,
        watermarkImageUrl: cleanNullable(gallery.watermarkImageUrl),
        watermarkMode: watermarkModeToDb[gallery.watermarkMode ?? "text"],
        watermarkOpacity: gallery.watermarkOpacity ?? 55,
        watermarkPosition: watermarkPositionToDb[gallery.watermarkPosition ?? "bottom-right"],
        watermarkSize: gallery.watermarkSize ?? 140,
        watermarkText: cleanNullable(gallery.watermarkText),
        workspaceId,
      },
      update: {
        allowDownloads: gallery.allowDownloads ?? true,
        allowSocialSharing: gallery.allowSocialSharing ?? true,
        clientId,
        coverImageUrl: cleanNullable(gallery.cover),
        description: cleanNullable(gallery.description),
        name: gallery.name,
        passwordHash,
        privacy: privacyToDb[gallery.privacy],
        settings: gallerySettings(gallery),
        status: statusToDb[gallery.status],
        storageUsedBytes: BigInt((gallery.photos ?? []).reduce((sum, photo) =>
          sum + numberFromBigInt(photo.bytes) + numberFromBigInt(photo.displayBytes) + numberFromBigInt(photo.thumbnailBytes), 0)),
        watermarkEnabled: gallery.watermarkEnabled ?? false,
        watermarkImageUrl: cleanNullable(gallery.watermarkImageUrl),
        watermarkMode: watermarkModeToDb[gallery.watermarkMode ?? "text"],
        watermarkOpacity: gallery.watermarkOpacity ?? 55,
        watermarkPosition: watermarkPositionToDb[gallery.watermarkPosition ?? "bottom-right"],
        watermarkSize: gallery.watermarkSize ?? 140,
        watermarkText: cleanNullable(gallery.watermarkText),
      },
      where: {
        workspaceId_slug: {
          slug: existing?.slug ?? slug,
          workspaceId,
        },
      },
    })

    const incomingPhotoIds = new Set<string>()

    for (const [index, photo] of (gallery.photos ?? []).entries()) {
      const sourceKey = photo.id || photo.sourceUrl || photo.blobUrl || `${gallery.id}-${index}`
      const dbPhotoId = existing?.photos.find((candidate) => {
        const metadata = asStringRecord(candidate.metadata)
        return metadata.externalId === sourceKey || candidate.sourceUrl === photo.sourceUrl || candidate.originalUrl === photo.blobUrl
      })?.id

      const savedPhoto = await prisma.photo.upsert({
        create: {
          bytes: BigInt(numberFromBigInt(photo.bytes)),
          caption: cleanNullable(photo.caption),
          displayBytes: BigInt(numberFromBigInt(photo.displayBytes)),
          displayUrl: cleanNullable(photo.displayUrl),
          downloadUrl: cleanNullable(photo.downloadUrl),
          fileName: photo.fileName,
          galleryId: dbGallery.id,
          height: photo.height,
          isHidden: Boolean(photo.hidden),
          kind: photo.kind === "Raw" ? "RAW" : "IMAGE",
          metadata: photoMetadata(photo, sourceKey),
          originalUrl: photo.blobUrl,
          sortOrder: index,
          sourceUrl: cleanNullable(photo.sourceUrl),
          thumbnailBytes: BigInt(numberFromBigInt(photo.thumbnailBytes)),
          thumbnailUrl: cleanNullable(photo.thumbnailUrl),
          title: photo.title || photo.fileName,
          width: photo.width,
          workspaceId,
        },
        update: {
          bytes: BigInt(numberFromBigInt(photo.bytes)),
          caption: cleanNullable(photo.caption),
          displayBytes: BigInt(numberFromBigInt(photo.displayBytes)),
          displayUrl: cleanNullable(photo.displayUrl),
          downloadUrl: cleanNullable(photo.downloadUrl),
          fileName: photo.fileName,
          height: photo.height,
          isHidden: Boolean(photo.hidden),
          kind: photo.kind === "Raw" ? "RAW" : "IMAGE",
          metadata: photoMetadata(photo, sourceKey),
          originalUrl: photo.blobUrl,
          sortOrder: index,
          sourceUrl: cleanNullable(photo.sourceUrl),
          thumbnailBytes: BigInt(numberFromBigInt(photo.thumbnailBytes)),
          thumbnailUrl: cleanNullable(photo.thumbnailUrl),
          title: photo.title || photo.fileName,
          width: photo.width,
        },
        where: {
          id: dbPhotoId ?? `missing-${dbGallery.id}-${index}`,
        },
      })

      incomingPhotoIds.add(savedPhoto.id)
    }

    await prisma.photo.deleteMany({
      where: {
        galleryId: dbGallery.id,
        id: {
          notIn: Array.from(incomingPhotoIds),
        },
      },
    })

    const coverPhoto = await prisma.photo.findFirst({
      select: { id: true },
      where: {
        galleryId: dbGallery.id,
        OR: [
          { displayUrl: gallery.cover },
          { thumbnailUrl: gallery.cover },
          { originalUrl: gallery.cover },
          { sourceUrl: gallery.cover },
        ],
      },
    })

    await prisma.gallery.update({
      data: {
        coverPhotoId: coverPhoto?.id ?? null,
      },
      where: {
        id: dbGallery.id,
      },
    })
  }

  await prisma.gallery.deleteMany({
    where: {
      workspaceId,
      slug: {
        notIn: Array.from(incomingSlugs),
      },
    },
  })

  const storageUsedBytes = await prisma.gallery.aggregate({
    _sum: {
      storageUsedBytes: true,
    },
    where: {
      workspaceId,
    },
  })

  await prisma.workspace.update({
    data: {
      storageUsedBytes: storageUsedBytes._sum.storageUsedBytes ?? BigInt(0),
    },
    where: {
      id: workspaceId,
    },
  })

  return getWorkspacePortfolioGalleries(workspaceId)
}
