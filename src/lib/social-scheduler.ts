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
  captionMode: SocialCaptionMode
  includePortfolioLink: boolean
  intervalHours: number
  networks: SocialSchedulerNetwork[]
  postsPerDay: number
  repeat: boolean
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
  imageUrl: string
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
    captionMode: "caption-and-title",
    includePortfolioLink: true,
    intervalHours: 3,
    networks: [],
    postsPerDay: 1,
    repeat: false,
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

  return {
    captionMode,
    includePortfolioLink: typeof record.includePortfolioLink === "boolean" ? record.includePortfolioLink : true,
    intervalHours: boundedInteger(record.intervalHours, 1, 23, fallback.intervalHours),
    networks: [...new Set(networks)],
    postsPerDay: boundedInteger(record.postsPerDay, 1, 3, fallback.postsPerDay),
    repeat: typeof record.repeat === "boolean" ? record.repeat : false,
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
): ScheduledSocialPost[] {
  const visiblePhotos = photos.filter((photo) => !photo.hidden && photo.imageUrl)
  if (visiblePhotos.length === 0 || schedule.networks.length === 0) return []

  const startAt = new Date(schedule.startAt).getTime()
  const total = schedule.repeat ? Math.max(visiblePhotos.length * 2, limit) : visiblePhotos.length

  return Array.from({ length: Math.min(total, limit) }, (_, index) => {
    const dayIndex = Math.floor(index / schedule.postsPerDay)
    const slotIndex = index % schedule.postsPerDay
    const photo = visiblePhotos[index % visiblePhotos.length]

    return {
      caption: socialPostCaption(photo, schedule.captionMode),
      imageUrl: photo.imageUrl,
      networks: schedule.networks,
      photoId: photo.id,
      publishAt: new Date(startAt + dayIndex * dayMs + slotIndex * schedule.intervalHours * hourMs).toISOString(),
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
