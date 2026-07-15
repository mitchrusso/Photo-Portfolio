# PhotoView.io Subscriber-Surface Audit

Date: July 15, 2026  
Production audited: `https://photoview.io`  
Repository state audited: commit `1e8ec34` plus the uncommitted audit artifacts in this folder

## Executive conclusion

The primary-domain migration is substantially complete, but the product is not yet clean enough to call the switch or subscriber experience fully complete.

- The apex site, `www`, sitemap, robots file, production deployment, health endpoint, and legacy-domain 301 redirects are healthy.
- Active application code and subscriber-facing source contain no references to `photoviewpro.com` except the intentional redirect configuration.
- One production workspace record still stores `https://photoviewpro.com` as its public domain. Historical analytics and one historical signup record also retain the old URL.
- Wildcard subscriber sites are not usable over HTTPS yet. `mitchell-russo.photoview.io` currently fails TLS, and its HTTP request reaches the application but returns 404.
- Several public and subscriber screens expose unfinished implementation notes, placeholder content, or non-working controls.
- AI Help contains stale builder directions and renders Markdown syntax as literal text.
- TinyEmail contains an invalid, unconfigured PhotoViewPro trial workflow. Reliable lifecycle messages are currently being sent by the app through Resend instead.

## Repair follow-up

The first repair pass was completed locally after the audit was recorded:

- Vercel now serves the wildcard hostname over HTTPS. The known `mitchell-russo` address returns the application 404 because that workspace does not yet have a published website record; its draft was not published without the owner's explicit approval.
- Public, custom-storage, and published subscriber-site contact forms now use a validated, rate-limited server endpoint with Resend delivery, success/error states, a honeypot, and published-workspace destination validation. Published-site messages are also persisted after successful delivery.
- Static public portfolio covers bypass the database-only media route, while database-backed galleries keep metered delivery.
- Settings → My Account no longer cancels its own summary request when loading begins.
- AI Help's website-builder guidance matches the current Build, Design, Site, toolbar, and Live Canvas interface, and answers are normalized to plain text.
- Subscriber-visible roadmap notes and the public gear placeholders were removed or replaced with current-capability language.
- Historical and launch documentation was labeled or updated to reflect the PhotoView.io migration and completed live billing verification.

Verification after these changes: ESLint passes, all 52 regression tests pass, and the Next.js production build and TypeScript validation pass. These repairs are not production changes until they are committed and deployed.

## Coverage

| Area | What was inspected | Health |
|---|---|---|
| Public website | Home, demo, comparison, portfolio, articles, article detail, blog, trips, gear, contact, storage contact, copyright, privacy, terms, registration, login, embed | Needs work |
| Authenticated product | Dashboard, Library, My Website, Galleries, Mobile Access, all nine Settings tabs, full Account | Needs work |
| Responsive behavior | Home, registration, dashboard, and account at a phone-size viewport; overflow metrics checked | Healthy with minor content density concerns |
| AI Help | Initial modal, a live website-builder answer, and all 28 source knowledge topics | Needs work |
| Merlin | Six walkthrough entry points, source definitions, 27 deterministic steps, and live first-step panels | Generally healthy |
| Edit Hints/tooltips | Control mapping, hint copy, destinations, accessible names, and live builder controls | Generally healthy |
| Subscriber email | Registration, login, trial, education, paid onboarding, payment failure, cancellation, storage warnings, and Resend delivery records | Healthy delivery; content follow-up needed |
| TinyEmail | Production configuration, workflow list, PhotoViewPro workflow details, and integration documentation | Not ready |
| Database-authored content | Text and JSON fields across production tables, including 5 workspaces, 84 galleries, 954 photos, 4 content posts, 23 email deliveries, and 6 signups | Old-domain cleanup needed |
| Domain/DNS/deployment | DNS delegation, apex/www responses, legacy redirects, wildcard hostname, Vercel domain attachment, latest production deployment, `/api/health` | Apex healthy; wildcard blocked |
| Code quality/security | ESLint, TypeScript/production build, 51 regression tests, production dependency audit, security headers, URL validation paths | Healthy baseline |
| Internal documentation | All tracked documentation plus TinyEmail and onboarding runbooks | Needs updating |

## Priority findings

### P0 — Wildcard subscriber addresses are not live

`*.photoview.io` is attached to the Vercel project and public DNS now delegates to Vercel nameservers. However, `https://mitchell-russo.photoview.io` fails during TLS negotiation. The HTTP request reaches Vercel but returns 404 on the matched `/site/[workspaceSlug]` route.

Impact: subscriber website addresses shown in the builder cannot currently be trusted as publishable URLs.

Recommended fix:

