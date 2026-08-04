"use client"

import { Bell, Check, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const RELEASE_BUNDLE_ID = "2026-08-04-provider-aware-custom-domains"
const RELEASE_READ_STORAGE_KEY = "photoview:release-notifications:read"
const RELEASE_DISMISSED_STORAGE_KEY = "photoview:release-notifications:dismissed"

type ReleaseNotification = {
  actionHref?: string
  actionLabel?: string
  details?: string[]
  eyebrow: string
  summary: string
  title: string
}

export const releaseNotifications: ReleaseNotification[] = [
  {
    actionHref: "/dashboard?panel=website",
    actionLabel: "Open website builder",
    details: [
      "Connect a domain you already own",
      "Automatic DNS provider detection",
      "Direct link to recognized DNS settings",
      "Exact DNS records with copy buttons",
      "Automatic ownership and connection checks",
      "PhotoView.io address remains available",
    ],
    eyebrow: "Website publishing",
    title: "Self-service custom domains",
    summary: "Connect a purchased domain to a published PhotoView website without a support ticket. PhotoView recognizes many DNS providers, opens the right management area, shows the exact records, verifies the connection, and reports when the domain is live.",
  },
  {
    actionHref: "/dashboard?panel=settings&settings=imports",
    actionLabel: "Open Lightroom setup",
    details: [
      "Up to 50 MB per rendered image",
      "Original rendered file preserved",
      "No resizing or cropping during import",
      "New plug-in update checks",
    ],
    eyebrow: "Lightroom Classic",
    title: "Lightroom Plugin now transfers images up to 50MB",
    summary: "Send large finished photographs directly from Lightroom Classic into a new or existing PhotoView portfolio. The secure direct transfer bypasses ordinary browser upload limits.",
  },
  {
    details: [
      "Cinematic full-screen opening",
      "Scroll-stacked portfolio panels",
      "Continuously moving image strip",
      "Responsive mobile sequence",
    ],
    eyebrow: "Website templates",
    title: "New Scroll Stack portfolio template",
    summary: "Turn selected PhotoView portfolios into an immersive scrolling story. Large project panels layer into view, then lead visitors into a moving strip of additional photographs.",
  },
  {
    eyebrow: "About page",
    title: "Introduce yourself with video",
    summary: "Upload an MP4 or MOV to the About page instead of a still photograph. Visitors receive familiar playback controls, while your saved photo remains available as the poster and fallback.",
  },
  {
    actionHref: "/tutorials",
    actionLabel: "View all tutorials",
    details: [
      "Builder tour",
      "Templates",
      "Brand identity",
      "Homepage",
      "Hero",
      "Featured work",
      "Custom sections",
      "About page",
      "Desktop and mobile",
      "Preview and publish",
    ],
    eyebrow: "Help center",
    title: "Complete illustrated tutorial series",
    summary: "Follow ten step-by-step guides covering the entire My Website workflow, from the first builder tour through previewing, publishing, and future updates.",
  },
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
    details: [
      "Save up to 12 background images",
      "Switch backgrounds without uploading again",
      "Use a solid color without deleting saved images",
      "Adjust brightness and Screen back",
    ],
    eyebrow: "Website design",
    title: "Multiple saved website backgrounds",
    summary: "Build a reusable background collection for one website, switch among saved images whenever you like, or temporarily use a solid color while every uploaded background remains available.",
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
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-[#f0c66f]" : "text-[#9b6d22]"}`}>August 2026 release</p>
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
                {notification.actionHref && notification.actionLabel ? (
                  <a
                    className={`mt-3 inline-flex rounded-md border px-3 py-2 text-xs font-semibold ${
                      isDark ? "border-[#d8a84f]/45 bg-[#d8a84f]/10 text-[#f7dd9a]" : "border-[#b68a3b] bg-[#fff8e8] text-[#755019]"
                    }`}
                    href={notification.actionHref}
                  >
                    {notification.actionLabel}
                  </a>
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
        title={hasUnread ? "Open What's new to review unread PhotoView features" : "Open What's new and revisit recent PhotoView features"}
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
