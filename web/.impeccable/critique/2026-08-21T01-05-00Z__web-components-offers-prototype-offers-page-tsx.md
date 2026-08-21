# Critique snapshot — /offers (buyer) (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/offers/prototype-offers-page.tsx` (+ shared `buyer-offer-actions.tsx`)  
> **Status:** fixes applied + committed  

## Good
- Actions are **live**: `BuyerOfferActions` → real `offerAction` (accept/decline counter); `fetchBuyerOffers`; `ReviewForm` on accepted offers; load-more; empty + error states; variant tinting consistent with seller offers.

## Issues found (4) → fixed
1. **[P1] "Retry" CTA** (error state) → `px-4 py-2` (~36px) below 44px floor → `h-11 inline-flex`.
2. **[P1] "Browse listings" CTA** (empty state) → same fix.
3. **[P2] Accept counter / Decline counter** buttons (shared `buyer-offer-actions.tsx`) → `h-8` (32px) → `h-11`.
4. **[P2]** stale "view-only during review" comment contradicted the live actions → corrected.

## Verify
- `eslint` + `tsc` clean for both files.
- SSR probe `/offers?variant=A|B`: HTTP 200; empty-state "Browse listings" renders `inline-flex h-11`.
- Buyer row buttons (`h-11`) verified by source + class-merge; no offers seeded for the demo buyer so the populated path is covered by the same shared-component verification as the seller side.
