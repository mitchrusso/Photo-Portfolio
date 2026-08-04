import { createPrivateKey, createSign } from "node:crypto"
import { resolveNs, resolveTxt } from "node:dns/promises"

export const DOMAIN_CONNECT_PROVIDER_ID = "photoview.io"
export const DOMAIN_CONNECT_APEX_SERVICE_ID = "website-apex"
export const DOMAIN_CONNECT_SUBDOMAIN_SERVICE_ID = "website-subdomain"

export type DomainConnectServiceId =
  | typeof DOMAIN_CONNECT_APEX_SERVICE_ID
  | typeof DOMAIN_CONNECT_SUBDOMAIN_SERVICE_ID

export type DnsSetupGuidance = {
  automaticSetupAvailable: boolean
  domainConnectDiscovered: boolean
  nameservers: string[]
  providerDashboardUrl: string | null
  providerName: string | null
  setupMode: "automatic" | "guided" | "manual"
}

type DnsProvider = {
  dashboardUrl: string
  matches: RegExp[]
  name: string
}

type DomainConnectSettings = {
  providerDisplayName?: string
  providerId: string
  providerName: string
  urlAPI: string
  urlSyncUX?: string
}

export type DomainConnectCapability = {
  providerName: string
  serviceId: DomainConnectServiceId
  urlSyncUX: string
}

const DNS_PROVIDERS: DnsProvider[] = [
  {
    dashboardUrl: "https://dash.cloudflare.com/",
    matches: [/\.ns\.cloudflare\.com$/],
    name: "Cloudflare",
  },
  {
    dashboardUrl: "https://dcc.godaddy.com/portfolio",
    matches: [/\.domaincontrol\.com$/],
    name: "GoDaddy",
  },
  {
    dashboardUrl: "https://account.squarespace.com/domains/managed",
    matches: [/\.googledomains\.com$/, /\.squarespacedns\.com$/],
    name: "Squarespace Domains",
  },
  {
    dashboardUrl: "https://ap.www.namecheap.com/domains/domaincontrolpanel/",
    matches: [/\.registrar-servers\.com$/],
    name: "Namecheap",
  },
  {
    dashboardUrl: "https://manage.wix.com/account/domains",
    matches: [/\.wixdns\.net$/],
    name: "Wix",
  },
  {
    dashboardUrl: "https://hpanel.hostinger.com/domains",
    matches: [/\.dns-parking\.com$/],
    name: "Hostinger",
  },
  {
    dashboardUrl: "https://my.ionos.com/domains",
    matches: [/\.ui-dns\.(?:biz|com|de|org)$/],
    name: "IONOS",
  },
  {
    dashboardUrl: "https://wordpress.com/domains/manage/",
    matches: [/\.wordpress\.com$/],
    name: "WordPress.com",
  },
  {
    dashboardUrl: "https://vercel.com/dashboard/domains",
    matches: [/\.vercel-dns\.com$/],
    name: "Vercel DNS",
  },
]

const TRUSTED_DOMAIN_CONNECT_HOSTS: Record<string, string[]> = {
  "api.cloudflare.com": ["api.cloudflare.com", "dash.cloudflare.com"],
  "api.domainconnect.ionos.com": ["api.domainconnect.ionos.com"],
  "domainconnect.godaddy.com": ["domainconnect.godaddy.com"],
  "domainconnect.vercel.com": ["domainconnect.vercel.com", "vercel.com"],
}

const DNS_LOOKUP_TIMEOUT_MS = 2_500
const DOMAIN_CONNECT_HTTP_TIMEOUT_MS = 3_500

function normalizedNameserver(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "")
}

export function detectDnsProvider(nameservers: string[]) {
  const normalized = nameservers.map(normalizedNameserver)
  return DNS_PROVIDERS.find((provider) =>
    normalized.some((nameserver) => provider.matches.some((pattern) => pattern.test(nameserver))),
  ) ?? null
}

