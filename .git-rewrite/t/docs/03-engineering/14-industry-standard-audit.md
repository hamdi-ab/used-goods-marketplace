# Industry-Standard & Best-Practice Audit

> **Project:** VinTech Challenge 2026
> **Version:** 1.0
> **Owner:** Engineering Team
> **Status:** Report

# 1. Purpose and method

Compare the implemented Used Goods Marketplace against (a) well-known
peer marketplaces — eBay, Vinted, OLX, Facebook Marketplace, Mercari,
Craigslist — and (b) industry best-practice for marketplace products,
then map every gap to a tracker ticket.

Method: three parallel exploration passes produced a complete inventory
of the frontend, the backend/DB/RPCs/RLS, and the PRD/architecture
claims. Each finding is cross-checked against the PRD (FR/FS/IA/DB/API/
SEC) to separate "deviates from this repo's own spec" from "deviates
from industry standard". Findings are prioritized:

- **P0 — Blocks a credible marketplace** (security, missing core loop,
  data the UI shows as real but is fake).
- **P1 — Major gaps / spec deviations** (features peers have, self-contradictions).
- **P2 — Polish & scalability** (niceties, pagination at scale, minor UX).

References use `file:line` against the `web/` tree unless noted (docs
refs are `docs/...`).

# 2. Priority findings

## P0 — must fix for a credible, secure marketplace

| # | Finding | Industry standard | Impact | Fix (summary) | Files |
|---|---|---|---|---|---|
| 1 | **No "become a seller" path.** `requireSeller()` redirects non-sellers to `/profile` with a `// future prompt` comment (`lib/auth.ts:51-55`). Sellers exist only via DB seed. | Every marketplace lets you switch to sell mode instantly; selling is the core loop. | Users cannot list anything. MVP scope is hollow. | Add a `promoteToSeller` action + "Start selling" CTA in dashboard/onboarding; set `role='seller'` via an RPC with an idempotency guard. | `lib/auth.ts:51`, `app/(site)/dashboard/page.tsx:70` |
| 2 | **Notifications feature is entirely absent.** PRD claims it (`docs/01-prd/04-functional-requirements.md:366-372`), DB spec has a `notifications` table (`docs/02-architecture/03-database-design-specification.md:248-258`), API spec lists endpoints (`docs/02-architecture/04-api-specification.md:460-474`). **No migration, no lib, no UI.** Only the dashboard open-offer badge exists. | In-app toasts + a notifications inbox for offer received/accepted, listing sold, reviews. Universal on peers. | Traders get no signal; dashboard badge is the only alert. | Create `notifications` table + `create_notifications` trigger on offers/reviews/reports; add a `useNotifications` hook + toast layer + unread badge + inbox page. |
| 3 | **`record_verification` RPC is unreachable.** Defined in `20260814000000_create_verifications.sql:104-169` but no server action or page calls it. Verification badges (`phone_verified`, `fayda_verified`) can never be set via the app. | eBay/Vinted let users request + admins verify identity; badges mean something only if settable. | Trust surface is cosmetic. PRD FR:380-386 (admin verification review) is unimplemented. | Add `adminVerifications` action + admin verifications page; expose a self-serve verification request UI. |
| 4 | **`view_count` is never incremented.** Column seeded `0`; no read or write path updates it (`20260812200000_create_listings.sql:36`; shown in `lib/listings/constants.ts:128`, `components/dashboard/listing-manager.tsx:56`). | eBay/Vinted show real view counts. | Dashboard "Views" stat is always 0 — fake metric. | Increment via an RPC triggered on listing-detail view (fire-and-forget, batched, idempotent). |
| 5 | **AI action has no auth guard, no file validation.** `generateListingSuggestionsAction` (`app/actions/ai.ts:26-63`) runs with no `requireSeller`/`requireUser`, forwards files to Gemini trusting `file.type`, and only a per-process 10/min in-memory limiter (`lib/ai/listings.ts:24-40`) stands between an anon caller and Gemini quota. | Every marketplace that uses AI gates it and validates uploads server-side. | Anonymous quota abuse; magic-byte gap lets a renamed executable through. | Require auth (trader), add magic-byte + type + size validation before forwarding, move the limiter to a shared store. |
| 6 | **Profiles RLS leaks `phone` to anonymous.** The T03 policy grants `anon SELECT ... using (true)` on all columns (`20260812120000_profile_phone_public.sql:18-21`; `grant select on public.profiles to anon` at `20260812000000_create_profiles.sql:120`). Postgres has no column-level RLS; phone is only hidden in the data-access layer. | Phone privacy is a column-level concern; peers return only public fields by default. | A direct PostgREST/anon call reads any user's phone regardless of `phone_public` — privacy breach vs `docs/02-architecture/07-security-architecture.md:343-354`. | Replace the blanket `SELECT ... using (true)` with per-field masking or a `profiles_public` view exposing only name/avatar/city/trust, and revoke anon SELECT on `phone`. |

