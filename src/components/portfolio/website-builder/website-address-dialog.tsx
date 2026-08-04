"use client"

import { Check, CheckCircle2, Copy, ExternalLink, Globe2, LoaderCircle, RefreshCw, Trash2, TriangleAlert, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export type WebsiteAddressStatus = "idle" | "saving" | "saved" | "error"

type WebsiteAddressDialogProps = {
  addressDraft: string
  addressError: string
  addressStatus: WebsiteAddressStatus
  fieldClass: string
  isDark: boolean
  mutedTextClass: string
  onCancel: () => void
  onChange: (subdomain: string) => void
  onSave: () => void | Promise<void>
  surfaceClass: string
}

type DomainConnectNotice = {
  message: string
  tone: "error" | "pending" | "success"
}

type CustomDomainStatus = {
  active: boolean
  apexName?: string
  checkedAt?: string | null
  configured: boolean
  domain: string | null
  dnsSetup?: {
    automaticSetupAvailable: boolean
    domainConnectDiscovered: boolean
    nameservers: string[]
    providerDashboardUrl: string | null
    providerName: string | null
    setupMode: "automatic" | "guided" | "manual"
  } | null
  dnsRecords: Array<{
    name: string
    type: "A" | "CNAME" | "TXT"
    value: string
  }>
  providerError?: string
  setupAvailable: boolean
  verified: boolean
}

const emptyCustomDomainStatus: CustomDomainStatus = {
  active: false,
  configured: false,
  domain: null,
  dnsSetup: null,
  dnsRecords: [],
  setupAvailable: true,
  verified: false,
}

export function WebsiteAddressDialog({
  addressDraft,
  addressError,
  addressStatus,
  fieldClass,
  isDark,
  mutedTextClass,
  onCancel,
  onChange,
  onSave,
  surfaceClass,
}: WebsiteAddressDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCancelRef = useRef(onCancel)
  const [customDomain, setCustomDomain] = useState("")
  const [customDomainError, setCustomDomainError] = useState("")
  const [customDomainStatus, setCustomDomainStatus] = useState(emptyCustomDomainStatus)
  const [customDomainTask, setCustomDomainTask] = useState<"automatic" | "connecting" | "loading" | "removing" | "verifying" | null>("loading")
  const [copiedRecord, setCopiedRecord] = useState("")
  const [domainConnectNotice, setDomainConnectNotice] = useState<DomainConnectNotice | null>(null)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const focusInput = window.requestAnimationFrame(() => inputRef.current?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancelRef.current()
        return
      }
      if (event.key !== "Tab") return

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusInput)
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    let active = true
    const domainConnectResult = new URLSearchParams(window.location.search).get("domainConnect")
    const notices: Record<string, DomainConnectNotice> = {
      cancelled: {
        message: "Automatic setup was cancelled. No DNS records were changed by PhotoView.",
        tone: "pending",
      },
      connected: {
        message: "Automatic setup completed and the domain is connected.",
        tone: "success",
      },
      "domain-changed": {
        message: "The connected domain changed before automatic setup finished. Review the current domain below.",
        tone: "error",
      },
      "invalid-state": {
        message: "The automatic setup link expired or could not be verified. Start again if needed.",
        tone: "error",
      },
      pending: {
        message: "The provider returned successfully. PhotoView is still waiting for the new DNS records to propagate.",
        tone: "pending",
      },
      "provider-error": {
        message: "The DNS provider could not complete automatic setup. You can retry or use the guided records below.",
        tone: "error",
      },
      "verification-error": {
        message: "PhotoView could not verify the returned DNS change yet. Check the connection again shortly.",
        tone: "error",
      },
    }
    if (domainConnectResult) {
      setDomainConnectNotice(notices[domainConnectResult] ?? null)
      const cleanedUrl = new URL(window.location.href)
      cleanedUrl.searchParams.delete("address")
      cleanedUrl.searchParams.delete("domainConnect")
      window.history.replaceState(window.history.state, "", cleanedUrl)
    }

    void fetch("/api/website/domain", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as CustomDomainStatus & { error?: string }
        if (!response.ok) throw new Error(payload.error || "Could not load the custom-domain status.")
        if (!active) return
        setCustomDomainStatus(payload)
        setCustomDomain(payload.domain ?? "")
      })
      .catch((error) => {
        if (active) setCustomDomainError(error instanceof Error ? error.message : "Could not load the custom-domain status.")
      })
      .finally(() => {
        if (active) setCustomDomainTask(null)
      })

    return () => {
      active = false
    }
  }, [])

  async function submitCustomDomain(method: "PATCH" | "POST") {
    setCustomDomainError("")
    setCustomDomainTask(method === "POST" ? "connecting" : "verifying")
    try {
      const response = await fetch("/api/website/domain", {
        body: method === "POST" ? JSON.stringify({ domain: customDomain }) : undefined,
        credentials: "same-origin",
        headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
        method,
      })
      const payload = await response.json().catch(() => ({})) as CustomDomainStatus & { error?: string }
      if (!response.ok || !payload.domain) {
        throw new Error(payload.error || "The custom domain could not be connected.")
      }
      setCustomDomainStatus(payload)
      setCustomDomain(payload.domain)
    } catch (error) {
      setCustomDomainError(error instanceof Error ? error.message : "The custom domain could not be connected.")
    } finally {
      setCustomDomainTask(null)
    }
  }

  async function removeCustomDomain() {
    if (!window.confirm(`Remove ${customDomainStatus.domain} from this PhotoView website? Your PhotoView.io address will keep working.`)) {
      return
    }

    setCustomDomainError("")
    setCustomDomainTask("removing")
    try {
      const response = await fetch("/api/website/domain", {
        credentials: "same-origin",
        method: "DELETE",
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; removed?: boolean }
      if (!response.ok || !payload.removed) throw new Error(payload.error || "The custom domain could not be removed.")
      setCustomDomain("")
      setCustomDomainStatus(emptyCustomDomainStatus)
    } catch (error) {
      setCustomDomainError(error instanceof Error ? error.message : "The custom domain could not be removed.")
    } finally {
      setCustomDomainTask(null)
    }
  }

  async function startAutomaticSetup() {
    setCustomDomainError("")
    setDomainConnectNotice(null)
    setCustomDomainTask("automatic")
    try {
      const response = await fetch("/api/website/domain/domain-connect", {
        credentials: "same-origin",
        method: "POST",
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; setupUrl?: string }
      if (!response.ok || !payload.setupUrl) {
        throw new Error(payload.error || "Automatic setup could not be started.")
      }
      window.location.assign(payload.setupUrl)
    } catch (error) {
      setCustomDomainError(error instanceof Error ? error.message : "Automatic setup could not be started.")
      setCustomDomainTask(null)
    }
  }

  async function copyRecord(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedRecord(key)
      window.setTimeout(() => setCopiedRecord((current) => current === key ? "" : current), 1800)
    } catch {
      setCustomDomainError("Copy was blocked. Select the DNS value and copy it manually.")
    }
  }

  return (
    <div
      aria-labelledby="publish-setup-title"
      aria-describedby="website-address-description"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className={`max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-md border p-5 shadow-2xl ${surfaceClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Website address</p>
            <h3 className="mt-1 text-xl font-semibold" id="publish-setup-title">Website address</h3>
            <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`} id="website-address-description">Choose where this website will live. These settings are separate from page editing.</p>
          </div>
          <button
            aria-label="Close website address"
            className={`flex size-11 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
            onClick={onCancel}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-1 text-xs font-medium">
            PhotoView.io address
            <div className={`flex h-11 overflow-hidden rounded-md border ${fieldClass}`}>
              <input
                aria-describedby={`website-address-help${addressError ? " website-address-error" : ""}`}
                aria-errormessage={addressError ? "website-address-error" : undefined}
                aria-invalid={addressStatus === "error"}
                autoCapitalize="none"
                autoCorrect="off"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm font-normal outline-none"
                maxLength={63}
                onChange={(event) => onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="yourname"
                ref={inputRef}
                spellCheck={false}
                value={addressDraft}
              />
              <span className={`flex items-center border-l px-3 text-xs ${isDark ? "border-white/15" : "border-[#d7d0c4]"} ${mutedTextClass}`}>.photoview.io</span>
            </div>
            <span className={mutedTextClass} id="website-address-help">Choose a unique address using letters, numbers, or hyphens.</span>
            {addressError ? <span className="font-semibold text-red-600" id="website-address-error" role="alert">{addressError}</span> : null}
          </label>
          <section className={`rounded-md border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-[#ded8cc] bg-[#f7f5f0]"}`} aria-labelledby="custom-domain-title">
            <div className="flex items-start gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${isDark ? "bg-white/10" : "bg-white"}`}>
                <Globe2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-semibold ${isDark ? "text-white" : "text-[#1f211e]"}`} id="custom-domain-title">Purchased custom domain</p>
                  {customDomainStatus.domain ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      customDomainStatus.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}>
                      {customDomainStatus.active ? "Connected" : "Needs DNS"}
                    </span>
                  ) : null}
                </div>
                <p className={`mt-1 text-sm leading-6 ${mutedTextClass}`}>
                  Connect a domain you already own. PhotoView provides the exact DNS records and checks the connection for you.
                </p>
              </div>
            </div>

            {customDomainTask === "loading" ? (
              <p className={`mt-4 flex items-center gap-2 text-sm ${mutedTextClass}`}>
                <LoaderCircle className="size-4 animate-spin" /> Loading domain status…
              </p>
            ) : customDomainStatus.domain ? (
              <div className="mt-4 grid gap-4">
                <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/10" : "border-[#d7d0c4] bg-white"}`}>
                  <p className="break-all text-sm font-semibold">{customDomainStatus.domain}</p>
                  <div className={`mt-2 grid gap-1 text-xs ${mutedTextClass}`}>
                    <p className="flex items-center gap-2">
                      {customDomainStatus.verified ? <CheckCircle2 className="size-4 text-emerald-600" /> : <TriangleAlert className="size-4 text-amber-600" />}
                      Ownership {customDomainStatus.verified ? "verified" : "needs verification"}
                    </p>
                    <p className="flex items-center gap-2">
                      {customDomainStatus.configured ? <CheckCircle2 className="size-4 text-emerald-600" /> : <TriangleAlert className="size-4 text-amber-600" />}
                      DNS {customDomainStatus.configured ? "points to PhotoView" : "needs the records below"}
                    </p>
                  </div>
                </div>

                {customDomainStatus.dnsSetup?.providerName && !customDomainStatus.active ? (
                  <div className={`rounded-md border p-3 ${isDark ? "border-white/10 bg-black/10" : "border-[#d7d0c4] bg-white"}`}>
                    <p className="text-sm font-semibold">
                      DNS provider detected: {customDomainStatus.dnsSetup.providerName}
                    </p>
                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>
                      PhotoView found where this domain&apos;s DNS is managed and tailored the next step for you.
                    </p>
                    {customDomainStatus.dnsSetup.providerDashboardUrl ? (
                      <a
                        className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white"
                        href={customDomainStatus.dnsSetup.providerDashboardUrl}
                        rel="noreferrer"
                        target="_blank"
                        title={`Open ${customDomainStatus.dnsSetup.providerName} DNS management in a new tab`}
                      >
                        Open {customDomainStatus.dnsSetup.providerName}
                        <ExternalLink className="size-4" />
                      </a>
                    ) : null}
                    {customDomainStatus.dnsSetup.automaticSetupAvailable ? (
                      <button
                        className="mt-3 flex h-11 items-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-60"
                        disabled={customDomainTask !== null}
                        onClick={() => void startAutomaticSetup()}
                        title="Review and approve PhotoView DNS records at your provider"
                        type="button"
                      >
                        {customDomainTask === "automatic" ? <LoaderCircle className="size-4 animate-spin" /> : <Globe2 className="size-4" />}
                        Set up automatically
                      </button>
                    ) : null}
                    {customDomainStatus.dnsSetup.domainConnectDiscovered ? (
                      <p className={`mt-3 text-xs leading-5 ${mutedTextClass}`}>
                        {customDomainStatus.dnsSetup.automaticSetupAvailable
                          ? "This provider supports PhotoView's free Domain Connect setup. You will review and approve the DNS changes before they are applied."
                          : "This provider supports the free Domain Connect standard. Guided setup works now; one-click setup will become available after the provider approves PhotoView's connection template."}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {customDomainStatus.dnsRecords.length > 0 && !customDomainStatus.active ? (
                  <div>
                    <p className="text-sm font-semibold">
                      Add these records{customDomainStatus.dnsSetup?.providerName ? ` in ${customDomainStatus.dnsSetup.providerName}` : " where the domain's DNS is managed"}
                    </p>
                    <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>Use the DNS or DNS records area. Remove conflicting A or CNAME records for the same host. Changes can take several minutes or, with some providers, up to 48 hours.</p>
                    <div className="mt-3 grid gap-2">
                      {customDomainStatus.dnsRecords.map((record, index) => {
                        const key = `${record.type}-${record.name}-${index}`
                        return (
                          <div className={`grid gap-2 rounded-md border p-3 sm:grid-cols-[70px_minmax(0,1fr)_minmax(0,2fr)] ${isDark ? "border-white/10" : "border-[#ded8cc]"}`} key={key}>
                            <div>
                              <p className={`text-[10px] uppercase tracking-[0.12em] ${mutedTextClass}`}>Type</p>
                              <p className="mt-1 text-xs font-bold">{record.type}</p>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[10px] uppercase tracking-[0.12em] ${mutedTextClass}`}>Name</p>
                              <p className="mt-1 break-all text-xs font-semibold">{record.name}</p>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[10px] uppercase tracking-[0.12em] ${mutedTextClass}`}>Value</p>
                              <div className="mt-1 flex items-start gap-2">
                                <p className="min-w-0 flex-1 break-all font-mono text-[11px]">{record.value}</p>
                                <button
                                  aria-label={`Copy ${record.type} record value`}
                                  className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
                                  onClick={() => void copyRecord(key, record.value)}
                                  title={copiedRecord === key ? "Copied" : "Copy value"}
                                  type="button"
                                >
                                  {copiedRecord === key ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {customDomainStatus.active ? (
                  <a className="text-sm font-semibold text-emerald-700 underline underline-offset-4" href={`https://${customDomainStatus.domain}`} rel="noreferrer" target="_blank">
                    Open connected website
                  </a>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    className="flex h-11 items-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={customDomainTask !== null || !customDomainStatus.setupAvailable}
                    onClick={() => void submitCustomDomain("PATCH")}
                    title="Recheck domain ownership, DNS records, and certificate readiness"
                    type="button"
                  >
                    {customDomainTask === "verifying" ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Check connection
                  </button>
                  <button
                    className={`flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold ${isDark ? "border-red-400/30 text-red-200" : "border-red-200 text-red-700"}`}
                    disabled={customDomainTask !== null}
                    onClick={() => void removeCustomDomain()}
                    title="Disconnect this purchased domain without unpublishing the PhotoView.io address"
                    type="button"
                  >
                    {customDomainTask === "removing" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Remove domain
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <label className="grid gap-1 text-xs font-medium">
                  Domain you own
                  <input
                    autoCapitalize="none"
                    autoCorrect="off"
                    className={`h-11 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
                    disabled={!customDomainStatus.setupAvailable || customDomainTask !== null}
                    onChange={(event) => {
                      setCustomDomainError("")
                      setCustomDomain(event.target.value.toLowerCase().trim())
                    }}
                    placeholder="example.com"
                    spellCheck={false}
                    value={customDomain}
                  />
                  <span className={mutedTextClass}>Enter the exact address visitors should use. Do not include https:// or a page path.</span>
                </label>
                <button
                  className="mt-3 flex h-11 items-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={!customDomain.trim() || !customDomainStatus.setupAvailable || customDomainTask !== null}
                  onClick={() => void submitCustomDomain("POST")}
                  title="Save this domain and detect its DNS provider"
                  type="button"
                >
                  {customDomainTask === "connecting" ? <LoaderCircle className="size-4 animate-spin" /> : <Globe2 className="size-4" />}
                  Connect domain
                </button>
                {!customDomainStatus.setupAvailable ? (
                  <p className="mt-3 text-sm font-semibold text-amber-700">Custom-domain automation needs administrator configuration before domains can be connected.</p>
                ) : null}
              </div>
            )}

            {customDomainStatus.providerError ? (
              <p className="mt-3 text-sm font-semibold text-amber-700" role="status">{customDomainStatus.providerError}</p>
            ) : null}
            {domainConnectNotice ? (
              <p
                className={`mt-3 text-sm font-semibold ${
                  domainConnectNotice.tone === "success"
                    ? "text-emerald-700"
                    : domainConnectNotice.tone === "pending"
                      ? "text-amber-700"
                      : "text-red-600"
                }`}
                role={domainConnectNotice.tone === "error" ? "alert" : "status"}
              >
                {domainConnectNotice.message}
              </p>
            ) : null}
            {customDomainError ? (
              <p className="mt-3 text-sm font-semibold text-red-600" role="alert">{customDomainError}</p>
            ) : null}
          </section>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className={`h-11 rounded-md border px-4 text-sm font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-11 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-60"
            disabled={addressStatus === "saving" || !addressDraft.trim()}
            onClick={() => void onSave()}
            type="button"
          >
            {addressStatus === "saving" ? "Saving…" : "Save address"}
          </button>
        </div>
      </div>
    </div>
  )
}
