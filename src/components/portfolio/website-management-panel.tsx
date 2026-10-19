"use client"

import { ExternalLink, Globe2, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type WebsiteSummary = {
  billingType: "INCLUDED" | "ADD_ON"
  customDomain: string | null
  id: string
  isPrimary: boolean
  name: string
  status: "DRAFT" | "ACTIVE" | "BILLING_FAILED" | "DISABLED" | "DELETED"
  subdomain: string | null
  url: string | null
}

type WebsiteResponse = {
  billing: {
    additionalWebsiteMonthlyCents: number
    additionalWebsiteQuantity: number
    billingCycle: "ANNUAL" | "MONTHLY" | null
    currentPeriodEnd: string | null
    lifetimeAccess: boolean
    lifetimeAnnualBalanceCents: number | null
    lifetimeAnnualRenewsAt: string | null
    lifetimeBillingChoice: "annual" | "monthly" | null
    subscriptionStatus: string | null
  }
  websites: WebsiteSummary[]
}

export function WebsiteManagementPanel({
  fieldClass,
  mutedTextClass,
  surfaceClass,
}: {
  fieldClass: string
  mutedTextClass: string
  surfaceClass: string
}) {
  const [data, setData] = useState<WebsiteResponse | null>(null)
  const [error, setError] = useState("")
  const [newName, setNewName] = useState("")
  const [names, setNames] = useState<Record<string, string>>({})
  const [subdomains, setSubdomains] = useState<Record<string, string>>({})
  const [billingChoices, setBillingChoices] = useState<Record<string, "annual" | "monthly">>({})
  const [task, setTask] = useState<string | null>("loading")

  const load = useCallback(async () => {
    setTask("loading")
    setError("")
    try {
      const response = await fetch("/api/websites", { cache: "no-store", credentials: "same-origin" })
      const payload = await response.json() as WebsiteResponse & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Websites could not be loaded.")
      setData(payload)
      setNames(Object.fromEntries(payload.websites.map((website) => [website.id, website.name])))
      setSubdomains(Object.fromEntries(payload.websites.map((website) => [website.id, website.subdomain ?? ""])))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Websites could not be loaded.")
    } finally {
      setTask(null)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function createWebsite() {
    if (!newName.trim()) return
    setTask("create")
    setError("")
    try {
      const response = await fetch("/api/websites", {
        body: JSON.stringify({ name: newName }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || "The draft could not be created.")
      setNewName("")
      await load()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The draft could not be created.")
      setTask(null)
    }
  }

  async function renameWebsite(websiteId: string) {
    setTask(`rename:${websiteId}`)
    setError("")
    try {
      const response = await fetch(`/api/websites/${encodeURIComponent(websiteId)}`, {
        body: JSON.stringify({ name: names[websiteId] }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || "The website name could not be saved.")
      await load()
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "The website name could not be saved.")
      setTask(null)
    }
  }

  async function activateWebsite(websiteId: string) {
    const subdomain = subdomains[websiteId]?.trim()
    if (!subdomain) {
      setError("Choose a PhotoView.io address before activation.")
      return
    }
    setTask(`activate:${websiteId}`)
    setError("")
    try {
      const response = await fetch(`/api/websites/${encodeURIComponent(websiteId)}/activate`, {
        body: JSON.stringify({
          ...(data?.billing.lifetimeAccess ? { billingChoice: data.billing.lifetimeBillingChoice ?? billingChoices[websiteId] } : {}),
          subdomain,
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as { checkoutUrl?: string; error?: string }
      if (!response.ok) throw new Error(payload.error || "The website could not be activated.")
      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl)
        return
      }
      await load()
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "The website could not be activated.")
      setTask(null)
    }
  }

  async function deleteWebsite(website: WebsiteSummary) {
    if (!window.confirm(`Delete ${website.name}? Public access will stop immediately. This cannot be undone.`)) return
    setTask(`delete:${website.id}`)
    setError("")
    try {
      const response = await fetch(`/api/websites/${encodeURIComponent(website.id)}`, {
        credentials: "same-origin",
        method: "DELETE",
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error || "The website could not be deleted.")
      await load()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The website could not be deleted.")
      setTask(null)
    }
  }

  const renewalDate = data?.billing.currentPeriodEnd
    ? new Date(data.billing.currentPeriodEnd).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "the next subscription renewal"
  const addOnPrice = data?.billing.billingCycle === "ANNUAL"
    ? "$15.48 per year ($1.29/month equivalent)"
    : "$1.29 per month"

  return (
    <div className={`rounded-md border p-4 shadow-sm ${surfaceClass}`} data-testid="website-management-panel">
      <div className="flex flex-col gap-3 border-b border-current/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="size-5 text-[#99702d]" />
            <h2 className="text-lg font-semibold">My Websites</h2>
          </div>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
            Create as many drafts as you need. Your primary website is included. Each additional live website costs $1.29 per month, consolidated onto the existing subscription.
          </p>
        </div>
        {data && (
          <span className="w-fit rounded-full bg-[#fff8e8] px-3 py-1.5 text-xs font-semibold text-[#735223]">
            {data.billing.additionalWebsiteQuantity} paid add-on{data.billing.additionalWebsiteQuantity === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid gap-1 text-sm font-medium">
          New website name
          <input
            className={`h-11 rounded-md border px-3 font-normal outline-none ${fieldClass}`}
            maxLength={80}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Weddings and events"
            value={newName}
          />
        </label>
        <button
          className="mt-auto flex h-11 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!newName.trim() || task !== null}
          onClick={() => void createWebsite()}
          type="button"
        >
          {task === "create" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create free draft
        </button>
      </div>
      <p className={`mt-2 text-xs leading-5 ${mutedTextClass}`}>Drafts have no public URL and create no charge until activated.</p>

      {task === "loading" && !data ? (
        <div className={`mt-5 flex min-h-40 items-center justify-center rounded-md border border-dashed ${mutedTextClass}`}><Loader2 className="mr-2 size-4 animate-spin" />Loading websites…</div>
      ) : (
        <div className="mt-5 grid gap-4">
          {data?.websites.map((website) => {
            const isActive = website.status === "ACTIVE"
            const isAddOnDraft = website.billingType === "ADD_ON" && !isActive
            return (
              <article className="rounded-md border border-[#e5ded2] p-4" key={website.id}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? "bg-[#edf6e4] text-[#466026]" : "bg-[#f2eee7] text-[#625d54]"}`}>
                        {isActive ? "Live" : "Draft"}
                      </span>
                      {website.isPrimary && <span className="rounded-full bg-[#fff8e8] px-2.5 py-1 text-[11px] font-semibold text-[#735223]">Included primary website</span>}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        aria-label={`Name for ${website.name}`}
                        className={`h-10 rounded-md border px-3 text-sm font-semibold outline-none ${fieldClass}`}
                        maxLength={80}
                        onChange={(event) => setNames((current) => ({ ...current, [website.id]: event.target.value }))}
                        value={names[website.id] ?? website.name}
                      />
                      <button
                        className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7d0c4] px-3 text-sm font-semibold disabled:opacity-50"
                        disabled={!names[website.id]?.trim() || names[website.id] === website.name || task !== null}
                        onClick={() => void renameWebsite(website.id)}
                        type="button"
                      >
                        {task === `rename:${website.id}` ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save name
                      </button>
                    </div>
                    {website.url ? (
                      <a className="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-[#735223] underline underline-offset-4" href={website.url} rel="noreferrer" target="_blank">
                        {website.url}<ExternalLink className="size-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className={`mt-3 text-sm ${mutedTextClass}`}>No public URL while this website is a draft.</p>
                    )}
                    {website.customDomain && <p className={`mt-1 text-xs ${mutedTextClass}`}>Custom domain: {website.customDomain}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <a
                      className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white"
                      href={`/dashboard?panel=website&websiteId=${encodeURIComponent(website.id)}`}
                    >
                      <Pencil className="size-4" /> Edit website
                    </a>
                    {!website.isPrimary && (
                      <button
                        className="flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                        disabled={task !== null}
                        onClick={() => void deleteWebsite(website)}
                        type="button"
                      >
                        {task === `delete:${website.id}` ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
                      </button>
                    )}
                  </div>
                </div>

                {isAddOnDraft && (
                  <div className="mt-4 rounded-md border border-[#d8caa8] bg-[#fffaf0] p-3">
                    <p className="text-sm font-semibold">Activate this website</p>
                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                      Activation assigns the URL immediately. {addOnPrice} is added on {renewalDate}; there is no separate prorated charge today.
                    </p>
                    {data?.billing.lifetimeAccess && (
                      <fieldset className="mt-3 grid gap-2 rounded-md border border-[#e2d7bf] bg-white p-3">
                        <legend className="px-1 text-sm font-semibold">Do you want monthly billing of $1.29 a month, or pay now for the balance of your yearly subscription?</legend>
                        {data.billing.lifetimeBillingChoice ? (
                          <p className={`text-xs ${mutedTextClass}`}>Additional websites use your existing {data.billing.lifetimeBillingChoice} website-billing schedule.</p>
                        ) : (
                          <>
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                              <input checked={billingChoices[website.id] === "monthly"} className="mt-1" name={`billing-${website.id}`} onChange={() => setBillingChoices((current) => ({ ...current, [website.id]: "monthly" }))} type="radio" />
                              <span><strong>$1.29 monthly</strong><br /><span className={mutedTextClass}>Starts now and renews monthly.</span></span>
                            </label>
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                              <input checked={billingChoices[website.id] === "annual"} className="mt-1" name={`billing-${website.id}`} onChange={() => setBillingChoices((current) => ({ ...current, [website.id]: "annual" }))} type="radio" />
                              <span><strong>Pay ${((data.billing.lifetimeAnnualBalanceCents ?? 0) / 100).toFixed(2)} now</strong><br /><span className={mutedTextClass}>Covers the balance through {data.billing.lifetimeAnnualRenewsAt ? new Date(data.billing.lifetimeAnnualRenewsAt).toLocaleDateString() : "your anniversary"}, then $15.48 yearly.</span></span>
                            </label>
                          </>
                        )}
                      </fieldset>
                    )}
                    <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <label className="flex h-11 min-w-0 items-center rounded-md border border-[#d7d0c4] bg-white px-3 text-sm text-[#1e211d]">
                        <input
                          aria-label={`PhotoView address for ${website.name}`}
                          className="min-w-0 flex-1 bg-transparent outline-none"
                          maxLength={63}
                          onChange={(event) => setSubdomains((current) => ({ ...current, [website.id]: event.target.value.toLowerCase() }))}
                          placeholder="weddings"
                          value={subdomains[website.id] ?? ""}
                        />
                        <span className="shrink-0 text-[#70695f]">.photoview.io</span>
                      </label>
                      <button
                        className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-50"
                          disabled={!subdomains[website.id]?.trim() || task !== null || Boolean(data?.billing.lifetimeAccess && !data.billing.lifetimeBillingChoice && !billingChoices[website.id])}
                        onClick={() => void activateWebsite(website.id)}
                        type="button"
                      >
                        {task === `activate:${website.id}` ? <Loader2 className="size-4 animate-spin" /> : <Globe2 className="size-4" />} Activate for $1.29/month
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  )
}
