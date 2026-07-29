"use client"

import { Bell, Check, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const RELEASE_BUNDLE_ID = "2026-07-29-feature-roundup"
const RELEASE_READ_STORAGE_KEY = "photoview:release-notifications:read"
const RELEASE_DISMISSED_STORAGE_KEY = "photoview:release-notifications:dismissed"

type ReleaseNotification = {
  details?: string[]
  eyebrow: string
  summary: string
  title: string
}

export const releaseNotifications: ReleaseNotification[] = [
  {
    eyebrow: "Desktop workflow",
    title: "Multiple Smart Folders",
    summary: "Create separate watched-folder routes for different export folders, portfolios, clients, or websites. One desktop uploader can monitor up to 12 routes.",
  },
  {
    details: [
      "Kinetic Headline",
      "Atelier Split",
      "Triptych Stage",
      "Commercial Casebook",
      "Studio Split",
      "Swiss Sequence",
      "Object Stage",
      "Specimen Wall",
      "Quiet Sequence",
      "Acclaim Portfolio",
    ],
    eyebrow: "Website templates",
    title: "Ten distinctive portfolio experiences",
    summary: "Choose a new visual experience without rebuilding your content. Every template uses the same PhotoView portfolios and adapts to desktop and mobile.",
  },
  {
    details: ["Editorial Story", "Cinematic Chapters", "Museum Index", "Editorial Rail", "Masonry Journal", "Dark Filmstrip", "Coral Panorama"],
    eyebrow: "Website storytelling",
    title: "Story, index, and panorama templates",
    summary: "Present projects as immersive stories, cinematic chapters, exhibition indexes, full-frame journals, filmstrips, or a horizontal panorama contact sheet.",
  },
  {
    eyebrow: "Website builder",
    title: "Custom Home blocks and pages",
    summary: "Add movable Text blocks and curated Portfolio grids to Home, create up to five independent custom pages, and choose Adaptive Width or Full Screen.",
  },
  {
    eyebrow: "Live embeds",
    title: "Multiple embed profiles",
    summary: "Save separate named embed tabs for different websites, Shopify placements, products, partners, or campaigns while managing every image from PhotoView.",
  },
  {
    eyebrow: "Website design",
    title: "Background images and display controls",
    summary: "Upload a website background image, adjust its brightness and screen-back blend, and use full-frame grids that preserve portrait, landscape, square, and panoramic photographs.",
  },
  {
    eyebrow: "Privacy",
    title: "Gallery and Portfolio two-factor protection",
    summary: "Add a password and email verification to protected Galleries and Portfolios when client work needs an additional layer of access control.",
  },
  {
    eyebrow: "Affiliate workflow",
    title: "Quick Add Gear",
    summary: "Turn a plain-English equipment list into reviewable camera, lens, and accessory tiles with retailer images, descriptions, and approved affiliate links.",
  },
  {
    eyebrow: "Publishing",
    title: "Smarter articles and social campaigns",
    summary: "Schedule approved educational articles, build reusable social campaign designs, and keep PhotoView links, calls to action, and selected photographs connected.",
  },
]

export function ReleaseNotifications({ isDark }: { isDark: boolean }) {
  const [hasUnread, setHasUnread] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initializationTimer = window.setTimeout(() => {
      const readBundle = window.localStorage.getItem(RELEASE_READ_STORAGE_KEY)
      const dismissedBundle = window.localStorage.getItem(RELEASE_DISMISSED_STORAGE_KEY)
      setHasUnread(readBundle !== RELEASE_BUNDLE_ID && dismissedBundle !== RELEASE_BUNDLE_ID)
    }, 0)
    return () => window.clearTimeout(initializationTimer)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", closeOnEscape)
    window.addEventListener("mousedown", closeOnOutsideClick)
    return () => {
      window.removeEventListener("keydown", closeOnEscape)
      window.removeEventListener("mousedown", closeOnOutsideClick)
    }
  }, [isOpen])

  const openNotifications = () => {
    setIsOpen((current) => {
      const nextValue = !current
      if (nextValue && hasUnread) {
        window.localStorage.setItem(RELEASE_READ_STORAGE_KEY, RELEASE_BUNDLE_ID)
        setHasUnread(false)
      }
      return nextValue
    })
  }

  const dismissNotifications = () => {
    window.localStorage.setItem(RELEASE_READ_STORAGE_KEY, RELEASE_BUNDLE_ID)
    window.localStorage.setItem(RELEASE_DISMISSED_STORAGE_KEY, RELEASE_BUNDLE_ID)
    setHasUnread(false)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const panel = isOpen
    ? createPortal(
        <div
          aria-label="What's new in PhotoView.io"
          aria-modal="false"
          className={`fixed right-4 top-16 z-[120] flex max-h-[calc(100vh-5rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(20,24,20,0.28)] ${
            isDark ? "border-white/15 bg-[#111310] text-white" : "border-[#d8d0c3] bg-[#fffdf8] text-[#1e211d]"
          }`}
          data-testid="release-notifications-panel"
          ref={panelRef}
          role="dialog"
        >
          <div className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${isDark ? "border-white/10" : "border-[#e2dbcf]"}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-[#f0c66f]" : "text-[#9b6d22]"}`}>July 2026 release</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
                <Sparkles className="size-5 text-[#c58b25]" />
                What&apos;s new
              </h2>
              <p className={`mt-1 text-sm leading-5 ${isDark ? "text-white/60" : "text-[#6f685d]"}`}>New ways to automate, publish, protect, and present your photography.</p>
            </div>
            <button
              aria-label="Close notifications"
              className={`grid size-9 shrink-0 place-items-center rounded-md border ${isDark ? "border-white/15 bg-white/[0.05]" : "border-[#d8d0c3] bg-white"}`}
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="overscroll-contain overflow-y-auto" data-testid="release-notifications-list">
            {releaseNotifications.map((notification) => (
              <article className={`border-b px-5 py-4 ${isDark ? "border-white/10" : "border-[#e8e1d6]"}`} key={notification.title}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-[#f0c66f]" : "text-[#9b6d22]"}`}>{notification.eyebrow}</p>
                <h3 className="mt-1 text-base font-semibold">{notification.title}</h3>
                <p className={`mt-1.5 text-sm leading-6 ${isDark ? "text-white/65" : "text-[#625c52]"}`}>{notification.summary}</p>
                {notification.details ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {notification.details.map((detail) => (
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isDark ? "border-white/15 bg-white/[0.05] text-white/75" : "border-[#d9d1c3] bg-white text-[#5f584d]"}`} key={detail}>
                        {detail}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className={`sticky bottom-0 border-t p-4 ${isDark ? "border-white/10 bg-[#111310]" : "border-[#d8d0c3] bg-[#fffdf8]"}`}>
            <button
              className={`flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold ${
                isDark ? "border-[#d8a84f]/45 bg-[#d8a84f]/15 text-[#f7dd9a]" : "border-[#1f2a24] bg-[#1f2a24] text-white"
              }`}
              data-testid="dismiss-release-notifications"
              onClick={dismissNotifications}
              type="button"
            >
              <Check className="size-4" />
              Dismiss
            </button>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={hasUnread ? "New PhotoView notifications" : "PhotoView notifications"}
        className={`relative grid size-10 shrink-0 place-items-center rounded-md border transition ${
          hasUnread
            ? isDark
              ? "border-[#d84a40]/60 bg-[#b42318]/15 text-[#ff827a]"
              : "border-[#d84a40] bg-[#fff0ee] text-[#b42318]"
            : isDark
              ? "border-white/15 bg-white/10 text-white"
              : "border-[#d4cdc0] bg-white text-[#1e211d]"
        }`}
        data-testid="release-notifications-button"
        onClick={openNotifications}
        ref={buttonRef}
        title={hasUnread ? "New PhotoView features" : "PhotoView notifications"}
        type="button"
      >
        <span className={hasUnread ? "photoview-notification-bell-unread" : ""}>
          <Bell className="size-4" />
        </span>
        {hasUnread ? <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#d92d20] ring-2 ring-white" /> : null}
      </button>
      {panel}
    </>
  )
}
