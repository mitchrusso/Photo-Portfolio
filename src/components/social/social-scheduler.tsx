"use client"

import { CalendarClock, Check, Clock3, Link2, LoaderCircle, Palette, Pause, Play, Save, ShieldCheck, Unplug } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { SafeImage } from "@/components/portfolio/safe-image"
import {
  applySocialCampaignTemplate,
  socialCampaignTemplates,
  type SocialCampaignDesign,
  type SocialCampaignTemplateId,
} from "@/lib/social-campaign-design"
import {
  buildSocialQueue,
  defaultSocialSchedule,
  normalizeSocialSchedule,
  socialScheduleIssue,
  socialPostCaption,
  type SocialQueuePhoto,
  type SocialSchedule,
  type SocialSchedulerNetwork,
} from "@/lib/social-scheduler"

type SchedulerGallery = {
  id: string
  name: string
  photos: SocialQueuePhoto[]
  publicUrl?: string
  socialSchedule?: SocialSchedule
}

type SchedulerNetwork = {
  brandColor: string
  configured: boolean
  id: SocialSchedulerNetwork
  label: string
}

type SocialConnectionSummary = {
  id: string
  network: string
  providerAccountName: string
  status: string
}

type SocialDeliverySummary = {
  attemptCount: number
  connection: { providerAccountName: string }
  id: string
  lastError: string | null
  network: string
  photo: { title: string }
  publishedAt: string | null
  scheduledFor: string
  status: string
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

function CampaignPreview({
  design,
  imageUrl,
}: {
  design: SocialCampaignDesign
  imageUrl?: string
}) {
  const brand = design.showBrand && (
    <span className="absolute bottom-4 left-5 text-[11px] font-bold tracking-wide text-white drop-shadow-sm">PhotoView.io</span>
  )
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#171d19] shadow-sm" data-testid="social-campaign-preview">
      {imageUrl && <SafeImage alt="Campaign design preview" className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 420px" src={imageUrl} />}
      {design.templateId === "gallery-spotlight" && (
        <div className="absolute inset-x-0 bottom-0 min-h-[37%] bg-[#111713]/95 px-5 pb-14 pt-5 text-white">
          <p className="text-xl font-bold leading-tight">{design.headline || "A new collection"}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#e8e3d9]">{design.supportingText}</p>
          {design.ctaLabel && <span className="absolute bottom-4 right-5 rounded bg-[#d8a84f] px-3 py-2 text-xs font-bold text-[#172019]">{design.ctaLabel}</span>}
        </div>
      )}
      {design.templateId === "editorial-story" && (
        <div className="absolute inset-y-0 left-0 w-[38%] bg-[#f6f1e8] px-4 py-7 text-[#182019]">
          <span className="block h-16 w-1.5 bg-[#b58835]" />
          <p className="mt-5 font-serif text-xl font-bold leading-tight">{design.headline || "Behind the frame"}</p>
          <p className="mt-4 line-clamp-4 text-[11px] leading-4 text-[#514b42]">{design.supportingText}</p>
          {design.ctaLabel && <p className="absolute bottom-12 left-4 text-[11px] font-bold text-[#8a6428]">{design.ctaLabel} →</p>}
          {design.showBrand && <span className="absolute bottom-4 left-4 text-[10px] font-bold">PhotoView.io</span>}
        </div>
      )}
      {design.templateId === "client-invitation" && (
        <div className="absolute inset-[9%] flex flex-col justify-center rounded-md border-2 border-[#d8a84f] bg-[#131a16]/85 p-7 text-white">
          <p className="font-serif text-2xl font-bold leading-tight">{design.headline || "Let’s create together"}</p>
          <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#ebe6dc]">{design.supportingText}</p>
          {design.ctaLabel && <span className="mt-5 w-fit rounded bg-[#d8a84f] px-3 py-2 text-xs font-bold text-[#172019]">{design.ctaLabel}</span>}
          {brand}
        </div>
      )}
      {design.templateId === "print-launch" && (
        <>
          <div className="absolute inset-x-0 top-0 bg-[#d8a84f] px-5 py-3 text-[11px] font-bold tracking-[0.24em] text-[#172019]">NEW RELEASE</div>
          <div className="absolute inset-x-0 bottom-0 min-h-[29%] bg-[#f7f3eb] px-5 py-5 text-[#172019]">
            <p className="text-xl font-bold leading-tight">{design.headline || "New limited edition"}</p>
            <p className="mt-2 line-clamp-2 text-[11px] text-[#5d564b]">{design.supportingText}</p>
            {design.ctaLabel && <span className="absolute bottom-5 right-5 rounded bg-[#172019] px-3 py-2 text-[11px] font-bold text-white">{design.ctaLabel}</span>}
          </div>
        </>
      )}
      {design.templateId === "original" && brand}
    </div>
  )
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
  const [connections, setConnections] = useState<SocialConnectionSummary[]>([])
  const [metaConfigured, setMetaConfigured] = useState(false)
  const [activationState, setActivationState] = useState<"idle" | "activating" | "active" | "error">("idle")
  const [activationMessage, setActivationMessage] = useState("")
  const [deliveries, setDeliveries] = useState<SocialDeliverySummary[]>([])
  const visiblePhotos = activeGallery?.photos.filter((photo) => !photo.hidden) ?? []
  const scheduledPhotos = schedule.selectedPhotoIds === null
    ? visiblePhotos
    : visiblePhotos.filter((photo) => schedule.selectedPhotoIds?.includes(photo.id))
  const campaignPreviewPhoto = scheduledPhotos[0] ?? visiblePhotos[0]
  const queue = useMemo(
    () => buildSocialQueue(schedule, activeGallery?.photos ?? [], 18, activeGallery?.publicUrl),
    [activeGallery?.photos, activeGallery?.publicUrl, schedule],
  )
  const issue = socialScheduleIssue(schedule, scheduledPhotos.length)
  const fieldClass = isDark
    ? "border-white/15 bg-white/[0.06] text-white"
    : "border-[#d7d0c4] bg-white text-[#1e211d]"
  const mutedClass = isDark ? "text-white/60" : "text-[#777064]"

  useEffect(() => {
    let cancelled = false
    fetch("/api/social/connections", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Connections could not be loaded.")))
      .then((data: { connections?: SocialConnectionSummary[]; providers?: { meta?: boolean } }) => {
        if (cancelled) return
        setConnections(data.connections ?? [])
        setMetaConfigured(Boolean(data.providers?.meta))
        const result = new URLSearchParams(window.location.search).get("social")
        if (result === "connected") {
          setActivationState("active")
          setActivationMessage("Facebook and Instagram authorization was connected successfully. Choose the account below before activating a plan.")
        } else if (result === "connection-error" || result === "no-eligible-accounts") {
          setActivationState("error")
          setActivationMessage(result === "no-eligible-accounts"
            ? "Meta did not return an eligible Facebook Page or Instagram Professional account."
            : "The Meta authorization could not be completed. Please try connecting again.")
        }
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/social/deliveries?galleryId=${encodeURIComponent(activeGallery?.id ?? "")}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Deliveries could not be loaded.")))
      .then((data: { deliveries?: SocialDeliverySummary[] }) => {
        if (!cancelled) setDeliveries(data.deliveries ?? [])
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [activeGallery?.id])

  if (!activeGallery) return null

  function updateSchedule(update: Partial<SocialSchedule>) {
    setSchedule((current) => ({ ...current, ...update, updatedAt: new Date().toISOString() }))
    setSaveState("idle")
  }

  function updateCampaignDesign(update: Partial<SocialCampaignDesign>) {
    updateSchedule({ campaignDesign: { ...schedule.campaignDesign, ...update } })
  }

  function chooseCampaignTemplate(templateId: SocialCampaignTemplateId) {
    updateSchedule({ campaignDesign: applySocialCampaignTemplate(schedule.campaignDesign, templateId) })
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

  function togglePhoto(photoId: string) {
    const selected = new Set(schedule.selectedPhotoIds ?? visiblePhotos.map((photo) => photo.id))
    if (selected.has(photoId)) selected.delete(photoId)
    else selected.add(photoId)
    updateSchedule({ selectedPhotoIds: [...selected] })
  }

  function toggleConnection(connection: SocialConnectionSummary) {
    const selected = schedule.connectionIds.includes(connection.id)
    const connectionIds = selected
      ? schedule.connectionIds.filter((id) => id !== connection.id)
      : [...schedule.connectionIds, connection.id]
    const stillSelectedForNetwork = connections.some((candidate) =>
      candidate.network === connection.network && connectionIds.includes(candidate.id),
    )
    const networks = selected && !stillSelectedForNetwork
      ? schedule.networks.filter((network) => network !== connection.network)
      : [...new Set([...schedule.networks, connection.network as SocialSchedulerNetwork])]
    updateSchedule({ connectionIds, networks })
  }

  async function disconnectConnection(connectionId: string) {
    const response = await fetch(`/api/social/connections?id=${encodeURIComponent(connectionId)}`, { method: "DELETE" })
    if (!response.ok) {
      setActivationState("error")
      setActivationMessage("The social account could not be disconnected.")
      return
    }
    setConnections((current) => current.filter((connection) => connection.id !== connectionId))
    updateSchedule({ connectionIds: schedule.connectionIds.filter((id) => id !== connectionId) })
    setActivationState("idle")
    setActivationMessage("Social account disconnected. Existing unpublished deliveries for that account will no longer be sent.")
  }

  async function activateSchedule() {
    setActivationState("activating")
    setActivationMessage("")
    const next = normalizeSocialSchedule({ ...schedule, status: "active", updatedAt: new Date().toISOString() })
    try {
      const response = await fetch("/api/social/queue/activate", {
        body: JSON.stringify({ galleryId: activeGallery.id, schedule: next }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const data = await response.json() as { deliveries?: number; error?: string }
      if (!response.ok) throw new Error(data.error || "The publishing queue could not be activated.")
      setSchedule(next)
      onSave(activeGallery.id, next)
      setActivationState("active")
      setActivationMessage(`${data.deliveries ?? 0} scheduled deliveries are ready.`)
      const deliveryResponse = await fetch(`/api/social/deliveries?galleryId=${encodeURIComponent(activeGallery.id)}`, { cache: "no-store" })
      if (deliveryResponse.ok) setDeliveries(((await deliveryResponse.json()) as { deliveries?: SocialDeliverySummary[] }).deliveries ?? [])
    } catch (error) {
      setActivationState("error")
      setActivationMessage(error instanceof Error ? error.message : "The publishing queue could not be activated.")
    }
  }

  async function pauseSchedule() {
    setActivationState("activating")
    const response = await fetch("/api/social/queue/pause", {
      body: JSON.stringify({ galleryId: activeGallery.id }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    const data = await response.json() as { error?: string; schedule?: SocialSchedule }
    if (!response.ok || !data.schedule) {
      setActivationState("error")
      setActivationMessage(data.error || "Publishing could not be paused.")
      return
    }
    setSchedule(data.schedule)
    onSave(activeGallery.id, data.schedule)
    setDeliveries((current) => current.map((delivery) =>
      ["PENDING", "PROCESSING"].includes(delivery.status)
        ? { ...delivery, lastError: "Publishing paused by subscriber.", status: "CANCELED" }
        : delivery,
    ))
    setActivationState("idle")
    setActivationMessage("Publishing paused. No remaining posts in this plan will be sent.")
  }

  const automaticConnectionCount = connections.length
  const statusLabel = schedule.status === "active" ? "Publishing active" : saveState === "saved" ? "Plan saved" : "Draft plan"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-[#b08336]" />
            <h2 className="text-lg font-semibold">Social Scheduler</h2>
          </div>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedClass}`}>
            Turn one portfolio into a paced social series. PhotoView.io follows its display order, skips hidden photos, and stops after the final visible image unless you choose to repeat it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${schedule.status === "active" || saveState === "saved" ? "bg-[#e9f1dc] text-[#466026]" : isDark ? "bg-white/10" : "bg-[#f1eee8] text-[#625d54]"}`}>
            {statusLabel}
          </span>
          <button
            className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${fieldClass}`}
            onClick={() => saveSchedule("draft")}
            type="button"
          >
            <Save className="size-4" />
            Save plan
          </button>
          {schedule.status === "active" ? (
            <button className="flex h-10 items-center gap-2 rounded-md bg-[#735223] px-3 text-sm font-semibold text-white" disabled={activationState === "activating"} onClick={pauseSchedule} type="button">
              {activationState === "activating" ? <LoaderCircle className="size-4 animate-spin" /> : <Pause className="size-4" />}
              Pause publishing
            </button>
          ) : (
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={Boolean(issue) || schedule.connectionIds.length === 0 || activationState === "activating"}
              onClick={activateSchedule}
              type="button"
            >
              {activationState === "activating" ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
              Activate publishing
            </button>
          )}
        </div>
      </div>

      <section className="rounded-md border border-current/10 p-4" aria-labelledby="campaign-designer-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-[#b08336]" />
              <h3 className="text-sm font-semibold" id="campaign-designer-heading">1. Design the campaign</h3>
            </div>
            <p className={`mt-1 text-xs leading-5 ${mutedClass}`}>
              Choose a reusable design, then give viewers a clear message and next step. This design is saved with this portfolio campaign.
            </p>
          </div>
          <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? "bg-white/10" : "bg-[#f1eee8]"}`}>
            {schedule.campaignDesign.campaignName}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Campaign design templates">
          {socialCampaignTemplates.map((template) => {
            const selected = schedule.campaignDesign.templateId === template.id
            return (
              <button
                aria-pressed={selected}
                className={`overflow-hidden rounded-md border text-left transition ${selected ? "border-[#d8a84f] ring-2 ring-[#d8a84f]/20" : "border-current/10"}`}
                key={template.id}
                onClick={() => chooseCampaignTemplate(template.id)}
                type="button"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#171d19]">
                  {campaignPreviewPhoto && <SafeImage alt="" className="object-cover" fill priority={template.id === "original"} sizes="220px" src={campaignPreviewPhoto.imageUrl} />}
                  {template.id === "gallery-spotlight" && <span className="absolute inset-x-0 bottom-0 h-[36%] bg-[#111713]/95" />}
                  {template.id === "editorial-story" && <span className="absolute inset-y-0 left-0 w-[38%] bg-[#f6f1e8]" />}
                  {template.id === "client-invitation" && <span className="absolute inset-[12%] rounded border border-[#d8a84f] bg-[#131a16]/80" />}
                  {template.id === "print-launch" && <><span className="absolute inset-x-0 top-0 h-[18%] bg-[#d8a84f]" /><span className="absolute inset-x-0 bottom-0 h-[31%] bg-[#f7f3eb]" /></>}
                  {selected && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#d8a84f] text-[#172019]"><Check className="size-3.5" /></span>}
                </div>
                <span className="block px-3 py-2">
                  <span className="block text-xs font-semibold">{template.label}</span>
                  <span className={`mt-1 block text-[11px] leading-4 ${mutedClass}`}>{template.description}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <div className="grid content-start gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
              Campaign name
              <input
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                maxLength={120}
                onChange={(event) => updateCampaignDesign({ campaignName: event.target.value })}
                placeholder="Summer print release"
                value={schedule.campaignDesign.campaignName}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
              Headline shown on the design
              <input
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                maxLength={160}
                onChange={(event) => updateCampaignDesign({ headline: event.target.value })}
                placeholder="Tell viewers what this campaign is about"
                value={schedule.campaignDesign.headline}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
              Supporting text
              <textarea
                className={`min-h-24 resize-y rounded-md border px-3 py-2 text-sm font-normal leading-5 outline-none ${fieldClass}`}
                maxLength={400}
                onChange={(event) => updateCampaignDesign({ supportingText: event.target.value })}
                placeholder="Add context, an offer, a date, or anything else the viewer should know."
                value={schedule.campaignDesign.supportingText}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              Call-to-action label
              <input
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                maxLength={80}
                onChange={(event) => updateCampaignDesign({ ctaLabel: event.target.value })}
                placeholder="Book a session"
                value={schedule.campaignDesign.ctaLabel}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              Destination link
              <input
                className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                maxLength={2000}
                onChange={(event) => updateCampaignDesign({ destinationUrl: event.target.value })}
                placeholder={activeGallery.publicUrl || "https://"}
                type="url"
                value={schedule.campaignDesign.destinationUrl}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
              Campaign direction <span className={`font-normal ${mutedClass}`}>(private—not published)</span>
              <textarea
                className={`min-h-20 resize-y rounded-md border px-3 py-2 text-sm font-normal leading-5 outline-none ${fieldClass}`}
                maxLength={1000}
                onChange={(event) => updateCampaignDesign({ directions: event.target.value })}
                placeholder="Example: Encourage architectural clients to view the full gallery and request a quote."
                value={schedule.campaignDesign.directions}
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-md border border-current/10 p-3 text-sm sm:col-span-2">
              <span>
                <span className="font-medium">Show PhotoView.io branding</span>
                <span className={`mt-1 block text-xs ${mutedClass}`}>Add a small, consistent signature to designed posts.</span>
              </span>
              <input checked={schedule.campaignDesign.showBrand} className="size-4 accent-[#d8a84f]" onChange={(event) => updateCampaignDesign({ showBrand: event.target.checked })} type="checkbox" />
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold">Designed post preview</p>
            <CampaignPreview design={schedule.campaignDesign} imageUrl={campaignPreviewPhoto?.imageUrl} />
            <p className={`mt-2 text-[11px] leading-4 ${mutedClass}`}>
              The final social image is generated at 1200 × 1200 pixels. The destination link is added to the post text so viewers can act on it.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-3">
          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">2. Choose the work</p>
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
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className={`text-xs leading-5 ${mutedClass}`}>
                {scheduledPhotos.length} of {visiblePhotos.length} visible photos selected. Hidden photos are never posted.
              </p>
              <div className="flex shrink-0 gap-2 text-xs font-semibold">
                <button onClick={() => updateSchedule({ selectedPhotoIds: visiblePhotos.map((photo) => photo.id) })} type="button">Select all</button>
                <button onClick={() => updateSchedule({ selectedPhotoIds: [] })} type="button">Clear</button>
              </div>
            </div>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1" aria-label="Choose photos to schedule">
              {visiblePhotos.map((photo) => {
                const selected = schedule.selectedPhotoIds === null || schedule.selectedPhotoIds.includes(photo.id)
                return (
                  <label className="flex cursor-pointer items-center gap-3 rounded-md border border-current/10 p-2 text-sm" key={photo.id}>
                    <input checked={selected} className="size-4 accent-[#d8a84f]" onChange={() => togglePhoto(photo.id)} type="checkbox" />
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-black/10">
                      <SafeImage alt="" className="object-cover" fill sizes="40px" src={photo.imageUrl} />
                    </span>
                    <span className="truncate">{photo.title}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">3. Choose the platforms</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {networks.map((network) => {
                const selected = schedule.networks.includes(network.id)
                const configured = network.configured || connections.some((connection) => connection.network === network.id)
                return (
                  <button
                    aria-pressed={selected}
                    className={`flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm transition ${
                      selected ? "border-[#d8a84f] bg-[#fff8e8] text-[#1e211d]" : fieldClass
                    } ${configured ? "" : "opacity-50"}`}
                    disabled={!configured}
                    key={network.id}
                    onClick={() => toggleNetwork(network.id)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: network.brandColor }} />
                      {network.label}
                    </span>
                    {selected ? <Check className="size-4" /> : <span className="text-[10px] uppercase">{configured ? "Choose" : "Set up"}</span>}
                  </button>
                )
              })}
            </div>
            <p className={`mt-3 text-xs leading-5 ${mutedClass}`}>
              Platforms without an account URL are disabled. Add them in Setup first.
            </p>
          </div>

          <div className="rounded-md border border-current/10 p-4">
            <p className="text-sm font-semibold">4. Set the pace</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium sm:col-span-2">
                Days between posting days
                <input
                  className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                  max={30}
                  min={1}
                  onChange={(event) => updateSchedule({ dayInterval: Number(event.target.value) })}
                  type="number"
                  value={schedule.dayInterval}
                />
                <span className={`font-normal ${mutedClass}`}>Use 1 for every day, 2 for every other day, or any interval up to 30 days.</span>
              </label>
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
            <p className="text-sm font-semibold">5. Post details</p>
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
                <span className="font-medium">Use portfolio link when no destination is entered</span>
                <span className={`mt-1 block text-xs leading-5 ${mutedClass}`}>Keep every campaign actionable, even when the designer link is blank.</span>
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
                  Account URLs enable manual sharing today. Automatic publishing requires each platform&apos;s OAuth permission. PhotoView.io will never ask for or store a social-media password.
                </p>
                <p className="mt-2 text-xs font-semibold text-[#735223]">
                  {automaticConnectionCount} platforms authorized for automatic publishing. Save this plan now; it will not publish until a secure connection is added and the subscriber explicitly activates it.
                </p>
                <div className="mt-3 space-y-2">
                  {connections.map((connection) => (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-[#ead29b] bg-white/70 px-3 py-2 text-sm text-[#1e211d]" key={connection.id}>
                      <label className="flex min-w-0 cursor-pointer items-center gap-2">
                        <input
                          checked={schedule.connectionIds.includes(connection.id)}
                          className="size-4 accent-[#d8a84f]"
                          onChange={() => toggleConnection(connection)}
                          type="checkbox"
                        />
                        <span className="truncate"><strong className="capitalize">{connection.network}</strong> · {connection.providerAccountName}</span>
                      </label>
                      <button aria-label={`Disconnect ${connection.providerAccountName}`} className="rounded p-1 text-[#735223]" onClick={() => disconnectConnection(connection.id)} type="button">
                        <Unplug className="size-4" />
                      </button>
                    </div>
                  ))}
                  <a
                    aria-disabled={!metaConfigured}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-md border border-[#cba24d] px-3 text-sm font-semibold ${metaConfigured ? "bg-white text-[#1e211d]" : "pointer-events-none opacity-50"}`}
                    href={metaConfigured ? "/api/social/meta/connect" : undefined}
                  >
                    <Link2 className="size-4" />
                    {connections.length ? "Connect another Facebook or Instagram account" : "Connect Facebook and Instagram"}
                  </a>
                  {!metaConfigured && <p className={`text-xs ${mutedClass}`}>Meta app credentials must be added by PhotoView before subscribers can connect.</p>}
                </div>
              </div>
            </div>
          </div>

          {activationMessage && (
            <div className={`rounded-md border px-3 py-3 text-sm ${activationState === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-[#b8cf8b] bg-[#f1f7e7] text-[#36501f]"}`}>
              {activationMessage}
            </div>
          )}

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
                      <label className={`mt-2 grid gap-1 text-[11px] font-medium ${mutedClass}`}>
                        Exact post text
                        <textarea
                          className={`min-h-20 resize-y rounded-md border px-2 py-2 text-xs leading-5 ${fieldClass}`}
                          maxLength={5000}
                          onChange={(event) => updateSchedule({
                            captionOverrides: { ...schedule.captionOverrides, [post.photoId]: event.target.value },
                          })}
                          value={schedule.captionOverrides[post.photoId] ?? socialPostCaption(
                            activeGallery.photos.find((photo) => photo.id === post.photoId) ?? { id: post.photoId, imageUrl: post.imageUrl, title: "" },
                            schedule.captionMode,
                          )}
                        />
                      </label>
                      {post.linkUrl && <p className={`mt-1 truncate text-[11px] ${mutedClass}`}>Action link added: {post.linkUrl}</p>}
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

          {deliveries.length > 0 && (
            <div className="rounded-md border border-current/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Delivery history</p>
                  <p className={`mt-1 text-xs ${mutedClass}`}>Scheduled, published, canceled, and failed posts remain visible here.</p>
                </div>
                <span className="text-xs font-medium">{deliveries.length} posts</span>
              </div>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {deliveries.slice(0, 30).map((delivery) => (
                  <div className="rounded-md border border-current/10 p-3 text-xs" key={delivery.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">{delivery.photo.title} · {delivery.connection.providerAccountName}</span>
                      <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 font-semibold uppercase">{delivery.status}</span>
                    </div>
                    <p className={`mt-1 ${mutedClass}`}>{new Date(delivery.scheduledFor).toLocaleString()} · <span className="capitalize">{delivery.network}</span></p>
                    {delivery.lastError && <p className="mt-1 text-red-700">{delivery.lastError}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