## P1 — major gaps / deviations from peers and from this repo's own spec

| # | Finding | Peer norm | Impact | Fix | Files |
|---|---|---|---|---|---|
| 7 | **No offer expiry.** DB enum is `pending/countered/accepted/declined` (`20260813110000_create_offers.sql:24`); PRD says statuses include `Expired` (`docs/01-prd/04-functional-requirements.md:303-307`). Pending offers never time out. | eBay best-offer / Vinted expire offers after a few days. | A buyer's stale offer can hold a listing hostage forever. | Add `expires_at` to offers + a `cancel_expired_offers` job (cron), transition `pending`→`expired`, surface expiry in buyer/seller flows. |
| 8 | **Sold listings vanish from browse.** App filters `status='published'` only (`web/lib/listings.ts:204`); PRD BR-003 says "sold listings visible but no new offers" (`docs/01-prd/06-feature-specifications.md:380-381`). | eBay keeps sold listings visible with a ribbon ("Sold"); Vinted greys them. | Contradicts repo's own spec + loses price-comparison signal peers provide. | Keep `sold` listings readable + add a Sold ribbon; allow offers only on `published`. |
| 9 | **Owner actions missing on listing detail.** Owner sees "Contact seller" and "Report listing" on their own page; `FavoriteButton` lets you favorite your own listing (no `isOwner` guard) (`app/(site)/listings/[id]/page.tsx:140-145,211`; `components/favorites/favorite-button.tsx`). The *offer* button correctly guards. | You never see Buy/Report on your own item. | Confusing + risky (self-contact, self-favorite, self-report) — eBay/Vinted hide all buy-side CTAs for the owner. | Pass `isOwner` to Contact/Favorite/Report; hide self-report (`report-button.tsx`). |
| 10 | **No similar / "seller's other listings".** Listing detail has none; PRD IA lists "similar" as a page section (`docs/01-prd/08-information-architecture.md:416-430`) and FS mentions it. | Standard on every product page (eBay "More from this seller", Vinted "Similar items"). | Misses discovery + cross-sell. | Add a `listings_similar` RPC (same category, price band, same seller) + a "similar" block on the detail page. |
| 11 | **No image lightbox / zoom.** Static thumbnails only (`app/(site)/listings/[id]/page.tsx:85-101`). | Click-to-enlarge gallery is baseline on peers. | Weak photo inspection → lower conversion. | Wrap thumbnails in a lightbox (Next/Image + dialog). |
| 12 | **Search is form-submit only, no autocomplete/debounce; missing "verified seller" filter; free-text city.** PRD claims a verified-seller filter (`docs/01-prd/06-feature-specifications.md:324-331`) and `?page=limit` pagination (`docs/02-architecture/04-api-specification.md:532-551`); implementation uses 1000-row `offset` + free-text city + apply-on-submit (`app/(site)/search/page.tsx`, `components/search/search-filters.tsx:136-144`). | Etsy/OLX offer facet counts + autocomplete; Vinted uses known-city select. | Inconsistent city data; worse discovery; contradicts PRD. | Switch city to a known list/select; add verified-seller facet; debounce search to URL with a loading state. |
| 13 | **No "My reports" page.** `fetchMyReports` exists (`web/lib/reports.ts:94-114`) but no route imports it; the report dialog only shows a local "received" ack. | Vinted/eBay let you see report status. | Reporters can't track reports → trust gap. | Add `/reports` for the current user showing own reports + status. |
| 14 | **No pagination on offers, favorites, reviews, admin lists, dashboard manager.** All full-table fetches (`app/(site)/offers/page.tsx:26`, `app/(site)/offers/seller/page.tsx:24`, `app/(site)/favorites/page.tsx:39`, `users/[id]/page.tsx:186-215`, admin pages; `lib/pagination.ts` `MAX_PAGING_OFFSET=1000`). | Peers paginate with page numbers + totals. | NFR-PERF-002 scale envelope (500 concurrent / 50k listings) breaks under load. | Standard `limit/offset` (or cursor) + "Load more"/numbered pages for these surfaces. |
| 15 | **Profile completion % is never recomputed.** Set to 100 at onboarding (`app/actions/profile.ts:completeProfile`); column never updated after. PRD computes it from fields (`docs/01-prd/04-functional-requirements.md:112-122`). | Completion is a live progress signal. | Shows a meaningless "100%" once onboarding. | Compute from populated fields in the profile fetch/return; display a progress bar. |
| 16 | **Trust-score formula deviates from PRD.** PRD: derived from profile completion + successful listings + ratings + reports + verification (`docs/01-prd/04-functional-requirements.md:140-147`). Impl: only `round(avg(rating)*20)` + +10/+20 verification bumps in `submit_review` (`20260813120000_create_reviews.sql:93-106`). | Multi-signal trust is standard (eBay feedback score, Vinted badges). | Trust is under-specified vs PRD; easy to game. | Implement the documented composite; keep the DB recompute on review/offer-sold. |
| 17 | **`submitReportSchema` allows both targets; DB requires exactly-one.** Zod `submitReportSchema` does at-least-one (`app/actions/reports.ts:28-35`); the RPC + `reports_target_one` constraint require exactly-one (`20260813130000_create_reports.sql:107`). | Validation should match the store. | A caller sending both ids passes zod then fails in SQL with a generic message. | Tighten the schema to XOR via `.refine`, or normalize at action level. |
| 18 | **No global/anonymous rate limiting.** Only offers(10), reports(5), contact(20), AI(10/min) are limited (`docs/02-architecture/04-api-specification.md:604-622` claims anon 100/hr, auth 1000/hr). | Industry applies global caps to stop abuse/scraping. | Listing create/update, favorites, reviews, profile updates rate-unlimited. | Add a global token-bucket (`rate_limit` table) for anon vs auth. |
| 19 | **Admin can only suspend, never restore; and sellers can never be re-promoted.** `adminSuspendUser` demotes to buyer (`lib/admin.ts:214-233`); no promote path exists; combined with #1, a demoted seller can never list again. | eBay/Vinted admin panels restore accounts. | One-way moderation + locked-out sellers. | Add `adminRestoreUser` (and the seller-promotion action from #1) + restore UI. |

