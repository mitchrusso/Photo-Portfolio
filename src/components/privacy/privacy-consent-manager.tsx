"use client"

import { GoogleAnalytics } from "@next/third-parties/google"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { useEffect, useState } from "react"
import { MetaPixel } from "@/components/analytics/meta-pixel"
import { RedditPixel } from "@/components/analytics/reddit-pixel"
import { VisitorAnalytics } from "@/components/analytics/visitor-analytics"

export const PRIVACY_CONSENT_KEY = "photoview-analytics-consent"
export const PRIVACY_CONSENT_EVENT = "photoview:privacy-consent"

export type PrivacyConsent = "denied" | "granted"

const excludedTrackingSurfaces = [
  "/account",
  "/admin",
  "/auth",
  "/dashboard",
  "/embed",
  "/g",
  "/login",
  "/mobile",
  "/portfolio",
  "/s",
  "/site",
  "/site-domain",
]

function isTrackingSurface(pathname: string) {
  const hostname = window.location.hostname.toLowerCase()
  const isPhotoViewHost = hostname === "photoview.io" || hostname === "www.photoview.io"
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1"
  const isExcludedPath = excludedTrackingSurfaces.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  return (isPhotoViewHost || isLocalHost) && !isExcludedPath
}

function browserGlobalPrivacyControl() {
  return Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl)
}

function savedConsent(): PrivacyConsent | null {
  const cookieValue = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${PRIVACY_CONSENT_KEY}=`))
    ?.split("=")[1]
  if (cookieValue === "granted" || cookieValue === "denied") return cookieValue

  try {
    const value = window.localStorage.getItem(PRIVACY_CONSENT_KEY)
    return value === "granted" || value === "denied" ? value : null
  } catch {
    return null
  }
}

export function savePrivacyConsent(value: PrivacyConsent) {
  try {
    window.localStorage.setItem(PRIVACY_CONSENT_KEY, value)
  } catch {
    // The essential preference cookie still preserves the visitor's choice.
  }
  document.cookie = `${PRIVACY_CONSENT_KEY}=${value}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`
  window.dispatchEvent(new CustomEvent(PRIVACY_CONSENT_EVENT, { detail: value }))
}

export function PrivacyConsentManager() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<PrivacyConsent | null>(null)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!isTrackingSurface(pathname)) {
      queueMicrotask(() => {
        setActive(false)
        setReady(false)
      })
      return
    }

    const initialConsent = browserGlobalPrivacyControl() ? "denied" : savedConsent()
    if (initialConsent) savePrivacyConsent(initialConsent)
    queueMicrotask(() => {
      setActive(true)
      setConsent(initialConsent)
      setReady(true)
    })

    function handleConsent(event: Event) {
      const value = (event as CustomEvent<PrivacyConsent>).detail
      if (value === "granted" || value === "denied") setConsent(value)
    }

    window.addEventListener(PRIVACY_CONSENT_EVENT, handleConsent)
    return () => window.removeEventListener(PRIVACY_CONSENT_EVENT, handleConsent)
  }, [pathname])

  function choose(value: PrivacyConsent) {
    savePrivacyConsent(value)
    setConsent(value)
  }

  if (!active) return null

  return (
    <>
      {consent === "granted" ? (
        <>
          <Script
            data-site-id="e89f75506464"
            id="rybbit-analytics"
            src="https://app.rybbit.io/api/script.js"
            strategy="lazyOnload"
          />
          <VisitorAnalytics />
          <MetaPixel />
          <RedditPixel />
          <GoogleAnalytics gaId="G-MP96CNX4ZV" />
        </>
      ) : null}

      {ready && consent === null ? (
        <section
          aria-label="Privacy choices"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-[120] mx-auto max-w-3xl rounded-xl border border-[#b9c8bf] bg-white p-5 text-[#1f211e] shadow-2xl md:flex md:items-center md:gap-6"
          role="dialog"
        >
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Your privacy choices</h2>
            <p className="mt-2 text-sm leading-6 text-[#514b42]">
              PhotoView uses optional analytics and advertising tools to understand visits and improve campaigns. They stay off unless you accept. Essential account and security features always work.
            </p>
            <Link className="mt-2 inline-block text-sm font-semibold underline underline-offset-4" href="/privacy-choices">
              Review privacy choices
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row md:mt-0 md:flex-col">
            <button
              className="min-h-11 rounded-md border border-[#a49a8c] px-4 text-sm font-semibold hover:bg-[#f6f3ed]"
              onClick={() => choose("denied")}
              type="button"
            >
              Reject optional tracking
            </button>
            <button
              className="min-h-11 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white hover:bg-[#26382d]"
              onClick={() => choose("granted")}
              type="button"
            >
              Accept analytics
            </button>
          </div>
        </section>
      ) : null}
    </>
  )
}
