import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { CUSTOM_STORAGE_THRESHOLD_GB, subscriberPlans } from "../src/lib/plans.ts"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")

test("custom storage begins above the largest standard plan", () => {
  const largestPlanGb = Math.max(...subscriberPlans.map((plan) => plan.storageLimitBytes)) / 1024 ** 3

  assert.equal(CUSTOM_STORAGE_THRESHOLD_GB, largestPlanGb)
  assert.equal(CUSTOM_STORAGE_THRESHOLD_GB, 150)
})

test("pricing, contact, account, and registration share the custom storage threshold", () => {
  const pricing = read("src/app/pricing/page.tsx")
  const pricingGrid = read("src/components/site/pricing-plan-grid.tsx")
  const storageContact = read("src/app/storage-contact/page.tsx")
  const account = read("src/app/account/page.tsx")
  const register = read("src/app/register/page.tsx")
  const combined = [pricing, pricingGrid, storageContact, account, register].join("\n")

  assert.match(pricing, /More than \$\{CUSTOM_STORAGE_THRESHOLD_GB\} GB/)
  assert.match(pricingGrid, /plan\.storage\.toLowerCase\(\)/)
  assert.match(storageContact, /Need more than \{CUSTOM_STORAGE_THRESHOLD_GB\} GB\?/)
  assert.match(account, /Request more than \{CUSTOM_STORAGE_THRESHOLD_GB\} GB/)
  assert.match(register, /more than \$\{CUSTOM_STORAGE_THRESHOLD_GB\} GB\/year/)
  assert.doesNotMatch(combined, /more than 100 GB|above 100 GB/i)
})
