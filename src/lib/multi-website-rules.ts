export const ADDITIONAL_WEBSITE_MONTHLY_CENTS = 129
export const ADDITIONAL_WEBSITE_ANNUAL_CENTS = 1548
export const INCLUDED_WEBSITE_COUNT = 1
export const MAX_WEBSITE_NAME_LENGTH = 80
const MINIMUM_ANNUAL_LEAD_MS = 48 * 60 * 60 * 1000
const AVERAGE_YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000

export type WebsiteBillingTypeValue = "INCLUDED" | "ADD_ON"
export type WebsiteStatusValue = "DRAFT" | "ACTIVE" | "BILLING_FAILED" | "DISABLED" | "DELETED"

export type WebsiteBillingCandidate = {
  billingType: WebsiteBillingTypeValue
  status: WebsiteStatusValue
}

export function isWebsitePubliclyAvailable(status: WebsiteStatusValue) {
  return status === "ACTIVE"
}

export function isWebsiteBillable(website: WebsiteBillingCandidate) {
  return website.billingType === "ADD_ON" && website.status === "ACTIVE"
}

export function getAdditionalWebsiteQuantity(websites: WebsiteBillingCandidate[]) {
  return websites.filter(isWebsiteBillable).length
}

export function getAdditionalWebsiteMonthlyTotalCents(quantity: number) {
  return Math.max(0, Math.floor(quantity)) * ADDITIONAL_WEBSITE_MONTHLY_CENTS
}

export function getLifetimeWebsiteAnnualQuote(createdAt: Date, now = new Date()) {
  let anniversary = new Date(Date.UTC(
    now.getUTCFullYear(),
    createdAt.getUTCMonth(),
    createdAt.getUTCDate(),
    createdAt.getUTCHours(),
    createdAt.getUTCMinutes(),
    createdAt.getUTCSeconds(),
  ))
  while (anniversary.getTime() - now.getTime() < MINIMUM_ANNUAL_LEAD_MS) {
    anniversary = new Date(Date.UTC(
      anniversary.getUTCFullYear() + 1,
      anniversary.getUTCMonth(),
      anniversary.getUTCDate(),
      anniversary.getUTCHours(),
      anniversary.getUTCMinutes(),
      anniversary.getUTCSeconds(),
    ))
  }
  const balanceCents = Math.max(1, Math.min(
    ADDITIONAL_WEBSITE_ANNUAL_CENTS,
    Math.round(ADDITIONAL_WEBSITE_ANNUAL_CENTS * ((anniversary.getTime() - now.getTime()) / AVERAGE_YEAR_MS)),
  ))
  return { anniversary, balanceCents }
}

export function normalizeWebsiteName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_WEBSITE_NAME_LENGTH)
}

export function websiteActivationLabel(quantity: number) {
  const monthlyTotal = getAdditionalWebsiteMonthlyTotalCents(quantity)
  return `$${(monthlyTotal / 100).toFixed(2)}/month for ${quantity} additional ${quantity === 1 ? "website" : "websites"}`
}
