"use client"

import { settingsTabs, type SettingsTab } from "@/components/portfolio/portfolio-dashboard-model"
import {
  BadgeDollarSign,
  Brush,
  CalendarClock,
  CloudUpload,
  FolderCog,
  HardDrive,
  Link2,
  Smartphone,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"

const settingsDetails: Record<SettingsTab, { icon: LucideIcon; eyebrow: string; highlights: string[] }> = {
  setup: {
    icon: UserRoundCog,
    eyebrow: "Make PhotoView.io unmistakably yours",
    highlights: ["Photographer profile", "Social accounts", "Business identity"],
  },
  account: {
    icon: BadgeDollarSign,
    eyebrow: "Keep plans, usage, and billing clear",
    highlights: ["Plan controls", "Billing access", "Account status"],
  },
  design: {
    icon: Brush,
    eyebrow: "Shape every part of the presentation",
    highlights: ["Website templates", "Colors and typography", "Page layouts"],
  },
  sharing: {
    icon: Link2,
    eyebrow: "Control exactly how your work travels",
    highlights: ["Private and public links", "Embeds and previews", "Social destinations"],
  },
  scheduler: {
    icon: CalendarClock,
    eyebrow: "Turn a portfolio into an active campaign",
    highlights: ["Post timing", "Campaign pacing", "Publish controls"],
  },
  gallery: {
    icon: FolderCog,
    eyebrow: "Decide what visitors see and can do",
    highlights: ["Gallery access", "Custom watermarks", "Covers and downloads"],
  },
  imports: {
    icon: CloudUpload,
    eyebrow: "Bring photographs in from your workflow",
    highlights: ["Direct uploads", "Lightroom publishing", "Watched export folders"],
  },
  mobile: {
    icon: Smartphone,
    eyebrow: "Keep your portfolio close at hand",
    highlights: ["Phone imports", "Mobile companion", "Install guidance"],
  },
  storage: {
    icon: HardDrive,
    eyebrow: "Know exactly where your capacity stands",
    highlights: ["Live usage", "Storage alerts", "Upgrade options"],
  },
}

export function SettingsCapabilitiesShowcase() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("setup")
  const active = settingsTabs.find((tab) => tab.id === activeTab) ?? settingsTabs[0]
  const detail = settingsDetails[active.id]
  const Icon = detail.icon

  return (
    <div className="mt-12 overflow-hidden rounded-md border border-[#d8d1c5] bg-white shadow-[0_18px_50px_rgba(45,54,47,0.09)]" data-testid="homepage-settings-showcase">
      <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
        <div className="flex flex-col justify-center border-b border-[#ded8cc] bg-[#fffaf0] p-6 md:p-8 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c6f1d]">Power without the clutter</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight md:text-3xl">
            Your entire photography system, tuned from one place.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#5f594f]">
            From the first upload to the final campaign, PhotoView.io gives you precise control over how your work is organized, protected, presented, shared, and stored.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#1d2b22]">Explore the settings tabs to see what is built in.</p>
        </div>

        <div className="min-w-0 bg-[#fbfaf7]">
          <div className="flex items-center gap-3 border-b border-[#ded8cc] bg-white px-5 py-4 md:px-6">
            <h3 className="text-xl font-semibold">{active.label} settings</h3>
            <div className="hidden border-l border-[#ded8cc] pl-3 sm:block">
              <p className="text-xs text-[#756e63]">Always in sync</p>
              <p className="text-[11px] text-[#8d8579]">Saved to your subscriber workspace</p>
            </div>
          </div>

          <div className="overflow-x-auto border-b border-[#ded8cc] bg-white" aria-label="Settings capability categories" role="tablist">
            <div className="flex min-w-max px-4 md:px-5">
              {settingsTabs.map((tab) => (
                <button
                  aria-selected={activeTab === tab.id}
                  className={`relative px-3 py-4 text-sm font-semibold transition-colors ${
                    activeTab === tab.id ? "text-[#1f211e]" : "text-[#756e63] hover:text-[#1f211e]"
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                  {activeTab === tab.id ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[#d8a84f]" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 md:p-6" role="tabpanel">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#1d2b22] text-white">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-[#1f211e]">{detail.eyebrow}</p>
                <p className="mt-1 text-sm leading-6 text-[#6f685d]">{active.description}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {detail.highlights.map((highlight) => (
                <div className="rounded-md border border-[#ded8cc] bg-white px-3 py-3 text-sm font-medium text-[#4f4a42]" key={highlight}>
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
