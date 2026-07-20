# PhotoView.io disaster recovery runbook

Last reviewed: July 20, 2026

## Recovery objectives

- Database recovery point objective (RPO): no more than 24 hours for a scheduled snapshot; use Neon point-in-time restore for a substantially smaller RPO when retained history is available.
- Database recovery time objective (RTO): four hours for a verified restore and production connection change.
- Media recovery point objective: no more than 24 hours once the secondary media copy is enabled.
- Media recovery time objective: one business day for a full-bucket recovery; individual objects should be recoverable sooner.

## Current production inventory

- PostgreSQL: Neon production project connected through Vercel.
- The Vercel-managed Neon Free plan currently provides a six-hour point-in-time history window, one manual snapshot, and no scheduled snapshots.
- Media: private Cloudflare R2 bucket; browsers receive only short-lived signed delivery URLs.
- The active R2 bucket's public development URL and custom-domain access are disabled. It has only Cloudflare's default seven-day multipart-upload cleanup rule and intentionally has no retention lock.
- Application: Vercel production deployments with Git history and instant rollback.
- Run `npm run recovery:verify` with production environment variables to compare every active database R2 reference with the live bucket. The command is read-only and does not display subscriber filenames or URLs.

## Database protection

1. In Neon, open **Backup & Restore**.
2. Confirm point-in-time history retention is enabled. Record the exact retention window in the verification log below.
3. Enable a daily scheduled snapshot with at least 14 days of retention when the account plan supports scheduled snapshots.
4. Before every production migration, create a named snapshot such as `pre-deploy-YYYY-MM-DD-shortsha`.
5. Never run `prisma migrate reset` against production.

### Quarterly database restore drill

1. Record current production counts using `npm run recovery:verify`.
2. In Neon **Backup & Restore**, choose a recent restore point and preview it first.
3. Restore into an isolated temporary branch or compute endpoint. Do not replace the production branch during a drill.
4. Connect only a local verification session to the restored branch.
5. Verify the Prisma migration count and the Workspace, Gallery, and Photo counts against the recovery-readiness output from the same point in time.
6. Open representative records without exporting subscriber personal data.
7. Record the elapsed restore time and result below.
8. Delete the temporary restore branch after verification to prevent unnecessary cost.

## R2 media protection

Cloudflare's storage durability protects against hardware loss, but the active bucket alone is not a backup against accidental or malicious deletion. Do not place a retention lock on the active application bucket: PhotoView.io must be able to honor subscriber deletions.

Before expanding beyond the controlled beta:

1. Create a separate private backup bucket with no public `r2.dev` URL or custom domain.
2. Use a credential distinct from the application's object read/write credential.
3. Copy missing immutable objects to the backup bucket hourly through `/api/storage/backup`. Existing same-size objects are skipped, and size conflicts stop the job rather than overwriting a locked recovery object.
4. Apply a minimum 35-day retention lock to the backup bucket. Backup objects are intentionally not deleted by the hourly job; establish and test a separate audited pruning procedure before removing any recovery objects.
5. Restrict restoration credentials to the owner/recovery operator; do not add them to the production application.
6. Review the nine unreferenced objects reported on July 20, 2026 separately. Do not delete them until their migration/QA purpose is confirmed.

### Quarterly media restore drill

1. Select three non-sensitive test objects representing an original, display image, and thumbnail.
2. Record their sizes and SHA-256 checksums.
3. Restore copies from the backup bucket to an isolated recovery prefix, never over the production keys.
4. Confirm sizes and checksums match.
5. Confirm PhotoView.io can decode the restored formats locally.
6. Delete only the isolated recovery copies after verification.
7. Record the elapsed restore time and result below.

## Application rollback

1. Identify the last verified Vercel production deployment.
2. Inspect production errors before changing aliases.
3. Use Vercel Instant Rollback for an application-only regression. A code rollback does not reverse a database migration.
4. For a database-affecting incident, stop writes or place the affected workflow in maintenance mode, then follow the Neon restore procedure.
5. After recovery, run the public health check, authentication boundary checks, and `npm run recovery:verify`.

## Incident order of operations

1. Preserve evidence and record the incident start time.
2. Stop the destructive operation or compromised credential.
3. Rotate affected secrets without posting them in tickets, email, or chat.
4. Determine whether the incident affects application code, database records, media objects, or more than one layer.
5. Restore into isolation and validate before redirecting production.
6. Notify affected subscribers and regulators when legally required.
7. Document the root cause and add a regression or monitoring control.

## Verification log

| Date | Operator | Database retention/snapshot | Database drill | R2 integrity | Media backup/drill | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-07-20 | Codex | Six-hour PITR confirmed; permanent manual snapshot created at 17:39 UTC | Historical branch restored in isolation; 1 workspace, 32 portfolios, 381 photos, and 14 migrations matched production; temporary branch deleted | Private-access settings confirmed; 1,170 active objects checked; 0 missing; 9 unreferenced objects held for review | Private `photoviewpro-media-backup` bucket created with a 35-day lock; hourly incremental job added | Database and media integrity drills passed; verify the first full backup after production credentials are installed |
