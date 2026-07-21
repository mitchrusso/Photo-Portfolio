"use client"

import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Gift,
  Loader2,
  Paperclip,
  X,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

type FeedbackType = "bug" | "improvement" | "question" | "feedback"

type FeedbackAttachment = {
  base64: string
  contentType: string
  filename: string
  size: number
}

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 3 * 1024 * 1024
const FEEDBACK_ATTACHMENT_ACCEPT = "image/jpeg,image/png,image/webp,text/plain,.jpg,.jpeg,.png,.webp,.txt"
const feedbackDestinations = ["/dashboard", "/account", "/admin"]
const modernColorFunctionPattern = /\b(?:lab|lch|oklab|oklch)\([^)]*\)/gi

function dataUrlToBase64(dataUrl: string) {
  const marker = "base64,"
  const markerIndex = dataUrl.indexOf(marker)
  return markerIndex >= 0 ? dataUrl.slice(markerIndex + marker.length) : dataUrl
}

function fileToAttachment(file: File): Promise<FeedbackAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read the selected file."))
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      resolve({
        base64: dataUrlToBase64(result),
        contentType: file.type || "application/octet-stream",
        filename: file.name || "attachment",
        size: file.size,
      })
    }
    reader.readAsDataURL(file)
  })
}

function createScreenshotColorNormalizer() {
  const canvas = document.createElement("canvas")
  canvas.height = 1
  canvas.width = 1
  const context = canvas.getContext("2d", { willReadFrequently: true })

  return (value: string) => {
    if (!context || !/(?:lab|lch|oklab|oklch)\(/i.test(value)) return value

    return value.replace(modernColorFunctionPattern, (color) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = "#000000"
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
      return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`
    })
  }
}

function normalizeScreenshotCloneColors(clonedDocument: Document, normalizeColor: (value: string) => string) {
  const cloneWindow = clonedDocument.defaultView
  if (!cloneWindow) return

  clonedDocument.querySelectorAll<HTMLElement>("*").forEach((element) => {
    const computedStyle = cloneWindow.getComputedStyle(element)

    Array.from(computedStyle).forEach((property) => {
      const value = computedStyle.getPropertyValue(property)
      const normalizedValue = normalizeColor(value)
      if (normalizedValue !== value) element.style.setProperty(property, normalizedValue, "important")
    })
  })
}

function normalizeLiveScreenshotColors(normalizeColor: (value: string) => string) {
  const restore: Array<{
    element: HTMLElement
    priority: string
    property: string
    value: string
  }> = []

  document.querySelectorAll<HTMLElement>("*").forEach((element) => {
    const computedStyle = window.getComputedStyle(element)

    Array.from(computedStyle).forEach((property) => {
      const value = computedStyle.getPropertyValue(property)
      const normalizedValue = normalizeColor(value)
      if (normalizedValue === value) return

      restore.push({
        element,
        priority: element.style.getPropertyPriority(property),
        property,
        value: element.style.getPropertyValue(property),
      })
      element.style.setProperty(property, normalizedValue, "important")
    })
  })

  return () => {
    restore.forEach(({ element, priority, property, value }) => {
      if (value) element.style.setProperty(property, value, priority)
      else element.style.removeProperty(property)
    })
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not prepare an image for the screenshot."))
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
    reader.readAsDataURL(blob)
  })
}

async function inlineScreenshotImages() {
  const restore: Array<{
    element: HTMLImageElement
    sizes: string | null
    src: string | null
    srcset: string | null
  }> = []

  await Promise.all(Array.from(document.images).map(async (element) => {
    const source = element.currentSrc || element.src
    if (!source || source.startsWith("data:") || source.startsWith("blob:")) return

    try {
      const response = await fetch(source, { credentials: "same-origin" })
      if (!response.ok) return
      const dataUrl = await blobToDataUrl(await response.blob())
      if (!dataUrl) return

      restore.push({
        element,
        sizes: element.getAttribute("sizes"),
        src: element.getAttribute("src"),
        srcset: element.getAttribute("srcset"),
      })
      element.removeAttribute("srcset")
      element.removeAttribute("sizes")
      element.src = dataUrl
      await element.decode().catch(() => undefined)
    } catch {
      // A screenshot should still work when one optional remote image cannot be inlined.
    }
  }))

  return () => {
    restore.forEach(({ element, sizes, src, srcset }) => {
      if (src === null) element.removeAttribute("src")
      else element.setAttribute("src", src)
      if (srcset === null) element.removeAttribute("srcset")
      else element.setAttribute("srcset", srcset)
      if (sizes === null) element.removeAttribute("sizes")
      else element.setAttribute("sizes", sizes)
    })
  }
}

function suppressScreenshotPseudoElements() {
  const style = document.createElement("style")
  style.dataset.feedbackCaptureIgnore = "true"
  style.textContent = "*::before, *::after { content: none !important; }"
  document.head.appendChild(style)
  return () => style.remove()
}

export function SubscriberFeedback() {
  const pathname = usePathname()
  const { data: session, status: sessionStatus } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType | "">("")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [screenshot, setScreenshot] = useState<FeedbackAttachment | null>(null)
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([])
  const [capturing, setCapturing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const launcherButtonRef = useRef<HTMLButtonElement>(null)

  const isSubscriberScreen = feedbackDestinations.some((destination) =>
    pathname === destination || pathname.startsWith(`${destination}/`),
  )
  // Subscriber shortcuts belong to the working dashboard only. They must not
  // appear over login, account, SuperAdmin, or MFA security screens.
  const showFloatingShortcuts = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
  const canSubmit = Boolean(type && message.trim() && !submitting)
  const totalAttachmentBytes = useMemo(
    () => attachments.reduce((sum, attachment) => sum + attachment.size, 0),
    [attachments],
  )

  useEffect(() => {
    if (!isOpen) return
    setEmail(session?.user?.email ?? "")
    setName(session?.user?.name ?? "")
    closeButtonRef.current?.focus()
    const launcherButton = launcherButtonRef.current

    const handleDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        return
      }
      if (event.key !== "Tab") return

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      const first = focusable.at(0)
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleDialogKeyboard)
    return () => {
      document.removeEventListener("keydown", handleDialogKeyboard)
      launcherButton?.focus()
    }
  }, [isOpen, session?.user?.email, session?.user?.name])

  useEffect(() => {
    if (isOpen) return
    setError("")
    setSuccess("")
  }, [isOpen])

  useEffect(() => {
    if (!showFloatingShortcuts) setIsOpen(false)
  }, [showFloatingShortcuts])

  async function captureScreenshot() {
    if (capturing) return
    setCapturing(true)
    setError("")

    try {
      const { default: html2canvas } = await import("html2canvas")
      const normalizeColor = createScreenshotColorNormalizer()
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      const hiddenElements = Array.from(document.querySelectorAll<HTMLElement>("[data-feedback-capture-hide]"))
      const previousVisibility = hiddenElements.map((element) => ({
        element,
        opacity: element.style.opacity,
        pointerEvents: element.style.pointerEvents,
        visibility: element.style.visibility,
      }))

      hiddenElements.forEach((element) => {
        element.style.opacity = "0"
        element.style.pointerEvents = "none"
        element.style.visibility = "hidden"
      })
      const restorePseudoElements = suppressScreenshotPseudoElements()
      const restoreImages = await inlineScreenshotImages()
      const restoreNormalizedColors = normalizeLiveScreenshotColors(normalizeColor)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      let canvas: HTMLCanvasElement
      try {
        canvas = await html2canvas(document.body, {
          allowTaint: false,
          backgroundColor: "#ffffff",
          foreignObjectRendering: true,
          height: window.innerHeight,
          imageTimeout: 15_000,
          logging: false,
          onclone: (clonedDocument) => normalizeScreenshotCloneColors(clonedDocument, normalizeColor),
          scale: Math.min(window.devicePixelRatio || 1, 1.25),
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          useCORS: true,
          width: window.innerWidth,
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
          ignoreElements: (element) =>
            element.hasAttribute("data-feedback-capture-ignore") || ["CANVAS", "IFRAME", "VIDEO"].includes(element.tagName),
        })
      } finally {
        previousVisibility.forEach(({ element, opacity, pointerEvents, visibility }) => {
          element.style.opacity = opacity
          element.style.pointerEvents = pointerEvents
          element.style.visibility = visibility
        })
        restoreImages()
        restoreNormalizedColors()
        restorePseudoElements()
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.72)
      const base64 = dataUrlToBase64(dataUrl)
      const size = Math.ceil((base64.length * 3) / 4)
      if (size > MAX_ATTACHMENT_BYTES || size + totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
        throw new Error("The screenshot is too large to attach. Try a smaller browser window and capture it again.")
      }
      setScreenshot({ base64, contentType: "image/jpeg", filename: "photoview-screenshot.jpg", size })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not capture the screen.")
    } finally {
      setCapturing(false)
    }
  }

  async function handleAttachments(files: FileList | null) {
    const selectedFiles = Array.from(files ?? [])
    if (selectedFiles.length === 0) return
    setError("")

    const unsupported = selectedFiles.find((file) => !["image/jpeg", "image/png", "image/webp", "text/plain"].includes(file.type))
    if (unsupported) {
      setError(`${unsupported.name} is not a supported attachment. Use JPEG, PNG, WebP, or a plain-text file.`)
      return
    }

    const tooLarge = selectedFiles.find((file) => file.size > MAX_ATTACHMENT_BYTES)
    if (tooLarge) {
      setError(`${tooLarge.name} is too large. Each file must be 2 MB or smaller.`)
      return
    }
    const addedBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0)
    if (totalAttachmentBytes + (screenshot?.size ?? 0) + addedBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      setError("The screenshot and attached files must be 3 MB or smaller in total.")
      return
    }

    try {
      const nextAttachments = await Promise.all(selectedFiles.map(fileToAttachment))
      setAttachments((current) => [...current, ...nextAttachments])
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not attach those files.")
    }
  }

  async function submitFeedback() {
    if (!canSubmit) return
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({
          attachments: attachments.map(({ base64, contentType, filename }) => ({ base64, contentType, filename })),
          message,
          pageUrl: window.location.href,
          reporterEmail: email,
          reporterName: name,
          screenshot: screenshot
            ? { base64: screenshot.base64, contentType: screenshot.contentType, filename: screenshot.filename }
            : undefined,
          type,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(payload.error || "Your feedback could not be sent.")

      setSuccess("Thank you—your feedback was sent.")
      setType("")
      setMessage("")
      setScreenshot(null)
      setAttachments([])
      window.setTimeout(() => setIsOpen(false), 900)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Your feedback could not be sent.")
    } finally {
      setSubmitting(false)
    }
  }

  if (sessionStatus !== "authenticated" || !isSubscriberScreen) return null

  const dialog = isOpen && showFloatingShortcuts ? (
    <div
      aria-label="Close feedback dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      data-feedback-capture-hide
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) setIsOpen(false)
      }}
    >
      <section
        aria-labelledby="subscriber-feedback-title"
        aria-modal="true"
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[#d8d2c8] bg-white p-5 text-[#1e211d] shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7"
        role="dialog"
        ref={dialogRef}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6d22]">PhotoView.io feedback</p>
            <h2 className="mt-1 text-xl font-semibold" id="subscriber-feedback-title">Bug Report/Feature Request</h2>
          </div>
          <button
            aria-label="Close feedback dialog"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-[#ded8cc] bg-white hover:bg-[#f6f3ed]"
            onClick={() => setIsOpen(false)}
            ref={closeButtonRef}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="mt-5 space-y-4">
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
          {success ? <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">{success}</p> : null}

          <label className="block text-sm font-semibold">
            Feedback type
            <select
              className="mt-2 h-11 w-full rounded-md border border-[#d8d2c8] bg-white px-3 text-sm font-medium outline-none focus:border-[#b08336]"
              onChange={(event) => setType(event.target.value as FeedbackType | "")}
              value={type}
            >
              <option value="">---</option>
              <option value="bug">Bug</option>
              <option value="improvement">Improvement</option>
              <option value="question">Question</option>
              <option value="feedback">Feedback</option>
            </select>
          </label>

          <textarea
            aria-label="Feedback message"
            className="min-h-28 w-full resize-y rounded-md border border-[#d8d2c8] bg-white p-3 text-sm leading-6 outline-none placeholder:text-[#8a8378] focus:border-[#b08336]"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a comment or describe a problem."
            value={message}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="flex h-10 items-center gap-2 rounded-md border border-[#d8d2c8] bg-white px-3 text-sm font-semibold hover:bg-[#f6f3ed] disabled:opacity-60"
              disabled={capturing}
              onClick={() => void captureScreenshot()}
              type="button"
            >
              {capturing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {capturing ? "Taking screenshot…" : "Take screenshot"}
            </button>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#d8d2c8] bg-white px-3 text-sm font-semibold hover:bg-[#f6f3ed]">
              <Paperclip className="size-4" />
              Attach files
              <input
                accept={FEEDBACK_ATTACHMENT_ACCEPT}
                aria-label="Attach one or more files"
                className="sr-only"
                multiple
                onChange={(event) => {
                  void handleAttachments(event.target.files)
                  event.currentTarget.value = ""
                }}
                type="file"
              />
            </label>
            {screenshot ? <span className="text-xs font-semibold text-green-700">Screenshot captured and attached.</span> : null}
            <p className="basis-full text-xs text-[#746d63]">JPEG, PNG, WebP, or TXT; up to 2 MB each and 3 MB total.</p>
            {attachments.map((attachment, index) => (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#f1eee8] px-2.5 py-1 text-xs text-[#625b51]" key={`${attachment.filename}-${index}`}>
                <span className="max-w-56 truncate">{attachment.filename}</span>
                <button
                  aria-label={`Remove ${attachment.filename}`}
                  className="grid size-5 place-items-center rounded-full hover:bg-white"
                  onClick={() => setAttachments((current) => current.filter((_, attachmentIndex) => attachmentIndex !== index))}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <label className="relative block">
            <span className="sr-only">Your email</span>
            <input
              className="h-11 w-full rounded-md border border-[#d8d2c8] bg-white px-3 pr-10 text-sm outline-none focus:border-[#b08336]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email"
              type="email"
              value={email}
            />
            <CheckCircle2 className={`pointer-events-none absolute right-3 top-3.5 size-4 ${email.trim() ? "text-green-600" : "text-[#aaa49a]"}`} />
          </label>
          <label className="relative block">
            <span className="sr-only">Your name</span>
            <input
              className="h-11 w-full rounded-md border border-[#d8d2c8] bg-white px-3 pr-10 text-sm outline-none focus:border-[#b08336]"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              value={name}
            />
            <CheckCircle2 className={`pointer-events-none absolute right-3 top-3.5 size-4 ${name.trim() ? "text-green-600" : "text-[#aaa49a]"}`} />
          </label>

          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white hover:bg-[#2b3931] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canSubmit}
            onClick={() => void submitFeedback()}
            type="button"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit feedback"}
          </button>
          <p className="text-center text-xs text-[#746d63]">Sent to the PhotoView.io support team</p>
        </div>
      </section>
    </div>
  ) : null

  const captureNotice = capturing && showFloatingShortcuts ? (
    <div
      aria-live="assertive"
      className="fixed inset-x-4 top-5 z-[110] mx-auto flex max-w-md items-center gap-3 rounded-lg border border-[#e7c874] bg-[#fff8e8] px-4 py-3 text-[#4f391e] shadow-2xl"
      data-feedback-capture-ignore
      role="status"
    >
      <Loader2 className="size-5 shrink-0 animate-spin" />
      <div>
        <p className="text-sm font-semibold">Taking screenshot…</p>
        <p className="mt-0.5 text-xs">The feedback form will return when the screenshot is attached.</p>
      </div>
    </div>
  ) : null

  return (
    <>
      {showFloatingShortcuts ? (
        <>
          <a
            className="subscriber-floating-shortcut fixed bottom-[4.25rem] left-4 z-[70] flex h-11 w-[calc(240px-2rem)] max-w-[calc(100vw-2rem)] items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-[#1f2a24] px-2 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#2b3931]"
            data-feedback-capture-hide
            href="/account#referrals"
          >
            <Gift className="size-4 text-[#f1c96d]" />
            Earn more storage
          </a>
          <button
            className="subscriber-floating-shortcut fixed bottom-4 left-4 z-[70] flex h-11 w-[calc(240px-2rem)] max-w-[calc(100vw-2rem)] items-center gap-1.5 whitespace-nowrap rounded-md border border-[#e7c874] bg-[#fff8e8] px-2 text-xs font-semibold text-[#64471f] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffefc5]"
            data-feedback-capture-hide
            onClick={() => setIsOpen(true)}
            ref={launcherButtonRef}
            type="button"
          >
            <ClipboardList className="size-4" />
            Bug/Feature Request
          </button>
        </>
      ) : null}
      {typeof document === "undefined" ? null : createPortal(<>{dialog}{captureNotice}</>, document.body)}
    </>
  )
}
