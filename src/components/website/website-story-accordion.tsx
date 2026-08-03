"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useId, useState } from "react"
import type { WebsiteStoryAccordionItem } from "@/lib/website-story-accordion"

type StoryItem = WebsiteStoryAccordionItem & {
  imageAlt: string
  imageUrl: string
}

type WebsiteStoryAccordionProps = {
  accentColor: string
  backgroundColor: string
  compact?: boolean
  heading: string
  items: StoryItem[]
  textColor: string
}

function readableTextColor(backgroundColor: string) {
  const normalized = backgroundColor.trim().replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#ffffff"
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#171814" : "#ffffff"
}

export function WebsiteStoryAccordion({
  accentColor,
  backgroundColor,
  compact = false,
  heading,
  items,
  textColor,
}: WebsiteStoryAccordionProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "")
  const instanceId = useId().replace(/:/g, "")

  if (items.length < 2) return null

  const effectiveActiveId = items.some((item) => item.id === activeId) ? activeId : items[0].id
  const tabTextColor = readableTextColor(accentColor)

  const panel = (item: StoryItem) => (
    <div
      aria-labelledby={`${instanceId}-${item.id}-tab`}
      className={`grid min-w-0 overflow-hidden ${compact ? "grid-cols-1" : "min-h-[420px] md:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]"}`}
      id={`${instanceId}-${item.id}-panel`}
      role="region"
      style={{ backgroundColor, color: textColor }}
    >
      {item.imageUrl ? (
        <div className={`relative min-h-64 bg-transparent ${compact ? "" : "md:min-h-[420px]"}`}>
          <Image
            alt={item.imageAlt}
            className="object-contain"
            fill
            sizes="(min-width: 768px) 52vw, 100vw"
            src={item.imageUrl}
            unoptimized
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col justify-center p-7 sm:p-10">
        <h3 className="text-3xl font-semibold leading-tight sm:text-4xl">{item.title}</h3>
        {item.body ? (
          <div className="mt-5 whitespace-pre-wrap text-base leading-7 opacity-85">{item.body}</div>
        ) : (
          <p className="mt-5 text-sm leading-6 opacity-65">Add this chapter&apos;s story in the website builder.</p>
        )}
      </div>
    </div>
  )

  return (
    <section aria-label={heading || "Story"} className="w-full border-y border-current/10 px-4 py-10 sm:px-6">
      {heading ? <h2 className="mb-7 text-center text-3xl font-semibold sm:text-4xl">{heading}</h2> : null}

      <div className={`${compact ? "hidden" : "hidden md:flex"} min-h-[420px] w-full overflow-hidden border border-current/15`}>
        {items.map((item) => {
          const active = item.id === effectiveActiveId
          return active ? (
            <div className="min-w-0 flex-1" key={item.id}>{panel(item)}</div>
          ) : (
            <button
              aria-controls={`${instanceId}-${item.id}-panel`}
              aria-expanded="false"
              className="group flex w-14 shrink-0 items-center justify-center border-x border-black/15 px-2 py-5 text-xs font-semibold uppercase tracking-[0.18em] transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px]"
              id={`${instanceId}-${item.id}-tab`}
              key={item.id}
              onClick={() => setActiveId(item.id)}
              style={{ backgroundColor: accentColor, color: tabTextColor }}
              type="button"
            >
              <span className="[writing-mode:vertical-rl] rotate-180">{item.title}</span>
            </button>
          )
        })}
      </div>

      <div className={`${compact ? "block" : "md:hidden"} overflow-hidden border border-current/15`}>
        {items.map((item) => {
          const active = item.id === effectiveActiveId
          return (
            <div className="border-b border-current/15 last:border-b-0" key={item.id}>
              <button
                aria-controls={`${instanceId}-${item.id}-mobile-panel`}
                aria-expanded={active}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.16em]"
                id={`${instanceId}-${item.id}-mobile-tab`}
                onClick={() => setActiveId(item.id)}
                style={active ? { backgroundColor: accentColor, color: tabTextColor } : undefined}
                type="button"
              >
                <span>{item.title}</span>
                {active ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              {active ? (
                <div
                  aria-labelledby={`${instanceId}-${item.id}-mobile-tab`}
                  id={`${instanceId}-${item.id}-mobile-panel`}
                  role="region"
                >
                  {panel(item)}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
