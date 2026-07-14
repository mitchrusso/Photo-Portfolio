import { Globe2, Lock } from "lucide-react"

import type { PortfolioGallery } from "@/lib/gallery-utils"

export function PrivacyBadge({ privacy }: { privacy: PortfolioGallery["privacy"] }) {
  const Icon = privacy === "Public" ? Globe2 : Lock

  return (
    <span className="flex items-center gap-1 text-[11px] text-[#6f685d]">
      <Icon className="size-3.5" />
      {privacy}
    </span>
  )
}