1. Confirm Vercel has issued the wildcard certificate after nameserver propagation.
2. Verify the wildcard domain status in Vercel and redeploy if certificate issuance remains stuck.
3. Publish or seed the saved website draft for `mitchell-russo`, then verify the workspace lookup on `/site/[workspaceSlug]`.
4. Add an automated production check for one known subscriber subdomain.

### P0 — Public contact page does not send messages

The public `/contact` form has no submit action. Its button is `type="button"`, the fields lack names/labels, and the page exposes the internal note:

> Form persistence will connect to the contact message database table next.

Impact: visitors believe they can contact the photographer, but nothing happens. The placeholder-only labels also create an accessibility problem.

Evidence: [public contact screenshot](screenshots/10-contact.png)

Recommended fix: connect the form to a validated server action/API, persist or deliver the message, add success/error states, add proper labels, rate-limit submissions, and remove the implementation note.

### P1 — Public portfolio covers are broken

All visible cover cards on `/portfolio` render broken images. The underlying Vercel Blob assets return 200, but the page rewrites static migrated cover IDs through `/api/media/{galleryId}/{photoId}`, and those API requests return 404 because the migrated identifiers do not resolve through the production database route.

Impact: the primary photography showcase appears visually broken.

Evidence: [broken public portfolio screenshot](screenshots/06-portfolio.png)

Recommended fix: only use the metered media route for database-backed photos, or make the media resolver fall back to the migrated static asset URL when a legacy record is not found.

### P1 — Settings → My Account remains stuck on skeletons

The four summary cards never resolve, although the full `/account` page loads the correct plan and billing data. The effect that starts the fetch depends on `accountSummaryStatus`; setting that status to `loading` immediately cleans up the first effect and marks its in-flight response as unmounted, while the second run exits because the state is already `loading`.

Impact: subscribers see a permanently loading account summary and may assume billing is broken.

Evidence: [stuck account summary](screenshots/23-account-tab.png), [healthy full account page](screenshots/31-account-full.png)

Recommended fix: remove the loading status from that effect's dependency cycle or use an AbortController without invalidating the initiating request.

### P1 — AI Help gives stale builder instructions and exposes raw Markdown

The live answer to “How do I build my website?” says to use a “template strip at the top,” “controls on the left,” and a preview “on the right.” The current builder uses Build, Design, and Site tools, a focus selector, and a Live Canvas. The response also displays `**My Website**` literally instead of formatting or stripping Markdown.

Impact: the help system sends subscribers looking for controls that do not exist in the described locations.

Evidence: [AI Help answer screenshot](screenshots/33-ai-help-answer.png)

Recommended fix: rewrite the `Building a photographer website` knowledge article against the current interface and render the returned answer with a safe Markdown renderer or plain-text normalizer.

### P1 — TinyEmail's PhotoViewPro workflow is invalid and unconfigured

TinyEmail is configured in production for contact tagging, but its only PhotoViewPro workflow is a draft named `PhotoViewPro - Trial Sequence`. Opening it shows:

- `Invalid workflow`
- API trigger `Not-Configured`
- the note that API keys for workflow triggers require an Enterprise plan
- no usable email/timing sequence

The app-owned Resend automation is currently the reliable message path. Production records show 23 of 23 tracked lifecycle deliveries sent and zero failed.

Impact: TinyEmail should not be described as an active automation layer. It is only a contact/tag segmentation layer in the present configuration.

Recommended fix: either build tag-triggered TinyEmail workflows and test them, or explicitly retire TinyEmail automations and keep Resend as the single lifecycle-email system.

### P1 — Subscriber-facing screens expose roadmap and backend notes

The following implementation language is visible to subscribers:

- Gallery: “Client portal is a placeholder for future subscriber/client access.”
- Imports: “The API key still needs to match the server-side import key until per-subscriber keys are wired to the database.”
- Storage: “This tab explains what the dashboard is measuring now and how subscriber storage can be enforced later.”

Evidence: [Gallery settings](screenshots/27-gallery-tab.png), [Imports settings](screenshots/28-imports-tab.png), [Storage settings](screenshots/30-storage-tab.png)

Recommended fix: remove roadmap/internal implementation language. Describe only what subscribers can do now, and hide controls for unavailable capabilities.

### P1 — The public gear page is placeholder content

`/whats-in-my-bag` says that the working gear list “will become editable,” labels every product as an “Amazon affiliate link placeholder,” and sends all product CTAs to generic Amazon.

Impact: the page looks unfinished and does not perform the affiliate/product function it advertises.

Evidence: [public gear screenshot](screenshots/16-bag.png)

Recommended fix: render approved database/builder gear, remove the static mock list, and hide the page when no published items exist.

### P2 — Custom storage form uses `mailto:` and exposes implementation status

