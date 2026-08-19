# E2E Functionality Checklist by Role

> **Project:** Used Goods Marketplace — VinTech Challenge 2026
> **Version:** 2.0
> **Owner:** engineering
> **Status:** Executed — 25/25 passing against the remote Supabase project
> (`fqbtbprwruwollkkpbou`) on branch `fm/ui-layout-max-width-fix` (commit `0fb4c77`)

## Scope

Every user-facing flow, grouped by role, with its Playwright spec coverage. The
specs live in `web/tests/e2e/` and run via `web/playwright.config.ts` (system
Chrome, single worker, `globalSetup` warms all routes and resets demo state, so
re-runs are idempotent). Framework: `@playwright/test` (devDependency).

Coverage legend:

- **[x]** — the flow is exercised through the UI; footnotes mark aspects that are
  only asserted shallowly.
- **[ ]** — not fully covered; each is called out inline and summarized under Gaps.

## Test accounts (seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@vintch.local` | `admin1234` |
| Seller (badge: Verified Seller) | `amira.sellers@vintch.local` | `demo1234` |
| Seller (badge: Verified Seller + Fayda) | `fayad.verified@vintch.local` | `demo1234` |
| Seller | `kebede.trader@vintch.local` | `demo1234` |
| Buyer | `biniam.buyer@vintch.local` | `demo1234` |

## Guest / Anonymous

- [x] Browse home: hero, category cards, listing grid (`/`) — *pagination not asserted*
- [x] Search with keyword; filters update the URL (`/search`) — *sort not asserted*
- [x] Read listing detail: title + signed-out CTA routing (`/listings/[id]`) — *gallery/price/trust/similar not asserted*
- [x] Public seller profile reachable from a listing (`/users/[id]`) — *reviews not asserted*
- [x] Static pages (`/about`, `/help`, `/terms`, `/privacy`, `/safety`, `/contact`)
- [x] Interactive CTAs (favorite, offer, contact, report) redirect to `/login?next=…`

## Buyer

- [x] Favorite / unfavorite; manage `/favorites`
- [x] Submit an offer on a listing (`/listings/[id]`) and see it in `/offers`
- [ ] Track own offers + status badges (`/offers`) — *listing appears; badge states not asserted*
- [ ] Respond to a counter-offer (accept / decline) (`/offers`) — **gap**
- [ ] Review an accepted transaction (1–5 stars) (`/offers`) — **gap**
- [ ] Contact seller (Telegram/phone, opt-in respected) (`/listings/[id]`) — **gap** (guest redirect asserted)
- [x] Report a listing; land on `/reports` — *status tracking not asserted*
- [x] Notifications inbox (`/notifications`) — smoke (renders only)
- [x] Profile page: account form + verification card render (`/profile`) — *save / phone-public toggle not asserted*
- [x] Request phone/Fayda verification (`/profile` → VerificationCard) — *T21, read seam stubbed*
- [x] Dashboard buyer view + "Start selling" CTA (`/dashboard`) — *promoteToSeller action not clicked*

## Seller

- [x] Create a listing with photos + publish (`/sell`) — *AI Assist not asserted*
- [x] Edit own listing (`/listings/[id]/edit`)
- [x] Dashboard lists own listings with edit/archive actions (`/dashboard`) — *archive click not asserted*
- [ ] Dashboard listing stats: views, favorites — *controls present; stats not asserted*
- [x] Incoming offers page (`/offers/seller`) — smoke (renders only; accept/decline/counter **gap**)
- [x] No offer/contact/report/favorite CTAs on own listing (ownership guard, INV-005)

## Admin

- [x] KPI dashboard + moderation queue (`/admin`) — smoke (renders)
- [x] User management: suspend / restore controls (`/admin/users`) — smoke
- [x] Listing moderation: remove controls (`/admin/listings`) — smoke
- [x] Report moderation: queue renders (`/admin/reports`) — smoke (actions **gap**)
- [x] Marketplace statistics (`/admin/statistics`) — smoke
- [x] Verification review (`/admin/verifications`) — smoke (*T21, queue stubbed to empty*)
- [x] Admin account settings (`/admin/account`) — smoke
- [ ] Admin sees seller surface (can create/edit listings) — **gap**

## Spec mapping

| Spec | Covers | Status |
|---|---|---|
| `guest.spec.ts` | home, search URL, listing detail + CTA→login, seller profile, static pages | passing |
| `buyer.spec.ts` | favorites, offer, report, profile, notifications, dashboard CTA | passing |
| `seller.spec.ts` | create/edit/dashboard, incoming-offers render, ownership guard, /sell authz | passing |
| `admin.spec.ts` | overview, users, listings, reports, statistics, verifications, account | passing |
| `auth.spec.ts` | login/sign-out round-trip (no reload), password toggle | existing (pre-suite) |

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
- The suite targets the **remote** Supabase project (see `web/.env.local`;
  `SUPABASE_SERVICE_ROLE_KEY` is required for the idempotency cleanup). Run:
  `cd web && npx playwright test` (dev server on `localhost:3000`).

## Gaps (intentionally not covered)

- Counter-offer accept/decline and review-an-accepted-transaction need multi-user
  state (seller counters → buyer accepts) — deferred as high-flake.
- Contact-seller submission and notifications mark-read are render-tested only.
- Profile save / phone-public toggle, archive click, admin moderation actions,
  and the admin seller surface are smoke-tested.
- Pagination and search sort are not asserted on the listing surfaces.
