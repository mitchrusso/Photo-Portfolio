# PhotoView.io Session Handoff — July 27, 2026

This is the authoritative starting document for the next PhotoView.io Codex task. It supersedes `SESSION-HANDOFF-2026-07-16.md` for active work. Older handoffs and audit reports remain useful historical evidence, but many of their open items have since been completed.

## Start here in the next task

Before making changes:

1. Read this document completely.
2. Work in:

   `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox`

3. Run:

   ```bash
   git status --short --branch
   git log -8 --oneline --decorate
   ```

4. Confirm that `origin/main` is at or beyond commit `65568f0`.
5. Preserve unrelated and untracked user files. Five local `.qa-*.png` screenshots were intentionally left untracked at handoff.
6. Read `CLAUDE.md`, `docs/PRD.md`, and the documentation directly related to the requested feature.
7. Do not repeat tasks marked complete unless a new regression is demonstrated.
8. Never print, commit, or paste secrets. Environment-variable names may be discussed; values may not.
9. When changing a feature, update its tooltips, AI Help, Tours, tests, and subscriber-facing documentation in the same change.
10. Do not claim a release is live until the Vercel production deployment for the intended commit is `READY`.

Suggested opening request:

> Read `docs/SESSION-HANDOFF-2026-07-27.md` completely, inspect the repository and production state, and summarize the current status and the most important next step before changing code. Preserve existing work and do not repeat completed tasks.

## Current production state

| Item | Current value |
| --- | --- |
| Product | PhotoView.io |
| Production URL | `https://photoview.io` |
| Subscriber websites | `https://<subscriber-address>.photoview.io` |
| Repository | `mitchrusso/Photo-Portfolio` |
| Local repository | `/Users/mitchrusso/Documents/Codex/2026-07-16/please-read-the-handoff-document-and/work/Photo-Portfolio-crm-mailbox` |
| Production branch | `origin/main` |
| Application baseline commit | `65568f0 Update help for responsive layouts and custom pages` |
| Application baseline deployment | `dpl_Dnb8bWd3wEGPHLCfXyDEzoHQwuPW` |
| Deployment state at handoff | `READY` |
| Hosting | Vercel |
| Framework | Next.js 16 App Router, React 19, TypeScript, Tailwind |
| Database | PostgreSQL through Prisma 7 |
| Media storage | Private Cloudflare R2 with authorized application delivery |
| Media backup | Separate private R2 backup bucket, hourly incremental copy, 35-day retention lock |
| Payments | Stripe subscriptions, Checkout, Customer Portal, signed/idempotent webhooks |
| Transactional email | Resend |
| Lifecycle audiences | TinyEmail synchronization; application remains the active lifecycle sender |
| SuperAdmin MFA | Twilio Verify SMS after the one authorized SuperAdmin email login |
| CRM messaging mailbox | `mitch@photoview.io` through Gmail OAuth |

The production aliases include `photoview.io`, `www.photoview.io`, and `*.photoview.io`. Legacy PhotoViewPro aliases and compatibility identifiers remain intentionally where required for redirects, older integrations, migrations, and audience tags. Subscriber-facing copy should say PhotoView.io.

## Verification baseline

The release at this handoff was verified with:

- 185 automated tests passing;
- ESLint passing;
- TypeScript passing;
- production `next build` passing;
- Vercel production deployment `READY`;
- commit SHA in Vercel matching `65568f0`;
- recent authenticated desktop and mobile builder QA;
- security and full-system audits documented under `docs/`.

Local build note: `.env.production.local` contains intentionally sanitized placeholder URLs. A normal local production build can therefore fail with `ERR_INVALID_URL` for `https://[SENSITIVE]`. The verified local build temporarily excluded that file and used `.env.local`, then restored it unchanged. Vercel uses its encrypted production configuration and built successfully.

## Product direction

PhotoView.io is a portfolio-first publishing platform for serious photographers. It combines:

- private photo and video asset storage;
- galleries containing portfolios, with photos and videos inside portfolios;
- polished portfolio presentation;
- a customizable photographer website;
- secure sharing and embedding;
- imports from common photography workflows;
- guided help and AI assistance;
- scheduled social campaigns;
- an internal partnership CRM for PhotoView.io operations.

