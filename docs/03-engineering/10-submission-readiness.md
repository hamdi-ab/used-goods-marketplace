# Submission Readiness Plan

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Owner:** Product & Engineering Team
>
> **Status:** Draft
>
> **Last Updated:** August 2026

> **Scope note:** This document is the deliverable of tracker ticket T22. It turns the three "Not yet decided" threads — hosting/deploy, seed data, and the demo screenplay — into a single actionable plan. It plans the work; it does not perform the deployment (T17), the seed production, or the video production. Hosting is already approved at a platform level (ADR-017: Vercel + GitHub Actions + Supabase); this doc pins the concrete shape around it.

# 1. Purpose

Produce the plan needed to hit the map's Destination: a hosted live demo plus a 3–5 minute video walkthrough on the submission deadline (Aug 26). It is the connective tissue between the build work (T01–T15), the docs/demo prep (T16), and the deploy/video/submit ticket (T17), and it defines what must be true *before* the app is hosted.

# 2. Hosting / Deploy Plan

Platforms are locked by [ADR-017](../../02-architecture/01-architecture-decision-records.md): GitHub, GitHub Actions, Vercel, Supabase. The concrete shape:

## 2.1 Supabase flip (hosted vs local CLI)

- Dev runs on the Supabase CLI local stack (map note). Before submission the app must run against a **hosted Supabase project**.
- **Plan:** create the hosted project by T17 start at the latest; run migrations (`supabase/migrations/` are the schema of record) against hosted; keep the local stack for feature dev up to that flip point.
- **Region:** choose a region close to Ethiopia for lower latency (EU, e.g. `eu-west-1`/`eu-central-1` if offered); nearest region wins for demo snappiness.

## 2.2 Vercel

