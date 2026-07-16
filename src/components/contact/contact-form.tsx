"use client"

import { FormEvent, useState } from "react"

type ContactFormProps = {
  buttonClassName?: string
  className?: string
  defaultSubject?: string
  disabled?: boolean
  disabledLabel?: string
  fieldClassName?: string
  messageLabel?: string
  messagePlaceholder?: string
  submitLabel?: string
  workspaceSlug?: string
}

const defaultFieldClassName = "h-11 rounded-md border border-white/10 bg-black px-3 text-sm font-normal outline-none focus:border-[#d8a84f]"

export function ContactForm({
  buttonClassName = "h-11 rounded-md bg-white text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60",
  className = "grid gap-4",
  defaultSubject,
  disabled = false,
  disabledLabel = "Add a contact email to enable this form",
  fieldClassName = defaultFieldClassName,
  messageLabel = "Message",
  messagePlaceholder,
  submitLabel = "Send message",
  workspaceSlug,
}: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || status === "sending") return

    const form = event.currentTarget
    const formData = new FormData(form)
    setStatus("sending")
    setStatusMessage("")

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({
          email: formData.get("email"),
          message: formData.get("message"),
          name: formData.get("name"),
          subject: formData.get("subject"),
          website: formData.get("website"),
          workspaceSlug,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error ?? "The message could not be delivered.")

      form.reset()
      setStatus("sent")
      setStatusMessage("Thank you. Your message was delivered.")
    } catch (error) {
      setStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "The message could not be delivered.")
    }
  }

  return (
    <form className={className} onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium">
        Name
        <input autoComplete="name" className={fieldClassName} maxLength={120} name="name" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input autoComplete="email" className={fieldClassName} maxLength={320} name="email" required type="email" />
      </label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">
        Subject
        <input className={fieldClassName} defaultValue={defaultSubject} maxLength={160} name="subject" />
      </label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">
        {messageLabel}
        <textarea className={`${fieldClassName} min-h-36 py-3`} maxLength={4_000} minLength={10} name="message" placeholder={messagePlaceholder} required />
      </label>
      <label aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        Website
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>
      <button className={`${buttonClassName} md:col-span-2`} disabled={disabled || status === "sending"} type="submit">
        {disabled ? disabledLabel : status === "sending" ? "Sending…" : submitLabel}
      </button>
      {statusMessage ? (
        <p aria-live="polite" className={`text-sm md:col-span-2 ${status === "error" ? "text-red-400" : "text-emerald-400"}`} role="status">
          {statusMessage}
        </p>
      ) : null}
    </form>
  )
}
