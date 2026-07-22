# PhotoView Partnership CRM

The partnership CRM is integrated into the PhotoView application at `/admin/partnerships`. It uses the existing Auth.js administrator session, PhotoView's administrator-role checks, and the existing SuperAdmin SMS verification. The proxy is only a first check: the page and every API route repeat authorization on the server.

## Production setup

1. Apply `prisma/migrations/20260721200000_partnership_crm/migration.sql` through the existing `prisma migrate deploy` production build step.
2. Add these encrypted Vercel environment variables for Production, Preview, and Development as appropriate:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `PARTNERSHIP_CRM_GMAIL_ADDRESS` (`mitch@photoview.io` in production)
   - `PARTNERSHIP_CRM_ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
3. In the Google Cloud OAuth client, register the exact production redirect URI: `https://photoview.io/api/google/callback`.
4. Run `npm run crm:seed` if the automatic first-open seed has not already populated the nine current partner records.

Never prefix the OAuth credentials or encryption key with `NEXT_PUBLIC_`, place them in client code, or commit real values. The configured CRM mailbox is `mitch@photoview.io`; Google authorization is prefilled for that mailbox and rejects a different account. Gmail access requests `gmail.readonly` for CRM conversation search and `gmail.send` for explicitly reviewed outbound messages. The CRM cannot delete or modify mailbox content. Tokens are encrypted with AES-256-GCM before PostgreSQL storage. Disconnecting Gmail deletes the saved encrypted connection.

## Sending CRM outreach

1. Open `/admin/partnerships?view=Gmail` and connect `mitch@photoview.io`. An older read-only connection is detected and must be reconnected once to grant `gmail.send`.
2. Create an outreach draft for a partner, then open the Outreach tab.
3. Select **Review and send**, verify the recipient, subject, and message, then explicitly confirm **Send now**.
4. The server fixes the sender to `mitch@photoview.io`, sends through Gmail, marks the outreach record `SENT`, and adds a dated activity to the partner record. Failed Gmail requests do not mark a draft as sent.

The direct-send route repeats administrator plus SuperAdmin MFA authorization, rejects cross-origin requests, validates recipient and header content, and never accepts a client-supplied sender address.

## Data migration

The original standalone prototype stored pipeline stages, notes, tasks, and meetings in browser localStorage. The integrated version does not read or write localStorage. Partners, contacts, activities, notes, outreach drafts, meetings, tasks, and per-administrator Google connections are now Prisma/PostgreSQL records.