- **Project:** one Vercel project linked to `main`; CI/CD auto-deploys on merge (Workflow 2 in [02-ci-cd-strategy.md](02-ci-cd-strategy.md)).
- **Demo URL:** a clean default `vercel.app` URL is acceptable. A custom domain is optional polish; do not spend ticket time on DNS unless it is free after the app deploys.
- **Env vars** (must live in Vercel, never in git): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`. Mirror the four listed in CI/CD §9.
- **Preview URLs:** rely on Vercel's automatic per-PR previews for the demo; the demo video records against the production URL, not a preview.

## 2.3 Free-tier sanity for NFR targets

- NFR-SCALE-001 calls 10k users / 50k listings / 500 concurrent as *design targets*, not proven load (see [00-performance-and-scalability-strategy.md](00-performance-and-scalability-strategy.md)). The hosted demo needs only to run fast and not degrade.
- Check the chosen tiers cover the demo: Supabase free tier (500 MB DB, 1 GB storage) is ample for ~100 seed listings + images; Vercel Hobby zero-cost tier for a docs/scout build is sufficient. **Only true concurrency/load proof is the T19 load test,** which runs against the hosted app as a separate ticket.
- Pause/limit warnings are not blockers for a 5-minute demo; note them and move on.

## 2.4 Deploy decision (recorded when it happens)

When T17 runs, record in the map's Decisions-so-far: project region, demo URL, and the Supabase/Vercel project IDs (IDs stay in the tracker/README; secrets never enter the repo).

# 3. Seed-Data Production Plan

Schema and image tiers are already defined; the seed plan assigns real content to them.

## 3.1 Categories

Initial categories come from [Database Design §23](../../02-architecture/03-database-design-specification.md): Electronics, Furniture, Home Appliances, Vehicles, Fashion, Books, Sports, Baby & Kids, Other. Every seed listing fills exactly one.

## 3.2 Listings

- **Volume:** ~50–75 listings, spanning every category, seeded around **Addis Ababa neighborhoods** (Bole, Piassa, Merkato, Kazanchis, as the map note says). Weight Electronics/Furniture/Home Appliances (the persona pain-point categories).
- **Photos:** use the Tier-locked asset plan + real product placeholder photos from [08-image-asset-strategy](../../04-design/08-image-asset-strategy.md) §4. Placeholder image generation is Tier 3 garnish — 1–4 real-ish product photos per listing via one consistent style is enough; do not hand-tune each.
- **Quality bar:** a seed listing must read like a real one — price in ETB, condition badge, location, seller, timestamp. The demo reviewer must not see empty shells.

## 3.3 Demo accounts

One per role (per DB §23's "one admin account", plus buyers/sellers):

- **Buyer** (demo buyer account): browsable, can favorite/offer.
- **Seller** (demo seller account) with a few of its own listings + earned trust indicators (verified email/phone, a couple of reviews, ratings).
- **Admin** for the moderation queue (Reports) if shown in demo.

## 3.4 Seeding mechanics

- Represent as a **seed script/backfill** (idempotent, runnable against the hosted DB once the flip happens), not manual inserts.
- Toreuse seed data in multiple local and hosted environments, wrap it in a script the same shape as the migrations side of the schema.

# 4. Demo Screenplay

Base: the Demo Story in [00-winning-strategy](../../00-strategy/00-winning-strategy.md), the video deliverables in [06-implementation-roadmap.md §12](06-implementation-roadmap.md), and the ~3–5 minute cap.

Open with the signature VinTech neighborhood hero (image-asset §3) so the first frame is memorable; then record against **the hosted production URL** with a running hosted DB (no local stack in the video).

| # | Shot | What happens on screen | Trust / point proven |
|---|------|------------------------|----------------------|
| 1 | Brand hero | Signature neighborhood illustration, marketplace name | Identity/polish |
| 2 | Seller: create listing | Seller uploads 1–2 photos, AI Listing Assistant suggests title/description/category | Effortless selling; AI differentiator |
| 3 | Seller: publish | Listing goes live with condition + price in ETB, Addis location | Real marketplace |
| 4 | Buyer: search & filter | Keyword search + filters (category/price/condition/city) | Fast discovery (< 30 s) |
| 5 | Buyer: result → detail | Clean card grid → listing detail with seller trust bar | Seller Trust Framework visible |
| 6 | Buyer: contact | Telegram/call buttons record a contact attempt (t.me deep-link + tel:) | Trust + communication carve |
| 7 | Buyer: offer | Offer submitted, arrives on seller dashboard | Full marketplace lifecycle |
| 8 | (optional) Admin | Moderation queue sees the new listing reported/toggle | Governance |
| 9 | Closing | Value proposition: speed, trust, simplicity + submission ask | Winning statement |

- **Pacing target:** listing creation + search + contact card that the video visually lands in ~5 minutes; each shot only moves one story step.
- **Voiceover/microcopy:** 2–4 short sentences per shot in plain language matching the winning strategy's "fastest and most trustworthy way…".
- **Tooling decision (deferred to T16/T17):** pick screen recording (OS-native or OBS), trim to ≤5:00, and host the recording (Vercel static or an external link) — recorded in the map when chosen.

# 5. Pre-Submission Gate

Fold this into T17's definition of done (do not duplicate the roadmap checklist; point to it):

- Hosted Supabase flipped; production URL is the demo URL.
- Seed data applied to hosted; demo accounts work.
- Lighthouse-arm: performance, accessibility, best-practice, SEO at the documented 95 bar.
- Demo video ≈ 3–5 minutes rendered and hosted.
- README/doc pack links updated to the live URL (map Destination: "hosted live demo by Aug 26").

# 6. Open items that depend on the build

- Whether the AI Listing Assistant & trust-score demos seed well against the hosted DB (depends on T14).
- Whether the admin queue appears in the video (only if T11's admin surface is polish-ahead of time).
- Custom domain (optional; only if time remains after the video is recorded).

# 7. Bottom line

The submission is: hosted app + honest seed + a 5-minute story that proves the winning strategy (trust, speed, simplicity) on the live URL. Everything in this doc either already exists in the pack (platform, categories, image tier, demo story) or is a small, well-scoped production step (hosted project, seed script, screenplay). The only genuinely risky seam is the hosted-flip timing relative to the Aug 26 deadline.