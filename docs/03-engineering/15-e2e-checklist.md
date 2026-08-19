# E2E Functionality Checklist by Role

> **Project:** Used Goods Marketplace — VinTech Challenge 2026
> **Version:** 1.0
> **Owner:** engineering
> **Status:** Draft (specs written; execution gated on local Supabase stack)

## Scope

Every user-facing flow, grouped by role, with its Playwright spec coverage. The
specs live in `web/tests/e2e/` and run via `web/playwright.config.ts` (system
Chrome, auto-start `next dev`, requires the local Supabase stack up with seed
data). Framework: `@playwright/test` (devDependency).

## Test accounts (seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@vintch.local` | `admin1234` |
| Seller (badge: Verified Seller) | `amira.sellers@vintch.local` | `demo1234` |
| Seller (badge: Verified Seller + Fayda) | `fayad.verified@vintch.local` | `demo1234` |
| Seller | `kebede.trader@vintch.local` | `demo1234` |
| Buyer | `biniam.buyer@vintch.local` | `demo1234` |

## Guest / Anonymous

- [ ] Browse home: hero, category cards, listing grid, pagination (`/`)
- [ ] Search with filters + sort (`/search`)
- [ ] Read listing detail: gallery, price, trust panel, similar listings (`/listings/[id]`)
- [ ] Read public seller profile + reviews (`/users/[id]`)
- [ ] Static pages (`/about`, `/help`, `/terms`, `/privacy`, `/safety`, `/contact`)
- [ ] Interactive CTAs (favorite, offer, contact, report) redirect to `/login?next=…`

## Buyer

- [ ] Favorite / unfavorite listings; manage `/favorites`
- [ ] Submit an offer on a listing (`/listings/[id]`)
- [ ] Track own offers + status badges (`/offers`)
- [ ] Respond to a counter-offer (accept / decline) (`/offers`)
- [ ] Review an accepted transaction (1–5 stars) (`/offers`)
- [ ] Contact seller (Telegram/phone, opt-in respected) (`/listings/[id]`, `/users/[id]`)
- [ ] Report a listing or seller; track status in `/reports`
- [ ] Notifications inbox + mark read / mark all read (`/notifications`)
- [ ] Profile management: avatar, city/phone/Telegram/bio, phone-public toggle (`/profile`)
- [ ] Request phone/Fayda verification (`/profile` → VerificationCard) — *T21, read seam stubbed*
- [ ] Dashboard buyer view + "Start selling" CTA (`/dashboard`) — *promoteToSeller stub no-op (T21)*

## Seller

- [ ] Create a listing with photos (1–10) + AI Assist (`/sell`)
- [ ] Edit own listing (`/listings/[id]/edit`)
- [ ] Archive / soft-delete own listing (`/dashboard`)
- [ ] Dashboard listing stats: views, favorites, edit/archive links (`/dashboard`)
- [ ] Incoming offers: accept (marks sold), decline, counter (`/offers/seller`)
- [ ] No offer/contact/report CTAs on own listing (ownership guard)

## Admin

- [ ] Admin KPI dashboard + moderation queue (`/admin`)
- [ ] User management: suspend / restore (`/admin/users`)
- [ ] Listing moderation: remove (`/admin/listings`)
- [ ] Report moderation: remove listing / block seller / reject (`/admin/reports`)
- [ ] Marketplace statistics (`/admin/statistics`)
- [ ] Verification review (`/admin/verifications`) — *T21, queue stubbed to empty*
- [ ] Admin account settings (`/admin/account`)
- [ ] Admin sees seller surface (can create/edit listings)

## Spec mapping

| Spec | Covers | Status |
|---|---|---|
| `auth.spec.ts` | login/sign-out round-trip (no reload), password toggle | existing |
| `guest.spec.ts` | guest browsing, search, listing detail, CTA→login redirects | new |
| `buyer.spec.ts` | favorites, offer, counter response, review, contact, report, profile | new |
| `seller.spec.ts` | create/edit/archive listing, incoming-offer actions, dashboard | new |
| `admin.spec.ts` | admin KPI, users, listings, reports, statistics | new |

## Known gates

- `web/lib/nav.ts` now exports `adminNav`/`adminAccountNav` (was a missing-export
  compile break for the admin shell); `sonner` restored to `web/package.json`
  (removed by in-flight WIP but required by the root layout's `<Toaster>`).
- Remaining typecheck errors are pre-existing and type-only (offers
  `searchParams`, listing `status` on `BrowseListing`, notification-bell `role`,
  `normalizeRole`) — they do not block the Turbopack dev/build.
- Verification seams (`fetchMyVerifications`, `fetchAdminVerifications`,
  `promoteToSeller`) are T21 stubs; verification E2E assertions are limited to
  "renders / not verified yet / all caught up" until the real RPCs land.
- Full suite requires the local Supabase stack up with seed data
  (`npx supabase start` from `web/`, then `npx supabase db reset`). Run:
  `cd web && npx playwright test`.
