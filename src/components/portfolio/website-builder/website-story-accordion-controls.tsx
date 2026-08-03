"use client"

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import type { WebsiteBuilderSettings } from "@/components/portfolio/website-builder/website-builder-model"
import type { PortfolioGallery } from "@/lib/gallery-utils"
import {
  MAX_WEBSITE_STORY_ACCORDION_ITEMS,
  MIN_WEBSITE_STORY_ACCORDION_ITEMS,
} from "@/lib/website-story-accordion"

type Props = {
  fieldClass: string
  galleries: PortfolioGallery[]
  isDark: boolean
  mutedTextClass: string
  setSettings: Dispatch<SetStateAction<WebsiteBuilderSettings>>
  settings: WebsiteBuilderSettings
}

export function WebsiteStoryAccordionControls({
  fieldClass,
  galleries,
  isDark,
  mutedTextClass,
  setSettings,
  settings,
}: Props) {
  const update = (patch: Partial<WebsiteBuilderSettings["storyAccordion"]>) => {
    setSettings((current) => ({
      ...current,
      storyAccordion: { ...current.storyAccordion, ...patch },
    }))
  }

  return (
    <details
      className={`group rounded-md border ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
      data-website-story-accordion-controls
    >
      <summary
        className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5"
        title="Open the optional chapter-based story section. It works with every website template."
      >
        <span>
          <span className="block text-sm font-semibold">Accordion story</span>
          <span className={`block text-xs ${mutedTextClass}`}>Chapter pages for every template</span>
        </span>
        <ChevronDown className="size-4 transition group-open:rotate-180" />
      </summary>
      <div className={`space-y-4 border-t p-3 ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}>
        <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/10 bg-white/5" : "border-[#ead7ae] bg-[#fff8e8]"}`}>
          <p className="font-semibold">How Accordion story works</p>
          <p className={`mt-1 ${mutedTextClass}`}>
            Each chapter combines a short tab title, written story, and optional portfolio cover. “Origin” is only starter text for “where the story began”—rename it to anything. This section is separate from the regular About page and text blocks.
          </p>
        </div>
        <label className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold">Show on website</span>
            <span className={`mt-1 block text-xs leading-5 ${mutedTextClass}`}>Wide page tabs on desktop and a stacked accordion on phones.</span>
          </span>
          <input
            checked={settings.storyAccordion.enabled}
            className="mt-1 size-5 accent-[#d8a84f]"
            onChange={(event) => update({ enabled: event.target.checked })}
            title="Show or hide the complete Accordion story section without deleting its saved chapters"
            type="checkbox"
          />
        </label>

        <label className="block text-sm font-medium">
          Section heading
          <input
            className={`mt-1 w-full ${fieldClass}`}
            onChange={(event) => update({ heading: event.target.value })}
            title="Name the complete section, such as My story, Our process, or The journey"
            value={settings.storyAccordion.heading}
          />
        </label>

        <div className="space-y-3">
          {settings.storyAccordion.items.map((item, index) => (
            <div className={`rounded-md border p-3 ${isDark ? "border-white/10" : "border-[#ded8cc]"}`} key={item.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Chapter {index + 1}</p>
                <div className="flex gap-1">
                  <button aria-label={`Move chapter ${index + 1} up`} disabled={index === 0} onClick={() => {
                    const items = [...settings.storyAccordion.items]
                    ;[items[index - 1], items[index]] = [items[index], items[index - 1]]
                    update({ items })
                  }} title="Move this chapter one position earlier" type="button"><ChevronUp className="size-4" /></button>
                  <button aria-label={`Move chapter ${index + 1} down`} disabled={index === settings.storyAccordion.items.length - 1} onClick={() => {
                    const items = [...settings.storyAccordion.items]
                    ;[items[index], items[index + 1]] = [items[index + 1], items[index]]
                    update({ items })
                  }} title="Move this chapter one position later" type="button"><ChevronDown className="size-4" /></button>
                  <button aria-label={`Remove chapter ${index + 1}`} disabled={settings.storyAccordion.items.length <= MIN_WEBSITE_STORY_ACCORDION_ITEMS} onClick={() => update({
                    items: settings.storyAccordion.items.filter((candidate) => candidate.id !== item.id),
                  })} title="Remove this chapter; at least two chapters are required" type="button"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <label className="block text-xs font-medium">
                Tab title
                <input className={`mt-1 w-full ${fieldClass}`} onChange={(event) => {
                  const items = settings.storyAccordion.items.map((candidate) => candidate.id === item.id
                    ? { ...candidate, title: event.target.value }
                    : candidate)
                  update({ items })
                }} title="The short chapter name visitors click, such as The beginning, Finding my style, or Today" value={item.title} />
              </label>
              <label className="mt-3 block text-xs font-medium">
                Story
                <textarea className={`mt-1 min-h-24 w-full ${fieldClass}`} onChange={(event) => {
                  const items = settings.storyAccordion.items.map((candidate) => candidate.id === item.id
                    ? { ...candidate, body: event.target.value }
                    : candidate)
                  update({ items })
                }} title="Write the text visitors read when this chapter is open" value={item.body} />
              </label>
              <label className="mt-3 block text-xs font-medium">
                Image from portfolio
                <select className={`mt-1 w-full ${fieldClass}`} onChange={(event) => {
                  const items = settings.storyAccordion.items.map((candidate) => candidate.id === item.id
                    ? { ...candidate, galleryId: event.target.value }
                    : candidate)
                  update({ items })
                }} title="Use the selected portfolio cover as this chapter's full-frame image" value={item.galleryId}>
                  <option value="">No image</option>
                  {galleries.map((gallery) => <option key={gallery.id} value={gallery.id}>{gallery.name}</option>)}
                </select>
              </label>
            </div>
          ))}
        </div>

        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-current/20 px-3 text-sm font-semibold disabled:opacity-40"
          disabled={settings.storyAccordion.items.length >= MAX_WEBSITE_STORY_ACCORDION_ITEMS}
          onClick={() => update({
            items: [
              ...settings.storyAccordion.items,
              {
                body: "",
                galleryId: "",
                id: `story-${Date.now()}`,
                title: `Chapter ${settings.storyAccordion.items.length + 1}`,
              },
            ],
          })}
          title="Add another chapter; Accordion story supports two to six chapters"
          type="button"
        >
          <Plus className="size-4" />
          Add chapter
        </button>
      </div>
    </details>
  )
}
