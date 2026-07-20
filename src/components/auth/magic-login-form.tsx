"use client"

import { Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

type MagicLoginFormProps = {
  defaultEmail?: string
  resend?: boolean
}

export function MagicLoginForm({ defaultEmail = "", resend = false }: MagicLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError("Please enter your subscriber email.")
      return
    }

    setError("")
    setMessage("")
    setSending(true)

    try {
      const response = await fetch("/api/auth/request-magic-link", {
        body: JSON.stringify({ email: normalizedEmail, resend }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        setError(payload?.error ?? "The login email could not be sent. Please try again shortly.")
        return
      }

      if (resend) {
        setMessage("A fresh login email was accepted for delivery.")
      } else {
        router.push(`/login?sent=1&email=${encodeURIComponent(normalizedEmail)}`)
      }
    } catch {
      setError("PhotoView.io could not reach the email service. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (resend) {
    return (
      <form onSubmit={submit}>
        <input name="email" type="hidden" value={email} />
        <button
          className="h-10 w-full rounded-md border border-[#d8cdbd] bg-[#fffdf9] text-sm font-medium text-[#4f4a42] hover:border-[#b7aa96] hover:bg-[#fff8e8] disabled:cursor-wait disabled:opacity-65"
          disabled={sending}
          type="submit"
        >
          {sending ? "Sending…" : "Send a fresh link"}
        </button>
        {error ? (
          <p className="mt-3 rounded-md border border-[#d8a84f]/45 bg-[#fff5d8] px-3 py-2 text-sm text-[#735223]" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 rounded-md border border-[#bdd5c8] bg-[#eef7f3] px-3 py-2 text-sm font-medium text-[#315c48]" role="status">
            {message}
          </p>
        ) : null}
      </form>
    )
  }

  return (
    <form onSubmit={submit}>
      <label className="mt-5 block text-sm font-medium text-[#4f4a42]" htmlFor="email">
        Subscriber email
      </label>
      <div className="mt-2 flex h-12 items-center gap-3 rounded-md border border-[#d8cdbd] bg-[#fffdf9] px-3 focus-within:border-[#b58835] focus-within:ring-2 focus-within:ring-[#d8a84f]/20">
        <Mail className="size-4 text-[#8a8175]" />
        <input
          autoComplete="email"
          className="h-full flex-1 bg-transparent text-sm text-[#1f211e] outline-none placeholder:text-[#a1988b]"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-[#d8a84f]/45 bg-[#fff5d8] px-3 py-2 text-sm text-[#735223]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="mt-5 h-11 w-full rounded-md bg-[#1d2b22] text-sm font-semibold text-white hover:bg-[#293d31] disabled:cursor-wait disabled:opacity-65"
        disabled={sending}
        type="submit"
      >
        {sending ? "Sending secure link…" : "Send secure login link"}
      </button>
    </form>
  )
}
