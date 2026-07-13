# Subscriber Onboarding

PhotoViewPro trial registration now creates durable subscriber records before it sends autoresponder data or creates a Stripe Checkout session.

## Current Registration Flow

1. The prospect submits the trial form with name, email, phone, website, studio name, and selected plan.
2. The API normalizes the selected plan from `src/lib/plans.ts`.
3. The database layer creates or updates:
   - `Plan`
   - `User`
   - `Workspace`
   - `WorkspaceMember` with `OWNER` role
   - `Subscription` with `TRIALING` status
   - `TrialSignup`
4. TinyEmail/autoresponder tagging runs.
5. Stripe Checkout is created when the plan price id environment variable is configured.
6. The trial signup and subscription are updated with the Stripe Checkout session id.

## Current Login Rule

The `/login` page asks for the subscriber email address, verifies that the email belongs to a trialing or active subscriber, and sends a one-time magic link to that inbox.

Dashboard access requires a valid, unused login token. The link expires after 15 minutes and can only be used once.

## Required Environment

Set `DATABASE_URL` to a reachable Postgres database before registrations can be saved.

Local example:

```bash
DATABASE_URL="postgresql://example_user:example_password@localhost:5432/example_app?schema=public"
```

The current local value points at `localhost:5432`; that database server must be running for the registration endpoint to persist records.

## Deployment Notes

The project now runs `prisma generate` on `postinstall`, so Vercel and new local clones generate the Prisma client automatically after dependencies are installed.

For a fresh local database, apply the checked-in migrations before testing registration:

```bash
npx prisma migrate deploy
```

Production uses the checked-in migration workflow documented in `docs/database-migrations.md`.

## Lifecycle Automation Status

Completed:

- Trial registration creates the subscriber, workspace, plan, subscription, and trial signup records.
- Stripe test Checkout, signed webhooks, subscription conversion, plan changes, billing portal, and cancellation are implemented.
- TinyEmail can be updated directly through `TINYEMAIL_API_KEY`.
- Transactional lifecycle emails can be sent through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Login now uses a one-time magic link sent to the subscriber email address.
- Storage thresholds are checked hourly through Vercel Cron.
- Storage warning tags are emitted at 75%, 90%, and 100%.
- The app-owned email automation cron sends trial education, customer onboarding, failed-payment, cancellation, and usage-warning transactional emails through Resend. TinyEmail remains the segmentation/list layer.
- The Account page exposes usage, current plan context, and overage preferences.
- `/admin/subscribers` gives configured admins a subscriber operations view for status, billing connection, storage, and portfolio footprint.

Still needed before public launch:

- Final Stripe live-mode products, prices, customer portal, and webhook endpoint.
- TinyEmail automations built from `docs/tinyemail-autoresponder.md`.
- A supervised live-mode checkout using the lowest-priced plan after the remaining launch gates pass.

Verification:

- Run `npm run subscriber:lifecycle:verify` to exercise the complete disposable Stripe test-mode flow. See `docs/subscriber-lifecycle-verification.md`.

## Transactional Lifecycle Email

TinyEmail remains useful for contact tagging and segmentation, but its Workflow API trigger is limited on the current account. PhotoViewPro therefore has a direct transactional email path for messages that must be reliable.

Configure these environment variables to enable it:

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="PhotoViewPro <hello@photoviewpro.com>"
```

When these are missing, lifecycle email calls return `not_configured` and the registration/usage flows continue normally.

Current transactional sends:

- Magic login email from `/login`.
- Trial welcome email from `/api/trial/register`.
- Storage threshold warnings from `/api/usage/check-thresholds`.
- Trial education and customer onboarding sequences from `/api/email/automations`.
- Customer welcome, payment failed, and cancellation emails from `/api/stripe/webhook`.

## Email Automation Cron

Vercel Cron calls `/api/email/automations` hourly, fifteen minutes after the usage checker. The endpoint is protected by `CRON_SECRET` or `EMAIL_AUTOMATION_SECRET`.

The scheduler sends:

- Trial education every day on days 1-13 for accounts that are still `TRIALING`, whether or not Stripe already has a payment method on file.
- Customer onboarding on days 2, 5, and 10 after the account is no longer trialing and Stripe billing is connected.
- One message per automation key per subscription, recorded in `EmailAutomationDelivery` so repeated cron runs do not resend the same lesson.

Stripe webhooks send immediate lifecycle emails for customer welcome, payment failure, and subscription cancellation. Storage-capacity emails are handled by `/api/usage/check-thresholds` so the capacity threshold and alert email stay together.
