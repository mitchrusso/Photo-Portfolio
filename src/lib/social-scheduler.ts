import {
  defaultSocialCampaignDesign,
  normalizeSocialCampaignDesign,
  socialCampaignDestination,
  type SocialCampaignDesign,
} from "./social-campaign-design.ts"

export const socialSchedulerNetworks = [
  "facebook",
  "instagram",
  "linkedin",
  "pinterest",
  "x",
] as const

export type SocialSchedulerNetwork = (typeof socialSchedulerNetworks)[number]
export type SocialScheduleStatus = "draft" | "active" | "paused" | "completed"
export type SocialCaptionMode = "caption" | "title" | "caption-and-title"

export type SocialSchedule = {
  campaignDesign: SocialCampaignDesign
  captionMode: SocialCaptionMode
  captionOverrides: Record<string, string>
  connectionIds: string[]
  dayInterval: number
  includePortfolioLink: boolean
  intervalHours: number
  networks: SocialSchedulerNetwork[]
  postsPerDay: number
  repeat: boolean
  selectedPhotoIds: string[] | null
  startAt: string
  status: SocialScheduleStatus
  timezone: string
  updatedAt: string
}

export type SocialQueuePhoto = {
  caption?: string
  hidden?: boolean
  id: string
  imageUrl: string
  title: string
}

export type ScheduledSocialPost = {
  caption: string
  design: SocialCampaignDesign
  imageUrl: string
  linkUrl?: string
  networks: SocialSchedulerNetwork[]
  photoId: string
  publishAt: string
  sequence: number
}

const dayMs = 24 * 60 * 60 * 1000
const hourMs = 60 * 60 * 1000

function boundedInteger(value: unknown, minimum: number, maximum: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(maximum, Math.max(minimum, Math.round(number)))
}

export function defaultSocialSchedule(now = new Date()): SocialSchedule {
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setHours(9, 0, 0, 0)

  return {
    campaignDesign: defaultSocialCampaignDesign(),
    captionMode: "caption-and-title",
    captionOverrides: {},
    connectionIds: [],
    dayInterval: 1,
    includePortfolioLink: true,
    intervalHours: 3,
    networks: [],
    postsPerDay: 1,
    repeat: false,
    selectedPhotoIds: null,
    startAt: start.toISOString(),
    status: "draft",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    updatedAt: now.toISOString(),
  }
}

export function normalizeSocialSchedule(value: unknown, now = new Date()): SocialSchedule {
  const fallback = defaultSocialSchedule(now)
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback

  const record = value as Record<string, unknown>
  const networks = Array.isArray(record.networks)
    ? record.networks.filter((network): network is SocialSchedulerNetwork =>
        typeof network === "string" && socialSchedulerNetworks.includes(network as SocialSchedulerNetwork),
      )
    : []
  const startAt = typeof record.startAt === "string" && !Number.isNaN(Date.parse(record.startAt))
    ? record.startAt
    : fallback.startAt
  const captionMode =
    record.captionMode === "caption" || record.captionMode === "title" || record.captionMode === "caption-and-title"
      ? record.captionMode
      : fallback.captionMode
  const status =
    record.status === "active" || record.status === "paused" || record.status === "completed" || record.status === "draft"
      ? record.status
      : fallback.status
  const captionOverrides = record.captionOverrides && typeof record.captionOverrides === "object" && !Array.isArray(record.captionOverrides)
    ? Object.fromEntries(Object.entries(record.captionOverrides as Record<string, unknown>)
        .filter(([id, caption]) => Boolean(id.trim()) && typeof caption === "string")
        .map(([id, caption]) => [id, String(caption).slice(0, 5000)]))
    : {}

  return {
    campaignDesign: normalizeSocialCampaignDesign(record.campaignDesign),
    captionMode,
    captionOverrides,
    connectionIds: Array.isArray(record.connectionIds)
      ? [...new Set(record.connectionIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())))]
      : [],
    dayInterval: boundedInteger(record.dayInterval, 1, 30, 1),
    includePortfolioLink: typeof record.includePortfolioLink === "boolean" ? record.includePortfolioLink : true,
    intervalHours: boundedInteger(record.intervalHours, 1, 23, fallback.intervalHours),
    networks: [...new Set(networks)],
    postsPerDay: boundedInteger(record.postsPerDay, 1, 3, fallback.postsPerDay),
    repeat: typeof record.repeat === "boolean" ? record.repeat : false,
    selectedPhotoIds: Array.isArray(record.selectedPhotoIds)
      ? [...new Set(record.selectedPhotoIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())))]
      : null,
    startAt,
    status,
    timezone: typeof record.timezone === "string" && record.timezone.trim() ? record.timezone : fallback.timezone,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : fallback.updatedAt,
  }
}

export function socialPostCaption(photo: SocialQueuePhoto, mode: SocialCaptionMode) {
  const title = photo.title.trim()
  const caption = photo.caption?.trim() ?? ""

  if (mode === "title") return title
  if (mode === "caption") return caption || title
  if (!caption || caption === title) return title
  return `${title}\n\n${caption}`
}

export function buildSocialQueue(
  schedule: SocialSchedule,
  photos: SocialQueuePhoto[],
  limit = 60,
  portfolioUrl?: string,
): ScheduledSocialPost[] {
  const selectedPhotoIds = schedule.selectedPhotoIds === null ? null : new Set(schedule.selectedPhotoIds)
  const visiblePhotos = photos.filter((photo) =>
    !photo.hidden && photo.imageUrl && (selectedPhotoIds === null || selectedPhotoIds.has(photo.id)),
  )
  if (visiblePhotos.length === 0 || schedule.networks.length === 0) return []

  const startAt = new Date(schedule.startAt).getTime()
  const total = schedule.repeat ? Math.max(visiblePhotos.length * 2, limit) : visiblePhotos.length

  return Array.from({ length: Math.min(total, limit) }, (_, index) => {
    const dayIndex = Math.floor(index / schedule.postsPerDay)
    const slotIndex = index % schedule.postsPerDay
    const photo = visiblePhotos[index % visiblePhotos.length]
    const destinationUrl = socialCampaignDestination(
      schedule.campaignDesign,
      schedule.includePortfolioLink ? portfolioUrl : undefined,
    )

    return {
      caption: [
        schedule.captionOverrides[photo.id] ?? socialPostCaption(photo, schedule.captionMode),
        destinationUrl ?? "",
      ].filter(Boolean).join("\n\n"),
      imageUrl: photo.imageUrl,
      design: schedule.campaignDesign,
      linkUrl: destinationUrl,
      networks: schedule.networks,
      photoId: photo.id,
      publishAt: new Date(startAt + dayIndex * schedule.dayInterval * dayMs + slotIndex * schedule.intervalHours * hourMs).toISOString(),
      sequence: index + 1,
    }
  })
}

export function socialScheduleIssue(schedule: SocialSchedule, visiblePhotoCount: number) {
  if (visiblePhotoCount === 0) return "This portfolio has no visible images to schedule."
  if (schedule.networks.length === 0) return "Choose at least one social platform."
  if (Number.isNaN(Date.parse(schedule.startAt))) return "Choose a valid starting date and time."
  if (new Date(schedule.startAt).getTime() < Date.now() - 60_000) return "Choose a starting time in the future."
  if ((schedule.postsPerDay - 1) * schedule.intervalHours >= 24) {
    return "The selected spacing pushes the last post into the next day. Reduce the spacing or posts per day."
  }
  return null
}