It is not intended to become a YouTube/Vimeo replacement, unlimited storage dump, full studio-management suite, or enterprise DAM without an explicit product decision.

## Current plans

| Plan | Monthly | Annual | Included storage |
| --- | ---: | ---: | ---: |
| Starter | $3.99 | $39.99 | 5 GB |
| Growth | $5.99 | $59.99 | 20 GB |
| Studio | $7.99 | $79.99 | 50 GB |
| Premier | $11.99 | $119.99 | 150 GB |

The canonical catalog is `src/lib/plans.ts`. Do not create replacement live prices or change production billing without explicit authorization. Run `npm run stripe:verify:production` before a billing release.

## Major completed work

### Authentication, accounts, and administration

- Passwordless magic-link subscriber login is live.
- Login correctly replaces stale browser identity rather than opening the previously signed-in subscriber.
- Account surfaces display the signed-in email address.
- Stale entitlement/session messaging now tells a paid subscriber to refresh or sign in again instead of incorrectly claiming that no plan exists.
- Exactly one configured primary SuperAdmin identity receives full SuperAdmin rights.
- `/admin` and all privileged APIs repeat server-side role authorization.
- SuperAdmin requires a separate Twilio Verify SMS code after email login.
- The SMS approval is signed, login-bound, rate-limited, expiring, and valid for 12 hours.
- Support users can receive explicitly selected capabilities without becoming SuperAdmin.
- SuperAdmin rights, security, subscribers, billing, coupons, health, audit, and operations views are present.
- One-time invitation codes can be assigned to a name/email, used once, and optionally suppress the startup email sequence.
- Trial signup alerts go to the configured PhotoView.io operations address with subscriber, date/time, and plan.

Read:

- `docs/SUPERADMIN-SMS-MFA.md`
- `src/lib/admin-access.ts`
- `src/lib/admin-mfa.ts`
- `src/app/admin`

### Gallery, portfolio, and media hierarchy

The product language is now:

1. a **Gallery** contains portfolios;
2. a **Portfolio** contains photos and videos;
3. subscribers can create and name galleries;
4. portfolios can be assigned or moved between galleries;
5. photographs can be organized and moved through Library and portfolio controls.

Completed behavior:

- The first gallery appears as **My Gallery** until renamed.
- Current Gallery and Add New Gallery are clear in the sidebar.
- Renaming requires confirmation and does not misleadingly describe existing content as being moved.
- New galleries are empty and ready for imports or moved portfolios.
- Portfolio cover state is visibly marked with a red border and Cover badge.
- Cover, order, visibility, and deletion changes save automatically.
- Delete operations are confirmed and workspace-scoped.
- Public and private sharing paths use opaque signed tokens instead of guessable portfolio-name URLs.
- Copy-link controls visibly confirm clipboard success.

### Photo and video support

- Still images and supported RAW workflows remain available.
- General portfolio video supports verified MP4 and MOV input through the dedicated video route.
- Video storage counts toward the subscriber plan.
- MOV may retain an original plus a generated MP4 playback copy and poster, so it usually consumes more storage.
- Portfolio video uses a poster image and the public/private presentation rules of its portfolio.
- Hero video remains available for the website opening section, with its own limits and editing behavior.
- Hero playback is paused inside Live Canvas to avoid repeated retrieval while editing; it plays in Preview and published sites.
- The application is a photography portfolio platform that accepts video assets, not a public video network.

### Website builder

The builder has been heavily refined. Preserve its current single-panel design.

- Templates appear in a horizontal filmstrip.
- The left **Build your site** panel mirrors the Live Canvas order.
- Website identity has its own block with subscriber name/studio name, optional logo upload, and visibility.
- Template controls include:
  - Adaptive Width;
  - Full Screen;
  - background, text, and accent colors;
  - custom background image upload;
  - Screen back percentage;
  - background brightness;
  - font choices with visibly different typography;
  - frame style and thickness;
  - image shape.
