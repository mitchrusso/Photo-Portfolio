import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { shouldOpenResendReconciliationIncident } from "../src/lib/resend-delivery-policy.ts"
import { isExpectedUploadRejection } from "../src/lib/upload-operational-policy.ts"
import { getWebsitePhotoDisplayLabel } from "../src/lib/website-photo-labels.ts"

test("expected customer upload rejections do not become system incidents", () => {
  assert.equal(isExpectedUploadRejection("The file is not a valid or supported image."), true)
  assert.equal(isExpectedUploadRejection("Image dimensions exceed the safety limit."), true)
  assert.equal(isExpectedUploadRejection("Storage provider connection failed."), false)
})

test("Resend receipt polling is advisory when the signed webhook is configured", () => {
  assert.equal(shouldOpenResendReconciliationIncident({ checked: 50, failed: 50, webhookConfigured: true }), false)
  assert.equal(shouldOpenResendReconciliationIncident({ checked: 50, failed: 50, webhookConfigured: false }), true)
  assert.equal(shouldOpenResendReconciliationIncident({ checked: 50, failed: 2, webhookConfigured: false }), false)
})

test("website-wide filename hiding remains active inside the opened portfolio", () => {
  const photo = {
    blobUrl: "https://example.com/original.jpg",
    bytes: 1,
    downloadUrl: "https://example.com/download.jpg",
    fileName: "wildlife-01.jpg",
    height: 800,
    id: "photo-1",
    kind: "Image" as const,
    sourceUrl: "https://example.com/source.jpg",
    title: "wildlife-01.jpg",
    width: 1200,
  }
  assert.equal(getWebsitePhotoDisplayLabel({ photoLabelMode: "file-name", showFileNames: true }, photo, true), "")
  assert.equal(getWebsitePhotoDisplayLabel({ photoLabelMode: "caption", showFileNames: true }, { ...photo, caption: "Owl at dawn" }, true), "Owl at dawn")
})

test("pending SMS registration stays informational while owner email remains active", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/support-alerts.ts"), "utf8")
  const pendingBranch = source.slice(source.indexOf("verification.errorCode === 30034"), source.indexOf("} else {", source.indexOf("verification.errorCode === 30034")))
  assert.match(pendingBranch, /severity: "INFO"/)
  assert.match(pendingBranch, /countOccurrence: false/)
})
