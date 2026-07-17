import { getPrismaClient } from "@/lib/db"
import {
  getPhotoCover,
  isVisibleRenderableImage,
  photoMatchesCover,
  type PortfolioGallery,
  type PortfolioPhoto,
} from "@/lib/gallery-utils"
import { normalizeSocialSchedule } from "@/lib/social-scheduler"
import { hashGalleryPassword } from "@/lib/gallery-access"
import { findStoredCoverPhotoId } from "@/lib/portfolio-cover"

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

function persistedWatermarkReference(value: string | undefined, existingValue: string | null | undefined) {
  const cleaned = cleanNullable(value)
  if (!cleaned) return null

  // Browser-facing media routes are intentionally short-lived delivery paths.
  // Keep the managed storage reference already saved by the watermark upload.
  if (cleaned.startsWith("/api/media/")) return existingValue ?? null

  return cleaned
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
      workspace: {
        select: {
          slug: true,
          websiteSubdomain: true,
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

function photoFromDb(photo: DbGallery["photos"][number], galleryDeliveryId: string): PortfolioPhoto {
  const metadata = asStringRecord(photo.metadata)
  const externalId = String(metadata.externalId ?? photo.id)

  return {
    blobUrl: photo.originalUrl,
    bytes: numberFromBigInt(photo.bytes) || null,
    camera: typeof metadata.camera === "string" ? metadata.camera : undefined,
    caption: photo.caption ?? undefined,
    category: typeof metadata.category === "string" ? metadata.category : undefined,
    capturedDate: typeof metadata.capturedDate === "string" ? metadata.capturedDate : undefined,
    deliveryUrl: `/api/media/${encodeURIComponent(galleryDeliveryId)}/${encodeURIComponent(externalId)}`,
    displayBytes: numberFromBigInt(photo.displayBytes) || null,
    displayUrl: photo.displayUrl ?? undefined,
    downloadUrl: photo.downloadUrl ?? photo.originalUrl,
    fileName: photo.fileName,
    height: photo.height,
    hidden: photo.isHidden,
    id: externalId,
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
  const photos = gallery.photos
    .filter((photo) => asStringRecord(photo.metadata).assetPurpose !== "website")
    .map((photo) => photoFromDb(photo, gallery.id))
  const coverPhotoMetadata = gallery.coverPhoto ? asStringRecord(gallery.coverPhoto.metadata) : {}
  const coverPhotoId = gallery.coverPhoto
    ? String(coverPhotoMetadata.externalId ?? gallery.coverPhoto.id)
    : undefined
  const legacyShowFileNames = typeof settings.showFileNames === "boolean" ? settings.showFileNames : true
  const photoLabelMode =
    settings.photoLabelMode === "caption" || settings.photoLabelMode === "file-name" || settings.photoLabelMode === "none"
      ? settings.photoLabelMode
      : legacyShowFileNames
        ? "file-name"
        : "none"
  const coverImage =
    (gallery.coverImageUrl ? `/api/media/${encodeURIComponent(gallery.id)}/asset/cover` : undefined) ??
    (gallery.coverPhoto ? getPhotoCover(photoFromDb(gallery.coverPhoto, gallery.id)) : undefined) ??
    getPhotoCover(photos.find(isVisibleRenderableImage)) ??
    fallbackCover

  return {
    allowDownloads: gallery.allowDownloads,
    allowFavorites: settings.allowFavorites as boolean | undefined,
    allowSocialSharing: gallery.allowSocialSharing,
    client: gallery.client?.name ?? "Personal",
    cover: coverImage,
    coverPhotoId,
    description: publicStorageDescription(gallery.description),
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
    seoDescription: typeof settings.seoDescription === "string"
      ? publicStorageDescription(settings.seoDescription)
      : undefined,
    seoTitle: settings.seoTitle as string | undefined,
    showFileNames: typeof settings.showFileNames === "boolean" ? settings.showFileNames : true,
    socialImageUrl: settings.socialImageUrl as string | undefined,
    socialSchedule: settings.socialSchedule ? normalizeSocialSchedule(settings.socialSchedule) : undefined,
    status: statusFromDb[gallery.status],
    url: settings.url as string | undefined,
    watermarkEnabled: gallery.watermarkEnabled,
    watermarkImageUrl: gallery.watermarkImageUrl
      ? `/api/media/${encodeURIComponent(gallery.id)}/asset/watermark`
      : undefined,
    watermarkMode: watermarkModeFromDb[gallery.watermarkMode],
    watermarkOpacity: gallery.watermarkOpacity,
    watermarkPosition: watermarkPositionFromDb[gallery.watermarkPosition],
    watermarkSize: gallery.watermarkSize,
    watermarkText: gallery.watermarkText ?? undefined,
    workspaceSlug: gallery.workspace.slug,
    websiteSubdomain: gallery.workspace.websiteSubdomain ?? undefined,
  }
}

function publicStorageDescription(description: string | null) {
  return (description ?? "").replace(/preserved in Vercel Blob\.?/gi, "preserved securely.")
}

function publicGalleryWithVisiblePhotos(gallery: PortfolioGallery, includeAllVisiblePhotos: boolean) {
  const visiblePhotos = (gallery.photos ?? []).filter(isVisibleRenderableImage)
  const visibleCover = visiblePhotos.find((photo) =>
    photo.id === gallery.coverPhotoId || photoMatchesCover(photo, gallery.cover),
  )
  const replacementCover = gallery.coverPhotoId && !visibleCover ? visiblePhotos[0] : visibleCover

  return {
    ...gallery,
    cover: replacementCover ? getPhotoCover(replacementCover) ?? gallery.cover : gallery.cover,
    coverPhotoId: replacementCover?.id ?? (gallery.coverPhotoId && !visibleCover ? undefined : gallery.coverPhotoId),
    images: visiblePhotos.length,
    photos: includeAllVisiblePhotos
      ? visiblePhotos
      : replacementCover
        ? [replacementCover]
        : [],
  }
}

export async function getWorkspacePortfolioGalleries(workspaceId: string) {
  const galleries = await getWorkspaceGalleriesFromDb(workspaceId)
  return galleries.map(galleryFromDb)
}

export async function getPublicWorkspacePortfolioGalleries(
  requestedWorkspaceSlug: string,
  requestedGallerySlugs?: string[],
  options: { includeVisiblePhotos?: boolean } = {},
) {
  const workspaceSlug = requestedWorkspaceSlug.trim()
  if (!workspaceSlug) return null

  const prisma = getPrismaClient()
  const workspace = await prisma.workspace.findUnique({
    select: { id: true },
    where: { slug: workspaceSlug },
  })
  if (!workspace) return null

  if (requestedGallerySlugs && requestedGallerySlugs.length === 0) return []

  const gallerySlugs = requestedGallerySlugs
    ? Array.from(new Set(requestedGallerySlugs.map((slug) => slug.trim()).filter(Boolean))).slice(0, 100)
    : undefined
  const galleries = await prisma.gallery.findMany({
    include: {
      client: true,
      coverPhoto: true,
      photos: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      workspace: {
        select: {
          slug: true,
          websiteSubdomain: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    where: {
      privacy: {
        in: ["PUBLIC", "UNLISTED", "PASSWORD"],
      },
      ...(gallerySlugs ? { slug: { in: gallerySlugs } } : {}),
      status: {
        not: "ARCHIVED",
      },
      workspaceId: workspace.id,
    },
  })

  return galleries.map(galleryFromDb).map((gallery) =>
    publicGalleryWithVisiblePhotos(gallery, options.includeVisiblePhotos ?? false),
  )
}

export async function getPublicPortfolioGallery(gallerySlug: string, requestedWorkspaceSlug?: string) {
  const workspaceSlug = requestedWorkspaceSlug?.trim()
  if (!workspaceSlug) return null
  const prisma = getPrismaClient()
  const galleries = await prisma.gallery.findMany({
    include: {
      client: true,
      coverPhoto: true,
      photos: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      workspace: {
        select: {
          slug: true,
          websiteSubdomain: true,
        },
      },
    },
    where: {
      privacy: {
        in: ["PUBLIC", "UNLISTED", "PASSWORD"],
      },
      slug: gallerySlug,
      status: {
        not: "ARCHIVED",
      },
      workspace: {
        slug: workspaceSlug,
      },
    },
    take: 1,
  })

  if (!galleries[0]) return null

  return publicGalleryWithVisiblePhotos(galleryFromDb(galleries[0]), true)
}

export async function replaceWorkspacePortfolioGalleries(workspaceId: string, galleries: PortfolioGallery[]) {
  const prisma = getPrismaClient()

  // Browser sync is upsert-only; destructive changes must use an explicit audited delete route.
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
    const watermarkImageUrl = persistedWatermarkReference(gallery.watermarkImageUrl, existing?.watermarkImageUrl)

    const dbGallery = await prisma.gallery.upsert({
      create: {
        allowDownloads: gallery.allowDownloads ?? true,
        allowSocialSharing: gallery.allowSocialSharing ?? true,
        clientId,
        description: cleanNullable(gallery.description),
        name: gallery.name,
        passwordHash,
        privacy: privacyToDb[gallery.privacy],
        settings: gallerySettings(gallery),
        slug,
        status: statusToDb[gallery.status],
        watermarkEnabled: gallery.watermarkEnabled ?? false,
        watermarkImageUrl,
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
        description: cleanNullable(gallery.description),
        name: gallery.name,
        passwordHash,
        privacy: privacyToDb[gallery.privacy],
        settings: gallerySettings(gallery),
        status: statusToDb[gallery.status],
        watermarkEnabled: gallery.watermarkEnabled ?? false,
        watermarkImageUrl,
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

    for (const [index, photo] of (gallery.photos ?? []).entries()) {
      const sourceKey = photo.id || photo.sourceUrl || photo.blobUrl || `${gallery.id}-${index}`
      const dbPhotoId = existing?.photos.find((candidate) => {
        const metadata = asStringRecord(candidate.metadata)
        return metadata.externalId === sourceKey || candidate.sourceUrl === photo.sourceUrl || candidate.originalUrl === photo.blobUrl
      })?.id

      if (!dbPhotoId) continue

      await prisma.photo.update({
        data: {
          caption: cleanNullable(photo.caption),
          isHidden: Boolean(photo.hidden),
          metadata: photoMetadata(photo, sourceKey),
          sortOrder: index,
          title: photo.title || photo.fileName,
        },
        where: {
          id: dbPhotoId,
        },
      })

    }

    const selectedClientCover = gallery.coverPhotoId
      ? gallery.photos?.find((photo) => photo.id === gallery.coverPhotoId && !photo.hidden)
      : undefined
    const selectedCoverPhotoId = selectedClientCover
      ? findStoredCoverPhotoId(existing?.photos ?? [], gallery.coverPhotoId)
      : null
    const coverPhoto = selectedCoverPhotoId
      ? { id: selectedCoverPhotoId }
      : await prisma.photo.findFirst({
          select: { id: true },
          where: {
            galleryId: dbGallery.id,
            isHidden: false,
            OR: [
              { displayUrl: gallery.cover },
              { thumbnailUrl: gallery.cover },
              { originalUrl: gallery.cover },
              { sourceUrl: gallery.cover },
            ],
          },
        })

    const galleryStorage = await prisma.photo.aggregate({
      _sum: {
        bytes: true,
        displayBytes: true,
        thumbnailBytes: true,
      },
      where: {
        galleryId: dbGallery.id,
      },
    })
    const galleryStorageBytes =
      numberFromBigInt(galleryStorage._sum.bytes) +
      numberFromBigInt(galleryStorage._sum.displayBytes) +
      numberFromBigInt(galleryStorage._sum.thumbnailBytes)

    await prisma.gallery.update({
      data: {
        coverPhotoId: coverPhoto?.id ?? null,
        storageUsedBytes: BigInt(galleryStorageBytes),
      },
      where: {
        id: dbGallery.id,
      },
    })
  }

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
