import assert from "node:assert/strict"
import test from "node:test"

import { sanitizeEmailSignupEmbed } from "../src/lib/email-signup-embed-security.ts"
import {
  detectEmailSignupProvider,
  getHostedEmailSignupUrl,
  isAllowedEmailSignupUrl,
} from "../src/lib/email-signup-providers.ts"
import { stripPrivateWebsiteSettings } from "../src/lib/website-settings-security.ts"

test("email signup providers are recognized from hosted links and embed snippets", () => {
  assert.equal(detectEmailSignupProvider("https://example.ck.page/photography"), "kit")
  assert.equal(detectEmailSignupProvider('<form action="https://studio.us12.list-manage.com/subscribe/post"></form>'), "mailchimp")
  assert.equal(detectEmailSignupProvider('<div class="ml-form-embed">MailerLite</div>'), "mailerlite")
  assert.equal(detectEmailSignupProvider("https://example.com/form"), "")
})

test("hosted signup links require HTTPS and a supported provider domain", () => {
  assert.equal(getHostedEmailSignupUrl("https://forms.aweber.com/form/1"), "https://forms.aweber.com/form/1")
  assert.equal(getHostedEmailSignupUrl("http://forms.aweber.com/form/1"), "")
  assert.equal(isAllowedEmailSignupUrl("https://aweber.com.evil.example/form"), false)
  assert.equal(isAllowedEmailSignupUrl("javascript:alert(1)"), false)
})

test("email signup embed sanitization removes executable and unsupported content", () => {
  const sanitized = sanitizeEmailSignupEmbed(`
    <form action="https://studio.us12.list-manage.com/subscribe/post" onsubmit="steal()">
      <input name="EMAIL" type="email" onfocus="steal()">
      <button type="submit">Subscribe</button>
    </form>
    <script>alert("inline")</script>
    <script src="https://evil.example/tracker.js"></script>
  `)

  assert.match(sanitized, /studio\.us12\.list-manage\.com/)
  assert.match(sanitized, /Subscribe/)
  assert.doesNotMatch(sanitized, /onsubmit|onfocus|steal|evil\.example|alert/)
  assert.equal(sanitizeEmailSignupEmbed("<form action='https://evil.example'>Bad</form>"), "")
})

test("saved website settings sanitize email signup blocks without changing other blocks", () => {
  const settings = stripPrivateWebsiteSettings({
    customBlocks: [
      {
        embedCode: '<form action="https://app.kit.com/forms/123/subscriptions"><input onfocus="bad()"></form>',
        id: "signup",
        type: "email-signup",
      },
      { body: "Keep me", id: "text", type: "text" },
    ],
    lightroomImport: { apiKey: "secret", enabled: true },
  })
  const blocks = settings.customBlocks as Array<Record<string, unknown>>

  assert.doesNotMatch(String(blocks[0].embedCode), /onfocus|bad/)
  assert.equal(blocks[1].body, "Keep me")
  assert.deepEqual(settings.lightroomImport, { apiKey: "", enabled: true })
})
