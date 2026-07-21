import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8")

test("partnership CRM page repeats admin and MFA authorization server-side", () => {
  const source = read("src/app/admin/partnerships/page.tsx")
  assert.match(source, /isAdminSession\(session\)/)
  assert.match(source, /hasValidSuperAdminMfa\(session\)/)
})

test("CRM mutations and Google routes use server authorization", () => {
  for (const file of [
    "src/app/api/admin/crm/route.ts",
    "src/app/api/google/connect/route.ts",
    "src/app/api/google/callback/route.ts",
    "src/app/api/google/status/route.ts",
    "src/app/api/google/disconnect/route.ts",
    "src/app/api/gmail/messages/route.ts",
  ]) assert.match(read(file), /getAuthorizedCrmSession/)
})

test("production Google callback is fixed and credentials are server-only", () => {
  const source = read("src/lib/partnership-crm/google.ts")
  assert.match(source, /https:\/\/photoview\.io\/api\/google\/callback/)
  assert.match(source, /PARTNERSHIP_CRM_ENCRYPTION_KEY/)
  assert.match(source, /PARTNERSHIP_CRM_GMAIL_ADDRESS/)
  assert.match(source, /login_hint/)
  assert.match(source, /UnexpectedCrmGmailAccountError/)
  assert.match(source, /previousMatchesMailbox/)
  assert.match(source, /connection\.email\.trim\(\)\.toLowerCase\(\) !== crmGmailAddress\(\)/)
  assert.doesNotMatch(source, /NEXT_PUBLIC_GOOGLE/)
})

test("integrated CRM has no localStorage persistence", () => {
  const files = ["src/components/admin/partnership-crm.tsx", "src/lib/partnership-crm/data.ts"]
  for (const file of files) assert.doesNotMatch(read(file), /localStorage/)
})

test("CRM migration includes all preserved business records", () => {
  const schema = read("prisma/schema.prisma")
  for (const model of ["CrmPartner", "CrmContact", "CrmActivity", "CrmTask", "CrmMeeting", "CrmNote", "CrmOutreach", "CrmGoogleConnection"]) assert.match(schema, new RegExp(`model ${model}`))
})
