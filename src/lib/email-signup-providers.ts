export const EMAIL_SIGNUP_PROVIDERS = [
  { id: "aweber", label: "AWeber", domains: ["aweber.com"] },
  { id: "mailchimp", label: "Mailchimp", domains: ["mailchimp.com", "list-manage.com"] },
  { id: "getresponse", label: "GetResponse", domains: ["getresponse.com", "gr8.com"] },
  { id: "kit", label: "Kit", domains: ["kit.com", "convertkit.com", "ck.page"] },
  { id: "activecampaign", label: "ActiveCampaign", domains: ["activecampaign.com", "activehosted.com"] },
  { id: "drip", label: "Drip", domains: ["getdrip.com", "drip.com"] },
  { id: "constant-contact", label: "Constant Contact", domains: ["constantcontact.com", "constantcontactpages.com"] },
  { id: "mailerlite", label: "MailerLite", domains: ["mailerlite.com", "mailerlite.io", "mlsend.com"] },
  { id: "gohighlevel", label: "GoHighLevel", domains: ["gohighlevel.com", "leadconnectorhq.com", "msgsndr.com"] },
] as const

export type EmailSignupProviderId = typeof EMAIL_SIGNUP_PROVIDERS[number]["id"]

export function emailSignupProviderLabel(providerId: EmailSignupProviderId | "") {
  return EMAIL_SIGNUP_PROVIDERS.find((provider) => provider.id === providerId)?.label ?? ""
}

function hostnameMatchesDomain(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

export function isAllowedEmailSignupUrl(value: string, providerId?: EmailSignupProviderId | "") {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    const providers = providerId
      ? EMAIL_SIGNUP_PROVIDERS.filter((provider) => provider.id === providerId)
      : EMAIL_SIGNUP_PROVIDERS

    return providers.some((provider) => provider.domains.some((domain) => hostnameMatchesDomain(url.hostname, domain)))
  } catch {
    return false
  }
}

export function detectEmailSignupProvider(value: string): EmailSignupProviderId | "" {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return ""

  const domainMatch = EMAIL_SIGNUP_PROVIDERS.find((provider) =>
    provider.domains.some((domain) => normalized.includes(domain)),
  )
  if (domainMatch) return domainMatch.id

  if (/\bmailchimp\b|mc_embed_signup/.test(normalized)) return "mailchimp"
  if (/\bconvertkit\b|\bkit form\b|formkit-form/.test(normalized)) return "kit"
  if (/\bactivecampaign\b|_form_\d+/.test(normalized)) return "activecampaign"
  if (/\bconstant contact\b|ctct-form/.test(normalized)) return "constant-contact"
  if (/\bmailer ?lite\b|ml-form-embed/.test(normalized)) return "mailerlite"
  if (/\bgo ?high ?level\b|leadconnector/.test(normalized)) return "gohighlevel"
  if (/\bgetresponse\b/.test(normalized)) return "getresponse"
  if (/\baweber\b/.test(normalized)) return "aweber"
  if (/\bdrip\b/.test(normalized)) return "drip"

  return ""
}

export function getHostedEmailSignupUrl(value: string) {
  const normalized = value.trim()
  return isAllowedEmailSignupUrl(normalized) ? normalized : ""
}
