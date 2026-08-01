"use client"

import { X } from "lucide-react"

export type WebsiteAddressStatus = "idle" | "saving" | "saved" | "error"

type WebsiteAddressDialogProps = {
  addressDraft: string
  addressError: string
  addressStatus: WebsiteAddressStatus
  fieldClass: string
  isDark: boolean
  mutedTextClass: string
  onCancel: () => void
  onChange: (subdomain: string) => void
  onSave: () => void | Promise<void>
  surfaceClass: string
}

export function WebsiteAddressDialog({
  addressDraft,
  addressError,
  addressStatus,
  fieldClass,
  isDark,
  mutedTextClass,
  onCancel,
  onChange,
  onSave,
  surfaceClass,
}: WebsiteAddressDialogProps) {
  return (
    <div
      aria-labelledby="publish-setup-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
    >
      <div className={`w-full max-w-lg rounded-md border p-5 shadow-2xl ${surfaceClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${mutedTextClass}`}>Website address</p>
            <h3 className="mt-1 text-xl font-semibold" id="publish-setup-title">Website address</h3>
            <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>Choose where this website will live. These settings are separate from page editing.</p>
          </div>
          <button
            aria-label="Close website address"
            className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
            onClick={onCancel}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-xs font-medium">
            PhotoView.io address
            <div className={`flex h-11 overflow-hidden rounded-md border ${fieldClass}`}>
              <input
                aria-invalid={addressStatus === "error"}
                autoCapitalize="none"
                autoCorrect="off"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm font-normal outline-none"
                maxLength={63}
                onChange={(event) => onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="yourname"
                spellCheck={false}
                value={addressDraft}
              />
              <span className={`flex items-center border-l px-3 text-xs ${isDark ? "border-white/15" : "border-[#d7d0c4]"} ${mutedTextClass}`}>.photoview.io</span>
            </div>
            <span className={mutedTextClass}>Choose a unique address using letters, numbers, or hyphens.</span>
            {addressError ? <span className="font-semibold text-red-600" role="alert">{addressError}</span> : null}
          </label>
          <div className={`rounded-md border p-3 text-sm leading-6 ${isDark ? "border-white/10 bg-white/5 text-white/70" : "border-[#ded8cc] bg-[#f7f5f0] text-[#6f685d]"}`}>
            <p className={`font-semibold ${isDark ? "text-white" : "text-[#1f211e]"}`}>Purchased custom domains</p>
            <p className="mt-1">Custom-domain connection and DNS verification are not active yet. For now, publish at the personal PhotoView.io address above.</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className={`h-10 rounded-md border px-4 text-sm font-semibold ${isDark ? "border-white/10" : "border-[#ded8cc]"}`}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-md bg-[#1f2a24] px-4 text-sm font-semibold text-white disabled:opacity-60"
            disabled={addressStatus === "saving" || !addressDraft.trim()}
            onClick={() => void onSave()}
            type="button"
          >
            {addressStatus === "saving" ? "Saving…" : "Save address"}
          </button>
        </div>
      </div>
    </div>
  )
}
