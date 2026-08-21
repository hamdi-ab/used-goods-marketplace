# Critique snapshot — /users/[id] (seller profile) (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/users/prototype-seller-profile-page.tsx` (+ shared `contact-button.tsx`, `make-offer-button.tsx`)  
> **Status:** fixes applied + committed  

## Good
- Real composite surface: `fetchPublicProfile`, `fetchSellerReviews`/`summarizeRating`, `fetchSellerContactInfo` (auth-gated), `fetchSellerPublicListings`; `ContactButton` + `ReportButton`; review stars + list; `PrototypeListingCard` showcase; "Browse all" filter link; external Telegram link (`rel="noreferrer noopener"` ✓); empty states for bio/reviews; accurate comment.

## Issues found
1. **[P2] "Contact seller" primary CTA** — shared `ContactButton` used `size="lg"` (h-10 = 40px), just under the 44px floor for a *primary conversion* control. → `className="h-11"` (also fixes `MakeOfferButton`, which is the same tier on the listing detail page).

## Verify
- `eslint` clean; `tsc` clean for `contact-button.tsx`, `make-offer-button.tsx`, `prototype-seller-profile-page.tsx`.
- SSR `/users/<nonexistent>?variant=A|B`: both HTTP 200; "Profile not found" renders (route compiles with the shared-component edits). The populated identity tile + Contact CTA render only with a public-profile row + session — covered by the corrected `className="h-11"` on the shared `ContactButton`, which already ships on the listing-detail page (same component).
