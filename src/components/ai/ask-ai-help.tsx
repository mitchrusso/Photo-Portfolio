"use client"

import { Bot, Loader2, Send, Sparkles, X } from "lucide-react"
import { FormEvent, useState } from "react"
import { createPortal } from "react-dom"

const suggestedQuestions = [
  "How do I build my website?",
  "How do I edit About or Trips pages?",
  "How does the AI Portfolio Assistant work?",
  "How do I share one portfolio?",
]

type AskAiHelpProps = {
  buttonClassName?: string
  panelClassName?: string
}

export function AskAiHelp({ buttonClassName, panelClassName }: AskAiHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"idle" | "asking" | "error">("idle")

  async function askQuestion(event?: FormEvent<HTMLFormElement>, suggestedQuestion?: string) {
    event?.preventDefault()
    const nextQuestion = (suggestedQuestion ?? question).trim()
    if (!nextQuestion || status === "asking") return

    setQuestion(nextQuestion)
    setStatus("asking")
    setAnswer("")
    setNote("")

    try {
      const response = await fetch("/api/ai/help", {
        body: JSON.stringify({ question: nextQuestion }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const payload = await response.json() as { answer?: string; error?: string; note?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "AI help is unavailable.")
      }

      setAnswer(payload.answer ?? "I do not have an answer for that yet.")
      setNote(payload.note ?? "")
      setStatus("idle")
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "AI help is unavailable.")
      setStatus("error")
    }
  }

  const helpDialog = isOpen ? (
    <div className="fixed inset-0 z-[1000] isolate flex items-start justify-center overflow-y-auto bg-black/60 px-3 py-4 sm:px-5 sm:py-8">
      <section
        aria-modal="true"
        className={panelClassName ?? "flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-md border border-[#ded8cc] bg-white text-[#1e211d] shadow-2xl sm:max-h-[calc(100dvh-4rem)]"}
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-[#e5ded2] bg-white p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b08336]">
              <Sparkles className="size-3.5" />
              Subscriber help
            </p>
            <h2 className="mt-2 text-xl font-semibold">Ask AI How To...</h2>
            <p className="mt-1 text-sm leading-5 text-[#6f685d]">
              Ask about PhotoViewPro setup, My Website, Library organization, portfolios, uploads, covers, captions, sharing, embeds, mobile viewing, billing, storage, watermarks, or AI portfolio tools.
            </p>
          </div>
          <button
            aria-label="Close AI help"
            className="flex size-9 items-center justify-center rounded-md border border-[#d7d0c4] bg-white"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestedQuestions.map((item) => (
              <button
                className="rounded-md border border-[#ded8cc] bg-[#fbfaf7] px-3 py-2 text-left text-sm text-[#4f4a42] hover:border-[#d8a84f]"
                key={item}
                onClick={() => void askQuestion(undefined, item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => void askQuestion(event)}>
            <input
              className="h-11 min-w-0 rounded-md border border-[#d7d0c4] px-3 text-sm outline-none focus:border-[#b08336]"
              maxLength={800}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: How do I organize my imported photos?"
              value={question}
            />
            <button
              className="flex h-11 items-center gap-2 rounded-md bg-[#1d2b22] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
              disabled={status === "asking" || question.trim().length < 3}
              type="submit"
            >
              {status === "asking" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Ask
            </button>
          </form>

          {(answer || status === "asking") && (
            <div className="mt-4 rounded-md border border-[#e5ded2] bg-[#fbfaf7] p-4">
              <p className="text-sm font-semibold">Answer</p>
              {status === "asking" ? (
                <p className="mt-2 text-sm text-[#6f685d]">Thinking through the PhotoViewPro help database...</p>
              ) : (
                <div className="mt-2 max-h-[34vh] overflow-y-auto pr-2">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#4f4a42]">{answer}</p>
                </div>
              )}
              {note && <p className="mt-3 text-xs leading-5 text-[#8a7760]">{note}</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  ) : null

  return (
    <>
      <button
        className={buttonClassName ?? "inline-flex h-10 items-center gap-2 rounded-md bg-[#1d2b22] px-3 text-sm font-semibold text-white hover:bg-[#26382d]"}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Bot className="size-4" />
        Ask AI How To...
      </button>

      {typeof document === "undefined" ? null : createPortal(helpDialog, document.body)}
    </>
  )
}
