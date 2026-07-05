"use client"

import { ArrowRight, Camera, Check, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { formatPlanPrice, formatPlanStorage, subscriberPlans } from "@/lib/plans"

type RegistrationResponse = {
  checkoutUrl?: string | null
  message?: string
  registration?: {
    planName: string
    trialEndsAt: string
  }
}

export default function RegisterPage() {
  const [selectedPlan, setSelectedPlan] = useState(subscriberPlans[0].slug)
  const [status, setStatus] = useState<"idle" | "submitting" | "ready" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const plan = params.get("plan")
    if (plan && subscriberPlans.some((subscriberPlan) => subscriberPlan.slug === plan)) {
      queueMicrotask(() => setSelectedPlan(plan as typeof subscriberPlans[number]["slug"]))
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setMessage("")

    const formData = new FormData(event.currentTarget)
    const payload = {
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      marketingConsent: formData.get("marketingConsent") === "on",
      phone: String(formData.get("phone") ?? ""),
      planSlug: selectedPlan,
      storageRequested: String(formData.get("storageRequested") ?? ""),
      studioName: String(formData.get("studioName") ?? ""),
      website: String(formData.get("website") ?? ""),
    }

    const response = await fetch("/api/trial/register", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })

    const result = await response.json() as RegistrationResponse

    if (!response.ok) {
      setStatus("error")
      setMessage(result.message ?? "Could not create the trial registration.")
      return
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
      return
    }

    setStatus("ready")
    setMessage(result.message ?? "Trial registered. Stripe still needs to be configured.")
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link className="inline-flex items-center gap-3" href="/">
          <span className="flex size-10 items-center justify-center rounded-md bg-[#d8a84f] text-black">
            <Camera className="size-5" />
          </span>
          <span className="font-semibold">PhotoViewPro</span>
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <section>
            <p className="text-sm uppercase tracking-[0.22em] text-[#d8a84f]">14-day free trial</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              Start publishing cinematic portfolios before you pay.
            </h1>
            <p className="mt-5 text-base leading-8 text-white/62">
              We collect the subscriber details needed to create the account, start onboarding, and hand billing to Stripe when the trial converts.
            </p>
            <div className="mt-7 grid gap-3 text-sm text-white/70">
              {[
                "First name, last name, email, and phone for subscriber follow-up.",
                "Studio name and website for account setup and onboarding context.",
                "Stripe collects payment details securely when checkout is configured.",
                "Plan, storage allowance, trial dates, and Stripe ids are tracked for billing and metering.",
              ].map((item) => (
                <div className="flex gap-3" key={item}>
                  <Check className="mt-0.5 size-4 shrink-0 text-[#d8a84f]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-md border border-white/10 bg-white/[0.04] p-5">
              <ShieldCheck className="size-5 text-[#d8a84f]" />
              <p className="mt-3 text-sm leading-7 text-white/62">
                Billing should stay with Stripe for PCI safety. PhotoViewPro stores subscription state, plan, storage entitlement, trial dates, and Stripe customer/subscription ids.
              </p>
            </div>
          </section>

          <form className="rounded-md border border-white/10 bg-[#070707] p-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                First name
                <input className="h-11 rounded-md border border-white/15 bg-black px-3 font-normal outline-none focus:border-[#d8a84f]" name="firstName" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Last name
                <input className="h-11 rounded-md border border-white/15 bg-black px-3 font-normal outline-none focus:border-[#d8a84f]" name="lastName" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Email
                <input className="h-11 rounded-md border border-white/15 bg-black px-3 font-normal outline-none focus:border-[#d8a84f]" name="email" required type="email" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Phone
                <input className="h-11 rounded-md border border-white/15 bg-black px-3 font-normal outline-none focus:border-[#d8a84f]" name="phone" required type="tel" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Studio name
                <input className="h-11 rounded-md border border-white/15 bg-black px-3 font-normal outline-none focus:border-[#d8a84f]" name="studioName" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Website
                <input className="h-11 rounded-md border border-white/15 bg-black px-3 font-normal outline-none focus:border-[#d8a84f]" name="website" placeholder="https://example.com" type="url" />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold">Choose a trial plan</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {subscriberPlans.map((plan) => (
                  <button
                    className={`rounded-md border p-4 text-left transition ${
                      selectedPlan === plan.slug
                        ? "border-[#d8a84f] bg-[#fff8e8] text-black"
                        : "border-white/10 bg-black text-white hover:bg-white/[0.04]"
                    }`}
                    key={plan.slug}
                    onClick={() => setSelectedPlan(plan.slug)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{plan.name}</span>
                    <span className={`mt-1 block text-xs ${selectedPlan === plan.slug ? "text-black/62" : "text-white/55"}`}>
                      {formatPlanPrice(plan)} · {formatPlanStorage(plan.storageLimitBytes)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 grid gap-2 text-sm font-medium">
              Storage note
              <textarea
                className="min-h-20 rounded-md border border-white/15 bg-black p-3 font-normal outline-none focus:border-[#d8a84f]"
                name="storageRequested"
                placeholder="Optional: tell us if you expect to need more than 10 GB/year."
              />
            </label>

            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-white/68">
              <input className="mt-1 size-4 accent-[#d8a84f]" name="marketingConsent" type="checkbox" />
              <span>Send me onboarding emails, usage education, and product updates during the trial.</span>
            </label>

            <button
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black disabled:opacity-55"
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? "Creating trial..." : "Start 14-day trial"}
              <ArrowRight className="size-4" />
            </button>

            {message && (
              <p className={`mt-4 rounded-md border p-3 text-sm leading-6 ${
                status === "error" ? "border-red-400/30 bg-red-400/10 text-red-100" : "border-[#d8a84f]/30 bg-[#d8a84f]/10 text-[#f4d47e]"
              }`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
