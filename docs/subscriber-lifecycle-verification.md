# Subscriber lifecycle verification

PhotoViewPro includes a disposable end-to-end verification command for the subscriber path:

```bash
npm run subscriber:lifecycle:verify
```

## Safety gate

The command exits before creating anything unless all of the following are true:

- `STRIPE_SECRET_KEY` begins with `sk_test_`.
- `DATABASE_URL` is configured.
- Cloudflare R2 private-storage credentials are configured.
- `PHOTO_STORAGE_PROVIDER` is `r2` or omitted, which defaults to R2.

It must never be changed to accept a live Stripe key. Generated objects carry a lifecycle-verifier marker, and the production webhook suppresses autoresponder and transactional-email side effects for those marked objects. This keeps repeated tests out of customer lists while still exercising webhook persistence.

## What it verifies

1. Durable trial registration creates the user, workspace, owner membership, plan, subscription, and signup records.
2. Stripe creates a real test Checkout Session.
3. The trial receives the correct plan, storage capacity, and write entitlement.
4. Two workspaces can use the same portfolio slug without crossing tenant boundaries.
5. Magic login tokens are workspace-scoped and single-use.
6. A private R2 object can be uploaded and delivered through a short-lived signed URL.
7. A Stripe test subscription upgrades from Starter to Growth and updates local storage capacity.
8. Stripe successfully invoices the standard Visa test payment method and the account becomes active.
9. Stripe Customer Portal opens for the subscriber.
10. Cancellation at period end preserves access until the period ends.
11. An ended subscription becomes read-only so retained work can be reviewed but not changed.

## Cleanup

The command always attempts cleanup in a `finally` block. It removes the R2 probe object, expires the Checkout Session, deletes the Stripe test customer and subscription, deletes both temporary subscriber workspaces and users, removes temporary tokens and signup records, and restores plan price references.

A successful run ends with both of these lines:

```text
Subscriber lifecycle verification passed.
  CLEAN  Stripe, database, and R2 test artifacts removed
```

If `CLEAN` does not appear, inspect Stripe test customers for the `qaRunId` metadata and the database for email addresses beginning with `qa-lifecycle+` before rerunning.

## Launch use

Run this command after changes to registration, authentication, plans, Stripe webhooks, billing portal actions, subscription access rules, tenant scoping, or R2 storage. Also run it immediately before a live-mode Stripe cutover. It complements, rather than replaces, `npm test`, `npm run lint`, `npm run build`, and `npm run stripe:verify`.
