# Stripe Live Cutover

PhotoView.io remains in Stripe test mode until every item below passes. Never paste a Stripe secret into source control, chat, logs, or a browser-visible variable.

## Current launch gate

Production uses `STRIPE_EXPECTED_MODE=test`. This deliberately prevents an accidental mixed or partial live configuration. The final cutover changes that value to `live` only after all live keys, prices, and the live webhook endpoint have been installed.

## Live Stripe setup

1. Open the dedicated PhotoView.io Stripe account under Mindful Guidance, LLC and switch Stripe to live mode.
2. Confirm the public business profile, payout account, statement descriptor, support contact, tax choice, and Customer Portal configuration.
3. Create active monthly and annual recurring USD prices for Starter, Growth, Studio, and Premier using the amounts in `src/lib/plans.ts`.
4. Create a live webhook endpoint targeting `https://photoview.io/api/stripe/webhook` and subscribe it to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Add the live secret key, publishable key, webhook signing secret, and all eight live price ids to the Vercel Production environment. Do not change Preview or Development; they should remain test-only.
6. Run `npm run stripe:verify:live` against a temporary local file containing the proposed production values. The command prints only validation results, never secret values.
7. Set `STRIPE_EXPECTED_MODE=live`, deploy production, and confirm the production build reports `validated in live mode`.

## Controlled payment test

Use a new email address and the lowest monthly plan. Confirm the exact charge and card immediately before submitting Stripe Checkout. Verify:

- Checkout creates one live Stripe customer and one trialing subscription.
- No charge is captured on day one of the 14-day trial.
- The webhook creates or updates the correct PhotoView.io subscriber and plan.
- My Account shows the plan, storage allowance, trial end, next billing date, and Customer Portal actions.
- The welcome email arrives and its dashboard link works.
- Updating the payment card opens Stripe Customer Portal.
- Canceling during trial schedules cancellation and prevents a future charge.
- SuperAdmin shows the trial, billing connection, and no unresolved billing incident.

## Rollback

If any live check fails, stop new checkout traffic, restore the complete test-mode Production variable set, set `STRIPE_EXPECTED_MODE=test`, and redeploy. Never mix test keys, live prices, or webhook secrets across modes.