- Adaptive Width uses a comfortable desktop maximum and fills smaller screens.
- Full Screen uses the available browser width while retaining mobile safety margins.
- Width behavior matches Live Canvas, Preview, and published sites.
- Home blocks are individually surfaced: Hero, Intro text, Featured work, and All portfolios.
- Featured Work visibility and display choice work independently.
- Featured Work and All Portfolios independently support slideshow, thumbnail grid, film strip, and cover cards.
- Section headlines support Left, Center, and Right alignment.
- Body copy remains editable even when its display toggle is off.
- Each long editor has a Close section control at the top and bottom.
- About supports multiline editing and an optional portrait.
- The About call-to-action defaults to Contact and works in Preview/published mode.
- Trips can select an exact portfolio without manually pasting a URL.
- Useful Articles supports evergreen subscriber content.
- Up to five independent custom pages can be created under Additional pages.
- Every custom page has its own title, body, visibility, navigation label, alignment, and top-menu/footer placement.
- Existing single Custom page content migrates to the first custom page.
- Website navigation links can be placed at the top or bottom.
- Subscriber sites include a professional footer, subscriber-content responsibility notice, platform policies, and **Created with PhotoView.io**.
- The builder supports preview, save-state feedback, address selection, publishing, and editing after publication.

Key files:

- `src/components/portfolio/portfolio-dashboard.tsx`
- `src/components/site/website-draft-preview.tsx`
- `src/lib/website-builder-rules.ts`
- `src/lib/website-publication-readiness.ts`

### Sharing and embeds

- Sharing can target all portfolios, a portfolio, or selected photographs.
- Secure links are opaque, signed, scoped, and tamper-resistant.
- QR codes explain their purpose and are generated only for PhotoView.io destinations.
- Social shortcuts make the selected share outcome clear.
- Saved embed profiles use tabs so subscribers can maintain multiple independent embeds for different outside pages.
- Each embed can include selected photographs, one portfolio, selected portfolios, or the complete embeddable collection.
- Only Public portfolios with embed permission are available.
- Hidden and protected work is excluded.
- Reordering or hiding work updates the external embed because PhotoView.io remains the host.

### Imports

Settings → Imports uses a persistent five-option bar at the top:

1. Lightroom
2. Phone
3. Smart Folders
4. SmugMug Import
5. Photo & Video Upload

Completed:

- Lightroom Classic export plugin and beginner instructions;
- subscriber-generated 90-day import key;
- new or existing portfolio destination;
- phone-friendly upload;
- desktop Smart Folder watcher;
- official SmugMug OAuth connection and selectable gallery import;
- resumable/deduplicated SmugMug imports;
- dedicated direct upload page.

Subscribers do not need Adobe developer credentials for the Lightroom Classic plugin and do not need SmugMug developer credentials for the official PhotoView.io connection.

### Social campaign system

- Campaign designer supports exact photo selection, layout, message, call to action, link, account choice, timing, spacing, repeat behavior, and queue preview.
- Connected social accounts use provider OAuth rather than storing passwords.
- Meta destinations can include eligible Facebook Pages and Instagram Professional accounts.
- Delivery state is recorded and retryable.
- Cron processes due social deliveries every five minutes.
- Manual public-profile links remain distinct from authenticated automatic publishing.
- Provider app review and changing platform policies remain operational dependencies.

### AI Help, tooltips, Tours, and onboarding

- Ask AI How To uses verified PhotoView.io feature knowledge and canonical answers.
- Contextual Hints can point from Live Canvas content to the exact builder control.
- Take a Tour offers Start Here, website, homepage, portfolio, About/Contact, equipment, embedding, social campaign, settings, and publishing paths.
- First login shows one dismissible welcome that launches Start Here.
- Help coverage includes galleries, portfolios, deletion, covers, imports, Lightroom, SmugMug, sharing, QR codes, embeds, social campaigns, website editing, Hero video, background controls, responsive width, and five custom pages.
- The newest update added dedicated AI topics and explicit Tour steps for Adaptive Width, Full Screen, and multiple custom pages.

Rule for future work: a feature is not complete until the related tooltip, AI Help answer, Tour path, and regression test are accurate.

