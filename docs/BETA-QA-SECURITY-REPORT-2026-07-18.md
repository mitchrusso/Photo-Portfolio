# PhotoView.io Beta QA and Security Report

**Review date:** July 18, 2026
**Scope:** Application code, 59 API routes, authentication and authorization boundaries, public media delivery, subscriber uploads, external imports, third-party callbacks, build configuration, dependencies, and release runtime checks.

## Executive result

PhotoView.io is **code-ready and deployed for a controlled beta after the remaining manual gates at the end of this report are completed**. The sweep found no remaining known critical or high-severity code vulnerability after remediation. The production build, schema validation, lint, dependency audit, automated regressions, unauthenticated route probes, and browser rendering checks all pass.

This assessment does not claim that a web application can be made risk-free. The production database migration and application deployment have now been verified. Cloudflare's public-bucket policy, backups, and the remaining signed-in/manual workflows must still be checked in their provider dashboards or with an interactive account.

## Evidence

| Check | Result |
| --- | --- |
| Automated regression suite | 115/115 passed |
| ESLint | Passed; no errors or warnings |
| Production Next.js build | Passed; TypeScript and 80 static pages completed |
| Prisma schema validation | Passed |
| `npm audit --omit=dev` | 0 known vulnerabilities |
| Browser rendering | Passed in headless Chrome; meaningful UI rendered with no Next.js error overlay |
| Unauthenticated route probes | Dashboard/admin redirected to login; invalid media/gallery routes failed closed |
| Security headers | CSP, HSTS, `nosniff`, referrer policy, permissions policy, and COOP present |
| Secret scan | No real credential file is tracked; history match was an empty example value |
| Diff hygiene | `git diff --check` passed |

The initial local Prisma migration-status command could not contact a database because this checkout uses the intentionally non-running example connection at `localhost:5432`. Vercel's production build subsequently connected to Neon and successfully applied and reverified all 13 migrations.

## Findings remediated

### 1. Public pages could serialize underlying storage references — High

Public gallery data could include original Blob/provider URLs. With a legacy publicly reachable object URL, a visitor could bypass PhotoView.io's password and download-policy route.

**Fix:** Every database-backed public photo reference is now rewritten to the controlled `/api/media/...` delivery route. Cover, display, source, thumbnail, download, and social-image references no longer expose provider URLs. Password and download rules remain enforced at delivery time.

### 2. Published websites loaded more workspace data than they needed — High

The published-site loader used the owner's complete workspace gallery model and filtered too late. Private portfolio metadata and raw asset references could enter a public server-rendered payload.

**Fix:** Published sites now load only the public persistence model. Private and client-portal portfolios are excluded. Unlisted portfolios are excluded from directory and website discovery and are returned only when an exact slug is deliberately requested.

### 3. Draft-only website media was publicly retrievable — High

Knowing a website-media photo ID could retrieve an asset before the website was published.

**Fix:** Website media now requires the same-workspace authenticated owner or an exact reference in that workspace's currently published website document. Unauthorized and draft-only requests return `404` to avoid leaking existence.

### 4. Subscriber-entered website links allowed scriptable schemes — High

Saved Hero, About, or legacy trip actions could contain a `javascript:` or other unsafe URL and execute when a visitor clicked it.

**Fix:** Published actions now accept only safe anchors, root-relative paths, and credential-free HTTP/HTTPS URLs. Scriptable, protocol-relative, malformed, credential-bearing, backslash, and newline forms fall back safely.

### 5. Feedback attachments trusted extension and MIME labels — Medium

An authenticated subscriber could label arbitrary bytes as an image or text attachment. Those bytes were forwarded to operational email.

**Fix:** The server now verifies canonical base64, extension/MIME agreement, JPEG/PNG/WebP magic bytes, and valid control-safe UTF-8 text. SVG, HTML, executable content, and mismatches are rejected. The browser picker is restricted to the same formats.

### 6. Large remote responses could exhaust function memory — Medium

SmugMug, retailer import, and social-render fetches relied partly on `Content-Length` or consumed an entire body before enforcing limits. Chunked or dishonest responses could exceed intended memory bounds.

**Fix:** A shared streaming reader now counts bytes while reading, cancels over-limit streams, and caps SmugMug and retailer pages at 2 MB and social render sources at 40 MB.

