import assert from "node:assert/strict"
import test from "node:test"
import { extractMailboxes, isPartnershipMessage, normalizedHost, prospectIdentity, slugifyProspect, syncQuery } from "../src/lib/partnership-crm/gmail-sync-rules.ts"

test("CRM Gmail synchronization parses display names and de-duplicates recipients", () => {
  assert.deepEqual(extractMailboxes('"Mitch Russo" <mitch@photoview.io>, Topaz Labs <help@topazlabs.com>, help@topazlabs.com'), [
    { email: "mitch@photoview.io", name: "Mitch Russo" },
    { email: "help@topazlabs.com", name: "Topaz Labs" },
  ])
})

test("CRM Gmail synchronization recognizes known partnership contacts", () => {
  assert.deepEqual(prospectIdentity({ email: "help@topazlabs.com", name: "Topaz Support" }), {
    category: "AI imaging",
    company: "Topaz Labs",
    website: "https://www.topazlabs.com",
  })
  assert.equal(prospectIdentity({ email: "editor@example-studio.com", name: "Editor" }, "PhotoView integration").company, "Example Studio")
})

test("CRM Gmail synchronization limits the full scan and overlaps incremental scans", () => {
  assert.equal(syncQuery(null, false), "in:sent newer_than:365d")
  assert.equal(syncQuery(new Date("2026-07-22T18:00:00.000Z"), false), "after:2026/07/15 {from:me to:me}")
  assert.equal(syncQuery(new Date("2026-07-22T18:00:00.000Z"), true), "in:sent newer_than:365d")
})

test("CRM Gmail synchronization applies conservative partnership classification", () => {
  assert.equal(isPartnershipMessage("PhotoView.io partnership idea", ""), true)
  assert.equal(isPartnershipMessage("Your receipt", "Thanks for your purchase"), false)
  assert.equal(normalizedHost("https://www.captureone.com/products"), "captureone.com")
  assert.equal(slugifyProspect("F-Stop Collaborate & Listen"), "f-stop-collaborate-listen")
})