async function withTimeout<T>(operation: Promise<T>, fallback: T) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), DNS_LOOKUP_TIMEOUT_MS)
      }),
    ])
  } catch {
    return fallback
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function domainConnectRecords(apexName: string) {
  const records = await withTimeout(resolveTxt(`_domainconnect.${apexName}`), [])
  return records.map((parts) => parts.join("").trim()).filter(Boolean)
}

function trustedDiscoveryUrl(record: string, apexName: string) {
  if (!/^[A-Za-z0-9.-]+(?::443)?(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?$/.test(record)) {
    return null
  }

  try {
    const prefix = new URL(`https://${record}`)
    if (
      prefix.protocol !== "https:"
      || prefix.username
      || prefix.password
      || (prefix.port && prefix.port !== "443")
      || prefix.search
      || prefix.hash
      || !TRUSTED_DOMAIN_CONNECT_HOSTS[prefix.hostname.toLowerCase()]
    ) return null

    const path = `${prefix.pathname.replace(/\/+$/, "")}/v2/${encodeURIComponent(apexName)}/settings`
    return new URL(path, prefix.origin)
  } catch {
    return null
  }
}

function trustedProviderUrl(value: unknown, discoveryHostname: string) {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    const allowedHosts = TRUSTED_DOMAIN_CONNECT_HOSTS[discoveryHostname] ?? []
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || (url.port && url.port !== "443")
      || url.search
      || url.hash
      || !allowedHosts.includes(url.hostname.toLowerCase())
    ) return null
    url.pathname = url.pathname.replace(/\/+$/, "")
    return url
  } catch {
    return null
  }
}

async function readDomainConnectSettings(apexName: string, records: string[]) {
  for (const record of records) {
    const settingsUrl = trustedDiscoveryUrl(record, apexName)
    if (!settingsUrl) continue

    try {
      const response = await fetch(settingsUrl, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(DOMAIN_CONNECT_HTTP_TIMEOUT_MS),
      })
      if (!response.ok) continue
      const payload = await response.json() as Partial<DomainConnectSettings>
      if (
        typeof payload.providerId !== "string"
        || typeof payload.providerName !== "string"
        || typeof payload.urlAPI !== "string"
      ) continue

      const urlAPI = trustedProviderUrl(payload.urlAPI, settingsUrl.hostname)
      const urlSyncUX = trustedProviderUrl(payload.urlSyncUX, settingsUrl.hostname)
      if (!urlAPI) continue

      return {
        providerDisplayName: typeof payload.providerDisplayName === "string"
          ? payload.providerDisplayName
          : undefined,
        providerId: payload.providerId,
        providerName: payload.providerName,
        urlAPI: urlAPI.toString().replace(/\/$/, ""),
        urlSyncUX: urlSyncUX?.toString().replace(/\/$/, ""),
      } satisfies DomainConnectSettings
    } catch {
      continue
    }
  }
  return null
}

function serviceIdFor(domain: string, apexName: string): DomainConnectServiceId {
  return domain === apexName ? DOMAIN_CONNECT_APEX_SERVICE_ID : DOMAIN_CONNECT_SUBDOMAIN_SERVICE_ID
}

export function isDomainConnectSigningConfigured() {
  return Boolean(process.env.DOMAIN_CONNECT_PRIVATE_KEY_BASE64?.trim())
}

export async function getDomainConnectCapability(
  domain: string,
  apexName: string,
): Promise<DomainConnectCapability | null> {
  if (!isDomainConnectSigningConfigured()) return null
  const records = await domainConnectRecords(apexName)
  const settings = await readDomainConnectSettings(apexName, records)
  if (!settings?.urlSyncUX) return null

  const serviceId = serviceIdFor(domain, apexName)
  const templateUrl = new URL(
    `${new URL(settings.urlAPI).pathname}/v2/domainTemplates/providers/${DOMAIN_CONNECT_PROVIDER_ID}/services/${serviceId}`,
    new URL(settings.urlAPI).origin,
  )

  try {
    const response = await fetch(templateUrl, {
      cache: "no-store",
      headers: { Accept: "application/domainconnect-template+json, application/json" },
      signal: AbortSignal.timeout(DOMAIN_CONNECT_HTTP_TIMEOUT_MS),
    })
    if (!response.ok) return null
    return {
      providerName: settings.providerDisplayName || settings.providerName,
      serviceId,
      urlSyncUX: settings.urlSyncUX,
    }
  } catch {
    return null
  }
}

