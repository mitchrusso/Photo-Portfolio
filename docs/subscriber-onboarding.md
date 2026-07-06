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

For a fresh database, apply the current schema before testing registration:

```bash
npx prisma db push
```

For production, replace `db push` with a migration workflow before launch.

## Lifecycle Automation Status

Completed:

- Trial registration creates the subscriber, workspace, plan, subscription, and trial signup records.
- Stripe checkout/webhook plumbing exists for sandbox subscription conversion.
- TinyEmail can be updated directly through `TINYEMAIL_API_KEY`.
- Transactional lifecycle emails can be sent through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Login now uses a one-time magic link sent to the subscriber email address.
- Usage thresholds are checked hourly through Vercel Cron.
- Storage and bandwidth warning tags are emitted at 75%, 90%, and 100%.
- The Account page exposes usage, current plan context, and overage preferences.

Still needed before public launch:

- Final Stripe live-mode products, prices, customer portal, and webhook endpoint.
- A production migration workflow instead of `prisma db push`.
- Subscriber upgrade/downgrade actions that actually change Stripe subscriptions.
- Auto-rollover billing rules for approved overages.
- Admin view for subscriber usage, status, failed payments, and cancellations.
- TinyEmail automations built from `docs/tinyemail-autoresponder.md`.

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
- Storage and bandwidth threshold warnings from `/api/usage/check-thresholds`.
