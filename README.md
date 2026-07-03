# Photo-Portfolio

A Next.js photo portfolio application created from the Scale.gg NextJS Starter App Template.

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
| Auth | Auth.js / NextAuth 5 with development auto-login |
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

Optional service keys:

| Variable | What it is |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini key name used by some AI SDK examples |
| `PEXELS_API_KEY` | Pexels API key |
| `FIRECRAWL_API_KEY` | Firecrawl API key |
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
npm run build    # Build for production
npm run start    # Start the production build
```

## Database Commands

```bash
npx prisma db push
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio
```

## Project Structure

```text
docs/                         Starter docs and product planning templates
prisma/schema.prisma          Prisma database schema
src/app/                      Next.js App Router pages and API routes
src/app/api/auth/             Auth.js routes and development auto-login
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
- Production auth currently redirects to `/login`; implement real production login before launch.
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

Add your real environment variables in the Vercel project settings. Do not commit them to the repo.

## License

MIT
