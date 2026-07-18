"use client"

import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react"
import { type FormEvent, useState } from "react"
import { createPortal } from "react-dom"

import {
  getWebsiteWalkthrough,
  settingsWalkthroughGoalOptions,
  websiteWalkthroughGoalOptions,
  type WebsiteWalkthrough,
  type WebsiteWalkthroughDestination,
  type WebsiteWalkthroughGoal,
} from "@/lib/website-walkthroughs"

type WalkthroughResponse = WebsiteWalkthrough & { error?: string; mode?: "ai" | "local" }

export function ToursWalkthrough({
  buttonClassName,
  buttonTitle,
  context = "website",
  onNavigate,
}: {
  buttonClassName?: string
  buttonTitle?: string
  context?: "settings" | "website"
  onNavigate: (destination: WebsiteWalkthroughDestination) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [request, setRequest] = useState("")
  const [walkthrough, setWalkthrough] = useState<WebsiteWalkthrough | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")

  function startWalkthrough(goal: WebsiteWalkthroughGoal) {
    setWalkthrough(getWebsiteWalkthrough(goal))
    setCurrentStep(0)
    setError("")
    setStatus("idle")
  }

  async function buildCustomTour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.trim().length < 3 || status === "loading") return

    setStatus("loading")
    setError("")
    try {
      const response = await fetch("/api/ai/walkthrough", {
        body: JSON.stringify({ context, request: request.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as WalkthroughResponse
      if (!response.ok) throw new Error(payload.error ?? "We could not build that tour.")

      setWalkthrough(payload)
      setCurrentStep(0)
      setStatus("idle")
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We could not build that tour.")
      setStatus("error")
    }
  }

  const step = walkthrough?.steps[currentStep]
  const goalOptions = context === "settings" ? settingsWalkthroughGoalOptions : websiteWalkthroughGoalOptions
  const panel = isOpen ? (
    <aside className="fixed bottom-4 right-4 z-[950] flex max-h-[calc(100dvh-2rem)] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-[#d8a84f] bg-white text-[#1e211d] shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e5ded2] bg-[#fffaf0] p-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6d22]">
            <Sparkles className="size-4" />
            PhotoView.io Tours
          </p>
          <h2 className="mt-1 text-lg font-semibold">{walkthrough?.title ?? "What would you like to accomplish?"}</h2>
        </div>
        <button aria-label="Close Tours" className="grid size-8 shrink-0 place-items-center rounded-md border border-[#ded8cc] bg-white" onClick={() => setIsOpen(false)} type="button">
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!walkthrough ? (
          <>
            <p className="text-sm leading-6 text-[#6f685d]">Choose a tour, or describe what you want to accomplish and we will select the shortest reliable path.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {goalOptions.map((option) => (
                <button className="rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-3 text-left hover:border-[#d8a84f]" key={option.goal} onClick={() => startWalkthrough(option.goal)} type="button">
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#756e63]">{option.note}</span>
                </button>
              ))}
            </div>
            <form className="mt-4 rounded-md border border-[#ded8cc] bg-[#fbfaf7] p-3" onSubmit={(event) => void buildCustomTour(event)}>
              <label className="text-xs font-semibold" htmlFor="merlin-goal">Or tell us what you want to do</label>
              <textarea
                className="mt-2 min-h-20 w-full resize-y rounded-md border border-[#d7d0c4] bg-white p-2 text-sm leading-5 outline-none focus:border-[#b08336]"
                id="merlin-goal"
                maxLength={400}
                onChange={(event) => setRequest(event.target.value)}
                placeholder={context === "settings" ? "Example: Show me where to manage watermarks" : "Example: Help me create a simple travel photography homepage"}
                value={request}
              />
              <button className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white disabled:opacity-50" disabled={status === "loading" || request.trim().length < 3} type="submit">
                {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Build my tour
              </button>
              {error && <p className="mt-2 text-xs font-semibold text-[#a43b2f]">{error}</p>}
            </form>
          </>
        ) : step ? (
          <>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#756e63]">
              <span>Step {currentStep + 1} of {walkthrough.steps.length}</span>
              <span>{Math.round(((currentStep + 1) / walkthrough.steps.length) * 100)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee8dc]">
              <div className="h-full rounded-full bg-[#d8a84f] transition-all" style={{ width: `${((currentStep + 1) / walkthrough.steps.length) * 100}%` }} />
            </div>
            {currentStep === 0 && <p className="mt-4 text-sm leading-6 text-[#6f685d]">{walkthrough.intro}</p>}
            <div className="mt-4 rounded-md border border-[#e5ded2] bg-[#fbfaf7] p-4">
              <span className="grid size-9 place-items-center rounded-full bg-[#fff3cf] text-sm font-bold text-[#8c621f]">{currentStep + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f685d]">{step.description}</p>
              <button className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f2a24] px-3 text-sm font-semibold text-white" onClick={() => onNavigate(step.destination)} type="button">
                <Sparkles className="size-4" />
                Show me
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#e9f1dc] text-[#466026]"><Check className="size-6" /></span>
            <h3 className="mt-4 text-lg font-semibold">Tour complete</h3>
            <p className="mt-2 text-sm text-[#6f685d]">Your changes remain editable. Preview the website whenever you are ready.</p>
          </div>
        )}
      </div>

      {walkthrough && (
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-[#e5ded2] bg-white p-3">
          <button className="flex h-9 items-center gap-2 rounded-md border border-[#d7d0c4] px-3 text-xs font-semibold" onClick={() => { setWalkthrough(null); setCurrentStep(0) }} type="button">
            <RotateCcw className="size-3.5" />
            Start over
          </button>
          <div className="flex gap-2">
            <button aria-label="Previous tour step" className="grid size-9 place-items-center rounded-md border border-[#d7d0c4] disabled:opacity-40" disabled={currentStep === 0} onClick={() => setCurrentStep((current) => Math.max(0, current - 1))} type="button">
              <ArrowLeft className="size-4" />
            </button>
            <button className="flex h-9 items-center gap-2 rounded-md bg-[#d8a84f] px-3 text-xs font-semibold text-[#171814]" onClick={() => setCurrentStep((current) => current + 1)} type="button">
              {currentStep >= walkthrough.steps.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </footer>
      )}
    </aside>
  ) : null

  return (
    <>
      <button aria-label="Take a Tour" className={buttonClassName ?? "flex h-10 items-center gap-2 rounded-md border border-[#d8a84f] bg-[#fff8e8] px-3 text-sm font-semibold text-[#735223]"} onClick={() => setIsOpen(true)} title={buttonTitle ?? "Take a Tour"} type="button">
        <Sparkles className="size-4" />
        Take a Tour
      </button>
      {typeof document === "undefined" ? null : createPortal(panel, document.body)}
    </>
  )
}
