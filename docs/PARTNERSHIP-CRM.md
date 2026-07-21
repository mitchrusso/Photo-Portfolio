# PhotoView Partnership CRM

The partnership CRM is integrated into the PhotoView application at `/admin/partnerships`. It uses the existing Auth.js administrator session, PhotoView's administrator-role checks, and the existing SuperAdmin SMS verification. The proxy is only a first check: the page and every API route repeat authorization on the server.

## Production setup

1. Apply `prisma/migrations/20260721200000_partnership_crm/migration.sql` through the existing `prisma migrate deploy` production build step.
2. Add these encrypted Vercel environment variables for Production, Preview, and Development as appropriate:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `PARTNERSHIP_CRM_ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
3. In the Google Cloud OAuth client, register the exact production redirect URI: `https://photoview.io/api/google/callback`.
4. Run `npm run crm:seed` if the automatic first-open seed has not already populated the nine current partner records.

Never prefix these values with `NEXT_PUBLIC_`, place them in client code, or commit real values. Gmail access requests only `gmail.readonly`; tokens are encrypted with AES-256-GCM before PostgreSQL storage. Disconnecting Gmail deletes the saved encrypted connection.

## Data migration

The original standalone prototype stored pipeline stages, notes, tasks, and meetings in browser localStorage. The integrated version does not read or write localStorage. Partners, contacts, activities, notes, outreach drafts, meetings, tasks, and per-administrator Google connections are now Prisma/PostgreSQL records.
