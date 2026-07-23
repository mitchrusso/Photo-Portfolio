export type ParsedMailbox = { email: string; name: string }

const knownProspects: Record<string, { category: string; company: string; website?: string }> = {
  "help@topazlabs.com": { category: "AI imaging", company: "Topaz Labs", website: "https://www.topazlabs.com" },
  "partnership@captureone.com": { category: "Editing software", company: "Capture One", website: "https://www.captureone.com" },
  "advertising@petapixel.com": { category: "Photography media", company: "PetaPixel", website: "https://petapixel.com" },
  "eic@petapixel.com": { category: "Photography media", company: "PetaPixel", website: "https://petapixel.com" },
  "matt@mattpaynephotography.com": { category: "Photography podcast", company: "F-Stop Collaborate and Listen", website: "https://www.mattpaynephotography.com" },
  "hello@thepinckards.com": { category: "Photography podcast", company: "Shoot Bigger", website: "https://thepinckards.com" },
  "kendra@girlmeansbusiness.com": { category: "Photography podcast", company: "Girl Means Business", website: "https://girlmeansbusiness.com" },
  "info@photographybusinessinstitute.com": { category: "Photography podcast", company: "Worth Every Penny", website: "https://photographybusinessinstitute.com" },
  "info@nikkiclosser.com": { category: "Photography podcast", company: "The Portrait System", website: "https://nikkiclosser.com" },
  "info@thephotographypodcast.com": { category: "Photography podcast", company: "The Photography Podcast", website: "https://thephotographypodcast.com" },
  "lensshark@gmail.com": { category: "Photography podcast", company: "LensShark", website: "https://lensshark.com" },
}

const freeDomains = new Set(["aol.com", "gmail.com", "hotmail.com", "icloud.com", "outlook.com", "yahoo.com"])

export function extractMailboxes(value: string) {
  const matches: ParsedMailbox[] = []
  const seen = new Set<string>()
  const pattern = /(?:"?([^"<,]*)"?\s*)?<([^>]+)>|([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})/gi
  for (const match of value.matchAll(pattern)) {
    const email = (match[2] || match[3] || "").trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    matches.push({ email, name: (match[1] || "").trim().replace(/^"|"$/g, "") })
  }
  return matches
}

export function emailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] || ""
}

export function normalizedHost(value: string) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, "") } catch { return value.toLowerCase().replace(/^www\./, "").split("/")[0] }
}

function titleCase(value: string) {
  return value.split(/[._\-\s]+/).filter(Boolean).map((part) => part.length <= 3 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`).join(" ")
}

export function prospectIdentity(mailbox: ParsedMailbox, subject = "") {
  const known = knownProspects[mailbox.email]
  if (known) return known
  const domain = emailDomain(mailbox.email)
  const category = /podcast|guest idea/i.test(subject) ? "Photography podcast" : "Strategic partnership"
  if (!freeDomains.has(domain)) {
    const company = titleCase(domain.split(".")[0] || mailbox.name || mailbox.email.split("@")[0])
    return { category, company, website: `https://${domain}` }
  }
  return { category, company: mailbox.name || titleCase(mailbox.email.split("@")[0]), website: "" }
}

export function isPartnershipMessage(subject: string, snippet: string) {
  return /photoview|partnership|integration|podcast guest|guest idea/i.test(`${subject} ${snippet}`)
}

export function slugifyProspect(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "gmail-prospect"
}

export function syncQuery(lastSyncAt: Date | null, full: boolean) {
  if (full || !lastSyncAt) return "in:sent newer_than:365d"
  const overlap = new Date(lastSyncAt.getTime() - 7 * 24 * 60 * 60 * 1000)
  return `after:${overlap.toISOString().slice(0, 10).replaceAll("-", "/")} {from:me to:me}`
}
