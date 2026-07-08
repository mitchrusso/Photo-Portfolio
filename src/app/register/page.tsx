"use client"

import { ArrowRight, Camera, Check, Image, ShieldCheck, Smartphone, Sparkles } from "lucide-react"
import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import {
  formatMonthlyPlanPrice,
  formatPlanBandwidth,
  formatPlanPrice,
  formatPlanStorage,
  subscriberPlans,
} from "@/lib/plans"
import { trackConversionEvent } from "@/components/analytics/visitor-analytics"

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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual")
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
      billingCycle,
      couponCode: String(formData.get("couponCode") ?? ""),
      storageRequested: String(formData.get("storageRequested") ?? ""),
      studioName: String(formData.get("studioName") ?? ""),
      website: String(formData.get("website") ?? ""),
    }

    trackConversionEvent("CHECKOUT_START", {
      couponCode: payload.couponCode,
      planSlug: payload.planSlug,
      billingCycle,
    })

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
    <main className="min-h-screen bg-[#f7f5f0] px-5 py-8 text-[#1d1d1b] md:px-10">
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
              Give your best photography a beautiful home.
            </h1>
            <p className="mt-5 text-base leading-8 text-[#5f574c]">
              PhotoViewPro is built for serious photographers who want to store, curate, display, and share their favorite work without turning a photo hobby or passion project into complicated business software.
            </p>
            <div className="mt-7 grid gap-4 text-sm text-[#5f574c] sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  icon: Image,
                  title: "Curate your best work",
                  copy: "Choose covers, order images, hide weaker photos, and build portfolios that feel intentional.",
                },
                {
                  icon: Smartphone,
                  title: "Display beautifully",
                  copy: "Swipe-friendly mobile viewing and cinematic desktop layouts keep the photograph first.",
                },
                {
                  icon: Sparkles,
                  title: "Share anywhere",
                  copy: "Send polished links, embed portfolios on your existing site, or publish from phone and Lightroom.",
                },
              ].map(({ copy, icon: Icon, title }) => (
                <div className="rounded-md border border-[#ded6c9] bg-white p-4 shadow-sm" key={title}>
                  <Icon className="size-5 text-[#d8a84f]" />
                  <h2 className="mt-3 font-semibold text-[#1d1d1b]">{title}</h2>
                  <p className="mt-2 leading-6 text-[#6b6257]">{copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
              <ShieldCheck className="size-5 text-[#d8a84f]" />
              <p className="mt-3 text-sm leading-7 text-[#5f574c]">
                Try it free for 14 days. Choose monthly for flexibility or annual to get two months free compared with paying month to month.
              </p>
            </div>
          </section>

          <form className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[#d8a84f]">Create your account</p>
              <h2 className="mt-2 text-2xl font-semibold">Start your PhotoViewPro trial</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b6257]">
                Pick a plan, tell us where to send your account details, and begin building a portfolio that looks intentional everywhere. Every plan includes enough storage for curated publishing, not just a tiny test gallery.
              </p>
            </div>
            <div className="mb-5 rounded-md border border-[#e0bd69] bg-[#fff8e8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#d8a84f]" />
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1b]">No charge today.</p>
                  <p className="mt-1 text-sm leading-6 text-[#6b6257]">
                    A payment method is required to start the 14-day trial, but you will not be charged until the trial ends. Cancel anytime before then and you pay nothing.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                First name
                <input className="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#d8a84f]" name="firstName" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Last name
                <input className="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#d8a84f]" name="lastName" required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Email
                <input className="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#d8a84f]" name="email" required type="email" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Phone
                <input className="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#d8a84f]" name="phone" required type="tel" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Photographer or portfolio name
                <input className="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#d8a84f]" name="studioName" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Website
                <input className="h-11 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#d8a84f]" name="website" placeholder="https://example.com" type="url" />
              </label>
            </div>

            <div className="mt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Choose your plan</p>
                  <p className="mt-1 text-xs text-[#7b7164]">Annual pricing includes two months free.</p>
                </div>
                <div className="grid grid-cols-2 rounded-md border border-[#d7cec0] bg-[#f2eee7] p-1 text-sm">
                  {[
                    ["monthly", "Monthly"],
                    ["annual", "Annual"],
                  ].map(([value, label]) => (
                    <button
                      className={`rounded px-3 py-2 font-semibold transition ${
                        billingCycle === value ? "bg-[#1a211b] text-white" : "text-[#6b6257] hover:text-[#1d1d1b]"
                      }`}
                      key={value}
                      onClick={() => setBillingCycle(value as "monthly" | "annual")}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {subscriberPlans.map((plan) => (
                  <button
                    className={`rounded-md border p-4 text-left transition ${
                      selectedPlan === plan.slug
                        ? "border-[#d8a84f] bg-[#fff8e8] text-black"
                        : "border-[#d7cec0] bg-[#fbfaf7] text-[#1d1d1b] hover:bg-[#f2eee7]"
                    }`}
                    key={plan.slug}
                    onClick={() => setSelectedPlan(plan.slug)}
                    type="button"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{plan.name}</span>
                      {selectedPlan === plan.slug ? <Check className="size-4" /> : null}
                    </span>
                    <span className="mt-3 block text-2xl font-semibold">
                      {billingCycle === "monthly" ? formatMonthlyPlanPrice(plan) : formatPlanPrice(plan)}
                    </span>
                    <span className={`mt-1 block text-xs ${selectedPlan === plan.slug ? "text-black/62" : "text-[#6b6257]"}`}>
                      {formatPlanStorage(plan.storageLimitBytes)} portfolio storage · {formatPlanBandwidth(plan.bandwidthLimitBytes)} monthly bandwidth
                    </span>
                    <span className={`mt-2 block text-xs ${selectedPlan === plan.slug ? "text-black/55" : "text-[#8a8072]"}`}>
                      {billingCycle === "annual"
                        ? "Includes two months free compared with monthly"
                        : `Annual option: ${formatPlanPrice(plan)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <section className="mt-5 rounded-md border border-[#e0bd69] bg-[#fff8e8] p-4">
              <label className="grid gap-2 text-sm font-medium" htmlFor="couponCode">
                <span className="text-base font-semibold text-[#1d1d1b]">Got a Coupon Code?</span>
                <span className="text-sm font-normal leading-6 text-[#6b6257]">
                  Enter it here before checkout. If your code includes free access, we will apply it automatically before sending you to payment.
                </span>
                <input
                  className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 font-normal uppercase outline-none focus:border-[#d8a84f]"
                  id="couponCode"
                  name="couponCode"
                  placeholder="ENTER CODE"
                />
              </label>
            </section>

            <label className="mt-5 grid gap-2 text-sm font-medium">
              Storage note
              <textarea
                className="min-h-20 rounded-md border border-[#d7cec0] bg-[#fbfaf7] p-3 font-normal outline-none focus:border-[#d8a84f]"
                name="storageRequested"
                placeholder="Optional: tell us if you expect to need more than 100 GB/year."
              />
            </label>

            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#6b6257]">
              <input className="mt-1 size-4 accent-[#d8a84f]" name="marketingConsent" type="checkbox" />
              <span>Send me onboarding emails, usage education, and product updates during the trial.</span>
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-md border border-[#d7cec0] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#5f574c]">
              <input className="mt-1 size-4 shrink-0 accent-[#d8a84f]" name="acceptableUse" required type="checkbox" />
              <span>
                I understand that PhotoViewPro is for professional portfolio and photography presentation use, and may not be used to host, stage, or distribute explicit adult content. Violations may result in immediate account closure.
              </span>
            </label>

            <button
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white disabled:opacity-55"
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? "Creating trial..." : "Start my free 14-day trial"}
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
