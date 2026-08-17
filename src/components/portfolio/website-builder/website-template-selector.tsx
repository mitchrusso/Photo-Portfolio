"use client"

import { useState } from "react"
import { WebsiteTemplateMiniPreview } from "@/components/portfolio/website-template-mini-preview"
import type { WebsiteTemplate } from "@/lib/website-builder-rules"

type TemplateOption = {
  bestFor: string
  description: string
  id: WebsiteTemplate
  label: string
}

type WebsiteTemplateSelectorProps = {
  accordionEnabled: boolean
  isDark: boolean
  mutedTextClass: string
  onOpenAccordion: () => void
  onSelectTemplate: (template: WebsiteTemplate) => void
  selectedTemplate: WebsiteTemplate
  surfaceClass: string
  templates: TemplateOption[]
}

const ACCORDION_SEARCH_TEXT = "accordion story interactive chapters universal works with every template process journey"
const ACCORDION_PREVIEW_CHAPTERS = ["The beginning", "The work", "Today"]

function matchesTemplateSearch(candidate: string, normalizedSearch: string) {
  if (!normalizedSearch) return true
  const searchable = candidate.toLocaleLowerCase()
  return normalizedSearch.split(/\s+/).every((term) => searchable.includes(term))
}

export function WebsiteTemplateSelector({
  accordionEnabled,
  isDark,
  mutedTextClass,
  onOpenAccordion,
  onSelectTemplate,
  selectedTemplate,
  surfaceClass,
  templates,
}: WebsiteTemplateSelectorProps) {
  const [templateSearch, setTemplateSearch] = useState("")
  const normalizedSearch = templateSearch.trim().toLocaleLowerCase()
  const filteredTemplates = templates.filter((template) => matchesTemplateSearch(
    `${template.label} ${template.description} ${template.bestFor}`,
    normalizedSearch,
  ))
  const accordionMatchesSearch = matchesTemplateSearch(ACCORDION_SEARCH_TEXT, normalizedSearch)
  const hasResults = accordionMatchesSearch || filteredTemplates.length > 0

  return (
    <section className={`rounded-md border p-3 shadow-sm ${surfaceClass}`} data-testid="website-template-filmstrip">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Choose a site template</p>
          <p className={`mt-0.5 text-xs ${mutedTextClass}`}>Start with Blank canvas, try any designed starting point, or add Accordion Story. Your content stays in place.</p>
        </div>
        <span className={`hidden shrink-0 text-xs font-semibold sm:block ${mutedTextClass}`}>Scroll to see more</span>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Search site templates</span>
        <input
          aria-label="Search site templates"
          className={`min-h-11 w-full rounded-md border px-3 text-sm outline-none transition focus:border-[#d8a84f] focus:ring-2 focus:ring-[#d8a84f]/25 ${
            isDark
              ? "border-white/15 bg-white/[0.06] text-white placeholder:text-white/45"
              : "border-[#ded8cc] bg-white text-[#1e211d] placeholder:text-[#847a6d]"
          }`}
          onChange={(event) => setTemplateSearch(event.target.value)}
          placeholder="Search templates, Blank canvas, or Accordion Story"
          title="Search by template name, visual style, photography type, or Accordion Story"
          type="search"
          value={templateSearch}
        />
      </label>
      <div aria-label="Site templates and universal options" className="mt-3 flex gap-3 overflow-x-auto pb-3" role="list">
        {accordionMatchesSearch ? (
          <div className="w-44 shrink-0" role="listitem">
            <button
              className={`relative w-full overflow-hidden rounded-md border p-2 text-left transition ${
                isDark
                  ? "border-white/10 bg-white/[0.04] hover:border-white/25"
                  : "border-[#ded8cc] bg-white hover:border-[#b7aa96]"
              }`}
              data-website-template-addon="accordion-story"
              onClick={onOpenAccordion}
              title="Accordion Story adds interactive image-and-text chapters to the current design. It works with every site template."
              type="button"
            >
              <span className={`absolute right-2 top-2 z-10 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] shadow-md ${
                accordionEnabled ? "bg-[#326a4a] text-white" : "bg-[#1f2a24] text-white"
              }`}>
                {accordionEnabled ? "Added" : "Universal"}
              </span>
              <span aria-hidden="true" className={`flex aspect-[4/3] flex-col justify-center gap-1.5 overflow-hidden rounded-sm p-3 ${
                isDark ? "bg-[#efe8dc]" : "bg-[#183c2e]"
              }`}>
                {ACCORDION_PREVIEW_CHAPTERS.map((chapter, index) => (
                  <span className="flex items-center gap-2" key={chapter}>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-sm text-[8px] font-bold ${
                      isDark ? "bg-[#183c2e] text-white" : "bg-[#efe8dc] text-[#183c2e]"
                    }`}>{index + 1}</span>
                    <span className={`h-1.5 rounded-full ${index === 1 ? "w-16" : "w-20"} ${
                      isDark ? "bg-[#183c2e]/55" : "bg-white/65"
                    }`} />
                  </span>
                ))}
              </span>
              <span className="mt-2 block text-xs font-semibold">Accordion Story</span>
              <span className={`mt-0.5 block text-[10px] ${mutedTextClass}`}>Interactive chapters for every template</span>
            </button>
          </div>
        ) : null}
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id
          return (
            <div className="w-44 shrink-0" key={template.id} role="listitem">
              <button
                aria-pressed={isSelected}
                className={`relative w-full overflow-hidden rounded-md border p-2 text-left transition ${
                  isSelected
                    ? "border-4 border-[#1f2a24] bg-[#fff8e8] p-[5px] text-[#1e211d] shadow-[0_0_0_3px_#d8a84f,0_8px_20px_rgba(31,42,36,0.18)]"
                    : isDark
                      ? "border-white/10 bg-white/[0.04] hover:border-white/25"
                      : "border-[#ded8cc] bg-white hover:border-[#b7aa96]"
                }`}
                data-website-template={template.id}
                onClick={() => onSelectTemplate(template.id)}
                title={`${template.label}: ${template.description} Best for ${template.bestFor.toLowerCase()}.`}
                type="button"
              >
                {isSelected ? (
                  <span className="absolute right-2 top-2 z-10 rounded-full bg-[#1f2a24] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-md">
                    In use
                  </span>
                ) : null}
                <WebsiteTemplateMiniPreview isSelected={isSelected} templateId={template.id} />
                <span className="mt-2 block truncate text-xs font-semibold">{template.label}</span>
                <span className="sr-only">{template.description} Best for {template.bestFor}.</span>
              </button>
            </div>
          )
        })}
        {!hasResults ? (
          <div className={`flex min-h-36 min-w-full items-center justify-center rounded-md border border-dashed px-4 text-center text-sm ${
            isDark ? "border-white/15" : "border-[#ded8cc]"
          } ${mutedTextClass}`} role="status">
            No templates match “{templateSearch.trim()}”. Try Blank canvas, cinematic, editorial, wedding, or Accordion Story.
          </div>
        ) : null}
      </div>
    </section>
  )
}
