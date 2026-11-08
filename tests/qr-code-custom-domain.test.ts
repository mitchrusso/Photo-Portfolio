import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { isAllowedQrCodeTarget } from "../src/lib/qr-code-target.ts"

test("QR codes allow verified published PhotoView custom domains", async () => {
  const checked: string[] = []
  const isPublishedCustomDomain = async (hostname: string) => {
    checked.push(hostname)
    return hostname === "barta-iv.com"
  }

  assert.equal(await isAllowedQrCodeTarget(new URL("https://barta-iv.com/portfolio"), {
    isProduction: true,
    isPublishedCustomDomain,
  }), true)
  assert.deepEqual(checked, ["barta-iv.com"])
})

test("QR codes reject unverified external domains and non-HTTPS custom URLs", async () => {
  const isPublishedCustomDomain = async () => false

  assert.equal(await isAllowedQrCodeTarget(new URL("https://example.com/portfolio"), {
    isProduction: true,
    isPublishedCustomDomain,
  }), false)
  assert.equal(await isAllowedQrCodeTarget(new URL("http://barta-iv.com/portfolio"), {
    isProduction: true,
    isPublishedCustomDomain: async () => true,
  }), false)
})

test("QR codes keep PhotoView and local-development targets working without a domain lookup", async () => {
  let lookupCount = 0
  const isPublishedCustomDomain = async () => {
    lookupCount += 1
    return false
  }

  assert.equal(await isAllowedQrCodeTarget(new URL("https://joe.photoview.io/portfolio"), {
    isProduction: true,
    isPublishedCustomDomain,
  }), true)
  assert.equal(await isAllowedQrCodeTarget(new URL("http://localhost:3000/portfolio"), {
    isProduction: false,
    isPublishedCustomDomain,
  }), true)
  assert.equal(lookupCount, 0)
})

test("the QR route verifies custom domains against published PhotoView websites", async () => {
  const route = await readFile(new URL("../src/app/api/qr-code/route.ts", import.meta.url), "utf8")
  const publication = await readFile(new URL("../src/lib/website-publication.ts", import.meta.url), "utf8")

  assert.match(route, /isAllowedQrCodeTarget/)
  assert.match(route, /isPublishedCustomDomain/)
  assert.match(publication, /customDomainVerifiedAt: \{ not: null \}/)
  assert.match(publication, /publishedBody: \{ not: null \}/)
  assert.match(publication, /status: "ACTIVE"/)
})
