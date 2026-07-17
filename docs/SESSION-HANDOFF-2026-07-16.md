# PhotoView.io Session Handoff — July 16, 2026

This document is the current starting point for a new Codex thread. It supersedes `SESSION-HANDOFF-2026-07-14.md` for active work. The older handoff remains useful as historical context, but several priorities and rollout steps in it have already been completed.

## Instructions for the next thread

Before changing code:

1. Read this entire document.
2. Work in `/Users/mitchrusso/Documents/Codex/2026-07-03/i/Photo-Portfolio`.
3. Run `git status --short` and `git log -5 --oneline --decorate`.
4. Confirm that `main` is at or beyond commit `1e6819d` and that no user changes will be overwritten.
5. Read `docs/PRD.md` and the current files relevant to the requested task.
6. Treat `docs/audits/launch-readiness-2026-07-16/README.md` as historical audit evidence. Its product launch blockers were fixed by commit `89b7c9a`; the remaining hardening items are still relevant.
7. Do not repeat completed domain migration, builder redesign, pricing, Hero video, deletion, or demo-removal work unless a new regression is demonstrated.
8. Never print, commit, paste into chat, or otherwise expose credentials or environment-variable values.

Suggested opening request for the next thread:

> Read `docs/SESSION-HANDOFF-2026-07-16.md` completely, inspect the repository state, and summarize the current production status and Priority 1 before making changes. Preserve existing work and do not repeat tasks marked complete.

## Current project state

| Item | Current value |
| --- | --- |
| Product | PhotoView.io |
| Production URL | `https://photoview.io` |
| Subscriber sites | `https://<subscriber-slug>.photoview.io` |
| Repository | `/Users/mitchrusso/Documents/Codex/2026-07-03/i/Photo-Portfolio` |
| Branch | `main` |
| Git remote | `origin/main` |
| Handoff baseline commit | `1e6819d Restore compact controls and deletion tools` |
| Production deployment | `dpl_ADT6xvvkuoiWLUyxSU6RkNZNjKFK` |
| Deployment state | `READY` |
| Hosting | Vercel |
| Framework | Next.js App Router, React, TypeScript |
| Database | Prisma-backed relational database |
| Media storage | Private Cloudflare R2 objects served through authorized/signed application routes |
| Payments | Stripe live subscriptions, checkout, customer portal, and signed webhooks |
| Transactional/lifecycle email | Resend, sent by the application and scheduled by Vercel Cron |
| Audience synchronization | TinyEmail lists and tags; TinyEmail visual workflows should remain inactive to avoid duplicate delivery |

Verified production aliases on July 16:

- `photoview.io`
- `www.photoview.io`
- `*.photoview.io`
- legacy `photoviewpro.com` and `www.photoviewpro.com` aliases, retained for redirects

The old domain is intentionally still present in redirect/domain compatibility code. A blind search-and-delete of every `photoviewpro` occurrence would break legacy redirects, existing TinyEmail tag names, the desktop uploader command, or migration compatibility. User-facing product copy and active links should say **PhotoView.io**.

## Product direction

PhotoView.io is a portfolio-first publishing platform for serious amateur, prosumer, and emerging professional photographers. Its differentiator is a cinematic presentation on desktop with a clean, natural mobile viewing experience.

The product is not currently intended to be a complete studio-management, client-proofing, print-sales, or enterprise digital-asset-management replacement. Preserve the focused experience unless the product scope is explicitly changed.

Core promises:

- preserve originals privately;
- publish curated portfolios rather than storage dumps;
- make desktop presentation cinematic;
- make mobile navigation effortless;
- allow photographers to build a complete public website around their portfolios;
- provide simple sharing, embedding, referrals, imports, and monetizable gear recommendations;
- make important controls understandable without technical knowledge.

## Current plans and pricing

Pricing was deliberately raised before customer launch. At the time of the change, the owner confirmed there were no existing subscribers requiring grandfathering.

