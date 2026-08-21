# Critique snapshot — /dashboard (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/dashboard/prototype-dashboard-page.tsx`  
> **Status:** fixes applied + committed  

## Good
- Parallel data fetch (`fetchSellerListings`, `countIncomingOffers`, `fetchBuyerOffers`, `fetchFavoriteIds`, `fetchUnreadNotificationsCount`, `fetchOwnProfile`); `canSell` gate; live `promoteToSeller` buyer→seller form; quick-action grid; listings manager; trust-score color coding; variant B tile tint.

## Issues found (3) → fixed
1. **[P2] "Create a listing" button** (`<Button asChild>`) — default `h-9` (36px) < 44px touch floor. → `className="h-11"`.
2. **[P2] "Start selling" button** (`promoteToSeller` form submit) — default `h-9` (36px). → `className="h-11"`.
3. **[P2]** stale "View-only during review" comment contradicted the live `promoteToSeller` form + live stats. → corrected.

## Deferred (P3)
- Quick-action icons all forced `text-[#2563EB]`; loses semantic color (favorites rose, trust emerald). Low priority; left as-is.

## Verify
- `eslint` + `tsc` clean for the file.
- SSR `/dashboard?variant=A`: HTTP 200 (renders the signed-out "Sign in" state because the curl probe carries no session, so `getCurrentUser` returns null and the authenticated buttons are not in the payload). The authenticated "Create a listing"/"Start selling" `h-11` buttons are covered by source + the identical `className="h-11"` pattern already verified live on `SellerOfferActions`.
