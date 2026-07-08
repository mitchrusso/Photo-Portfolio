"use client"

import { Save } from "lucide-react"
import { useState } from "react"

type OveragePolicy = "ASK_FIRST" | "AUTO_UPGRADE_NEXT_TIER" | "AUTO_BUY_BLOCKS"

type OverageSettingsFormProps = {
  autoRolloverEnabled: boolean
  overagePolicy: OveragePolicy
}

const policyOptions: Array<{ description: string; label: string; value: OveragePolicy }> = [
  {
    description: "Pause and notify me before adding paid capacity.",
    label: "Ask me first",
    value: "ASK_FIRST",
  },
  {
    description: "Move to the next plan automatically when a limit is exceeded.",
    label: "Auto-upgrade plan",
    value: "AUTO_UPGRADE_NEXT_TIER",
  },
  {
    description: "Keep the plan and add paid storage blocks when available.",
    label: "Buy extra blocks",
    value: "AUTO_BUY_BLOCKS",
  },
]

export function OverageSettingsForm({
  autoRolloverEnabled,
  overagePolicy,
}: OverageSettingsFormProps) {
  const [enabled, setEnabled] = useState(autoRolloverEnabled)
  const [policy, setPolicy] = useState<OveragePolicy>(overagePolicy)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function saveSettings() {
    setStatus("saving")

    const response = await fetch("/api/account/overage-settings", {
      body: JSON.stringify({
        autoRolloverEnabled: enabled,
        overagePolicy: policy,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    setStatus(response.ok ? "saved" : "error")
  }

  return (
    <section className="rounded-md border border-[#ded6c9] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#b58835]">Overage controls</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1d1d1b]">What happens when a limit is reached?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6257]">
            Auto-rollover is off by default. When enabled, PhotoViewPro can keep public galleries available by upgrading the account or adding extra capacity based on the option below.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-md border border-[#d7cec0] bg-[#fbfaf7] px-4 py-3 text-sm font-semibold">
          <input
            checked={enabled}
            className="size-4 accent-[#d8a84f]"
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          Auto-rollover
        </label>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {policyOptions.map((option) => (
          <button
            className={`rounded-md border p-4 text-left transition ${
              policy === option.value
                ? "border-[#d8a84f] bg-[#fff8e8]"
                : "border-[#d7cec0] bg-[#fbfaf7] hover:bg-[#f2eee7]"
            }`}
            key={option.value}
            onClick={() => setPolicy(option.value)}
            type="button"
          >
            <span className="text-sm font-semibold text-[#1d1d1b]">{option.label}</span>
            <span className="mt-2 block text-sm leading-6 text-[#6b6257]">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1a211b] px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={status === "saving"}
          onClick={saveSettings}
          type="button"
        >
          <Save className="size-4" />
          {status === "saving" ? "Saving..." : "Save usage settings"}
        </button>
        {status === "saved" ? <p className="text-sm text-[#4f6f2a]">Usage settings saved.</p> : null}
        {status === "error" ? <p className="text-sm text-red-700">Could not save usage settings.</p> : null}
      </div>
    </section>
  )
}
