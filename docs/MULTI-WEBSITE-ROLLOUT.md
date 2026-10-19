# Multi-website rollout

## Product rules

- Every paid PhotoView subscription includes one primary website.
- A subscriber may create unlimited additional drafts at no charge.
- Drafts receive neither a `photoview.io` URL nor a custom domain until activation succeeds.
- Each activated additional website costs a $1.29 monthly equivalent.
- Monthly subscribers use the $1.29 monthly Stripe Price. Annual subscribers use the $15.48 annual Stripe Price so the add-on stays on the existing renewal invoice.
- Lifetime subscribers choose either $1.29 monthly billing or a prorated payment through their account anniversary followed by $15.48 annual renewals. That choice applies to all active add-on websites on the account so billing remains consolidated.
- Activation uses `proration_behavior: none`. Access starts immediately after the billing commitment succeeds; the first add-on charge appears on the next subscription renewal.
- Deleting an additional website disables public access immediately, releases its PhotoView URL, disconnects its custom domain, and reduces the renewal quantity without a prorated credit.
- Storage remains account-wide and is billed independently of the number of websites.
- Subscribers supply and pay for optional custom domains. The included PhotoView-hosted address has no separate domain fee.

## Delivery phases

1. **Foundation (implemented):** first-class Website records, legacy-site backfill, unlimited draft APIs, aggregate add-on billing, URL assignment only after activation, and immediate disable/delete behavior.
2. **Builder routing (implemented):** edit links and independent browser caches, plus draft, preview, publish, address, and domain operations scoped by `websiteId`.
3. **Public routing (implemented):** PhotoView subdomains and verified custom domains resolve through active Website records only, with a legacy fallback during migration.
4. **Billing operations (implemented in code):** Stripe subscription-item quantity changes use no proration, subscription webhooks distinguish and reconcile the base-plan and website-add-on items, lifetime accounts receive a monthly-or-prorated-annual checkout choice, and health checks open incidents for payment failures and quantity mismatches. Live Stripe Price creation and Vercel configuration are release prerequisites.
5. **Release (not started):** migrate production, verify every existing subscriber has one primary website, run sandbox activation/deletion tests, deploy behind a feature flag, then enable for subscribers.

## Stripe catalog

Create one distinct Stripe Product named **PhotoView.io Additional Website** with two recurring Prices:

- Monthly: $1.29 USD per month.
- Annual: $15.48 USD per year.

Both Prices are quantity-based. Paid monthly and annual accounts use one add-on item on their existing subscription. Lifetime accounts use one separate add-on subscription because they have no recurring base invoice; that subscription still carries the aggregate website quantity so there is never one Stripe subscription per website.

Stripe webhooks and the daily reconciliation job must compare the active add-on count, the local subscription quantity, and Stripe's item quantity. A mismatch opens an operational incident and tells the subscriber that activation or billing needs attention.

## Tax

Additional website fees are recurring SaaS charges and must follow the account's Stripe Tax policy. Do not enable `automatic_tax` for this add-on until the business has the required tax registrations in the jurisdictions where it intends to collect tax.