| Plan | Monthly | Annual | Included storage |
| --- | ---: | ---: | ---: |
| Starter | $3.99 | $39.99 | 5 GB |
| Growth | $5.99 | $59.99 | 20 GB |
| Studio | $7.99 | $79.99 | 50 GB |
| Premier | $11.99 | $119.99 | 150 GB |

The plan catalog is defined in `src/lib/plans.ts`. Live Stripe prices were created and the production price variables were configured. Use `npm run stripe:verify:production` before any pricing or billing release. Do not create replacement live prices or mutate billing configuration casually.

## Completed work since the July 14 handoff

### Production rollout and billing

- Live Stripe secret key, publishable key, webhook signing secret, and eight recurring live price IDs were configured in Vercel.
- Stripe checkout, 14-day trials, magic-link return flow, customer portal, webhook handling, subscription status, and plan display are implemented.
- Resend production sending was configured and verified with real login email delivery.
- Production deploys are aliased to `https://photoview.io`.
- Production build checks reject incomplete or unsafe production configuration.

### Domain and brand migration

- The active product name and core URL were migrated from PhotoViewPro.com to PhotoView.io.
- Public pages, application surfaces, subscriber-facing copy, help, tooltips, Tours, email content, and active links were scanned and updated.
- `www` and legacy domains redirect to the PhotoView.io apex.
- Subscriber wildcard domains are supported under `*.photoview.io`.
- TinyEmail lists were renamed to PhotoView.io. The older `photoviewpro:*` tag identifiers remain compatibility identifiers and are not subscriber-facing branding.

### Website builder redesign

The builder has been substantially simplified and should not be reverted to the old three-step model.

- Templates appear as a horizontal filmstrip at the top.
- A single left panel titled **Build your site** contains page accordions and Template controls.
- Page editors open and close inline; the separate Step 3 editor was removed.
- Grab handles allow page/navigation reordering.
- Template controls include colors, fonts, image frame styles, frame thickness, and image shapes.
- Template controls are scrollable within the builder.
- The selected template is clearly marked as **In Use**.
- Changes have visible saved/saving status and a Save changes control.
- Live Canvas includes desktop/mobile modes and a persistent Preview button in its header.
- Hero images render without unintended cropping; the live canvas and preview use consistent headline sizing rules.
- Frame style, frame thickness, and Square/Soft/Rounded/Arch shapes were repaired and regression tested.
- The old **Reset draft** control is now **Start Over**, with explanatory destructive-action text.
- Merlin was renamed to **Tours**, and the main action is **Take a Tour**.
- Ask AI, Tours, and theme controls use a permanent compact icon-only header presentation with accessible labels and titles.
- The dashboard top header is non-scrolling and condensed to preserve space on laptop screens.

### Hero video

Website Hero video is implemented and live:

- one Hero MP4 per website;
- maximum file size: 200 MB;
- maximum duration: 90 seconds;
- silent, looping, inline playback;
- poster/fallback behavior while loading;
- counts toward subscriber storage;
- displayed through authorized media routes;
- available only in the website Hero workflow.

Ordinary portfolio/gallery upload intentionally accepts still images and supported RAW files only. It must not be broadened to MP4 or MOV without a new product decision and a complete gallery-video design.

### Library, galleries, and deletion

- Individual photos can be selected and permanently deleted in Library.
- Multiple selected photos can be permanently deleted in one action.
- **Hide** remains a reversible publishing control and is not deletion.
- Captions, tags, location, date, visibility, and bulk metadata controls are present.
- Whole portfolios can be deleted from the gallery/portfolio area.
- Whole-portfolio deletion requires typing `DELETE`.
- The final remaining portfolio cannot be deleted; the subscriber must create another portfolio first. This protects the dashboard’s required default-gallery invariant.
- Object cleanup uses storage deletion jobs and shared-reference checks to avoid deleting a file still used elsewhere.

### Launch-readiness remediation

Commit `89b7c9a` fixed the product blockers found by the July 16 audit:

