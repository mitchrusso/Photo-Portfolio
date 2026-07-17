import type { SiteSettings } from "@/lib/gallery-utils"

const socialDomains = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "pinterest.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
]

export function normalizeSocialAccountInput(
  platform: keyof SiteSettings["socialAccounts"],
  value: string,
) {
  const input = value.trim()
  if (!input) return ""

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input)
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : ""
    } catch {
      return ""
    }
  }

  const domainInput = input.replace(/^www\./i, "")
  const lowerDomainInput = domainInput.toLowerCase()
  if (socialDomains.some((domain) => lowerDomainInput === domain || lowerDomainInput.startsWith(`${domain}/`))) {
    try {
      return new URL(`https://${domainInput}`).toString()
    } catch {
      return ""
    }
  }

  const handle = input.replace(/^@+/, "").replace(/^\/+|\/+$/g, "")
  if (!handle) return ""
  const encodedHandle = encodeURIComponent(handle)

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/${encodedHandle}`
    case "instagram":
      return `https://www.instagram.com/${encodedHandle}`
    case "linkedin":
      return `https://www.linkedin.com/in/${encodedHandle}`
    case "pinterest":
      return `https://www.pinterest.com/${encodedHandle}`
    case "x":
      return `https://x.com/${encodedHandle}`
    case "tiktok":
      return `https://www.tiktok.com/@${encodedHandle}`
    case "youtube":
      return `https://www.youtube.com/@${encodedHandle}`
  }
}

export function normalizeSocialAccounts(accounts: SiteSettings["socialAccounts"]): SiteSettings["socialAccounts"] {
  return {
    facebook: normalizeSocialAccountInput("facebook", accounts.facebook),
    instagram: normalizeSocialAccountInput("instagram", accounts.instagram),
    linkedin: normalizeSocialAccountInput("linkedin", accounts.linkedin),
    pinterest: normalizeSocialAccountInput("pinterest", accounts.pinterest),
    tiktok: normalizeSocialAccountInput("tiktok", accounts.tiktok),
    x: normalizeSocialAccountInput("x", accounts.x),
    youtube: normalizeSocialAccountInput("youtube", accounts.youtube),
  }
}
