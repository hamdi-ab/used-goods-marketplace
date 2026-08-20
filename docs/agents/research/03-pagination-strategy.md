# Pagination Strategy — Offset vs Keyset for Marketplace List Surfaces

> **Project:** Used Goods Marketplace (VinTech Challenge 2026)
> **Version:** 1.0
> **Owner:** Research (wayfinder #89, parent #87 — resolves #90)
> **Status:** Recommended — keyset cursor for personal feeds; offset+count retained for browse/search and admin

## 1. NFR Context

| NFR | Target | Pagination implication |
|-----|--------|----------------------|
| NFR-SCALE-001 | 50,000 listings, 500 concurrent | Deep paging must stay sub-500 ms (NFR-PERF-002); OFFSET scan + exact COUNT(*) become O(N) |
| NFR-SCALE-002 | Database tables shall support pagination | Already true for browse/search (capped at 1000 rows — see §3.3); absent on five other surfaces |
| NFR-PERF-002 | Search returns within 500 ms | Browse/search offset is fine *within the cap*; personal feeds must avoid full-table scans |

## 2. Offset vs Keyset — Tradeoffs

| Dimension | Offset (`OFFSET n LIMIT m` / `.range()`) | Keyset / Cursor (`WHERE (col, id) > (last_val, last_id)`) |
|-----------|-------------------------------------------|-----------------------------------------------------------|
| **Query cost** | O(n + m) — Postgres must walk/skip *n* rows before returning *m* | O(m log N) — a single index seek on the cursor position |
| **Count / totals** | Can be paired with `COUNT(*)` (exact) or `COUNT(*) OVER()` (inline) | No count — `hasMore` derived from "page size + 1" probe |
| **Random page access** | Yes — user can jump to page 42 | No — strictly forward/backward traversal |
| **Totals accuracy** | Exact count is O(N); `planned`/`estimated` count is fast but approximate (PostgREST docs) | Totals are inherently approximate or omitted — no exact count by design |
| **Concurrent-write stability** | Rows shift as new items insert; page boundaries move; users can see duplicates or gaps | Cursor is stable — anchored on a unique tie-break column (`id`), so inserts before the cursor never shift the window |
| **Implementation complexity** | Trivial — one numeric param + one count query | Moderate — cursor token encodes the last sort key + id; decode on the server |
| **Supabase/PostgREST idiom** | `.range(start, end)` with `{ count: "exact" }` or `Prefer: count=exact` | `.gt("created_at", lastTs).or("and(created_at.eq.lastTs,id.gt.lastId)").order(...).limit(n+1)` |

**Source — PostgREST pagination docs** (`postgrest.org/en/stable/references/api/pagination_count.html`): *"Note that the larger the table the slower this query runs in the database"* (exact count). The `.range()` method maps to the HTTP Range header (`Range: 0-19`), which PostgREST translates to `OFFSET 0 LIMIT 20`. For counts, `count=exact` does a full sequential scan; `count=planned` uses Postgres statistics (fast, near-exact); `count=estimated` falls back to exact below a threshold.

## 3. Current State in the Codebase

### 3.1 Browse + Search — *offset, capped 1000*

`web/lib/listings.ts:165` (`fetchListings`) and `web/lib/listings.ts:254` (`searchListings`) already use offset-based pagination:

- `PAGE_SIZE = 12`, `BROWSE_LIMIT_MAX = 1000` (`web/lib/listings/constants.ts:130-134`)
- `parseOffset()` clamps to `MAX_PAGING_OFFSET = BROWSE_LIMIT_MAX - PAGE_SIZE = 988` (`web/lib/pagination.ts:7,15-20`)
- `fetchListings` uses PostgREST `.range(offset, offset + limit - 1)` with `{ count: "exact" }`
- `searchListings` delegates to the `search_listings` RPC, which clamps `v_limit`/`v_offset` to 1000 and returns `total_count` via `COUNT(*) OVER()` (migration `web/supabase/migrations/20260813000000_search_listings_rpc.sql:66-67,92`)
- `hasMore` is derived as `offset + listings.length < count && offset + listings.length < BROWSE_LIMIT_MAX`
- UI: "Load more" link (`web/app/(site)/page.tsx:180`, `web/app/(site)/search/page.tsx:115`)

**The 1000-row cap is a deliberate stopgap** (T05/T06): it guarantees the OFFSET scan never walks past row 1000, keeping browse/search within NFR-PERF-002. Beyond ~83 pages (1000/12) the "Load more" link disappears and results are silently truncated. This satisfies the 50k-listing NFR-SCALE-001 target *only up to the cap* — the architecture scales to 50k rows but the UI never exposes past 1000.

### 3.2 Offers / Favorites / Reviews / Admin / Dashboard — *no pagination*

| Surface | Fetch function | Lines | Query | Count? | UI |
|---------|---------------|-------|-------|--------|-----|
| Buyer offers | `fetchBuyerOffers` | `web/lib/offers.ts:87` | `.from("offers").select(…).eq("buyer_id", userId).order("created_at", desc)` | No | Full list — `web/app/(site)/offers/page.tsx:26` |
| Seller offers | `fetchSellerOffers` | `web/lib/offers.ts:126` | Same, `.eq("listing.seller_id", userId)` | No | Full list — `web/app/(site)/offers/seller/page.tsx:24` |
| Favorites | `fetchFavoriteListings` | `web/lib/favorites.ts:34` | `.from("favorites").select(…).eq("user_id", userId).order("created_at", desc)` | No | Full list — `web/app/(site)/favorites/page.tsx:14` |
| Reviews | `fetchSellerReviews` | `web/lib/reviews.ts:46` | `.from("reviews").select(…).eq("seller_id", sellerId).order("created_at", desc)` | No | Full list — `users/[id]/page.tsx:186-215` |
| Admin users | `fetchAdminUsers` | `web/lib/admin.ts:67` | `.from("profiles").select(…).is("deleted_at", null).order("created_at", desc)` | No | Full list — `web/app/admin/users/page.tsx:14` |
| Admin listings | `fetchAdminListings` | `web/lib/admin.ts:85` | `.from("listings").select(…).is("deleted_at", null).order("created_at", desc)` | No | Full list — `web/app/admin/listings/page.tsx:14` |
| Admin reports | `fetchAdminReports` | `web/lib/reports.ts:120` | `.from("reports").select(…).in("status", OPEN).order("created_at", asc)` | No | Full list — `web/app/admin/reports/page.tsx:16` |
| Dashboard list | `fetchSellerListings` | `web/lib/listings.ts:134` | `.from("listings").select(…).eq("seller_id", sellerId).order("created_at", desc)` | No | Full list — `web/app/(site)/dashboard/page.tsx:25` → `<ListingManager>` |

Every one of these does a **full-table-per-user** fetch with no `limit()` / `range()` at all. Under NFR-SCALE-001 (50k listings, 500 concurrent), a popular seller with 200 offers, 500 favorites, or 50 reviews will scan and transfer hundreds of rows per request — well outside NFR-PERF-002's 500 ms envelope. This is audit finding #14 (`docs/03-engineering/14-industry-standard-audit.md:53`): *"No pagination on offers, favorites, reviews, admin lists, dashboard manager."*

## 4. Deep-Offset Cost at Scale

PostgreSQL's `OFFSET N` does not seek — it materialises and walks past N rows, discarding them. At 50k listings:

| Page | Offset | Cost vs. keyset |
|------|--------|-----------------|
| 1 | 0 | Identical |
| 50 | 588 | Negligible (still within the 1000 cap) |
| 200 | 2388 | OFFSET is O(n) — Postgres reads 2400 rows to return 12 |
| 400 | 4788 | Offset scans 400× more rows than it returns |

This is why the codebase imposed the 1000-row ceiling: it is a hard guard against the deep-OFFSET anti-pattern. The cap works, but it makes browse/search non-navigable past ~83 pages. For the personal feeds (offers, favorites, reviews) there is **no cap today** — they will hit this wall sooner, at a lower offset, because they are scoped to a single user and return wider joined rows (listing + seller + images).

The PostgREST docs confirm: exact `COUNT(*)` is "the larger the table the slower this query runs." Keyset pagination sidesteps both costs — no OFFSET scan, no exact count.

## 5. Peer Norms

From `docs/03-engineering/14-industry-standard-audit.md:51-53` (synthesising eBay, Vinted, Etsy, OLX):

| Surface | Peer pattern | Totals? | Notes |
|---------|-------------|---------|-------|
| Browse / Search (public) | Numbered pagination | Yes — "X results, page 1 of N" | eBay: numbered pages + total; Vinted: numbered + total; Etsy/OLX: facet counts + autocomplete on filters |
| My Offers / Purchases | Infinite scroll or "Load more" | No | Transaction history; users scroll backward, rarely jump to a page number |
| Favorites / Saved items | Infinite scroll / "Load more" | No | Personal collection; no need for page math |
| Reviews (seller profile) | "Load more" or numbered, depending on volume | Rarely — shows "X reviews" as a static count, not per-page totals | eBay shows a "Top positive review" + "See all N reviews"; Vinted numbers but totals are small |
| Admin user/listings/reports | Numbered pagination + totals | Yes | Moderation needs to estimate queue size and jump to a page |

**Key insight:** public browse/search and admin surfaces show totals + page numbers; personal/transactional feeds (offers, favorites, reviews) use "Load more" or infinite scroll with no per-page totals. This maps cleanly onto the offset-vs-keyset matrix in §2.

## 6. Recommended Strategy — Per Surface

| Surface | Strategy | Sort key | Why |
|---------|----------|----------|-----|
| **Browse (homepage)** | **Offset + exact count** (keep as-is, remove 1000 cap later) | `published_at DESC, id DESC` | Public, peers expect page numbers + totals, filters change sort key → offset is the only shape that supports arbitrary page jumps. Count is cheap because the window is small (12 rows) and `COUNT(*) OVER()` is already inlined in the RPC. |
| **Search** | **Offset + exact count** (keep as-is) | Sortable: `published_at / price / id` | Same as browse: users filter + sort + expect "X results" + page numbers. The `search_listings` RPC already returns `total_count` per row. |
| **Buyer offers** | **Keyset cursor** | `created_at DESC, id DESC` | Personal feed; no totals needed; new offers arrive constantly → keyset prevents row-shifting/duplicate pages. |
| **Seller offers** | **Keyset cursor** | `created_at DESC, id DESC` | Same as buyer offers; high write churn. |
| **Favorites** | **Keyset cursor** | `favorites.created_at DESC, id DESC` | Personal collection; no totals needed; stable ordering by the favorite's own timestamp. |
| **Reviews** | **Keyset cursor** | `created_at DESC, id DESC` | Public but append-only; no per-page totals; the aggregate rating is computed separately (`summarizeRating`, `web/lib/reviews.ts:74`). |
| **Dashboard listing manager** | **Keyset cursor** | `created_at DESC, id DESC` | Personal; no totals; establishes the same cursor pattern as offers/favorites/reviews. |
| **Admin users** | **Offset + exact count** | `created_at DESC, id DESC` | Admin needs queue size + page numbers; write rate is low (one `INSERT` per signup); dataset is bounded by user count (NFR-SCALE-001: 10k users). |
| **Admin listings** | **Offset + exact count** | `created_at DESC, id DESC` | Admin needs totals + page jumps; read-only under RLS. |
| **Admin reports** | **Offset + exact count** | `created_at ASC, id ASC` | Moderation queue — admins may page through to estimate backlog; ordered oldest-first. |

### 6.1 Why keyset where totals aren't needed

The personal feeds (offers, favorites, reviews, dashboard) share three traits: (1) scoped to one user via RLS, (2) no UI showing "page N of M" or a result count, (3) frequent inserts at the top of the list (new offers, new favorites, new reviews). Offset's weaknesses — O(n) deep scan and write-induced row shifting — hit exactly these surfaces hardest, and offset's strengths — random page access and totals — are unused. Keyset delivers O(log N) seeks, stable pages under concurrent writes, and no count query. It is the strict Pareto-superior choice.

### 6.2 Why offset where totals are needed

Browse, search, and admin all expose (or peers expose) a total result count and/or numbered page controls. Keyset pagination cannot answer "how many pages are there?" without a separate `COUNT(*)` — which is the exact expensive query keyset was meant to avoid. On browse/search the count is already wired (RPC `total_count` column, PostgREST `count: "exact"`); on admin it is a one-time `COUNT(*)` over ≤10k rows — cheap. Offset keeps the UX (page numbers, "showing 1-12 of 487") that peers and admins both expect. The deep-offset risk only materialises past ~500+ pages; for browse/search the 1000-row cap (or a higher Supabase-safe ceiling) contains it, and for admin the dataset is small by definition.

## 7. Recommended First Surface

> **Paginate the dashboard listing manager (`web/lib/listings.ts:134` → `web/app/(site)/dashboard/page.tsx`) first, using keyset cursor.**

**Rationale:**

1. **Lowest-risk, highest-reuse implementation.** `fetchSellerListings` is a server-rendered data fetch consumed by a single component (`<ListingManager>` at `web/components/dashboard/listing-manager.tsx:98`). Adding `limit`/`cursor` params and a "Load more" button touches one seam and one page — no shared component or URL-contract changes. The same `fetchX(scopeId, { limit, cursor })` shape then ports directly to `fetchSellerOffers`, `fetchBuyerOffers`, `fetchFavoriteListings`, and `fetchSellerReviews`.

2. **Keyset is a perfect fit.** Listings are ordered `created_at DESC` with no total shown. A seller's listing set is append-slow (a handful of new listings per week) and never gets the write-churn that makes offset unstable on offers/favorites/reviews — so even if we shipped offset here, we'd immediately have to rewrite it when porting the pattern. Starting with keyset avoids the rework.

3. **RLS-scope = single-user dataset.** `fetchSellerListings` filters `.eq("seller_id", userId)` — each seller's listing set is small (bounded by how many items they list, not the 50k marketplace total). Deep-offset is never a concern; the keyset cursor is purely about correctness under concurrent listing creation, not performance.

4. **User value.** The dashboard is where sellers spend their time. Paginating "Your listings" before the public feeds prevents the classic "seller with 100+ listings sees a 30-second page load" failure at NFR-SCALE-001 volume.

5. **Establishes the cursor contract.** Once `parseCursor` + `buildCursorUrl` + "Load more" exist on the dashboard, they become copy-paste patterns for the four remaining personal feeds. The harder part (cursor token design, URL shape, UI component) is solved once.

**Implementation sketch (no code — outline only):**

- `lib/pagination.ts`: add `parseCursor(raw, sortCol, lastSortVal?, lastId?)` and `buildCursor(sortVal, id)` that encode `(created_at, id)` into an opaque base64 token.
- `lib/listings.ts:134` (`fetchSellerListings`): accept `{ limit?: number; cursor?: string }`; decode cursor to `WHERE (created_at, id) < (last_created_at, last_id)` with `ORDER BY created_at DESC, id DESC LIMIT (limit + 1)`; return `hasMore = rows.length > limit`.
- `web/app/(site)/dashboard/page.tsx`: read `cursor` from search params, pass to `fetchSellerListings`, render "Load more" link with `nextCursor`.

## 8. Cross-References

| Artifact | Location |
|----------|----------|
| NFR scale + perf targets | `docs/01-prd/05-non-functional-requirements.md` — NFR-SCALE-001, NFR-PERF-002 |
| Offset pagination (current) | `web/lib/pagination.ts:7,15-20`; `web/lib/listings.ts:165-225,254-293` |
| Browse/search 1000-row cap rationale | `web/lib/listings/constants.ts:130-134`; `web/lib/pagination.ts:3-7` |
| `search_listings` RPC (offset clamped + `COUNT(*) OVER()`) | `web/supabase/migrations/20260813000000_search_listings_rpc.sql:62-67,92` |
| Full-table fetches (no pagination) — offers | `web/lib/offers.ts:87-120,126-160`; `web/app/(site)/offers/page.tsx:26`; `web/app/(site)/offers/seller/page.tsx:24` |
| Full-table fetches — favorites | `web/lib/favorites.ts:34-66`; `web/app/(site)/favorites/page.tsx:14` |
| Full-table fetches — reviews | `web/lib/reviews.ts:46-70` |
| Full-table fetches — admin | `web/lib/admin.ts:67-109`; `web/lib/reports.ts:120-139` |
| Full-table fetches — dashboard | `web/lib/listings.ts:134-162`; `web/app/(site)/dashboard/page.tsx:25`; `web/components/dashboard/listing-manager.tsx:98-130` |
| Audit finding #14 (pagination gap) | `docs/03-engineering/14-industry-standard-audit.md:53` |
| Peer norms | `docs/03-engineering/14-industry-standard-audit.md:51` (eBay/Vinted numbered + totals; Etsy/OLX facets) |
| API spec (page/limit + totals) | `docs/02-architecture/04-api-specification.md:532-551` |
| Existing test coverage | `docs/03-engineering/01-testing-strategy.md:69` (unit tests on `lib/pagination`, `lib/browse`, `lib/search`) |
| PostgREST offset + count docs | `postgrest.org/en/stable/references/api/pagination_count.html` (fetched) |
| Supabase JS `.range()` maps to PostgREST Range header | Supabase JS client reference (PostgREST under the hood) |

## 9. One-Line Recommendation

**Adopt keyset cursor pagination (on `created_at + id`) for the five personal feeds — offers, favorites, reviews, dashboard — starting with the dashboard listing manager; retain offset + exact count on browse, search, and admin where totals and page-number UX are required.**
