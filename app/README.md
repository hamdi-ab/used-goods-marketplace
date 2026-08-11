# Used Goods Marketplace — Web App

Next.js (App Router) web application for the VinTech Challenge 2026
submission, built with Tailwind CSS and shadcn/ui and wired to a local
Supabase clone.

Design and architecture source of truth: the repository `docs/` tree
(design authority: `docs/04-design/00-design-foundations.md`; CI/CD shape:
`docs/03-engineering/02-ci-cd-strategy.md`).

## Requirements

- Node.js 20+ and npm
- Supabase CLI (>= 2.x) and Docker Desktop for the local Supabase stack

## Quick start

From this `app/` directory:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> From the repository root the run command is `cd app && npm run dev`.

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
- Spacing: 8-point grid tokens (`--spacing-xs` … `--spacing-5xl`)
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
`app/` directory. Requires Docker Desktop to be running:

```bash
supabase start
```

Stop it with `supabase stop`. On first run the CLI pulls the service images,
which can take a few minutes.

Once running, `supabase start` prints the local `SUPABASE_URL` and
`SUPABASE_ANON_KEY`. Create `app/.env.local` (never commit it):

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key printed by supabase start>
```

The `supabase` binary needs to be on your `PATH` or available as `supabase`.
This environment's `supabase start` was not executed (Docker was
unavailable during scaffold), so the runtime URLs above are the documented
defaults from the CLI output.

## Environment variables

See `.env.example` for the full set. Secrets must never be committed.

## CI/CD

Pull requests run lint, type check, and build via GitHub Actions
(`.github/workflows/ci.yml`). Merging to `main` triggers a Vercel production
deployment (`.github/workflows/deploy.yml`), gated on the Vercel secrets
being configured. Vercel preview deployments are created per-PR once the
repository is connected to Vercel.
