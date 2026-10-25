"use client"

import { CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"

export function UnsubscribeForm({ token }: { token: string }) {
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function unsubscribe() {
    setError("")
    setIsSubmitting(true)
    const response = await fetch("/api/email/unsubscribe", {
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.error ?? "We could not save your email preference. Please try again.")
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <CheckCircle2 className="size-8" />
        <h2 className="mt-3 text-xl font-semibold">You are unsubscribed.</h2>
        <p className="mt-2 text-sm leading-6">
          PhotoView.io will no longer send tips or product-education emails to this address. Essential account, billing, and security notices may still be sent.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1a211b] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || !token}
        onClick={unsubscribe}
        type="button"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Unsubscribe from tips
      </button>
      {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
    </div>
  )
}