## P2 — polish, scalability, minor UX

| # | Finding | Why it matters | Fix | Files |
|---|---|---|---|---|
| 20 | No **toasts** — all success/error is inline text. | Async ops (offer sent, profile saved) deserve non-blocking feedback. | Add `sonner` + a few `toast.success/error` calls. |
| 21 | No **breadcrumbs**; PRD IA claims them (`docs/01-prd/08-information-architecture.md:326-358`). | Deep listing pages lose context. | Add breadcrumb component on detail/edit. |
| 22 | No **"posted X ago"** / listing date on the detail page. | Buyers gauge freshness. | Render `timeago(published_at)`. |
| 23 | Category tiles use first-letter icons only; no category images. (PRD IA implies sub-categories exist; schema has `parent_id`.) | Weaker category browsing than peers. | Add category images + sub-category expansion. |
| 24 | Admin pages `users`/`listings`/`statistics`/`account` have **no `loading.tsx`**; only `admin/reports` does. | Jarring loading states in the console. | Add skeleton loaders. |
| 25 | No **offer history** per listing / no **buyer retract**. | Offer UX is single-shot. | Low; leave to future if offers stay simple. |
| 26 | No **review edit grace period**; DB spec marks it optional. | Minor. | Leave optional per PRD. |
| 27 | Contact dialog shows "Loading contact options…" for the **null** (failure/missing) state as well. | Misleading spinner forever on errors. | Distinguish loading vs empty vs error. | `components/contact/contact-dialog.tsx:110-113` |
| 28 | `fetchListing` does 4 sequential round-trips instead of a join. | Latency. | Single joined query / prefetch. | `lib/listings.ts:68-118` |