### Partnership CRM

The former separate `mitchrusso/photoview-partnership-crm` application is integrated into PhotoView.io at:

`/admin/partnerships`

Completed:

- existing PhotoView authentication, admin role checks, and SuperAdmin SMS MFA;
- PostgreSQL persistence instead of localStorage;
- migrated partner, contact, opportunity, outreach, meeting, task, analytics, and settings data;
- Salesforce-style opportunity workspace;
- company, contact, opportunity, activity, and next action in one flow;
- Gmail OAuth callback at `https://photoview.io/api/google/callback`;
- Gmail connection restricted to `mitch@photoview.io`;
- encrypted OAuth tokens stored server-side;
- mailbox search/synchronization;
- in-application email review and send;
- generated PhotoView.io introduction plus three follow-ups;
- scheduled delivery and activity tracking;
- hourly Gmail synchronization;
- due-sequence delivery every five minutes.

The CRM sender is `mitch@photoview.io`, not the SuperAdmin login address.

Read `docs/PARTNERSHIP-CRM.md` before changing OAuth, Gmail scopes, encryption, or delivery.

### Billing and Stripe

- Live monthly/annual plans, trials, Checkout, Customer Portal, and subscription status are implemented.
- Webhook signatures and replay protection are enforced.
- Live and sandbox webhook secrets are isolated.
- The application accepts the required lifecycle events and can recover a subscription after customer/credential association changes.
- Paid-access checks allow active subscriptions and unexpired trials, while preserving read-only access for expired/past-due states.
- A stale browser session can temporarily display old entitlement state; the user should refresh or sign in again, and the UI now explains that possibility.
- Legacy `photoviewpro.com` test webhook endpoints that return 301 should be updated or removed in Stripe rather than treated as production fulfillment endpoints.

### Email and lifecycle automation

- Resend/application automation is the production lifecycle sender.
- TinyEmail receives audience membership/tags.
- Keep TinyEmail visual sending workflows inactive unless the application sender is deliberately replaced.
- The application maintains delivery idempotency.
- Startup sequences, trial education, paid onboarding, Feature Academy, storage warnings, payment failure, and cancellation logic exist.
- Trial notifications and subscriber contact messages use PhotoView.io addresses.

### Storage, backup, and recovery

- Active Cloudflare R2 storage remains private.
- Subscriber media is delivered through authorized or short-lived application routes.
- The active bucket is not retention-locked so subscriber deletion requests can be honored.
- A separate private backup bucket has a 35-day lock.
- `/api/storage/backup` runs hourly at minute 20 and copies missing immutable objects.
- Size conflicts stop rather than overwrite a locked backup object.
- Neon point-in-time recovery and an isolated restore drill were completed.
- The July 20 recovery drill verified database counts, 1,170 referenced active objects, and the initial 1,179-object media backup.

Read `docs/DISASTER-RECOVERY-RUNBOOK.md`.

### Legal, copyright, and policies

- Subscriber Terms, Privacy, License, and Copyright/DMCA pages are published.
- Subscriber website footers clarify that website content is the subscriber's responsibility.
- PhotoView.io has a registered U.S. Copyright Office DMCA Designated Agent.
- Registration number: `DMCA-1075905`.
- Renewal is due no later than July 20, 2029.
- Operational procedures and response templates are documented.

Read:

- `docs/DMCA-NOTICE-OPERATIONS.md`
- `docs/DMCA-RESPONSE-TEMPLATES.md`

### Marketing and analytics

- Public navigation includes Articles & Tutorials.
- SEO-oriented article routes and structured metadata exist.
- Rybbit analytics is loaded from the root document head.
- Marketing explains portfolios, photo/video support, website building, social campaigns, imports, templates, custom pages, and branding.
- The PhotoView.io home share preview uses platform branding rather than a subscriber's personal photograph.

## Current scheduled jobs