export async function getDnsSetupGuidance(
  apexName: string,
  domain = apexName,
): Promise<DnsSetupGuidance> {
  const [resolvedNameservers, records] = await Promise.all([
    withTimeout(resolveNs(apexName), []),
    domainConnectRecords(apexName),
  ])
  const nameservers = resolvedNameservers
    .map(normalizedNameserver)
    .sort()
  const provider = detectDnsProvider(nameservers)
  const domainConnectDiscovered = records.length > 0
  const capability = domainConnectDiscovered
    ? await getDomainConnectCapability(domain, apexName)
    : null
  const automaticSetupAvailable = capability !== null

  return {
    automaticSetupAvailable,
    domainConnectDiscovered,
    nameservers,
    providerDashboardUrl: provider?.dashboardUrl ?? null,
    providerName: provider?.name ?? capability?.providerName ?? null,
    setupMode: automaticSetupAvailable ? "automatic" : provider ? "guided" : "manual",
  }
}

function domainConnectPrivateKey() {
  const encoded = process.env.DOMAIN_CONNECT_PRIVATE_KEY_BASE64?.trim()
  if (!encoded) throw new Error("Domain Connect request signing is not configured.")
  const key = createPrivateKey(Buffer.from(encoded, "base64").toString("utf8"))
  if (key.asymmetricKeyType !== "rsa") throw new Error("Domain Connect requires an RSA signing key.")
  return key
}

function domainConnectKeyLabel() {
  const value = process.env.DOMAIN_CONNECT_KEY_LABEL?.trim() || "_dcpubkeyv1"
  if (!/^_[A-Za-z0-9-]{1,61}$/.test(value)) {
    throw new Error("DOMAIN_CONNECT_KEY_LABEL must be one underscore-prefixed DNS label.")
  }
  return value
}

export function encodeDomainConnectParameter(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
}

export function canonicalDomainConnectQuery(parameters: Record<string, string>) {
  return Object.entries(parameters)
    .map(([name, value]) => [
      encodeDomainConnectParameter(name),
      encodeDomainConnectParameter(value),
    ] as const)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([name, value]) => `${name}=${value}`)
    .join("&")
}

export function createSignedDomainConnectApplyUrl(input: {
  apexName: string
  capability: DomainConnectCapability
  connectionRecord: { type: "A" | "CNAME"; value: string }
  domain: string
  redirectUri: string
  state: string
}) {
  const host = input.domain === input.apexName
    ? ""
    : input.domain.slice(0, -(input.apexName.length + 1))
  const expectedType = input.capability.serviceId === DOMAIN_CONNECT_APEX_SERVICE_ID ? "A" : "CNAME"
  if (input.connectionRecord.type !== expectedType) {
    throw new Error(`The ${input.capability.serviceId} template requires a ${expectedType} record.`)
  }

  const parameters: Record<string, string> = {
    domain: input.apexName,
    redirect_uri: input.redirectUri,
    state: input.state,
    ...(host ? { host } : {}),
    ...(input.connectionRecord.type === "A"
      ? { ipv4: input.connectionRecord.value }
      : { cname: input.connectionRecord.value }),
  }
  const canonicalQuery = canonicalDomainConnectQuery(parameters)
  const signature = createSign("RSA-SHA256")
    .update(canonicalQuery)
    .end()
    .sign(domainConnectPrivateKey(), "base64")
  const key = domainConnectKeyLabel()
  const applyBase = new URL(
    `${new URL(input.capability.urlSyncUX).pathname}/v2/domainTemplates/providers/${DOMAIN_CONNECT_PROVIDER_ID}/services/${input.capability.serviceId}/apply`,
    new URL(input.capability.urlSyncUX).origin,
  )
  applyBase.search = `${canonicalQuery}&sig=${encodeDomainConnectParameter(signature)}&key=${encodeDomainConnectParameter(key)}`
  return applyBase.toString()
}
