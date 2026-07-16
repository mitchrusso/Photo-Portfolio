"use client"

import { useState } from "react"
import { LoaderCircle, MessageSquareText, ShieldCheck } from "lucide-react"

export function MfaForm({ maskedPhone, nextPath }: { maskedPhone: string; nextPath: string }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [verifying, setVerifying] = useState(false)

  async function sendCode() {
    setError("")
    setSending(true)
    try {
      const response = await fetch("/api/admin/mfa/send", { method: "POST" })
      const body = await response.json().catch(() => ({})) as { alreadyVerified?: boolean; error?: string }
      if (!response.ok) throw new Error(body.error || "The code could not be sent.")
      if (body.alreadyVerified) {
        window.location.assign(nextPath)
        return
      }
      setSent(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code could not be sent.")
    } finally {
      setSending(false)
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setVerifying(true)
    try {
      const response = await fetch("/api/admin/mfa/verify", {
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const body = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(body.error || "The code could not be verified.")
      window.location.assign(nextPath)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code could not be verified.")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-md border border-[#ded6c9] bg-[#fbfaf7] p-4">
        <MessageSquareText className="size-5 text-[#b58835]" />
        <p className="mt-3 text-sm leading-6 text-[#6b6257]">
          Send a one-time security code to the SuperAdmin phone ending in <span className="font-semibold text-[#1d1d1b]">{maskedPhone.slice(-4)}</span>.
        </p>
      </div>

      {sent ? (
        <form className="mt-5" onSubmit={verifyCode}>
          <label className="block text-sm font-semibold text-[#3a362f]" htmlFor="mfa-code">Security code</label>
          <input
            autoComplete="one-time-code"
            autoFocus
            className="mt-2 h-12 w-full rounded-md border border-[#d7cec0] bg-white px-4 text-lg tracking-[0.3em] outline-none focus:border-[#b58835]"
            id="mfa-code"
            inputMode="numeric"
            maxLength={10}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            value={code}
          />
          <button
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a211b] text-sm font-semibold text-white disabled:opacity-60"
            disabled={verifying || code.length < 4}
            type="submit"
          >
            {verifying ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Verify and open SuperAdmin
          </button>
          <button className="mt-3 h-10 w-full text-sm font-medium text-[#6b6257] hover:text-[#1d1d1b]" disabled={sending} onClick={sendCode} type="button">
            Send a new code
          </button>
        </form>
      ) : (
        <button
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a211b] text-sm font-semibold text-white disabled:opacity-60"
          disabled={sending}
          onClick={sendCode}
          type="button"
        >
          {sending ? <LoaderCircle className="size-4 animate-spin" /> : <MessageSquareText className="size-4" />}
          Send security code
        </button>
      )}

      {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
    </div>
  )
}
