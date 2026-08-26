# Dagim Gebeya — Used Goods Marketplace

A trusted platform for buying and selling second-hand goods in Ethiopia.
Built for the **VinTech Challenge 2026**.

**Live demo:** https://dagim-gebeya.vercel.app (pending deployment)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Authentication & Roles](#authentication--roles)
- [Key User Flows](#key-user-flows)
- [Demo Accounts](#demo-accounts)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Related Documentation](#related-documentation)

---

## Features

### Core Marketplace
- **Listings**: Create, edit, publish, archive, and sell items with photos
- **Search & Filter**: Keyword search with category, price, condition, city filters
- **Offers**: Make, accept, decline, and counter offers
- **Favorites**: Save listings for later
- **Contact Seller**: Telegram deep-link or phone call

### Trust & Verification
- **Phone Verification**: SMS OTP (mock in demo: enter `123456`)
- **Fayda ID Verification**: National ID via OIDC (mock in demo)
- **Trust Score**: Composite score from verifications and reviews
- **Verified Seller Badge**: Shows on listings and profile

### Payments (Demo Mode)
- **Chapa Integration**: Pay for items via Ethiopia's leading payment gateway
- **Test Mode**: Uses Chapa sandbox — no real charges
- **Confirm Receipt**: Buyer confirms receipt to close the deal

### AI Listing Assistant
- **Gemini AI**: Suggests title, description, and category from photos
- **Optional**: Manual listing creation always works

### Monetization
- **Free Tier**: 5 active listings, 3 AI credits/month
- **Pro Tier**: 25 listings, 30 AI credits/month, analytics (199 ETB/month)
- **Listing Boosts**: 49 ETB (3 days) or 99 ETB (7 days) for visibility

### Admin Dashboard
- **Moderation Queue**: Reports, listings, users
- **Withdrawals**: Manage seller payouts
- **Verifications**: Review phone verification requests

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix) |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| AI | Google Gemini API (image analysis, listing suggestions) |
| Payments | Chapa (test mode) |
| Validation | Zod (server actions) |
| Testing | Vitest, ESLint, TypeScript |
| CI/CD | GitHub Actions + Vercel |

---

## System Architecture

```
             Browser (desktop / mobile)
                        │
              Next.js App — RSC + Server Actions
                        │
      ┌─────────────────┴──────────────────┐
   Supabase (BaaS)                     Gemini API
   │  ├─ PostgreSQL (RLS)               (AI listing assist)
   │  ├─ Auth (email + password, JWT)
   │  └─ Storage (avatars, listing-images)
```

### Key Design Decisions

- **Reads**: Server components / Server Actions → Supabase PostgREST
- **Writes**: `SECURITY DEFINER` RPCs enforce invariants and rate limits
- **RLS**: Every table has Row Level Security scoping rows to the caller
- **AI**: Optional — manual listing creation always works

See `docs/02-architecture/` for full ADRs and schema.

---

## Project Structure

```
web/
├── app/
│   ├── (site)/              # Public-facing pages
│   │   ├── page.tsx         # Home page
│   │   ├── sell/            # Create listing
│   │   ├── search/          # Browse & filter
│   │   ├── listings/[id]/   # Listing detail
│   │   ├── offers/          # Buyer/seller offers
│   │   ├── dashboard/       # Seller dashboard
│   │   ├── profile/         # User profile
│   │   ├── pricing/         # Plans & upgrade
│   │   ├── favorites/       # Saved listings
│   │   ├── notifications/   # Activity feed
│   │   ├── verify-phone/    # Phone OTP
│   │   ├── verify-fayda/    # Fayda OIDC flow
│   │   └── admin/           # Admin dashboard
│   ├── admin/               # Admin routes
│   ├── mock-fayda/          # Mock OIDC provider (demo)
│   ├── upgrade/             # Chapa upgrade callback
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── listings/            # Listing cards, forms
│   ├── offers/              # Offer actions, payment
│   ├── profile/             # Profile form, verification
│   ├── search/              # Search filters
│   └── contact/             # Contact dialog
├── lib/
│   ├── auth.ts              # Session helpers
│   ├── listings.ts          # Listing queries
│   ├── offers.ts            # Offer logic
│   ├── payments.ts          # Chapa integration
│   ├── fayda/               # Fayda OIDC verification
│   └── supabase/            # Supabase client
├── supabase/
│   ├── migrations/          # Schema (timestamped SQL)
│   └── seed.sql             # Demo data
└── public/
    └── images/              # Static assets
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
cd web
npm install
```

### Environment Setup

Create `web/.env.local`:

```env
# Hosted Supabase (production)
NEXT_PUBLIC_SUPABASE_URL=https://fqbtbprwruwollkkpbou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_a9DENFjtGXHK1SUVXc1V8Q_ngZ9QN4T
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chapa (test mode)
CHAPA_SECRET_KEY=CHASECK_TEST-QlfU5RsprI3fDoEXy0bJNMSc0vbqJT34
CHAPA_DEMO_FALLBACK=false

# Gemini AI
GEMINI_API_KEY=AQ.Ab8RN6I1xrxfP52YUICTKDA9I3tw6xzy0LsyC2tb6Vp6NHVLeA

# Demo mocks (set false for production)
FAYDA_MOCK=true
PHONE_MOCK=true
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Other Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (server-only) |
| `CHAPA_SECRET_KEY` | Yes | Chapa API key (test or live) |
| `CHAPA_DEMO_FALLBACK` | No | `true` to simulate payments offline |
| `GEMINI_API_KEY` | No | Google Gemini API key (AI features) |
| `FAYDA_MOCK` | No | `true` to use mock Fayda provider |
| `PHONE_MOCK` | No | `true` to skip real SMS OTP |

---

## Database

### Migrations

Schema lives in `supabase/migrations/` (timestamped SQL). Apply with:

```bash
supabase db reset
```

This also runs `supabase/seed.sql` to create demo data.

### Seed Data

~69 Addis Ababa listings across all categories (Electronics, Furniture, Home
Appliances, Vehicles, Fashion, Books, Sports, Baby & Kids, Other). Six
completed transactions with reviews back the sellers' trust scores.

---

## Authentication & Roles

Supabase Auth (email + password) via `@supabase/ssr` cookie sessions.

| Role | Capabilities |
|------|--------------|
| `buyer` | Browse, search, favorite, offer, pay |
| `seller` | All buyer + create listings, receive offers, withdraw |
| `admin` | Moderation queue, reports, verifications, withdrawals |

### Protected Routes

Redirect to `/login` if not authenticated:
- `/profile`, `/dashboard`, `/sell`, `/favorites`, `/offers`

---

## Key User Flows

### Buyer Flow
1. Sign in → Browse/search listings
2. Open listing → Contact seller (Telegram/call)
3. Make offer → Seller accepts
4. Pay with Chapa (test mode) → Confirm receipt → Deal closed

### Seller Flow
1. Sign in → Become seller (one tap from dashboard)
2. Create listing (with optional AI assistant)
3. Receive offers → Accept/decline/counter
4. View earnings → Request withdrawal

### Verification Flow
1. Go to `/profile` → Verification card
2. Phone: Enter number → Enter code `123456` (demo) → Badge earned
3. Fayda: Click "Verify with Fayda" → Mock OIDC consent → Badge earned

### Upgrade Flow
1. Go to `/pricing` → Click "Upgrade to Pro"
2. Chapa hosted checkout (test mode) → Payment form
3. Return to `/pricing?upgrade=ok` → "You're on Pro"

---

## Demo Accounts

All passwords: `demo1234`

| Account | Email | Role | Trust |
|---------|-------|------|-------|
| Admin | `admin@vintch.local` | Admin | — |
| Amira Sellers | `amira.sellers@vintch.local` | Seller (Phone ✓) | 85 |
| Fayad Verified | `fayad.verified@vintch.local` | Seller (Fayda ✓) | 75 |
| Kebede Trader | `kebede.trader@vintch.local` | Seller (plain) | 60 |
| Biniam Buyer | `test@gmail.com` | Buyer | 50 |

> **Note:** The buyer account email is `test@gmail.com` (not `@vintch.local`).

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables (see [Environment Variables](#environment-variables))
3. Deploy — auto-deploys on push to `main`

### Manual

```bash
npm run build
npm run start
```

---

## CI/CD

GitHub Actions (`.github/workflows/`):

- **ci.yml**: Lint, typecheck, test on every PR
- **deploy.yml**: Deploy to Vercel on merge to `main`

---

## Related Documentation

| Document | Description |
|----------|-------------|
| `docs/00-strategy/` | Winning strategy & product vision |
| `docs/01-prd/` | Product requirements |
| `docs/02-architecture/` | System architecture, ADRs, DB schema |
| `docs/03-engineering/` | Engineering standards, deployment, demo script |
| `docs/04-design/` | Design system, components |
| `docs/03-engineering/13-demo-script.md` | 5-minute video walkthrough script |
| `docs/03-engineering/10-submission-readiness.md` | Submission checklist |

---

## License

VinTech Challenge 2026 Submission