- ordinary uploads are restricted to still images/RAW and route-level validation/rate limiting;
- Hero MP4 remains isolated to the Hero endpoint;
- published navigation and muted copy inherit the chosen readable text color;
- publishing blocks visible starter content and requires a valid contact delivery email when Contact is enabled;
- older published sites without contact email do not expose a dead contact form;
- public portfolio counts use consistent inclusion and singular/plural wording;
- public portfolio back navigation returns to the subscriber’s website;
- global default-workspace lookup dependence was removed;
- AI help and publishing Tours explain readiness requirements.

### Marketing and subscriber support

- The Features page explicitly includes looping MP4 Hero video.
- The broken platform demo and its navigation links were removed; `/demo` returns 404.
- A persistent **Bug/Feature Request** control is available in the subscriber sidebar.
- Feedback type options are Bug, Improvement, Question, and Feedback.
- Feedback auto-populates the signed-in subscriber’s name and email and supports screenshots/files.
- A persistent **Earn more storage** referral shortcut is present.
- Successful referral reward is 1 GB of lifetime storage.
- AI help and Tours have been updated for current builder, deletion, publishing, and support workflows.

### Gear and affiliate tools

- What’s in My Bag supports categories, product copy, retailer/product links, affiliate tagging, and manual image upload.
- Quick Add can accept search terms or product links and creates an approval step before saving.
- Amazon Creators API environment variables were configured, but Amazon search/product-image retrieval was not reliable enough to be the only workflow.
- The approved fallback is subscriber manual image upload for gear items. Do not require subscribers to download images as the only long-term product vision, but do not claim automated Amazon imagery is currently reliable.
- Similar retailer imagery constraints may exist for B&H and other vendors unless an authorized API or allowed product feed is integrated.

## Current customer-facing capabilities

### Authentication and account

- passwordless email/magic-link authentication;
- 14-day Stripe trials and paid subscriptions;
- plan, storage, billing period, and next-billing information;
- Stripe customer portal for billing changes;
- cancellation and payment-failure lifecycle handling;
- subscriber referral link and lifetime-storage reward;
- SuperAdmin pages protected by server-side role checks.

### Portfolio and media

- create multiple galleries/portfolios;
- unlimited portfolios within plan storage constraints;
- upload still images and supported RAW files;
- private original preservation and display-image generation;
- choose covers, reorder, hide/show, caption, tag, date, and locate images;
- individual, bulk, and whole-portfolio deletion;
- public, unlisted, privacy, download, watermark, sharing, and embed controls;
- desktop cinematic viewer and mobile companion viewer;
- social queue/scheduler and portfolio sharing tools.

### Website publishing

- template filmstrip and live responsive canvas;
- Home/Hero, About, What’s in My Bag, Trips/Blog, Useful Articles, Contact, and custom content support;
- image or one MP4 Hero;
- page visibility and navigation ordering;
- custom fonts/colors/frames/shapes;
- preview and publish workflow;
- pre-publish readiness validation;
- PhotoView.io subscriber address assignment;
- custom-domain field/UI exists, but a complete self-service DNS verification and automated domain onboarding flow should be considered unfinished unless verified end to end.

### Imports and integrations

- SmugMug migration/import tooling;
- Lightroom plugin documentation and integration;
- desktop folder watcher/uploader;
- mobile/phone import workflow;
- Stripe billing;
- Resend transactional and lifecycle email;
- TinyEmail audience synchronization;
- Cloudflare R2 private storage;
- OpenAI-backed Ask AI assistance.

## Architecture and important files

### High-level request/data flow

1. Next.js pages and React client components render subscriber and public experiences.
2. Route handlers in `src/app/api` enforce authentication, entitlements, rate limits, signatures, and validation.
3. Prisma persists users, workspaces, subscriptions, galleries, media metadata, website drafts/publications, jobs, email ledgers, and operational events.
4. Originals and generated media live in private R2 storage.
5. Application media routes authorize access or issue short-lived access rather than exposing a public bucket.
6. Stripe webhooks update billing/subscription state and audience lifecycle tags.
7. Vercel Cron runs usage warnings, lifecycle email, storage cleanup/reconciliation, and health checks.

