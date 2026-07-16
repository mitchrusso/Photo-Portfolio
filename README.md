# PhotoView.io

A multi-tenant photography portfolio platform built with Next.js, PostgreSQL, private Cloudflare R2 media, Stripe subscriptions, and magic-link authentication.

Starter template source:

```text
https://github.com/mikefilsaime-groove/NextJS-Full-Starter-App-2026
```

## Manual Quick Start

```bash
git clone https://github.com/mitchrusso/Photo-Portfolio.git
cd Photo-Portfolio
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Development mode includes a safe fake auto-login user so you can start building without creating an auth system first.

## What Is Included

| Area | Stack |
| --- | --- |
| App framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui conventions, OKLCH theme tokens |
| Auth | Auth.js / NextAuth 5 with production magic links and development auto-login |
| Database | Prisma 7 with PostgreSQL |
| Data and validation | React Query, Zod, React Hook Form |
| Rich text | Tiptap |
| AI | Vercel AI SDK, OpenAI SDK, Google Gemini SDK |
| External services | Pexels, Firecrawl, Apify clients |

## Environment Variables

Copy the example file before running the app:

```bash
cp .env.example .env
```

Every value in `.env.example` is intentionally fake. Do not put real credentials in `.env.example`, README files, screenshots, chat prompts, or committed code.

Required for a real app:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js secret, generated per app |
| `AUTH_URL` | Local or deployed app URL |

SuperAdmin SMS verification is optional and disabled by default. When enabled, configure `SUPERADMIN_MFA_PHONE_E164`, `TWILIO_VERIFY_SERVICE_SID`, and either the restricted `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET` pair or the account SID / auth token fallback. It does not change subscriber login. See `docs/SUPERADMIN-SMS-MFA.md` for the activation and recovery procedure.

Optional service keys:

| Variable | What it is |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini key name used by some AI SDK examples |
| `PEXELS_API_KEY` | Pexels API key |
| `FIRECRAWL_API_KEY` | Optional Firecrawl fallback for plain-English retailer product discovery |
| `OPENAI_GEAR_SEARCH_MODEL` | Optional OpenAI model override for retailer product discovery; defaults to `gpt-4.1-mini` |
| `APIFY_API_KEY` | Apify API key |
| `ABLY_API_KEY` | Ably real-time key |
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_KEY` | Pusher key |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | Pusher cluster |

Generate a real auth secret only inside your private `.env` file:

```bash
openssl rand -base64 32
```

## Development Commands

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm test         # Run regression tests
npm run build    # Build for production
npm run start    # Start the production build
npm run stripe:verify                 # Validate Stripe test configuration
npm run subscriber:lifecycle:verify   # Run the disposable test-mode subscriber lifecycle
```

## Database Commands

```bash
npx prisma migrate dev --name describe_change
npx prisma migrate deploy
npx prisma generate
npx prisma studio
```

## Project Structure

```text
docs/                         Product, operations, integration, and launch guides
prisma/schema.prisma          Prisma database schema
src/app/                      Next.js App Router pages and API routes
src/app/api/auth/             Auth.js routes and magic-link authentication
src/components/providers/     React providers
src/lib/utils.ts              Shared utility helpers
src/auth.ts                   Auth.js configuration
src/proxy.ts                  Auth routing proxy
.env.example                  Fake placeholder env values only
```

## Security Notes For New Apps

- `.env` and local env files are ignored by git.
- `.env.example` must stay fake and safe to publish.
- Development auto-login is for local development only.
- Production login sends a single-use magic link that expires after 15 minutes.
- Stripe webhooks require a valid signature no more than five minutes old.
- Subscriber media is private in Cloudflare R2 and delivered with short-lived signed URLs after an authorization check.
- Run `npm run subscriber:lifecycle:verify` only with Stripe test credentials; the command refuses live keys.
- Do not paste real secrets into AI chats unless you intentionally trust that tool and account.
- Rotate any credential immediately if it ever appears in a public commit, screenshot, or message.

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

Browse components at [ui.shadcn.com](https://ui.shadcn.com).

## Deployment

Vercel is the easiest path for most Next.js apps:

```bash
npm i -g vercel
vercel
```

Add your real environment variables in the Vercel project settings. Do not commit them to the repo. Apply checked-in migrations with `prisma migrate deploy`; never use `prisma migrate reset` against production.

## License

MIT
