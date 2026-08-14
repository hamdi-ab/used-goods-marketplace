# Used Goods Marketplace — VinTech Challenge 2026

This repository is the single source of truth for the product (see `docs/`)
and now hosts the web application under `web/`.

## What is this?

A used-goods marketplace for Addis Ababa, built for the VinTech Challenge 2026.
Buyers search and filter listings, contact sellers (Telegram / call), and make
offers; sellers publish listings (with an optional AI-assisted listing
assistant); a seller trust framework (verified sellers, reviews, ratings)
supports safe transactions. The winning strategy and product vision live in
[`docs/00-strategy/00-winning-strategy.md`](docs/00-strategy/00-winning-strategy.md).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Security model | Postgres Row Level Security + typed Server Actions |
| AI (optional) | Google Gemini API — listing assistant |
| Testing | Vitest (unit), ESLint, `tsc --noEmit` |
| CI/CD | GitHub Actions + Vercel |

## System architecture

```text
             Browser (desktop / mobile)
                        │
              Next.js App (web/) — RSC + Server Actions
                        │
      ┌─────────────────┴──────────────────┐
   Supabase (BaaS)                     Gemini API
   │  ├─ PostgreSQL (RLS)               (AI listing assist)
   │  ├─ Auth (email + password, JWT)
   │  └─ Storage (avatars, listing-images)
```

The app is a serverless Next.js frontend over Supabase-as-backend. Reads and
writes go through Row Level Security policies on Postgres; privileged or
stateful writes (offers, reviews, reports, contact attempts) run as
`SECURITY DEFINER` RPCs that re-check the caller and apply rate limits.
See [`docs/02-architecture/00-system-architecture.md`](docs/02-architecture/00-system-architecture.md)
for the full picture and the ADRs.

## Repository layout

```
web/                Web application (Next.js App Router, Tailwind, shadcn/ui)
docs/00-strategy/   Winning strategy + product vision
docs/01-prd/        PRD: overview, goals, personas, stories, FR/NFR, flows
docs/02-architecture/  System architecture, ADRs, domain model, DB/API/backend specs
docs/03-engineering/   Performance, testing, CI/CD, coding standard, roadmap
docs/04-design/     Design system: foundations, components, library, UX
docs/agents/        Agent working notes (tracker conventions)
load-test/          k6 load-test scenario + runbook
```

## Application

The web app lives in `web/` (Next.js App Router, Tailwind CSS, shadcn/ui).

```bash
cd web
npm install
npm run dev
```

See [web/README.md](web/README.md) for full setup, the Supabase local stack
commands, and the design-token overview. For a hosted deployment, see
[`docs/03-engineering/12-deployment-guide.md`](docs/03-engineering/12-deployment-guide.md).

## Documentation map

- **PRD:** [`docs/01-prd/00-overview.md`](docs/01-prd/00-overview.md)
- **Build plan:** [`docs/03-engineering/06-implementation-roadmap.md`](docs/03-engineering/06-implementation-roadmap.md)
- **Design authority:** [`docs/04-design/00-design-foundations.md`](docs/04-design/00-design-foundations.md)
- **Architecture decisions:** [`docs/02-architecture/01-architecture-decision-records.md`](docs/02-architecture/01-architecture-decision-records.md)