### Primary files and directories

| Area | Path |
| --- | --- |
| Main dashboard/builder UI | `src/components/portfolio/portfolio-dashboard.tsx` |
| Public portfolio view | `src/components/portfolio/public-gallery-view.tsx` |
| Website preview/public rendering | `src/components/site/website-draft-preview.tsx` |
| Site header/marketing navigation | `src/components/site/site-header.tsx` |
| AI help knowledge | `src/lib/ai-help-knowledge.ts` |
| Builder Tours | `src/lib/website-walkthroughs.ts` |
| Plan catalog | `src/lib/plans.ts` |
| Photo storage and deletion | `src/lib/photo-storage.ts` and storage API routes |
| Hero video endpoint | `src/app/api/website/hero-video/route.ts` |
| Website publication readiness | `src/lib/website-publication-readiness.ts` |
| Stripe webhook | `src/app/api/stripe/webhook/route.ts` |
| Lifecycle email content | `src/lib/lifecycle-email.ts` |
| Lifecycle cadence/eligibility | `src/lib/email-automations.ts` |
| Feedback UI/API | `src/components/feedback` and related API route |
| Regression tests | `tests/regressions.test.ts` and other files under `tests` |
| Prisma schema/migrations | `prisma` |
| Production configuration guard | `scripts/check-production-config.mjs` |
| Vercel schedules | `vercel.json` |

### Important documentation

- `docs/PRD.md` — current product requirements and launch gates.
- `docs/audits/launch-readiness-2026-07-16/README.md` — full audit and historical evidence; read the remediation section first.
- `docs/private-r2-media.md` — private R2 architecture, migration, and verification.
- `docs/tinyemail-autoresponder.md` — current audience/lifecycle ownership and sequence content.
- `docs/subscriber-lifecycle-verification.md` — lifecycle verification guidance.
- `docs/stripe-live-cutover.md` — live Stripe operational notes.
- `docs/User-Guide.md` — subscriber help baseline; keep it synchronized with UI changes.
- `docs/platform-foundation.md` — architecture history; some “next steps” are stale and must not override this handoff.
- `docs/SESSION-HANDOFF-2026-07-14.md` — historical handoff only.

## Email and lifecycle ownership

This division is important because duplicate email is a real risk:

- **Resend/application lifecycle is the production sender.**
- `/api/email/automations` runs hourly by Vercel Cron and uses a delivery ledger/idempotency.
- TinyEmail receives subscriber/audience membership and lifecycle tags.
- TinyEmail visual workflows should remain inactive unless the application lifecycle is deliberately disabled and the replacement has been tested.

Current sequences documented in `docs/tinyemail-autoresponder.md`:

- 7-message trial education sequence;
- 4-message initial customer onboarding sequence;
- 15-message Feature Academy, customer days 14 through 70;
- storage 75%, storage 90%, and storage-exceeded notices;
- payment-failed and canceled notices.

Feature Academy eligibility excludes paused, canceled, trialing, and past-due subscriptions. Cancellation/payment state is expected to stop future customer tutorial eligibility.

Vercel Cron schedules verified in the active deployment:

| Schedule | Route |
| --- | --- |
| Hourly at minute 0 | `/api/usage/check-thresholds` |
| Hourly at minute 15 | `/api/email/automations` |
| Hourly at minute 30 | `/api/storage/cleanup` |
| Daily at 02:45 | `/api/storage/reconcile` |
| Hourly at minute 5 | `/api/health/check` |

## Verification baseline at handoff

The latest release was checked with:

- TypeScript/build validation;
- ESLint;
- 74 automated tests passing;
- production `next build` passing;
- local authenticated browser inspection;
- public production homepage inspection;
- production deployment inspection showing `READY`.

Specific recent checks:

- compact top controls remain icon-only with accessible labels;
- no horizontal overflow at the tested desktop viewport;
- Library shows single/bulk delete, Caption, Hide, and photo detail controls;
- whole-portfolio deletion route and confirmation exist;
- Features includes Hero MP4 copy;
- Demo navigation is absent and `/demo` returns 404;
- production homepage shows the new Hero video feature and no Demo link;
- no console errors were observed in the sampled public/local browser states.

