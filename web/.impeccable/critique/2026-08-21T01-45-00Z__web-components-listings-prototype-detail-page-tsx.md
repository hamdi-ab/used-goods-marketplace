# Critique snapshot — /listings/[id] (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/listings/prototype-detail-page.tsx` (+ shared `buyer-offer-actions.tsx`)  
> **Status:** fixes applied + committed  

## Good
- Fully real data surface: `fetchListing`, favorite/contact (auth-gated), `SellerTrustRow` with verified badges, `MakeOfferButton` (size=lg, live dialog/offer form), `ContactButton`, `FavoriteButton`, `ReportButton`, `SimilarListings`, sold-state callout, condition chip, blue price box.

## Issues found (3) → fixed
1. **[P1] "Browse listings" not-found CTA** — `px-4 py-2` (~32px) < 44px touch floor. → `h-11 inline-flex` (with focus ring).
2. **[P2] Accept counter / Decline counter** buttons (shared `buyer-offer-actions.tsx`) — default `h-8` (32px). → `h-11`.
3. (no comment to fix here — the page has no "view-only" claim.)

## Deferred (P3)
- `MakeOfferButton` uses `size="lg"` (h-10 = 40px) — the repo's elevated button tier; left as-is.
- Back-link "← Back to listings" is an inline text link (sub-44 but text-link convention).
- Shared `FavoriteButton`/`ReportButton` icon buttons in the trailing row — small shared components, out of cycle scope.

## Verify
- `eslint` clean; `tsc` clean for these files.
- SSR `/listings/<nonexistent-uuid>?variant=A`: HTTP 200; not-found "Browse listings" renders `inline-flex h-11`.
