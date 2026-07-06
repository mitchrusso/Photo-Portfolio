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

The `/login` page now asks for the subscriber email address. The system grants dashboard access when that email belongs to a user who is attached to a workspace as `OWNER`, `ADMIN`, or `EDITOR`, and the workspace subscription status is `TRIALING` or `ACTIVE`.

This is a database-backed subscriber gate. It is not yet a full passwordless email challenge. That should be added before public launch so only the email owner can complete the sign-in.

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
