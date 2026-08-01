"use client"

import { WebsiteTemplateMiniPreview } from "@/components/portfolio/website-template-mini-preview"
import type { WebsiteTemplate } from "@/lib/website-builder-rules"

type TemplateOption = {
  bestFor: string
  description: string
  id: WebsiteTemplate
  label: string
}

type WebsiteTemplateSelectorProps = {
  isDark: boolean
  mutedTextClass: string
  onSelectTemplate: (template: WebsiteTemplate) => void
  selectedTemplate: WebsiteTemplate
  surfaceClass: string
  templates: TemplateOption[]
}

export function WebsiteTemplateSelector({
  isDark,
  mutedTextClass,
  onSelectTemplate,
  selectedTemplate,
  surfaceClass,
  templates,
}: WebsiteTemplateSelectorProps) {
  return (
    <section className={`rounded-md border p-3 shadow-sm ${surfaceClass}`} data-testid="website-template-filmstrip">
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0">
          <p className="text-sm font-semibold">Choose a site template</p>
          <p className={`mt-0.5 text-xs ${mutedTextClass}`}>Try any starting point. Your content stays in place while the design changes.</p>
        </div>
        <span className={`hidden shrink-0 text-xs font-semibold sm:block ${mutedTextClass}`}>Scroll to see more</span>
      </div>
      <div aria-label="Site templates" className="mt-3 flex gap-3 overflow-x-auto pb-3" role="list">
        {templates.map((template) => {
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
      </div>
    </section>
  )
}
