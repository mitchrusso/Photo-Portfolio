"use client"

type WebsiteContactControlsProps = {
  contactEmail: string
  fieldClass: string
  isDark: boolean
  mutedTextClass: string
  onChange: (contactEmail: string) => void
}

export function WebsiteContactControls({
  contactEmail,
  fieldClass,
  isDark,
  mutedTextClass,
  onChange,
}: WebsiteContactControlsProps) {
  return (
    <div className="space-y-3" data-website-editor-field="content">
      <div className={`rounded-md border p-3 text-xs leading-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-[#ded8cc] bg-[#fbfaf7]"} ${mutedTextClass}`}>
        This is subscriber-only. The email below controls where Contact page messages go and is not shown to visitors.
      </div>
      <label className="grid gap-1 text-xs font-medium">
        Form delivery email
        <input
          className={`h-10 rounded-md border px-3 text-sm font-normal outline-none ${fieldClass}`}
          onChange={(event) => onChange(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={contactEmail}
        />
      </label>
      {!contactEmail ? (
        <div className="rounded-md border border-[#d8a84f]/50 bg-[#fff8e8] p-3 text-xs leading-5 text-[#735223]">
          Add an email address before publishing so visitors know where their message is going.
        </div>
      ) : null}
    </div>
  )
}
