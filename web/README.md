# Used Goods Marketplace — Web App

Next.js (App Router) web application for the VinTech Challenge 2026
submission, built with Tailwind CSS and shadcn/ui and wired to a local
Supabase clone.

Design and architecture source of truth: the repository `docs/` tree
(design authority: `docs/04-design/00-design-foundations.md`; CI/CD shape:
`docs/03-engineering/02-ci-cd-strategy.md`).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix) |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| AI (optional) | Google Gemini API — AI listing assistant |
| Validation | Zod (server actions) |
| Testing | Vitest, ESLint, TypeScript |
| CI/CD | GitHub Actions (lint, typecheck, test, build) + Vercel |

## System architecture

```text
             Browser (desktop / mobile)
                        │
              Next.js App (this dir) — RSC + Server Actions
                        │
      ┌─────────────────┴──────────────────┐
   Supabase (BaaS)                     Gemini API
   │  ├─ PostgreSQL (RLS)               (AI listing assist)
   │  ├─ Auth (email + password, JWT)
   │  └─ Storage (avatars, listing-images)
```

The app is a stateless Next.js frontend over Supabase-as-backend:

- **Reads** run as server components / Server Actions that call Supabase
  PostgREST; every table has Row Level Security policies scoping rows to the
  caller (see `supabase/migrations/`).
- **Privileged or stateful writes** (offers, reviews, reports, contact
  attempts) go through `SECURITY DEFINER` RPCs that re-check the caller,
  enforce invariants, and apply rate limits — never a raw client insert.
- **AI listing assist** is optional; manual listing creation always works
  (ADR-009, Gemini free tier).

The full architecture, ADRs, DB schema, and API surface are documented in
`docs/02-architecture/`. The deployment guide for hosted Supabase + Vercel is
`docs/03-engineering/12-deployment-guide.md`.

## Requirements

- Node.js 20+ and npm
- Supabase CLI (>= 2.x) and Docker Desktop for the local Supabase stack

## Quick start

From this `web/` directory:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> From the repository root the run command is `cd web && npm run dev`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |

## Design tokens

Applied in `app/globals.css` and sourced from the design authority:

- Primary color: `#2563EB` (Primary 500), with the full primary scale in the
  CSS variables
- Font: Geist (via `next/font/google`), heading + body
- Spacing: Tailwind's default numeric scale (`px-4`, `gap-4`, `size-8`)
- Semantic colors: success `#22C55E`, warning `#F59E0B`, error `#EF4444`,
  info `#0EA5E9`
- Icons: Lucide React

UI components live in `components/ui` (shadcn/ui, radix base). Customize
with the shadcn CLI: `npx shadcn@latest add <component>`.

## Supabase local stack

The app is configured to run against a local Supabase clone. The Supabase
config was initialized with `supabase init` (see `supabase/config.toml`).

Install the Supabase CLI:

- macOS/Linux: `brew install supabase/tap/supabase` or see the
  [official install docs](https://supabase.com/docs/guides/local-development/cli/getting-started#installing-the-supabase-cli)
- Windows: download the release binary from
  [github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
  or `scoop install supabase`

Start the local stack (Postgres, Auth, Storage, and friends) from this
`web/` directory. Requires Docker Desktop to be running:

```bash
supabase start
```

Stop it with `supabase stop`. On first run the CLI pulls the service images,
which can take a few minutes.

Once running, `supabase start` prints the local `SUPABASE_URL` and
`SUPABASE_ANON_KEY`. Create `web/.env.local` (never commit it):

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key printed by supabase start>
```

The `supabase` binary needs to be on your `PATH` or available as `supabase`.
This environment's `supabase start` was not executed (Docker was
unavailable during scaffold), so the runtime URLs above are the documented
defaults from the CLI output.

### Database migrations

Schema changes live in `supabase/migrations/` (timestamped SQL). Apply them
and load the seed on the local stack:

```bash
supabase db reset
```

`supabase db reset` also runs `supabase/seed.sql`, which creates the demo
accounts below (change passwords before any shared hosting):

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | `admin@vintch.local` | `admin1234` | Moderation queue |
| Seller (phone-verified) | `amira.sellers@vintch.local` | `demo1234` | Trust badge + listings |
| Seller (Fayda-verified) | `fayad.verified@vintch.local` | `demo1234` | Trust badge + listings |
| Seller (plain) | `kebede.trader@vintch.local` | `demo1234` | Unverified state |
| Buyer | `biniam.buyer@vintch.local` | `demo1234` | Browsing / offers |

The seed also publishes ~69 Addis Ababa listings across every category
(Bole, Piassa, Merkato, Kazanchis, …), weighted toward Electronics, Furniture,
and Home Appliances, so search/filter/detail have a full catalog to work
with. Six of those are marked sold behind the demo sellers' earned reviews
and ratings, leaving ~63 live listings to browse.

## Authentication & roles

Auth is Supabase Auth (email & password) wired through `@supabase/ssr`
cookie sessions. See `docs/02-architecture/07-security-architecture.md` for
the model.

- **Routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`;
  protected areas (`/profile`, `/dashboard`, `/onboarding`, `/sell`,
  `/favorites`) redirect to `/login` via `proxy.ts` (Next 16 middleware).
- **Roles:** `buyer` (default), `seller`, `admin`. A trigger creates a
  `profiles` row for every new user; onboarding (`/onboarding`) completes it.
- **RLS:** users read/update only their own profile; admins via
  `public.is_admin()`. Relaxing public-profile reads is a later ticket.
- **Session state:** `AuthProvider` subscribes to Supabase auth changes so
  the header user menu stays in sync; sessions persist across refresh via
  cookies.

## Environment variables

See `.env.example` for the full set. Secrets must never be committed.

### Deployed demo (competition)

For the VinTech Challenge 2026 submission, the deployed build uses:

- **Hosted Supabase** (not local Docker) — set via Vercel env vars
- **Mock Fayda** (`FAYDA_MOCK=true`) — the mock OIDC provider at `/mock-fayda/*`
  runs in the deployed build because real eSignet credentials aren't available
  for the competition. The verify-only OIDC surface is identical to production
  Fayda, so swapping to real credentials later is a config-only change.
- **Chapa test mode** — test secret key, demo fallback for sandbox payments

## CI/CD

Pull requests run lint, type check, and build via GitHub Actions
(`.github/workflows/ci.yml`). Merging to `main` triggers a Vercel production
deployment (`.github/workflows/deploy.yml`), gated on the Vercel secrets
being configured. Vercel preview deployments are created per-PR once the
repository is connected to Vercel.
