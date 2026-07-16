# PhotoViewPro Session Handoff

Updated: 2026-07-14

> Historical record: this handoff captures the project before the July 15, 2026 migration to `https://photoview.io`. Domain names and launch tasks below describe that earlier state and are not current operating instructions.

## Start Here

- Repository: `/Users/mitchrusso/Documents/Codex/2026-07-03/i/Photo-Portfolio`
- GitHub: `git@github.com:mitchrusso/Photo-Portfolio.git`
- Branch: `main`
- Production at the time of this handoff: `https://photoviewpro.com`
- Vercel project: `photo-portfolio`
- Affiliate implementation commit: `2a46648 Test affiliate gear tracking links`
- The working tree should be clean and synchronized with `origin/main` after this document is committed.

## Product Direction

PhotoViewPro is a portfolio-first platform for serious prosumer photographers. Its core promise is to help photographers store curated work, organize it, present it beautifully on desktop and mobile, build a photography website, and share portfolios without the commercial-studio complexity of SmugMug or Zenfolio.

Website building is included at every paid tier. The product is not currently positioned as a wedding proofing, print-commerce, or full photography-business platform.

## Current Production State

The following major areas are implemented and deployed:

- Subscriber registration, 14-day Stripe trials, plans, billing portal, and lifecycle webhooks
- Passwordless email login and subscriber dashboard
- SuperAdmin reporting, rights, coupons, subscriber and financial views
- Portfolio and gallery creation, uploads, covers, visibility, ordering, captions, metadata, deletion, and mobile viewing
- Cloudflare R2 media storage architecture and storage accounting
- SmugMug imports, direct phone imports, desktop folder imports, and Lightroom plugin workflow
- Visual website builder with templates, live canvas, pages, navigation, gear page, preview, and draft saving
- Ask AI How To, Edit Hints, guided Tours, portfolio assistant, and social-sharing assistant
- Referral links and account-capacity rewards
- Email lifecycle and usage automations
- Public marketing, pricing, legal, comparison, and onboarding pages

## Completed Acceptance: Quick Add Gear

The richer workflow is already deployed. It supports:

- Affiliate-account Yes/No choice
- Retailers including Amazon, B&H, Adorama, Best Buy, Walmart, eBay, KEH, MPB, Moment, and a custom retailer
- Plain-English equipment entry, one item per line
- Product discovery and a review table with image, product name, description, category, retailer, and affiliate link
- Approval before items are added to the subscriber's What's in My Bag page

The workflow has passed production acceptance. The final fixes clear stale results before a search, provide useful empty-result guidance, derive a reliable B&H product image from its product URL, and protect Amazon affiliate tracking behavior with regression tests.

The empty-result message is:

> No matching products were found. Try a more exact brand and model, choose another retailer, or paste the product page link.

Production was tested with B&H and `Nikon Z8 mirrorless camera body`. The result displayed the correct product, retailer-hosted image, description, category, and product link. No test product was approved or saved.

Affiliate behavior is intentionally narrow and safe:

- Amazon Associates tracking IDs are added to Amazon product URLs and replace an older `tag` value when present.
- Blank Amazon tracking IDs leave the product URL unchanged.
- Non-Amazon links are never rewritten. Subscribers paste the final deep link supplied by B&H, Adorama, Impact, Rakuten, or another affiliate network into the review row.
- The interface never asks for an affiliate password, secret key, or payment information.

## Verification Already Completed

For commit `2a46648`:

- `git diff --check` passed
- `npm test` passed: 35 tests
- Focused ESLint passed for the gear importer, retailer helper, and regression tests
- `npm run build` passed with 64 routes
- The prior B&H image fix was verified on `photoviewpro.com`; confirm the final deployment is Ready before starting new work

## Useful Commands

```bash
cd /Users/mitchrusso/Documents/Codex/2026-07-03/i/Photo-Portfolio
git status --short --branch
npm test
npm run build
npm run dev
```

## Important Architecture Notes

- `src/components/portfolio/portfolio-dashboard.tsx` is extremely large and remains the largest maintainability risk. Do not start a broad refactor during a narrow production fix. Plan its decomposition as a separate, tested project.
- Never expose API keys or service secrets in documentation, commits, client code, or chat output.
- Preserve the user's existing data and unrelated working-tree changes.
- Use Cloudflare R2 for durable media storage; do not reintroduce Vercel Blob language into subscriber-facing copy.
- Storage is metered per subscriber. Do not describe R2 as eliminating storage cost; it primarily removes egress charges.
- Keep the interface calm and beginner-friendly. Prefer one obvious action and contextual help over dense control panels.

## Next Priorities After Acceptance

1. Add focused tests for Quick Add Gear approval, saving, and deletion. Discovery, empty results, product images, and affiliate-link handling are covered now.
2. Complete a subscriber-ready end-to-end test: registration, checkout, login, upload, portfolio publication, website publication, billing management, and cancellation.
3. Audit production observability, failed webhooks, email failures, R2 failures, and admin alerts.
4. Decompose `portfolio-dashboard.tsx` into focused feature components without changing behavior.
5. Prepare the later domain migration from `PhotoViewPro.com` to `PhotoView.io` only after subscriber-readiness work is complete.

## Working Style

The user values fast visible progress. Give a time estimate only when asked, keep status updates brief, avoid long exploratory detours, and cap browser acceptance checks before switching to direct logs/tests.
