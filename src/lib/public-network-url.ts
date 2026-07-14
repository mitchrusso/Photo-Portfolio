import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

type AddressResolver = (hostname: string) => Promise<string[]>

type PublicImageValidationOptions = {
  resolveAddresses?: AddressResolver
}

async function defaultResolveAddresses(hostname: string) {
  return (await lookup(hostname, { all: true })).map(({ address }) => address)
}

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true

  const [first, second, third] = octets
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 0 && (third === 0 || third === 2))
    || (first === 192 && second === 88 && third === 99)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || (first === 198 && second === 51 && third === 100)
    || (first === 203 && second === 0 && third === 113)
    || first >= 224
}

export function isPrivateOrReservedAddress(address: string) {
  const normalized = address.toLowerCase().split("%")[0]
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4)

  const version = isIP(normalized)
  if (version === 4) return isPrivateIpv4(normalized)
  if (version !== 6) return true

  return normalized === "::"
    || normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized === "2001:db8::"
    || normalized.startsWith("2001:db8:")
    || normalized.startsWith("ff")
}

export async function assertPublicHttpUrl(url: URL, resolveAddresses: AddressResolver = defaultResolveAddresses) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Use an http or https URL")
  if (url.username || url.password) throw new Error("URLs containing credentials are not supported")

  const hostname = url.hostname.toLowerCase()
  if (hostname === "localhost" || (isIP(hostname) && isPrivateOrReservedAddress(hostname))) {
    throw new Error("Private network addresses are not supported")
  }

  const addresses = await resolveAddresses(hostname)
  if (addresses.length === 0 || addresses.some((address) => isPrivateOrReservedAddress(address))) {
    throw new Error("Private network addresses are not supported")
  }
}

export async function validatePublicImageUrl(value: string, options: PublicImageValidationOptions = {}) {
  const resolveAddresses = options.resolveAddresses ?? defaultResolveAddresses

  try {
    const url = new URL(value)
    await assertPublicHttpUrl(url, resolveAddresses)
    // Do not fetch arbitrary image hosts from the application server. The browser
    // loads the image directly and the UI supplies a fallback when it is invalid.
    return url.toString()
  } catch {
    return ""
  }
}