# 3. UI / UX audit (secondary)

Against peers and the repo UX guidelines (`docs/04-design/07-ux-guidelines.md`):

- **Listing detail action row is correct** (heart, report, offer, contact) but **owner-context is wrong** (#9) — the owner gets buy-side CTAs.
- **Seller trust card placement** is good (top of detail sidebar), but the **trust panel on the listing detail diverges from PRD IA:416-430** which orders: images → price → title → condition → **trust panel** → description → details → location → similar. We have: images, price, condition, CTAs, then description, then seller card (trust is after contact). Minor reorder vs spec.
- **Empty states** are handled consistently (home, search, favorites, offers, dashboard, admin, reviews, contact, trust badges, auth confirmations) — good parity with `docs/01-prd/06-feature-specifications.md` empty-state requirements.
- **Search filters are not debounced/live** — peers update results as you type or on every facet tick with instant URL sync. We apply on submit only.
- **No focus-trap / escape issues** were introduced in the recent reporting redesign; report/seller flows are contextually placed now.
- **Skeletons exist** for site pages but are inconsistent in the admin console (see P2 #24) and use default shadcn skeletons rather than content-shaped ones on a couple pages — minor polish.

# 4. Ticket mapping

Each P0–P2 finding above is a candidate ticket. The recommended order:

1. **#5 P0** AI auth + upload validation (security)
2. **#6 P0** Profiles anon phone leak (security/privacy)
3. **#1 P0** Become-a-seller path (core loop)
4. **#2 P0** Notifications system (core loop)
5. **#3 P0** Verification workflow reachable (trust)
6. **#4 P0** Real view counts
7. **#7 P1** Offer expiry
8. **#8 P1** Sold listings visible w/ ribbon
9. **#9 P1** Owner CTA guards
10. **#10 P1** Similar + seller's listings
11. **#11 P1** Image lightbox
12. **#12 P1** Search autocomplete/debounce + verified filter + known cities
13. **#13 P1** My-reports page
14. **#14 P1** Pagination on list surfaces
15. **#17/#18 P1** report schema XOR + global rate limits

# 5. Non-conformities vs declared scope

The PRD `Out of scope` items (OV:122-136) — live chat, escrow, delivery, wallet, auctions, storefronts, mobile apps, Fayda, recs — are correctly **not** implemented. The deviations here are for features the PRD *does* claim in scope (notifications, verification review, offer expiry, sold-listing visibility, verified-seller filter, profile completion). These are the priority.

# 6. Status

The app is functionally coherent and well-structured, but it is missing the two highest-leverage marketplace surfaces — **a way to become a seller** and **notifications** — and exposes phone data by accident. Everything below P0 is polish by comparison.
