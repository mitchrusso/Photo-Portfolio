"use client"

import { ImagePlus, Loader2, X } from "lucide-react"
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { TESTIMONIAL_BODY_MAX_LENGTH, TESTIMONIAL_BODY_MIN_LENGTH } from "@/lib/testimonials"

function BellAndHammer({ className = "size-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <path d="M13 42h35l-5-7V24c0-9-6-15-14-17V3h-8v4C13 9 8 15 8 24v11l-5 7h10Z" fill="#dc3e36" stroke="#8f1713" strokeWidth="2.5" />
      <path d="M18 45c1 6 5 10 9 10s8-4 9-10" fill="#b9231e" />
      <path d="m43 9 12 9" stroke="#6b451b" strokeLinecap="round" strokeWidth="6" />
      <rect fill="#e4ae45" height="13" rx="4" stroke="#9b6518" strokeWidth="2" transform="rotate(36 49 14)" width="18" x="48" y="14" />
      <path d="m5 13-4-3M3 25h-5" stroke="#e4ae45" strokeLinecap="round" strokeWidth="3" />
    </svg>
  )
}

export function TestimonialBell({ isDark, subscriberName }: { isDark: boolean; subscriberName: string }) {
  const nameParts = useMemo(() => subscriberName.trim().split(/\s+/).filter(Boolean), [subscriberName])
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [bodyLength, setBodyLength] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "submitting") return
    setStatus("submitting")
    setMessage("")

    try {
      const response = await fetch("/api/testimonials", { body: new FormData(event.currentTarget), method: "POST" })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || "Your testimonial could not be submitted.")
      setStatus("success")
      setMessage("Thank you. Your story was sent to PhotoView for review.")
      formRef.current?.reset()
      setBodyLength(0)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Your testimonial could not be submitted.")
    }
  }

  return (
    <>
      <button
        aria-label="Share a PhotoView testimonial"
        className={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-left ${isDark ? "border-[#d8a84f]/45 bg-white/[0.06]" : "border-[#d83a32]/55 bg-[#fff8ee]"}`}
        onClick={() => { setStatus("idle"); setMessage(""); setIsOpen(true) }}
        title="Share your PhotoView story"
        type="button"
      >
        <BellAndHammer className="size-7 shrink-0" />
        <span className="hidden leading-tight 2xl:block">
          <span className={`block text-xs font-bold ${isDark ? "text-[#ffd2cc]" : "text-[#722a23]"}`}>Ring the Bell</span>
          <span className={`block text-[10px] ${isDark ? "text-white/55" : "text-[#7a665f]"}`}>Share your story</span>
        </span>
      </button>

      {isOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/70 p-3 sm:p-6" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsOpen(false) }}>
          <section aria-labelledby="testimonial-title" aria-modal="true" className="mx-auto my-0 w-full max-w-2xl rounded-xl border border-[#d8d2c8] bg-[#fffdfa] p-5 text-[#1e211d] shadow-2xl sm:p-7" role="dialog">
            <header className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#fff0e4]"><BellAndHammer className="size-10" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a62b25]">PhotoView.io testimonial</p>
                <h2 className="mt-1 text-2xl font-semibold" id="testimonial-title">Ring the Bell for PhotoView</h2>
                <p className="mt-1 text-sm leading-6 text-[#6b6257]">Tell us what you love—or how PhotoView helped you show your work.</p>
              </div>
              <button aria-label="Close testimonial form" className="grid size-9 shrink-0 place-items-center rounded-md border border-[#ded8cc] bg-white" onClick={() => setIsOpen(false)} type="button"><X className="size-4" /></button>
            </header>

            {status === "success" ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="font-semibold">Your bell has been rung.</p>
                <p className="mt-2 text-sm leading-6">{message}</p>
                <button className="mt-4 h-10 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white" onClick={() => setIsOpen(false)} type="button">Done</button>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)} ref={formRef}>
                {message ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{message}</p> : null}
                <label className="block rounded-lg border border-dashed border-[#cfc6b9] bg-white p-4 text-sm font-semibold">
                  <span className="flex flex-wrap items-center gap-3"><ImagePlus className="size-5 text-[#a62b25]" /> Add your headshot <span className="text-xs font-normal text-[#7b746a]">JPEG, PNG, or WebP · 5 MB maximum</span></span>
                  <input accept="image/jpeg,image/png,image/webp" className="mt-3 block w-full text-sm font-normal" name="headshot" required type="file" />
                </label>
                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <label className="grid gap-2 text-sm font-semibold">First name<input autoComplete="given-name" className="h-11 rounded-md border border-[#d8d2c8] bg-white px-3 font-normal outline-none focus:border-[#b08336]" defaultValue={nameParts[0] || ""} maxLength={60} name="firstName" required /></label>
                  <label className="grid gap-2 text-sm font-semibold">Last initial<input autoComplete="family-name" className="h-11 rounded-md border border-[#d8d2c8] bg-white px-3 font-normal uppercase outline-none focus:border-[#b08336]" defaultValue={(nameParts.at(-1)?.[0] || "").toUpperCase()} maxLength={2} name="lastInitial" required /></label>
                </div>
                <label className="grid gap-2 text-sm font-semibold">Your testimonial<textarea className="min-h-36 resize-y rounded-md border border-[#d8d2c8] bg-white p-3 font-normal leading-6 outline-none focus:border-[#b08336]" maxLength={TESTIMONIAL_BODY_MAX_LENGTH} minLength={TESTIMONIAL_BODY_MIN_LENGTH} name="body" onChange={(event) => setBodyLength(event.target.value.length)} placeholder="What has PhotoView made easier, better, or more enjoyable?" required /><span className="text-right text-xs font-normal text-[#7b746a]">{bodyLength} / {TESTIMONIAL_BODY_MAX_LENGTH}</span></label>
                <label className="flex items-start gap-3 rounded-md bg-[#f7f2e8] p-3 text-sm leading-6"><input className="mt-1 size-4 accent-[#1d2b22]" name="permissionGranted" required type="checkbox" value="true" /><span><strong>PhotoView may feature my testimonial and headshot.</strong><br /><span className="text-[#6b6257]">Only your first name and last initial will be shown publicly.</span></span></label>
                <div className="flex justify-end gap-3">
                  <button className="h-11 rounded-md border border-[#d8d2c8] bg-white px-5 text-sm font-semibold" onClick={() => setIsOpen(false)} type="button">Cancel</button>
                  <button className="flex h-11 items-center gap-2 rounded-md bg-[#d83a32] px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={status === "submitting"} type="submit">{status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : <BellAndHammer className="size-5" />}{status === "submitting" ? "Sending…" : "Ring the Bell & Share"}</button>
                </div>
              </form>
            )}
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
