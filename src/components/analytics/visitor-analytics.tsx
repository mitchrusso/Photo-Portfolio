"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

const ignoredPathPrefixes = ["/admin", "/dashboard", "/account", "/login", "/register", "/api"]

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function getStoredId(key: string, prefix: string) {
  try {
    const existing = window.localStorage.getItem(key)
    if (existing) return existing

    const id = randomId(prefix)
    window.localStorage.setItem(key, id)
    return id
  } catch {
    return randomId(prefix)
  }
}

function shouldTrack(pathname: string) {
  return !ignoredPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function sendAnalyticsEvent(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" }))
    return
  }

  fetch("/api/analytics/events", {
    body,
    headers: {
      "content-type": "application/json",
    },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined)
}

export function trackConversionEvent(eventType: string, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return

  sendAnalyticsEvent({
    eventType,
    metadata,
    path: window.location.pathname,
    sessionId: getStoredId("photoviewpro-session-id", "session"),
    title: document.title,
    visitorId: getStoredId("photoviewpro-visitor-id", "visitor"),
  })
}

export function VisitorAnalytics() {
  const pathname = usePathname()
  const startedAtRef = useRef<number>(0)
  const previousPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return

    const visitorId = getStoredId("photoviewpro-visitor-id", "visitor")
    const sessionId = getStoredId("photoviewpro-session-id", "session")
    const previousPath = previousPathRef.current
    const now = Date.now()

    if (previousPath && shouldTrack(previousPath)) {
      sendAnalyticsEvent({
        durationMs: now - startedAtRef.current,
        eventType: "PAGE_EXIT",
        path: previousPath,
        sessionId,
        title: document.title,
        visitorId,
      })
    }

    previousPathRef.current = pathname
    startedAtRef.current = now

    sendAnalyticsEvent({
      eventType: "PAGE_VIEW",
      path: pathname,
      referrer: document.referrer,
      sessionId,
      title: document.title,
      visitorId,
    })

    function handleVisibilityChange() {
      if (document.visibilityState !== "hidden") return
      sendAnalyticsEvent({
        durationMs: Date.now() - startedAtRef.current,
        eventType: "PAGE_EXIT",
        path: pathname,
        sessionId,
        title: document.title,
        visitorId,
      })
    }

    window.addEventListener("pagehide", handleVisibilityChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    function handleTrackedClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      const element = target?.closest<HTMLElement>("[data-analytics-event]")
      if (!element) return

      trackConversionEvent(element.dataset.analyticsEvent ?? "SIGNUP_CLICK", {
        label: element.dataset.analyticsLabel ?? element.textContent?.trim()?.slice(0, 80) ?? "",
        target: element.dataset.analyticsTarget ?? element.getAttribute("href") ?? "",
      })
    }

    document.addEventListener("click", handleTrackedClick)

    return () => {
      window.removeEventListener("pagehide", handleVisibilityChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("click", handleTrackedClick)
    }
  }, [pathname])

  return null
}
