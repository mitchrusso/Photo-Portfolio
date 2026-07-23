import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { buildGmailRawMessage } from "../src/lib/partnership-crm/gmail-message.ts"

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
    "src/app/api/admin/crm/email/send/route.ts",
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

test("CRM Gmail authorization requires both search and send scopes", () => {
  const source = read("src/lib/partnership-crm/google.ts")
  assert.match(source, /gmail\.readonly/)
  assert.match(source, /gmail\.send/)
  assert.match(source, /hasRequiredGmailScopes/)
})

test("CRM email sending stays server-authorized and records successful outreach", () => {
  const source = read("src/app/api/admin/crm/email/send/route.ts")
  assert.match(source, /getAuthorizedCrmSession/)
  assert.match(source, /hasSameOrigin/)
  assert.match(source, /crmGmailAddress\(\)/)
  assert.match(source, /users\/me\/messages\/send/)
  assert.match(source, /status: "SENDING"/)
  assert.match(source, /status: "SENT"/)
  assert.match(source, /crmActivity\.create/)
  assert.doesNotMatch(source, /NEXT_PUBLIC_/)
})

test("Gmail raw messages encode unicode subject and body without client secrets", () => {
  const raw = buildGmailRawMessage({ body: "Hello — PhotoView", from: "mitch@photoview.io", subject: "Partnership ✓", to: "partner@example.com" })
  const decoded = Buffer.from(raw, "base64url").toString("utf8")
  assert.match(decoded, /From: PhotoView\.io <mitch@photoview\.io>/)
  assert.match(decoded, /To: partner@example\.com/)
  assert.match(decoded, /Subject: =\?UTF-8\?B\?/)
  assert.match(decoded, /Content-Transfer-Encoding: base64/)
})

test("CRM send UI requires a final review and explicit send action", () => {
  const source = read("src/components/admin/partnership-crm.tsx")
  assert.match(source, /Final review/)
  assert.match(source, /This sends immediately/)
  assert.match(source, /Review and send/)
  assert.match(source, /\/api\/admin\/crm\/email\/send/)
})

test("CRM partnership outreach stays inside the application", () => {
  const component = read("src/components/admin/partnership-crm.tsx")
  assert.match(component, /Open outreach workspace/)
  assert.match(component, /Approve and schedule all 4 emails/)
  assert.match(component, /three follow-ups/)
  assert.doesNotMatch(component, /gmailComposeUrl/)
  assert.doesNotMatch(component, /Open in Gmail/)
})

test("CRM generates a complete PhotoView introduction and three follow-ups", () => {
  const generator = read("src/app/api/admin/crm/sequences/generate/route.ts")
  const templates = read("src/lib/partnership-crm/email-sequences.ts")
  assert.match(generator, /count: z\.number\(\).*default\(4\)/)
  assert.match(generator, /The product link is https:\/\/photoview\.io/)
  assert.match(templates, /store, organize, curate, present, and share/)
  assert.match(templates, /Closing the loop/)
})

test("CRM presents its messaging address without mislabeling the SuperAdmin login as a sender", () => {
  const component = read("src/components/admin/partnership-crm.tsx")
  const page = read("src/app/admin/partnerships/page.tsx")
  assert.match(component, /CRM email account/)
  assert.match(component, /Partnership messages are composed, sent, and synchronized through this address/)
  assert.match(component, /SuperAdmin login is used only to protect access/)
  assert.doesNotMatch(component, /Signed-in administrator/)
  assert.doesNotMatch(component, /signedInEmail/)
  assert.doesNotMatch(page, /signedInEmail=/)
})

test("integrated CRM has no localStorage persistence", () => {
  const files = ["src/components/admin/partnership-crm.tsx", "src/lib/partnership-crm/data.ts"]
  for (const file of files) assert.doesNotMatch(read(file), /localStorage/)
})

test("CRM migration includes all preserved business records", () => {
  const schema = read("prisma/schema.prisma")
  for (const model of ["CrmPartner", "CrmContact", "CrmActivity", "CrmTask", "CrmMeeting", "CrmNote", "CrmOutreach", "CrmGoogleConnection"]) assert.match(schema, new RegExp(`model ${model}`))
})