### 7. High-resolution uploads could multiply serverless memory use — Medium

Display and thumbnail Sharp pipelines decoded large originals concurrently. A technically allowed high-megapixel image could cause avoidable peak memory pressure.

**Fix:** Variant generation is sequential and every Sharp pipeline has an explicit 100-megapixel decode ceiling. General uploads retain the 100 MB technical ceiling and format/content validation. Custom watermarks have tighter 10 MB and 16-megapixel limits.

### 8. Replacing a Lightroom/Desktop key did not revoke the previous key — Medium

Workspace-scoped signed keys expired after 90 days but generating a replacement did not invalidate the old key.

**Fix:** New credentials include cryptographic randomness and a SHA-256 token record per workspace. Issuing a replacement atomically supersedes the previous token. A database migration creates the credential table. Legacy tokens remain compatible only until their owner generates the first rotating key.

### 9. Lightroom could send a key to a mistyped or hostile endpoint — Medium

The bundled plugin defaulted to localhost and accepted an arbitrary API base URL, allowing a subscriber to paste a key into an unsafe destination.

**Fix:** The default is `https://photoview.io`. Production requests are restricted to PhotoView.io; only localhost and `127.0.0.1` HTTP ports remain available for explicit development. The downloadable plugin ZIP was rebuilt.

### 10. Missing input bounds and development redirect validation — Low/Medium

Several registration and telemetry strings had semantic validation but no practical maximum. The development-only login callback accepted an unvalidated redirect-like value.

**Fix:** Email, name, phone, studio, note, coupon, referral, website, gallery, network, and URL values now have bounded lengths. The development callback accepts only safe root-relative paths and remains unavailable in production.

### 11. Production configuration and browser policy could fail more safely — Medium

Production builds did not require a strong cron secret or a complete selected storage-provider configuration, and the application lacked a global content security policy.

**Fix:** Production builds now require at least 32-character auth and cron secrets, complete R2 or Vercel Blob configuration, coherent Stripe configuration, and coherent optional Meta/Twilio configuration. A CSP now blocks objects and unknown scripts by default, limits frames/forms, and upgrades insecure production requests. HSTS and the existing protected-route frame restrictions remain active; intentional embed pages remain embeddable.

### 12. Gallery settings undercounted visible photos — Low

The Gallery settings summary reused the public-view list, which intentionally omits the cover image to prevent a duplicate display. A six-photo portfolio therefore reported five shown even though all six visibility switches were enabled.

**Fix:** The settings summary now counts all visible renderable portfolio photos, including the cover, while the public viewer continues to suppress the duplicate cover tile.

## Upload and media safety matrix

| Path | Accepted | Safety controls |
| --- | --- | --- |
| Portfolio photographs | JPEG, PNG, WebP, AVIF, HEIC/HEIF, TIFF as supported | Declared MIME must match decoded format; 100 MB/100 MP technical bounds; storage entitlement; sequential bounded Sharp transforms |
| Custom watermark | Supported still image formats | Same signature/decoder validation plus 10 MB/16 MP bounds; stored as managed private gallery asset |
| Website Hero video | MP4 | 200 MB and 90-second limits; MP4 structure/duration validation; direct object upload; controlled delivery |
| Feedback attachments | JPEG, PNG, WebP, TXT | 2 MB each/3 MB total; base64, extension, MIME, signature, and UTF-8 checks |
| Lightroom/Desktop import | Supported still image formats | Workspace-scoped rotating 90-day credential; rate limiting; entitlement checks; server-side decode validation |
| Remote imports/renders | Approved public HTTP sources | SSRF/private-network rejection, redirect checking, timeouts, concurrency bounds, and streamed byte ceilings |

SVG is deliberately not accepted as an uploaded feedback or portfolio image because it can contain active content. Video is restricted to the dedicated Hero-video path instead of the general photo pipeline.

## Access-control review

