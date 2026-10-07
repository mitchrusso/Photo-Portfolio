"use client"

import { useEffect, useState } from "react"
import {
  PRIVACY_CONSENT_EVENT,
  PRIVACY_CONSENT_KEY,
  type PrivacyConsent,
  savePrivacyConsent,
} from "@/components/privacy/privacy-consent-manager"

function readConsent(): PrivacyConsent | null {
  try {
    const value = window.localStorage.getItem(PRIVACY_CONSENT_KEY)
    return value === "granted" || value === "denied" ? value : null
  } catch {
    return null
  }
}

export function PrivacyChoiceControls() {
  const [consent, setConsent] = useState<PrivacyConsent | null>(null)
  const [globalPrivacyControl, setGlobalPrivacyControl] = useState(false)

  useEffect(() => {
    const gpc = Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl)
    queueMicrotask(() => {
      setGlobalPrivacyControl(gpc)
      setConsent(gpc ? "denied" : readConsent())
    })

    function handleConsent(event: Event) {
      const value = (event as CustomEvent<PrivacyConsent>).detail
      if (value === "granted" || value === "denied") setConsent(value)
    }
    window.addEventListener(PRIVACY_CONSENT_EVENT, handleConsent)
    return () => window.removeEventListener(PRIVACY_CONSENT_EVENT, handleConsent)
  }, [])

  function choose(value: PrivacyConsent) {
    if (globalPrivacyControl && value === "granted") return
    savePrivacyConsent(value)
    setConsent(value)
  }

  return (
    <section className="rounded-md border border-[#ded8cc] bg-white p-6 shadow-sm" aria-labelledby="analytics-choice-heading">
      <h2 className="text-2xl font-semibold" id="analytics-choice-heading">Optional analytics and advertising</h2>
      <p className="mt-3 leading-7 text-[#514b42]">
        Google Analytics, Rybbit, Meta Pixel, and Reddit Pixel remain off unless you accept. Rejecting them does not affect login, subscriptions, uploads, portfolios, or security features.
      </p>
      {globalPrivacyControl ? (
        <p className="mt-4 rounded-md border border-[#b9c8bf] bg-[#f1f7f4] p-3 text-sm font-semibold text-[#294436]" role="status">
          Your browser is sending Global Privacy Control. Optional analytics are disabled while that signal is active.
        </p>
      ) : null}
      <p className="mt-4 text-sm font-semibold" role="status">
        Current choice: {globalPrivacyControl || consent === "denied" ? "Optional tracking rejected" : consent === "granted" ? "Analytics accepted" : "No choice saved"}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="min-h-11 rounded-md border border-[#a49a8c] px-4 text-sm font-semibold hover:bg-[#f6f3ed]" onClick={() => choose("denied")} type="button">
          Reject optional tracking
        </button>
        <button className="min-h-11 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d] disabled:cursor-not-allowed disabled:opacity-50" disabled={globalPrivacyControl} onClick={() => choose("granted")} type="button">
          Accept analytics
        </button>
      </div>
    </section>
  )
}