| Schedule | Route |
| --- | --- |
| Hourly at minute 0 | `/api/usage/check-thresholds` |
| Hourly at minute 5 | `/api/health/check` |
| Hourly at minute 10 | `/api/admin/crm/gmail/sync` |
| Hourly at minute 15 | `/api/email/automations` |
| Hourly at minute 20 | `/api/storage/backup` |
| Hourly at minute 30 | `/api/storage/cleanup` |
| Daily at 02:45 | `/api/storage/reconcile` |
| Every 5 minutes | `/api/social/publish-due` |
| Every 5 minutes | `/api/admin/crm/sequences/send-due` |

## Important files

| Area | Path |
| --- | --- |
| Main subscriber UI and builder | `src/components/portfolio/portfolio-dashboard.tsx` |
| Public portfolio viewer | `src/components/portfolio/public-gallery-view.tsx` |
| Public website rendering | `src/components/site/website-draft-preview.tsx` |
| Website rules and migration | `src/lib/website-builder-rules.ts` |
| Website tours | `src/lib/website-walkthroughs.ts` |
| AI Help knowledge | `src/lib/ai-help-knowledge.ts` |
| Gallery/media utilities | `src/lib/gallery-utils.ts` |
| Photo storage | `src/lib/photo-storage.ts` |
| Portfolio video API | `src/app/api/portfolio/videos/route.ts` |
| Hero video API | `src/app/api/website/hero-video/route.ts` |
| Plans | `src/lib/plans.ts` |
| Subscriber access | `src/lib/subscriber-access.ts` |
| SuperAdmin authorization | `src/lib/admin-access.ts` |
| SuperAdmin MFA | `src/lib/admin-mfa.ts`, `src/lib/twilio-verify.ts` |
| Partnership CRM | `src/components/admin/partnership-crm.tsx`, `src/lib/partnership-crm` |
| Stripe webhook | `src/app/api/stripe/webhook/route.ts` |
| Media backup | `src/lib/media-backup.ts`, `src/app/api/storage/backup/route.ts` |
| Tests | `tests/` |
| Database | `prisma/schema.prisma`, `prisma/migrations/` |
| Production schedules | `vercel.json` |

## Known limitations and next priorities

### Priority 1 — monitored beta acceptance

The code has received several QA and security sweeps, but beta operations still require observation. Before broad promotion:

1. invite a small, known beta cohort;
2. monitor magic-link latency and failures;
3. monitor Stripe webhook and entitlement state;
4. monitor photo/video upload failures and storage growth;
5. monitor website publish/load failures;
6. monitor social delivery and CRM sequence errors;
7. review operational events daily during the first beta week;
8. record every beta-reported confusion as either a product fix or help-system improvement.

Avoid destructive testing against the owner's real portfolios.

### Priority 2 — third-party approvals and provider polish

- Amazon Creators/product-data access was submitted and may take approximately two weeks. Automated Amazon names/images should not be considered reliable until approval and an end-to-end production test pass.
- Manual product-image upload remains the supported fallback.
- Google OAuth works for the owner mailbox, but public/external OAuth distribution may require Google verification and production consent-screen completion.
- Meta automatic publishing depends on Meta app configuration, review, eligible account types, and current platform policies.
- Provider dashboards should be reviewed periodically for Stripe, Resend, Twilio, Google, Meta, Cloudflare, Neon, TinyEmail, and Vercel health.

### Priority 3 — custom domains

PhotoView.io subdomains are working. A complete self-service purchased-domain flow still needs:

- domain entry validation;
- ownership verification;
- DNS instructions;
- Vercel domain assignment;
- certificate/activation status;
- safe removal and reassignment;
- AI Help, Tours, and support documentation.

Do not imply that outside-domain automation is complete until verified end to end.

### Priority 4 — mobile applications

The mobile companion web experience exists, but native App Store and Google Play packaging, store accounts, privacy declarations, screenshots, review assets, release signing, and submissions have not been completed.

### Priority 5 — accessibility and device acceptance

Continue testing:

- keyboard-only navigation;
- screen-reader names and announcements;
- 44 px mobile touch targets;
- focus visibility;
- high-contrast combinations;
- exact 1280×800 laptop layouts;
- mobile builder and public-site overflow;
- every template with both width modes.

### Priority 6 — incremental dashboard decomposition