The local test database and production/user database may have different gallery/photo counts. A count mismatch between local screenshots and the owner’s production workspace is not itself data loss.

## Known limitations and unresolved risks

### Priority 1 — controlled production acceptance test

This is the most important next task before unrestricted invitations. The audit was intentionally non-destructive, so it did not complete a full real-money, real-customer lifecycle.

Use a designated smoke-test subscriber and a documented small transaction budget. Verify:

1. registration and trial checkout;
2. login email delivery and one-time magic link;
3. monthly checkout and annual checkout mapping to the correct plan/storage;
4. Stripe webhook state in PhotoView.io;
5. original photo upload, display rendering, and storage count;
6. Hero MP4 upload at a safe test size and duration;
7. website address, preview, publish, and wildcard site load;
8. public contact form delivery;
9. public portfolio navigation, mobile viewing, sharing, and embed;
10. billing portal access;
11. cancellation and cessation of future customer tutorial eligibility;
12. deletion of a test photo and a test portfolio, including storage cleanup job completion;
13. SuperAdmin health/event visibility for the test actions.

Do not use the owner’s primary billing account or delete real portfolio data for this test.

### Priority 2 — SuperAdmin security hardening

Server-side role checks and audit events exist, but broad launch should still add:

- MFA for SuperAdmin;
- step-up reauthentication for destructive, financial, impersonation, and access-changing actions;
- session revocation;
- unusual device/IP login alerts;
- consideration of separate admin and subscriber sessions.

### Priority 3 — external monitoring and performance evidence

Internal operational events and health pages are strong, but add:

- external exception tracking or a Vercel log drain;
- Vercel Speed Insights or equivalent real-user performance data;
- synthetic checks for login, published-site load, contact form, and webhook/health status;
- alert routing for failed email, stuck deletion jobs, stale webhooks, and public-site failures.

### Priority 4 — responsive and accessibility acceptance

- run exact 1280×800 testing on a 13-inch-class laptop or exact emulator;
- complete keyboard-only navigation across dashboard, Library, builder, dialogs, and published sites;
- audit 44 px touch targets on mobile;
- confirm visible focus styles and screen-reader names;
- verify every template against light/dark palettes for contrast;
- explicitly label any remaining URL/referral inputs.

### Priority 5 — dashboard decomposition

`src/components/portfolio/portfolio-dashboard.tsx` is extremely large (over 9,000 lines and over 500 KB in the July 16 audit). It triggers a Babel deoptimization warning and increases regression risk.

Do not rewrite it wholesale. Decompose it incrementally by stable feature boundary, with tests after every extraction. Suggested order:

1. compact header and shared dashboard chrome;
2. Library selection/detail/bulk actions;
3. gallery/portfolio management and deletion dialogs;
4. website builder/template controls;
5. sharing/social/mobile/import panels;
6. account/storage/support shortcuts.

### Other known constraints

- Automated Amazon product imagery remains unreliable; manual gear-image upload is the supported fallback.
- Self-service custom-domain DNS verification/automation has not been accepted end to end.
- General gallery video is intentionally unsupported; only one Hero MP4 is supported.
- The final portfolio cannot be deleted by design.
- Latest authenticated production dashboard UI still benefits from a user-session visual acceptance pass after deploy; Codex cannot bypass magic-link authentication.
- No live refund or complete cancellation/reactivation cycle was performed during the read-only audit.

## Safety and data-handling rules