`/storage-contact` opens the visitor's email client rather than reliably submitting a lead, and displays:

> This form opens your email client for now. We will connect it to the PhotoViewPro lead database when backend messaging is added.

Evidence: [custom storage screenshot](screenshots/14-storage-contact.png)

Recommended fix: submit to a protected lead endpoint and show a normal confirmation state.

### P2 — Published subscriber contact forms rely on `mailto:`

The website builder describes a “Form delivery email,” but published sites generate a `mailto:` form. This fails for visitors without a configured desktop mail client and is inconsistent with the expectation of an on-site contact form.

Recommended fix: deliver contact submissions server-side to the subscriber's configured address and optionally persist them in `ContactMessage`.

### P2 — Production database still contains the old domain

Active/historical database hits:

- `Workspace.publicDomain`: one workspace, slug `photoviewpro-test`, stores `https://photoviewpro.com`.
- `TrialSignup.website`: one historical signup stores `https://photoviewpro.com`.
- `AnalyticsEvent.referrer`: 31 historical events reference the old domain.

Recommended treatment:

- Update or remove the test workspace's active `publicDomain` value.
- Preserve analytics referrers as historical data unless a reporting requirement says otherwise.
- Treat the signup website field as user-entered historical input; do not silently rewrite it unless that test record is being removed.

### P2 — Internal documentation is stale

- `docs/SESSION-HANDOFF-2026-07-14.md` correctly contains historical old-domain references, but it should be labeled as historical to prevent future confusion.
- `docs/subscriber-onboarding.md` still lists final Stripe live setup and a supervised live checkout as incomplete, although those steps were completed.
- The same document says TinyEmail workflows are still needed; that remains true.
- `docs/PRD.md` still contains starter-template placeholder instructions.

Recommended fix: add a current launch-state document and mark historical handoffs explicitly.

## Healthy findings

1. `https://photoview.io` returns 200 and `/api/health` returns `{"status":"ok"}`.
2. `www.photoview.io` redirects to the apex domain.
3. Both legacy hosts return a path-and-query-preserving 301 to `https://photoview.io`.
4. Public DNS now reports `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
5. Vercel lists the latest production deployment as Ready.
6. The sitemap and robots file use `photoview.io`.
7. Current subscriber links in Sharing, Mobile Access, Lightroom setup, referrals, website builder, and email URL generation use `photoview.io`.
8. The code search found no active old-domain references outside the intentional redirect list. The remaining documentation references are historical.
9. All 51 regression tests pass.
10. ESLint passes.
11. The optimized production build passes TypeScript and generates all 65 application routes.
12. `npm audit --omit=dev` reports zero vulnerabilities.
13. External URL validation, Stripe webhook replay protection, signed magic links, signed cancellation surveys, gallery password integrity, role-based admin access, and workspace-scoped import keys have regression coverage.
14. Phone-width checks of the home, registration, dashboard, and account pages showed no horizontal overflow.
15. All six Merlin walkthroughs exist and contain 27 deterministic source-defined steps. Their entry panels and first-step live behavior are coherent and use the current builder terminology.
16. Edit Hints use a deterministic control map and the live builder exposes accessible button names for the major controls inspected.
17. Resend lifecycle delivery tracking contains 23 successful sends and no failures.

## Domain migration trace classification

Not every old-domain string should be deleted:

- Keep the host list in `next.config.ts`; it powers the required 301 redirects.
- Keep historical analytics referrers unless reporting policy requires normalization.
- Keep historical handoff content, but label it as historical.
- Remove or update active configuration values such as `Workspace.publicDomain` when they no longer represent a real external domain.

## Evidence limitations

- This was a read-only product audit. No production records, third-party workflows, DNS, or source files were changed other than adding this local audit report and screenshots.
- A live checkout was not repeated because it would create another real Stripe subscription. The previously completed live checkout and current Account state were inspected instead.
- Destructive actions such as cancellation, permanent photo deletion, and billing-card replacement were not executed.
- TinyEmail was inspected while authenticated, but its invalid PhotoViewPro workflow was not edited.
- Wildcard TLS may finish provisioning after DNS propagation; it was still failing at the time recorded above and must be retested before launch.

## Recommended repair order

1. Restore wildcard subscriber TLS and verify a real published subdomain.
2. Fix the dead public contact form and published-site contact delivery.
3. Fix public portfolio cover resolution.
4. Fix the stuck My Account summary.
5. Remove subscriber-visible implementation/roadmap language and public placeholder pages.
6. Update AI Help content and Markdown rendering.
7. Decide whether TinyEmail will be a real tag-triggered automation system or segmentation only.
8. Clean the active old-domain database value and refresh current internal documentation.
9. Run a focused end-to-end regression pass, then deploy and re-audit production.
