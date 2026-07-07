"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"

const cancellationReasons = [
  "The cost is too high",
  "The service did not work for me",
  "The site lacks a feature I need",
  "I did not have enough time to set it up",
  "I only needed it temporarily",
  "I switched to another platform",
  "Other",
]

export function CancellationSurveyForm({
  defaultEmail,
  subscriptionId,
}: {
  defaultEmail: string
  subscriptionId: string
}) {
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState("")
  const [reason, setReason] = useState(cancellationReasons[0])
  const [submitted, setSubmitted] = useState(false)

  async function submitSurvey() {
    setError("")
    setIsSubmitting(true)

    const response = await fetch("/api/cancel-survey", {
      body: JSON.stringify({
        email,
        notes,
        reason,
        subscriptionId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      setError(body?.error ?? "We could not save that response. Please try again.")
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section className="rounded-md border border-[#ded6c9] bg-white p-6 shadow-sm">
        <CheckCircle2 className="size-9 text-emerald-700" />
        <h2 className="mt-4 text-2xl font-semibold">Thank you. That helps.</h2>
        <p className="mt-3 text-sm leading-6 text-[#6b6257]">
          We saved your feedback. If there is something we can fix or clarify, the PhotoViewPro team can follow up from here.
        </p>
        <Link className="mt-6 inline-flex h-11 items-center rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white" href="/">
          Back to PhotoViewPro
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-md border border-[#ded6c9] bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <label className="grid gap-2 text-sm font-semibold">
          Email address
          <input
            className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-normal outline-none focus:border-[#b58835]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </label>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold">Why did you cancel?</legend>
          <div className="grid gap-2">
            {cancellationReasons.map((item) => (
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#e5ded2] px-3 py-2 text-sm" key={item}>
                <input
                  checked={reason === item}
                  className="size-4 accent-[#1a211b]"
                  name="reason"
                  onChange={() => setReason(item)}
                  type="radio"
                />
                {item}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-2 text-sm font-semibold">
          Anything else we should know?
          <textarea
            className="min-h-32 rounded-md border border-[#d7cec0] bg-white px-3 py-3 text-sm font-normal outline-none focus:border-[#b58835]"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional, but useful. Tell us what would have made PhotoViewPro more valuable for you."
            value={notes}
          />
        </label>

        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={submitSurvey}
          type="button"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Send feedback
        </button>
      </div>
    </section>
  )
}