- Subscriber identity uses one-time, expiring email links and database-backed workspace sessions.
- Workspace mutations require an authenticated session and use the session workspace rather than trusting a submitted workspace ID.
- SuperAdmin authorization is database-role based, then protected by a separate signed, login-bound, expiring SMS approval.
- Public gallery routes are workspace scoped. Private/client-portal content is excluded; password galleries require signed access cookies.
- R2 object references are opaque and delivery URLs are short-lived. The application no longer places underlying storage references in public gallery payloads.
- Stripe webhooks verify signatures and use durable idempotency/replay controls.
- Cron and automation routes require secrets; production builds now reject missing or weak cron configuration.
- Social OAuth state is signed; stored provider tokens use authenticated encryption.
- Outbound import URLs use public-network validation to block loopback, private, link-local, and reserved destinations.
- Rate limiting is applied to authentication, import, feedback, share, and other abuse-sensitive routes.

## Code-quality observations

The codebase builds and lints cleanly. One component, `portfolio-dashboard.tsx`, exceeds 500 KB of generated Babel input. This is not a beta blocker or security defect, but it is a maintainability and reviewability risk. After beta, split the dashboard into feature-level components and hooks so future changes are easier to test and less likely to create regressions.

The live validation initially found one Resend 422 record. It belonged to the internal developer sandbox address at the reserved `example.com` domain, not a customer. Production automation now skips reserved example/test/localhost domains, the historical record is retained as `SKIPPED`, and the alert is resolved. The same pass aligned the direct Sharp dependency with Next.js, eliminating duplicate native libvips runtimes.

## Production validation result

Production commit `a248805` is live on `photoview.io`, `www.photoview.io`, `photoviewpro.com`, and the wildcard website domain. Vercel reports the deployment `Ready`.

| Live boundary | Result |
| --- | --- |
| Fail-closed production configuration | Passed in Stripe live mode |
| Database migrations | 13 found; no pending migrations after applying rotating import credentials |
| Public, login, and registration pages | HTTP 200 |
| Unauthenticated dashboard and SuperAdmin | Redirected to login |
| Production-only development login | Rejected with HTTP 403 |
| Invalid website media and gallery paths | Returned HTTP 404 |
| Invalid unsigned social render | Returned HTTP 403 |
| CSP, HSTS, and MIME-sniffing protection | Present |
| Public and unlisted portfolio pages | HTTP 200 using live database fixtures |
| Password portfolio access | Live temporary fixture required the gate, rejected a wrong password, accepted the correct password, and was restored to private-link access |
| Draft-only website media | Returned HTTP 404 |
| Public photo delivery | Controlled HTTP 307 to a signed R2 URL; `no-store` and `no-referrer` |
| Stripe webhook records | 7 completed, 0 failed/stale; recent live checkout, subscription, and invoice events |
| Lifecycle email records | 42 sent, 0 failed, 1 intentionally skipped developer placeholder |
| Vercel error scan after correction | No errors found |
| Public health endpoint | `ok` |

The existing `Testing` portfolio provided a reversible password-access fixture. The gate, rejection, acceptance, and restoration checks passed. Private-link delivery was already verified. A client-portal fixture is still unavailable for a non-destructive live test.

## Required deployment gates

Complete the remaining items before inviting beta subscribers:

1. **Cloudflare dashboard:** confirm the R2 bucket has public `r2.dev` and custom-domain access disabled. Controlled signed delivery is verified, but Vercel intentionally will not reveal the sensitive Cloudflare management values needed to inspect this policy remotely.
2. **Interactive subscriber smoke:** password and private-link access now pass in production. Create or select a client-portal fixture; verify upload/hide/download controls; publish and edit a website; replace a Lightroom key; and submit feedback with an attachment.
3. **Interactive identity smoke:** complete a subscriber magic-link login/logout and one SuperAdmin SMS challenge. These require access to the receiving inbox and phone.
4. **Provider dashboards:** visually confirm the Stripe webhook endpoint/event list, Resend domain health, Twilio Verify service, and Cloudflare storage/egress metrics. Database evidence already shows successful live Stripe events and lifecycle emails.
5. **Backups and recovery:** confirm Neon point-in-time recovery or daily backups, R2 object retention, and document one restore drill.
6. **Social publishing:** keep the feature labeled appropriately until Meta review and required publishing permissions are live.

## Beta recommendation

Proceed with a small, monitored beta after the six remaining manual gates are signed off. Start with a limited cohort, watch authentication failures, upload errors, storage growth, function memory, email/SMS delivery, payment webhooks, and unauthorized-response rates daily for the first week. No unresolved code-level critical or high finding remains from this review.