`src/components/portfolio/portfolio-dashboard.tsx` exceeds 500 KB and triggers Babel's deoptimization notice. Do not rewrite it wholesale.

Extract stable boundaries incrementally with tests:

1. website identity and Template controls;
2. custom-page editors;
3. gallery/portfolio navigation;
4. sharing and embed panels;
5. imports;
6. account/storage/support chrome.

### Other constraints

- The final remaining portfolio cannot be deleted by design.
- Active R2 storage must remain private.
- The backup bucket must not be used as the live bucket.
- General video is supported, but no streaming-network discovery or public video feed should be added by implication.
- Subscriber sites are editable after publication; publishing again updates the live site.
- Social-provider and retailer APIs can change independently of PhotoView.io.
- `.env.production.local` is sanitized and should not be treated as a source of live values.

## Safety rules

- Preserve subscriber data and unrelated working-tree changes.
- Use `apply_patch` for manual source edits.
- Do not use destructive Git commands.
- Do not delete production accounts, portfolios, media, CRM records, or email history during routine QA.
- Do not run live charges, refunds, cancellations, price creation, or credential rotation without explicit authorization.
- Never make the R2 bucket public.
- Never expose OAuth tokens, encryption keys, API keys, Stripe secrets, Twilio credentials, or database URLs.
- Never prefix server secrets with `NEXT_PUBLIC_`.
- Keep Gmail sending fixed to the configured CRM mailbox.
- Keep the one-primary-SuperAdmin rule unless the owner explicitly changes the security model.
- Review `git diff --check`, tests, lint, and build before publishing.
- Stage only task-related files; leave the local `.qa-*.png` files untouched unless explicitly asked to archive them.

## Useful commands

Run from the current repository:

```bash
git status --short --branch
git log -8 --oneline --decorate
npm test
npm run lint
npm run build
npm run stripe:verify:production
npm run subscriber:lifecycle:verify
npm run recovery:verify
```

If the sanitized `.env.production.local` blocks a local build, temporarily move only that file aside, run the build with `.env.local`, and restore it unchanged with a shell trap. Never edit the placeholder values into plausible secrets.

Do not casually rerun data-mutating setup commands such as live price creation, R2 migrations, plan migrations, CRM seeding, or production rollout configuration.

## Recent commit landmarks

| Commit | Purpose |
| --- | --- |
| `65568f0` | Update help for responsive layouts and custom pages |
| `a22845b` | Add responsive website widths and up to five custom pages |
| `761c45e` | Keep subscriber help aligned with current features |
| `57756ce` | Add reusable embed profile tabs |
| `ac862bc` | Add background screening and brightness controls |
| `01c8221` | Add custom website background images |
| `13672ee` | Surface Quick Add Gear in the website sidebar |
| `0a9da2e` | Accept isolated Stripe sandbox webhooks |
| `902488f` | Bound CRM outreach drafting time |
| `38b5e42` | Keep CRM outreach inside PhotoView.io |
| `9ec6793` | Clarify the CRM messaging account |
| `d4bf83a` | Deploy CRM Gmail synchronization |

## Owner preferences

- Make forward progress without repeatedly asking permission for ordinary reversible work.
- Ask before financial actions, destructive production changes, credential rotation, or material scope expansion.
- Explain product behavior in plain language.
- Treat confusing copy, invisible state, nonresponsive buttons, and hidden controls as real defects.
- Preserve the single-panel website builder and compact subscriber toolbar.
- Check Live Canvas, Preview, published output, desktop, and mobile for builder changes.
- Update AI Help, Hints, Tours, and tests whenever the product changes.
- Commit, push, and confirm Vercel `READY` after completed production work.
- Do not tell the owner something is fixed without testing the actual path in proportion to its risk.

## Recommended opening priority

Begin the next project with a concise beta-readiness review based on the current production system, then choose one focused workstream:

1. monitored beta operations and bug response;
2. self-service custom domains;
3. Amazon product-data integration after approval;
4. Google/Meta provider verification;
5. native mobile packaging;
6. incremental dashboard decomposition.

Do not restart broad redesign work. The immediate business objective is a stable, understandable beta with fast issue response and reliable production operations.
