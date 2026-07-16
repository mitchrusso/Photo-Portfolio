# PhotoView.io Product Requirements

**Status:** Active

**Last updated:** July 15, 2026

## Executive summary

PhotoView.io is a portfolio-first platform for serious prosumer photographers. It helps subscribers store curated photographs, organize them into galleries, present them well on desktop and mobile, build a photography website, and share work without the commercial-studio complexity of proofing and print-commerce platforms.

## Target users and jobs

The primary subscriber is a photographer who wants to:

- upload and organize finished photographs;
- create polished public or private portfolios;
- publish a simple photographer website at a PhotoView.io subdomain;
- import work from supported desktop, mobile, Lightroom, and SmugMug workflows;
- understand storage and subscription status without technical assistance.

PhotoView.io is not currently positioned as a wedding-proofing, print-sales, or full photography-business-management platform.

## Core product requirements

1. Passwordless subscriber registration and login with a 14-day paid-plan trial.
2. Secure, workspace-scoped photo storage and delivery with storage metering.
3. Gallery creation, editing, privacy, ordering, captions, metadata, covers, and responsive viewing.
4. A visual website builder with templates, editable pages and sections, draft preview, publishing, and subscriber contact delivery.
5. Guided assistance through AI Help, Edit Hints, and deterministic Tours.
6. Stripe subscriptions, billing portal access, lifecycle webhooks, and account status visibility.
7. Reliable transactional email through Resend; TinyEmail is optional for tagging and segmentation.
8. Administrative subscriber, storage, billing, and operational-health visibility.

## Success measures

- A new subscriber can register, complete checkout, receive a login link, upload work, create a gallery, and publish a site without staff intervention.
- Public portfolio and subscriber-site images load without broken media.
- Contact messages are delivered reliably and protected by validation, rate limiting, and spam controls.
- Billing, storage, and publication status are accurate and understandable.
- Production releases pass lint, regression tests, a TypeScript production build, security checks, and a focused browser smoke test.

## Non-functional requirements

- Workspace isolation and server-side authorization for private data and mutations.
- Signed or short-lived access to private media and import workflows.
- Responsive, accessible subscriber and public interfaces.
- No secrets in source control; production secrets remain in Vercel environment variables.
- Idempotent webhook and lifecycle-email processing, with observable failures and safe retries.
- Legacy `PhotoViewPro.com` requests preserve their path while redirecting permanently to `PhotoView.io`.

## Key integrations

- Vercel for application hosting and domain routing.
- PostgreSQL through Prisma for durable application data.
- Cloudflare R2 for primary media storage, with legacy Vercel Blob compatibility.
- Stripe for trials, subscriptions, and billing management.
- Resend for transactional email.
- TinyEmail for optional contact tagging and segmentation.
- Amazon Creators API and supported retailer metadata for approved gear listings.

## Launch gates

- Apex, `www`, legacy redirects, and wildcard subscriber domains are healthy.
- A known published subscriber site passes end-to-end verification.
- Registration, monthly and yearly checkout, login, Account, cancellation, and webhook flows pass.
- Public contact, published-site contact, portfolio covers, imports, and storage reporting pass.
- Subscriber-facing text contains no placeholder, roadmap, or internal implementation notes.
- Current help content and walkthroughs match the production interface.
