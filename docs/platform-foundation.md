# Photo-Portfolio Platform Foundation

PhotoViewPro is a multi-tenant photography SaaS with subscriber-owned workspaces.

## Implemented foundation

- Public marketing routes:
  - `/`
  - `/portfolio`
  - `/whats-in-my-bag`
  - `/trips`
  - `/blog`
  - `/articles`
  - `/contact`
- Protected app route:
  - `/dashboard`
- Public shared gallery route:
  - `/g/[galleryId]`
- Prisma schema for:
  - users and workspace members
  - photographer workspaces / tenants
  - Stripe-ready plans and subscriptions
  - clients
  - galleries and photos
  - storage usage events
  - proofing selections and comments
  - articles, trips, pages, and gear content
  - Amazon affiliate gear links
  - contact messages
  - social share events
- Public gallery social share buttons:
  - Facebook
  - X
  - LinkedIn
  - email
  - copy link
- Production magic-link authentication with single-use, 15-minute tokens
- Stripe test Checkout, signed webhooks, billing portal, plan changes, and cancellation
- Checked-in Prisma migrations for production deployment
- Workspace-scoped uploads, galleries, imports, and private Cloudflare R2 delivery
- Storage-capacity enforcement and durable object-deletion retries

## Next implementation steps

1. Complete the supervised Stripe live-mode cutover.
2. Finish and activate TinyEmail production workflows.
3. Run launch accessibility and browser/device QA.
4. Complete the PhotoView.io domain migration after subscriber readiness.
5. Continue the admin CMS, showcase, and editorial roadmap after launch-critical work.

## Security requirements

- All dashboard routes require authenticated workspace membership.
- All mutations must check workspace ownership.
- Gallery privacy must be enforced server-side.
- Password galleries should store only password hashes.
- Blob upload routes must check subscription status and storage limit.
- Stripe webhooks must verify signatures with the raw request body.
- Contact and share endpoints should be rate-limited.
