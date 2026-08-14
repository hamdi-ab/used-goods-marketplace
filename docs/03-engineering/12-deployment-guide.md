# Deployment Guide — Hosted Supabase + Vercel

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Owner:** Engineering Team
>
> **Status:** Draft

This guide deploys the Used Goods Marketplace to a hosted Supabase project
plus Vercel. It is the concrete how-to behind the hosting plan in
[`10-submission-readiness.md`](10-submission-readiness.md) (ADR-017: GitHub,
GitHub Actions, Vercel, Supabase). Local development uses the Supabase CLI
stack instead (see [`web/README.md`](../../web/README.md)).

# 1. Overview

The app needs three pieces to run:

1. **Supabase** — the database (Postgres + RLS), auth, and storage. Migrations
   in `web/supabase/migrations/` are the schema of record.
2. **Vercel** — the Next.js frontend (stateless, auto-scaling).
3. **Environment variables** — live in Vercel and Supabase, never in git.

```text
Developer → GitHub → GitHub Actions (CI) → Vercel → production URL
                                              │
                                              └→ Supabase (Postgres, Auth, Storage)
```

# 2. Hosted Supabase project

## 2.1 Create the project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. **Region:** pick the closest region to Ethiopia for demo latency (e.g.
   `eu-west-1` / `eu-central-1` if offered).
3. Note the project URL (`https://<project-ref>.supabase.co`) and the anon key
   (Settings → API).
4. The free tier (500 MB DB, 1 GB storage) is ample for the ~50–75 seeded
   listings used by the demo.

## 2.2 Apply migrations

The local CLI applies the same migrations that run in CI. From `web/`:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

- `supabase db push` applies any migrations not yet on the hosted DB, in order.
- `supabase db reset` is **local only** (wipes the local stack); never run it
  against hosted.

## 2.3 Load the demo seed

The seed (`web/supabase/seed.sql`) creates the demo accounts and Addis Ababa
listings. On hosted, run it once as the service role:

```bash
supabase db execute --file supabase/seed.sql
```

The seed is idempotent (safe to re-run). It creates demo accounts with known
credentials — **change these passwords** before sharing the demo broadly (see
section 5).

## 2.4 Storage buckets

The migration `20260812200000_create_listings.sql` creates the
`listing-images` bucket and its storage policies. Verify it exists on hosted:

```bash
supabase storage ls
```

# 3. Vercel deployment

## 3.1 Connect the repository

1. Create a Vercel account and import the GitHub repository
   `hamdi-ab/used-goods-marketplace`.
2. Vercel detects the Next.js app in `web/` — set **Root Directory** to `web/`.
3. Framework preset: **Next.js**. Build command `npm run build`, output
   `.next`.

## 3.2 Environment variables

Set these in Vercel (Project → Settings → Environment Variables) for the
Production, Preview, and Development environments:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key from Supabase | Public, safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | Secret — used only by Server Actions on the server |
| `GEMINI_API_KEY` | Gemini API key | Secret — AI listing assistant |
| `NEXT_PUBLIC_SITE_URL` | the Vercel production URL | Optional — used for metadata/sitemap |

Never commit these to git. The repo ships `.env.example` for the public-shape
only.

## 3.3 First deploy

Push to `main` (or run a manual deploy) — CI (`ci.yml`) runs lint, typecheck,
test, and build on every PR; the deploy workflow (`deploy.yml`) auto-deploys
`main` once the Vercel secrets are configured in GitHub. Preview deployments
are created per-PR automatically.

# 4. Post-deploy verification

1. Open the production URL — the home page shows seeded Addis Ababa listings.
2. Log in with a demo account (section 5) and confirm protected routes
   (`/dashboard`, `/profile`, `/sell`) redirect correctly.
3. Make an offer on a listing and confirm it appears on the seller's
   `/offers/seller`.
4. Confirm images load (Supabase Storage public bucket + `next/image`).

# 5. Demo accounts

The seed creates the accounts below (all password `demo1234` except admin):

| Account | Email | Role | Purpose |
|---|---|---|---|
| Admin | `admin@vintch.local` | admin | Moderation queue (Reports) — password `admin1234` |
| Seller (phone-verified) | `amira.sellers@vintch.local` | seller | "Verified Seller" trust badge |
| Seller (Fayda-verified) | `fayad.verified@vintch.local` | seller | "Verified Seller" trust badge |
| Seller (plain) | `kebede.trader@vintch.local` | seller | Unverified seller badge state |
| Buyer | `biniam.buyer@vintch.local` | buyer | Browsing, offers, favorites |

**Change the passwords before shared hosting.** See the tracker note in
`docs/agents/issue-tracker.md` for the canonical list.

# 6. Rollback / recovery

- **App:** Vercel deployment history — redeploy any previous build.
- **DB:** migrations are forward-only. To undo, write a corrective migration
  (follow the timestamped naming) rather than editing history.
- **Secrets:** rotate keys in Vercel/Supabase dashboards; the app reads them
  at runtime, so a rotation only needs a redeploy.

# 7. Related docs

- Hosting plan & decisions: `10-submission-readiness.md`
- CI/CD strategy: `02-ci-cd-strategy.md`
- Load verification (live run once hosted): `11-load-verification.md`
- Architecture: `../../02-architecture/00-system-architecture.md`