"use client"

import { CalendarClock, Check, Clock3, Pause, Play, Save, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { SafeImage } from "@/components/portfolio/safe-image"
import {
  buildSocialQueue,
  defaultSocialSchedule,
  normalizeSocialSchedule,
  socialScheduleIssue,
  type SocialQueuePhoto,
  type SocialSchedule,
  type SocialSchedulerNetwork,
} from "@/lib/social-scheduler"

type SchedulerGallery = {
  id: string
  name: string
  photos: SocialQueuePhoto[]
  socialSchedule?: SocialSchedule
}

type SchedulerNetwork = {
  brandColor: string
  configured: boolean
  id: SocialSchedulerNetwork
  label: string
}

type SocialSchedulerProps = {
  activeGalleryId: string
  galleries: SchedulerGallery[]
  isDark: boolean
  networks: SchedulerNetwork[]
  onGalleryChange: (galleryId: string) => void
  onSave: (galleryId: string, schedule: SocialSchedule) => void
}

function twoDigits(value: number) {
  return String(value).padStart(2, "0")
}

function localDateValue(iso: string) {
  const date = new Date(iso)
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`
}

function localTimeValue(iso: string) {
  const date = new Date(iso)
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`
}

function localInputsToIso(date: string, time: string) {
  const next = new Date(`${date}T${time || "09:00"}:00`)
  return Number.isNaN(next.getTime()) ? new Date().toISOString() : next.toISOString()
}

export function SocialScheduler({
  activeGalleryId,
  galleries,
  isDark,
  networks,
  onGalleryChange,
  onSave,
}: SocialSchedulerProps) {
  const activeGallery = galleries.find((gallery) => gallery.id === activeGalleryId) ?? galleries[0]
  const [schedule, setSchedule] = useState(() => normalizeSocialSchedule(activeGallery?.socialSchedule))
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle")
  const visiblePhotos = activeGallery?.photos.filter((photo) => !photo.hidden) ?? []
  const queue = useMemo(() => buildSocialQueue(schedule, activeGallery?.photos ?? [], 18), [activeGallery?.photos, schedule])
  const issue = socialScheduleIssue(schedule, visiblePhotos.length)
  const fieldClass = isDark
    ? "border-white/15 bg-white/[0.06] text-white"
    : "border-[#d7d0c4] bg-white text-[#1e211d]"
  const mutedClass = isDark ? "text-white/60" : "text-[#777064]"

  useEffect(() => {
    setSchedule(normalizeSocialSchedule(activeGallery?.socialSchedule))
    setSaveState("idle")
  }, [activeGallery?.id, activeGallery?.socialSchedule])

  if (!activeGallery) return null

  function updateSchedule(update: Partial<SocialSchedule>) {
    setSchedule((current) => ({ ...current, ...update, updatedAt: new Date().toISOString() }))
    setSaveState("idle")
  }

  function saveSchedule(status = schedule.status) {
    const next = normalizeSocialSchedule({ ...schedule, status, updatedAt: new Date().toISOString() })
    setSchedule(next)
    onSave(activeGallery.id, next)
    setSaveState("saved")
  }

  function toggleNetwork(network: SocialSchedulerNetwork) {
    const selected = schedule.networks.includes(network)
    updateSchedule({
      networks: selected
        ? schedule.networks.filter((candidate) => candidate !== network)
        : [...schedule.networks, network],
    })
  }

  const automaticConnectionCount = 0
  const statusLabel = schedule.status === "active" ? "Queue active" : schedule.status === "paused" ? "Paused" : "Draft"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-[#b08336]" />
            <h2 className="text-lg font-semibold">Social Scheduler</h2>
          </div>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedClass}`}>
            Turn one portfolio into a paced social series. PhotoViewPro follows its display order, skips hidden photos, and stops after the final visible image unless you choose to repeat it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${schedule.status === "active" ? "bg-[#e9f1dc] text-[#466026]" : isDark ? "bg-white/10" : "bg-[#f1eee8] text-[#625d54]"}`}>
            {statusLabel}
          </span>
          {saveState === "saved" && <span className="text-xs font-medium text-[#466026]">Saved</span>}
          <button
            className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${fieldClass}`}
            onClick={() => saveSchedule()}
            type="button"
          >
            <Save className="size-4" />
            Save draft
          </button>
          {schedule.status === "active" ? (
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-[#735223] px-3 text-sm font-semibold text-white"
              onClick={() => saveSchedule("paused")}
              type="button"
            >
              <Pause className="size-4" />
              Pause
            </button>
          ) : (
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={Boolean(issue)}
              onClick={() => saveSchedule("active")}
              type="button"
            >
              <Play className="size-4" />
              Activate queue
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-3">
          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">1. Choose the work</p>
            <label className="mt-3 grid gap-1.5 text-xs font-medium">
              Portfolio
              <select
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => onGalleryChange(event.target.value)}
                value={activeGallery.id}
              >
                {galleries.map((gallery) => (
                  <option key={gallery.id} value={gallery.id}>{gallery.name}</option>
                ))}
              </select>
            </label>
            <p className={`mt-2 text-xs leading-5 ${mutedClass}`}>
              {visiblePhotos.length} visible photos will be scheduled. Hidden photos remain in the portfolio but are never posted.
            </p>
          </div>

          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">2. Choose the platforms</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {networks.map((network) => {
                const selected = schedule.networks.includes(network.id)
                return (
                  <button
                    className={`flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm transition ${
                      selected ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d]" : fieldClass
                    } ${network.configured ? "" : "opacity-50"}`}
                    disabled={!network.configured}
                    key={network.id}
                    onClick={() => toggleNetwork(network.id)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: network.brandColor }} />
                      {network.label}
                    </span>
                    {selected ? <Check className="size-4" /> : <span className="text-[10px] uppercase">{network.configured ? "Choose" : "Set up"}</span>}
                  </button>
                )
              })}
            </div>
            <p className={`mt-3 text-xs leading-5 ${mutedClass}`}>
              Platforms without an account URL are disabled. Add them in Setup first.
            </p>
          </div>

          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">3. Set the pace</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium">
                Posts per day
                <select
                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                  onChange={(event) => updateSchedule({ postsPerDay: Number(event.target.value) })}
                  value={schedule.postsPerDay}
                >
                  <option value={1}>1 post per day</option>
                  <option value={2}>2 posts per day</option>
                  <option value={3}>3 posts per day</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium">
                Space posts by
                <select
                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                  disabled={schedule.postsPerDay === 1}
                  onChange={(event) => updateSchedule({ intervalHours: Number(event.target.value) })}
                  value={schedule.intervalHours}
                >
                  {[2, 3, 4, 5, 6, 8, 10, 12].map((hours) => <option key={hours} value={hours}>{hours} hours</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium">
                Start date
                <input
                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                  min={localDateValue(defaultSocialSchedule().startAt)}
                  onChange={(event) => updateSchedule({ startAt: localInputsToIso(event.target.value, localTimeValue(schedule.startAt)) })}
                  type="date"
                  value={localDateValue(schedule.startAt)}
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium">
                First post time
                <input
                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                  onChange={(event) => updateSchedule({ startAt: localInputsToIso(localDateValue(schedule.startAt), event.target.value) })}
                  type="time"
                  value={localTimeValue(schedule.startAt)}
                />
              </label>
            </div>
            <p className={`mt-2 flex items-center gap-2 text-xs ${mutedClass}`}>
              <Clock3 className="size-3.5" />
              Times use {schedule.timezone}.
            </p>
          </div>

          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">4. Post details</p>
            <label className="mt-3 grid gap-1.5 text-xs font-medium">
              Post text
              <select
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                onChange={(event) => updateSchedule({ captionMode: event.target.value as SocialSchedule["captionMode"] })}
                value={schedule.captionMode}
              >
                <option value="caption-and-title">Title and caption</option>
                <option value="caption">Caption, or title when blank</option>
                <option value="title">Title only</option>
              </select>
            </label>
            <label className="mt-3 flex items-start justify-between gap-4 rounded-md border border-current/10 p-3 text-sm">
              <span>
                <span className="font-medium">Include portfolio link</span>
                <span className={`mt-1 block text-xs leading-5 ${mutedClass}`}>Send viewers back to the complete portfolio.</span>
              </span>
              <input checked={schedule.includePortfolioLink} className="mt-1 size-4 accent-[#d8a84f]" onChange={(event) => updateSchedule({ includePortfolioLink: event.target.checked })} type="checkbox" />
            </label>
            <label className="mt-2 flex items-start justify-between gap-4 rounded-md border border-current/10 p-3 text-sm">
              <span>
                <span className="font-medium">Repeat after the last image</span>
                <span className={`mt-1 block text-xs leading-5 ${mutedClass}`}>Off by default so an old portfolio never loops unexpectedly.</span>
              </span>
              <input checked={schedule.repeat} className="mt-1 size-4 accent-[#d8a84f]" onChange={(event) => updateSchedule({ repeat: event.target.checked })} type="checkbox" />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`rounded-md border p-4 ${isDark ? "border-[#d8a84f]/30 bg-[#d8a84f]/10" : "border-[#ead29b] bg-[#fff8e8]"}`}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#99702d]" />
              <div>
                <p className="text-sm font-semibold">Secure publishing connections</p>
                <p className={`mt-1 text-xs leading-5 ${mutedClass}`}>
                  Account URLs enable manual sharing today. Automatic publishing requires each platform&apos;s OAuth permission. PhotoViewPro will never ask for or store a social-media password.
                </p>
                <p className="mt-2 text-xs font-semibold text-[#735223]">
                  {automaticConnectionCount} platforms authorized for automatic publishing. The queue can be prepared now; delivery remains approval-based until authorization is connected.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-current/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Upcoming queue</p>
                <p className={`mt-1 text-xs ${mutedClass}`}>The first 18 scheduled images are shown.</p>
              </div>
              <span className="text-xs font-medium">{queue.length} previewed</span>
            </div>

            {issue ? (
              <div className={`mt-4 rounded-md border px-3 py-3 text-sm ${isDark ? "border-white/15 bg-white/5" : "border-[#e5ded2] bg-[#fbfaf7]"}`}>
                {issue}
              </div>
            ) : (
              <div className="mt-4 max-h-[760px] space-y-2 overflow-y-auto pr-1">
                {queue.map((post) => (
                  <div className="grid grid-cols-[64px_1fr] gap-3 rounded-md border border-current/10 p-2" key={`${post.photoId}-${post.sequence}`}>
                    <div className="relative aspect-square overflow-hidden rounded-sm bg-black/10">
                      <SafeImage alt="" className="object-cover" fill sizes="64px" src={post.imageUrl} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold">Post {post.sequence}</span>
                        <time className={`text-[11px] ${mutedClass}`} dateTime={post.publishAt}>
                          {new Date(post.publishAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </time>
                      </div>
                      <p className={`mt-1 line-clamp-2 text-xs leading-5 ${mutedClass}`}>{post.caption}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.networks.map((network) => (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isDark ? "bg-white/10" : "bg-[#f1eee8]"}`} key={network}>
                            {networks.find((item) => item.id === network)?.label ?? network}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
