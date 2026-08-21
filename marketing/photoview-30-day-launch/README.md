# PhotoView.io 30-Day Organic Validation Campaign

Status: **Draft for approval**
Proposed run: August 17–September 15, 2026
Cadence: One post daily at 10:00 a.m. America/New_York

## What this campaign tests

1. **A feed forgets your photographs** — portfolio ownership and longevity.
2. **Lightroom to a live portfolio** — a faster publishing workflow.
3. **One portfolio, every destination** — direct links, responsive embeds, and reuse.

Supporting messages test photo + video, stronger curation, responsive presentation, phone import, templates, and entry-level price.

## Success gates

- 30 qualified trial starts in 30 days.
- At least 40% of new trials import photographs and publish a portfolio or website within 48 hours.
- At least 15% trial-to-paid conversion.
- At least five customers attributable to one repeatable channel or message family.

## Measurement

Every destination uses campaign, source, medium, and content-level UTM parameters. Product milestones are recorded server-side as:

- `REGISTRATION_CAPTURED`
- `TRIAL_STARTED`
- `PHOTO_IMPORTED`
- `PORTFOLIO_PUBLISHED`
- `SITE_PUBLISHED`
- `DESTINATION_SHARED`
- `PAID_CONVERSION`

## Approval and publishing

`campaign-manifest.json` is deliberately marked `DRAFT_FOR_APPROVAL`. Approval should change only the approved records to `APPROVED`; the publishing adapter must reject all other statuses. Instagram captions include the destination URL for attribution, but Instagram feed-caption URLs are normally not clickable. The active bio link should point to the campaign landing page while this campaign runs. Facebook, LinkedIn, and Pinterest can use the direct campaign link.

## Low-cost distribution work

- Offer five portfolio makeovers per week to photographers whose current work is strong but whose presentation is dated or feed-only.
- Contact small photography clubs and workshop leaders with a practical “Lightroom to live portfolio” demonstration.
- Invite micro-creators to publish one real portfolio during the trial and document the before/after workflow.
- Do not add paid media until an organic message produces qualified trial starts and at least one activation signal.

## Files

- `campaign-manifest.json` — complete captions, schedule, assets, platforms, URLs, and approval state.
- `campaign-calendar.csv` — compact calendar for review or import.
- `asset-manifest.json` — source provenance and transformation notes for every export.
- `creative/` — 30 portrait social assets at 1080×1350.
- `review/index.html` — visual review page with each caption and destination.
- `review/campaign-contact-sheet.jpg` — one-page campaign overview.
