# Critique snapshot — /offers/seller (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/offers/prototype-seller-offers-page.tsx` (+ shared `seller-offer-actions.tsx`)  
> **Status:** fixes applied + committed  
> **Score:** 33/40 — 2 P1 + 2 P2

## Good
- Actions are **live**, not stubs: `SellerOfferActions` posts to the real `offerAction` server action (accept/decline/counter) with `useActionState`, then `revalidatePath("/offers/seller")`.
- Decision-queue layout (thumbnail + blue hero amount + inline actions) is strong.
- Empty + error states both present with a "Go to dashboard" recovery CTA.
- Status colors (`OFFER_STATUS_COLORS`) are palette-locked (amber/blue/green/red/slate) — no off-palette.

## Issues found (4) → fixed
1. **[P1] Open-count pill, variant A** — `bg-muted text-muted-foreground` is sub-AA on a tinted background. → `text-foreground`.
2. **[P1] Empty-state + error "Go to dashboard" CTA** — render height was ~36px (`px-4 py-2`), below the 44px touch floor. → `inline-flex h-11 ...`.
3. **[P2] Row action buttons** (Accept/Decline/Counter/Send counter/Cancel in shared `seller-offer-actions.tsx`) — `h-8` (32px), below spec. → `h-11`.
4. **[P2] Stale comment** ("View-only during review") contradicted the live actions. → corrected.

## Not-fixed (out of scope)
- "View my offers" secondary nav link is `h-7` (28px) — secondary affordance; left as-is to match the codebase's secondary-link precedent.
- No seeded incoming offers for the demo seller in the current DB, so the populated row path (pill + buttons) was verified by code + the parallel reports/notifications live renders of the same `h-11`/`text-foreground` patterns, not a direct populated probe.

## Verify
- `npx eslint` on both files: exit 0; `tsc --noEmit` clean for these files.
- SSR probe `/offers/seller?variant=A` and `=B`: HTTP 200; empty-state CTA renders `inline-flex h-11`.
