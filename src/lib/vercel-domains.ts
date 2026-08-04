import { normalizeCustomDomain } from "@/lib/custom-domain"

type VercelVerificationChallenge = {
  domain?: string
  reason?: string
  type?: string
  value?: string
}

type VercelProjectDomain = {
  apexName?: string
  name?: string
  verification?: VercelVerificationChallenge[]
  verified?: boolean
}

type VercelDomainConfig = {
  configuredBy?: string | null
  misconfigured?: boolean
  recommendedCNAME?: Array<{ rank?: number; value?: string }>
  recommendedIPv4?: Array<{ rank?: number; value?: string[] }>
}

type VercelApiErrorPayload = {
  error?: {
    code?: string
    message?: string
  } | string
}

export type CustomDomainDnsRecord = {
  name: string
  type: "A" | "CNAME" | "TXT"
  value: string
}

export type CustomDomainProviderStatus = {
  active: boolean
  apexName: string
  configured: boolean
  dnsRecords: CustomDomainDnsRecord[]
  verified: boolean
}

export class VercelDomainError extends Error {
  code: string
  status: number

  constructor(message: string, status: number, code = "") {
    super(message)
    this.name = "VercelDomainError"
    this.code = code
    this.status = status
  }
}

function getVercelDomainEnvironment() {
  const token = process.env.VERCEL_API_TOKEN?.trim()
  const projectId = (process.env.PHOTOVIEW_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID)?.trim()
  const teamId = (process.env.PHOTOVIEW_VERCEL_TEAM_ID || process.env.VERCEL_TEAM_ID)?.trim()

  if (!token || !projectId) {
    throw new VercelDomainError(
      "Custom-domain automation is not configured yet. Add the Vercel API token and project ID.",
      503,
      "provider_not_configured",
    )
  }

  return { projectId, teamId, token }
}

export function isVercelDomainAutomationConfigured() {
  return Boolean(
    process.env.VERCEL_API_TOKEN?.trim()
    && (process.env.PHOTOVIEW_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID)?.trim(),
  )
}

function vercelApiUrl(path: string, teamId?: string) {
  const url = new URL(path, "https://api.vercel.com")
  if (teamId) url.searchParams.set("teamId", teamId)
  return url
}

async function vercelRequest<T>(path: string, init: RequestInit = {}) {
  const { teamId, token } = getVercelDomainEnvironment()
  const response = await fetch(vercelApiUrl(path, teamId), {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  })

  const payload = await response.json().catch(() => ({})) as T & VercelApiErrorPayload
  if (!response.ok) {
    const error = payload.error
    const message = typeof error === "string"
      ? error
      : error?.message || "Vercel could not complete the domain request."
    const code = typeof error === "string" ? "" : error?.code || ""
    throw new VercelDomainError(message, response.status, code)
  }

  return payload
}

function preferredCname(config: VercelDomainConfig) {
  return [...(config.recommendedCNAME ?? [])]
    .sort((left, right) => (left.rank ?? 99) - (right.rank ?? 99))
    .find((record) => record.value)?.value
}

function preferredIpv4(config: VercelDomainConfig) {
  return [...(config.recommendedIPv4 ?? [])]
    .sort((left, right) => (left.rank ?? 99) - (right.rank ?? 99))
    .find((record) => record.value?.[0])?.value?.[0]
}

function dnsRecordsFor(
  domain: string,
  projectDomain: VercelProjectDomain,
  config: VercelDomainConfig,
) {
  const verificationRecords = (projectDomain.verification ?? [])
    .filter((challenge) => challenge.type === "TXT" && challenge.domain && challenge.value)
    .map<CustomDomainDnsRecord>((challenge) => ({
      name: challenge.domain!,
      type: "TXT",
      value: challenge.value!,
    }))

  const isApex = projectDomain.apexName === domain
  const connectionRecord: CustomDomainDnsRecord = isApex
    ? {
        name: "@",
        type: "A",
        value: preferredIpv4(config) || "76.76.21.21",
      }
    : {
        name: domain.slice(0, -(projectDomain.apexName?.length ?? 0)).replace(/\.$/, "") || domain,
        type: "CNAME",
        value: preferredCname(config) || "cname.vercel-dns-0.com",
      }

  return [...verificationRecords, connectionRecord]
}

export async function getCustomDomainProviderStatus(domainValue: string): Promise<CustomDomainProviderStatus> {
  const domain = normalizeCustomDomain(domainValue)
  if (!domain) throw new VercelDomainError("Enter a valid custom domain.", 400, "invalid_domain")
  const { projectId } = getVercelDomainEnvironment()
  const encodedProject = encodeURIComponent(projectId)
  const encodedDomain = encodeURIComponent(domain)

  const [projectDomain, config] = await Promise.all([
    vercelRequest<VercelProjectDomain>(`/v9/projects/${encodedProject}/domains/${encodedDomain}`),
    vercelRequest<VercelDomainConfig>(
      `/v6/domains/${encodedDomain}/config?projectIdOrName=${encodedProject}&strict=false`,
    ),
  ])

  const verified = projectDomain.verified === true
  const configured = config.misconfigured === false
  return {
    active: verified && configured,
    apexName: projectDomain.apexName || domain,
    configured,
    dnsRecords: dnsRecordsFor(domain, projectDomain, config),
    verified,
  }
}

export async function addCustomDomainToVercel(domainValue: string) {
  const domain = normalizeCustomDomain(domainValue)
  if (!domain) throw new VercelDomainError("Enter a valid custom domain.", 400, "invalid_domain")
  const { projectId } = getVercelDomainEnvironment()

  try {
    await vercelRequest<VercelProjectDomain>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`,
    )
  } catch (error) {
    if (!(error instanceof VercelDomainError) || error.status !== 404) throw error
    await vercelRequest<VercelProjectDomain>(
      `/v10/projects/${encodeURIComponent(projectId)}/domains`,
      { body: JSON.stringify({ name: domain }), method: "POST" },
    )
  }

  return getCustomDomainProviderStatus(domain)
}

export async function verifyCustomDomainWithVercel(domainValue: string) {
  const domain = normalizeCustomDomain(domainValue)
  if (!domain) throw new VercelDomainError("Enter a valid custom domain.", 400, "invalid_domain")
  const { projectId } = getVercelDomainEnvironment()

  try {
    await vercelRequest<VercelProjectDomain>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}/verify`,
      { method: "POST" },
    )
  } catch (error) {
    if (!(error instanceof VercelDomainError) || ![400, 409].includes(error.status)) throw error
  }

  return getCustomDomainProviderStatus(domain)
}

export async function removeCustomDomainFromVercel(domainValue: string) {
  const domain = normalizeCustomDomain(domainValue)
  if (!domain) throw new VercelDomainError("Enter a valid custom domain.", 400, "invalid_domain")
  const { projectId } = getVercelDomainEnvironment()

  try {
    await vercelRequest<Record<string, never>>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`,
      { body: JSON.stringify({ removeRedirects: true }), method: "DELETE" },
    )
  } catch (error) {
    if (!(error instanceof VercelDomainError) || error.status !== 404) throw error
  }
}