- Preserve user data and unrelated working-tree changes.
- Use `apply_patch` for manual file edits.
- Do not use destructive Git commands.
- Never expose secrets from `.env.local`, Vercel, Stripe, Resend, TinyEmail, Cloudflare, Amazon, or OpenAI.
- Environment-variable names may be documented; values may not.
- Do not replace production environment variables without confirming the intended environment and value source.
- Do not create live Stripe charges, cancellations, refunds, price objects, or webhook changes without explicit authorization and a defined test budget.
- Do not delete production media or portfolios as part of routine QA.
- Do not activate TinyEmail sending workflows while the Resend lifecycle is active.
- Do not make the R2 bucket public.
- Do not change legacy redirects or compatibility tag names merely to eliminate textual remnants of the previous brand.
- Before committing, review `git diff --check`, relevant tests, lint, and build in proportion to the change.
- Before deploying, verify the branch/commit being deployed and inspect the resulting Vercel deployment state.

## Environment-variable categories

Do not record values in documentation. The application depends on categories including:

- authentication and canonical application URL;
- database connection;
- Stripe live secret, publishable key, webhook secret, expected mode, tax behavior, and eight price IDs;
- Resend API key and sender identity;
- TinyEmail API/audience configuration;
- Vercel Cron and email automation secrets;
- Cloudflare R2 account, bucket, credentials, and signing configuration;
- OpenAI API configuration;
- Amazon Creators API credentials and affiliate tags;
- SuperAdmin identity/authorization configuration.

Use Vercel’s encrypted environment management and existing scripts. Never move production secrets into source files.

## Useful commands

Run from the repository root:

```bash
cd /Users/mitchrusso/Documents/Codex/2026-07-03/i/Photo-Portfolio
git status --short
git log -5 --oneline --decorate
npm test
npm run lint
npm run build
npm run stripe:verify:production
npm run subscriber:lifecycle:verify
npx vercel inspect https://photoview.io --json
```

Local development:

```bash
npm run dev
```

Production deploy only when explicitly requested and after verification:

```bash
npx vercel --prod
```

Do not rerun `rollout:configure-production`, `amazon:credentials`, live price creation, R2 migrations, or plan migration merely as a health check. Those commands mutate configuration or data.

## Recent commit landmarks

| Commit | Purpose |
| --- | --- |
| `1e6819d` | Restore permanent compact controls, Library/bulk/portfolio deletion, remove Demo, update features/help |
| `89b7c9a` | Fix launch-readiness blockers found in the July 16 audit |
| `3b684de` | Condense dashboard header |
| `8b4b1be` | Remove builder toolbar scrolling |
| `d2a0ec7` | Restore compact builder controls |
| `b8eeb85` | Add full-frame Hero video support |
| `dfab518` | Fix plan migration build compatibility |
| `102bfef` | Add plan catalog data migration |
| `c8c3169` | Update subscription pricing and storage tiers |
| `f313b55` | Add subscriber feedback and referral shortcuts |
| `e7e463f` | Refine builder layout and rename guided Tours |

## Owner preferences and collaboration style

- The owner prefers forward progress and normally wants Codex to implement, test, then report the result.
- Do not repeatedly ask for permission for ordinary reversible implementation work.
- Ask before actions with real financial consequences, destructive production data changes, credential rotation, or material product-scope changes.
- Explain UI and operational steps in plain language and give exact Terminal commands when owner action is required.
- The interface should feel obvious to a nontechnical photographer; disappearing items, hidden controls, unexplained terminology, and multi-step indirection are considered design failures.
- Preserve the compact header and the simplified single-panel builder. These were refined through several iterations and regressions were immediately visible to the owner.
- When a change affects the builder, check both Live Canvas and Preview, desktop and mobile, and ensure the related Ask AI help and Tours remain accurate.
- The owner frequently asks for commit/push/deploy after visual acceptance. Do not claim a version is live until the production deployment is `READY` and aliased to `photoview.io`.

## Recommended immediate next move

Start with **Priority 1: a controlled end-to-end production acceptance plan and smoke run**. First define the disposable test identity, maximum Stripe charge, test media, and cleanup procedure. Then execute the flow in small observable stages and record results without exposing credentials or mutating the owner’s real portfolio data.

If the owner wants to delay real-money testing, the best safe alternative is **SuperAdmin MFA and step-up authentication**, followed by external monitoring and exact laptop/accessibility acceptance.
