export const socialCampaignTemplateIds = [
  "original",
  "gallery-spotlight",
  "editorial-story",
  "client-invitation",
  "print-launch",
] as const

export type SocialCampaignTemplateId = (typeof socialCampaignTemplateIds)[number]

export type SocialCampaignDesign = {
  campaignName: string
  ctaLabel: string
  destinationUrl: string
  directions: string
  headline: string
  showBrand: boolean
  supportingText: string
  templateId: SocialCampaignTemplateId
}

export type SocialCampaignTemplate = {
  description: string
  id: SocialCampaignTemplateId
  label: string
  suggestedCta: string
  suggestedHeadline: string
  suggestedText: string
}

export const socialCampaignTemplates: SocialCampaignTemplate[] = [
  {
    description: "Share the photograph without adding a graphic overlay.",
    id: "original",
    label: "Original photo",
    suggestedCta: "View portfolio",
    suggestedHeadline: "",
    suggestedText: "",
  },
  {
    description: "A strong title and action bar for a complete portfolio.",
    id: "gallery-spotlight",
    label: "Gallery spotlight",
    suggestedCta: "Explore the gallery",
    suggestedHeadline: "A new collection",
    suggestedText: "See the complete story behind this photograph.",
  },
  {
    description: "Magazine-inspired storytelling with room for context.",
    id: "editorial-story",
    label: "Editorial story",
    suggestedCta: "Read the story",
    suggestedHeadline: "Behind the frame",
    suggestedText: "A photograph is only the beginning of the story.",
  },
  {
    description: "Invite prospects to book, inquire, register, or visit.",
    id: "client-invitation",
    label: "Client invitation",
    suggestedCta: "Book a session",
    suggestedHeadline: "Let’s create together",
    suggestedText: "Now accepting a limited number of new commissions.",
  },
  {
    description: "Promote a print release, exhibition, or limited offer.",
    id: "print-launch",
    label: "Print launch",
    suggestedCta: "See the release",
    suggestedHeadline: "New limited edition",
    suggestedText: "Available for a limited time.",
  },
]

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

export function defaultSocialCampaignDesign(): SocialCampaignDesign {
  return {
    campaignName: "Portfolio campaign",
    ctaLabel: "View portfolio",
    destinationUrl: "",
    directions: "",
    headline: "",
    showBrand: true,
    supportingText: "",
    templateId: "original",
  }
}

export function normalizeSocialCampaignDesign(value: unknown): SocialCampaignDesign {
  const fallback = defaultSocialCampaignDesign()
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback
  const record = value as Record<string, unknown>
  return {
    campaignName: clean(record.campaignName, 120) || fallback.campaignName,
    ctaLabel: clean(record.ctaLabel, 80),
    destinationUrl: clean(record.destinationUrl, 2000),
    directions: clean(record.directions, 1000),
    headline: clean(record.headline, 160),
    showBrand: typeof record.showBrand === "boolean" ? record.showBrand : fallback.showBrand,
    supportingText: clean(record.supportingText, 400),
    templateId: socialCampaignTemplateIds.includes(record.templateId as SocialCampaignTemplateId)
      ? record.templateId as SocialCampaignTemplateId
      : fallback.templateId,
  }
}

export function applySocialCampaignTemplate(
  current: SocialCampaignDesign,
  templateId: SocialCampaignTemplateId,
) {
  const template = socialCampaignTemplates.find((candidate) => candidate.id === templateId) ?? socialCampaignTemplates[0]
  return normalizeSocialCampaignDesign({
    ...current,
    ctaLabel: template.suggestedCta,
    headline: template.suggestedHeadline,
    supportingText: template.suggestedText,
    templateId,
  })
}

export function socialCampaignDestination(design: SocialCampaignDesign, portfolioUrl?: string) {
  const explicit = design.destinationUrl.trim()
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit
  return portfolioUrl
}
