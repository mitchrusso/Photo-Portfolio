# Photo-Portfolio Platform Foundation

This app is moving from a personal gallery prototype toward a multi-tenant photography SaaS.

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

## Next implementation steps

1. Provision production Postgres.
2. Run the first Prisma migration.
3. Replace browser `localStorage` gallery edits with database reads/writes.
4. Add signup/login with a production auth provider.
5. Add Stripe subscription checkout and webhook handling.
6. Enforce subscription/storage limits before upload/import.
7. Store every upload/delete/import as a `StorageUsageEvent`.
8. Add an admin CMS for pages, trips, articles, and gear items.
9. Connect the contact form to `ContactMessage`.
10. Add a customer billing portal.

## Security requirements

- All dashboard routes require authenticated workspace membership.
- All mutations must check workspace ownership.
- Gallery privacy must be enforced server-side.
- Password galleries should store only password hashes.
- Blob upload routes must check subscription status and storage limit.
- Stripe webhooks must verify signatures with the raw request body.
- Contact and share endpoints should be rate-limited.
