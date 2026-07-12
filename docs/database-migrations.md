# Production database migrations

PhotoViewPro now keeps a checked-in Prisma migration history. The baseline migration was generated from the production database schema on July 12, 2026. It represents tables that already exist and must never be applied to that existing database.

## First production adoption

1. Create and verify a Neon backup or restore point.
2. Pull the current production environment into a temporary local file.
3. Mark the baseline as already applied.
4. Review migration status.
5. Deploy the additive migrations.
6. Run the application verification checklist before deploying code that depends on the new tables.

The database migration must be deployed before the application code in this release. The photo-delete route writes to `StorageDeletionJob`.

Commands, run from the linked PhotoViewPro project:

```bash
npx vercel env pull .env.production.local --environment=production
set -a
source .env.production.local
set +a
npx prisma migrate resolve --applied 20260712000000_baseline
npm run db:migrate:status
npm run db:migrate:deploy
rm .env.production.local
```

Never commit the pulled environment file. Do not run `prisma migrate reset` against production.

## Normal releases after adoption

Create migrations in development, review their SQL, commit them with the related application code, and run this before the application deployment:

```bash
npm run db:migrate:status
npm run db:migrate:deploy
```

If a migration fails, stop the application rollout. Do not edit a migration that has already been applied to any shared environment.

## Current additive migration

`20260712010000_storage_deletion_queue` creates the durable cleanup queue used when a subscriber deletes a photo. The API commits the database deletion and cleanup job together, attempts object removal immediately, and leaves failed jobs for the hourly retry cron.
