# Monetization Demo Transparency

> **Project:** Used Goods Marketplace (VinTech 2026)
> **Version:** 1.0
> **Owner:** Product & Engineering
> **Status:** Accepted

This document records the gap between the in-demo monetization surfaces and industry-standard production implementations. Judges and stakeholders should read it alongside `docs/01-prd/04-functional-requirements.md` (the deal loop) and `docs/02-architecture/01-architecture-decision-records.md` (ADR-021).

## The framing

The VinTech brief lists payments as a *plus*, not a requirement. We made the core deal loop (offer → accept → sold → direct contact) work without payment rails (ADR-021). The monetization surfaces that *do* appear in the demo — listing boost, AI credits, and the Pro tier — are intentionally labelled **demo** wherever their backing data is simulated. The integration seam is real (Chapa sandbox test mode); the analytics and recurring-billing infrastructure are what production adds.

## What's real vs simulated

### Listing boost (T29)

| Layer | Demo state | Production (industry standard) |
|-------|------------|-------------------------------|
| **Payment** | Off-platform hand-wave ("paid off-platform" tooltip) | In-platform wallet or direct Chapa charge; auto-deducted on activation |
| **Duration** | Flat window (3 days / 7 days) set by preset | Seller-chosen window or daily budget |
| **Analytics** | Mock numbers shown with `(demo)` badge: views, clicks, inquiries derived deterministically from the listing id | Real impression / click / attributed-sale counters surfaced in the dashboard |
| **Budget control** | None | Seller sets a max spend; boost pauses at cap |
| **Reporting** | None | Seller sees ROI per boost, conversion rate, time-on-surface |

### Pro tier upgrade (T27)

| Layer | Demo state | Production (industry standard) |
|-------|------------|-------------------------------|
| **Payment** | Chapa sandbox test transaction via `submitUpgradeIntent` → `/upgrade/callback` → `apply_upgrade` RPC | Recurring Chapa plan; prorated billing |
| **Tier mutation** | Real — `profiles.tier` flips `free → pro` when the callback verifies the tx_ref and the `apply_upgrade` RPC marks the row consumed | Same RPC, backed by real money movement |
| **Feature gating** | Real — quota enforcement (`enforceListingCap`, `countAiGenerationsThisMonth`) reads `profiles.tier` | Same |
| **Grace period** | None — tier flips immediately and stays | 7-14 day grace on expiry; soft feature gate before hard cut |
| **Self-serve downgrade** | Not exposed | Seller can downgrade; billing stops next cycle |
| **Receipt / invoice** | Not generated | Tax-compliant receipt on each billing cycle |

### AI credits (T25 / T28)

| Layer | Demo state | Production (industry standard) |
|-------|------------|-------------------------------|
| **Quota enforcement** | Real — `countAiGenerationsThisMonth` in `lib/ai/quota.ts` | Same |
| **Usage display** | Real — `/dashboard` account-usage card shows `X / limit` | Same |
| **Rollover / expiry** | None — hard monthly reset | Rollover policy (e.g. unused credits bank up to 2 months) |
| **Overage** | Hard cap — generate button disabled at limit | Seller can buy a top-up pack or pay per-call |
| **AI backend** | Demo flag `FAYDA_MOCK=true` swaps the model; suggestions are real Gemini output in dev | Production Gemini key with paid fallback |

## Offer system (T08) — Industry parity

The offer system is the core transaction flow of a P2P marketplace. Our implementation matches industry-standard negotiation:

| Feature | eBay | FB Marketplace | Ours | Status |
|---------|------|----------------|------|--------|
| Make offer | ✅ | ✅ | ✅ | ✅ |
| Include message | ✅ | ✅ | ✅ | ✅ |
| Seller accepts | ✅ | ✅ | ✅ | ✅ |
| Seller declines | ✅ | ✅ | ✅ | ✅ |
| Seller counters (with message) | ✅ | ✅ | ✅ | ✅ |
| Buyer accepts counter | ✅ | ✅ | ✅ | ✅ |
| Buyer declines counter | ✅ | ✅ | ✅ | ✅ |
| Buyer re-counters | ✅ | ✅ | ✅ | ✅ |
| Multi-round negotiation | Unlimited | Unlimited | Unlimited | ✅ |
| Offer expiry | 48h | None | 7 days | ✅ |
| Offer audit trail | ✅ Full log | ✅ Chat | ✅ offer_events table | ✅ |
| In-app notifications | ✅ | ✅ | ✅ All transitions | ✅ |
| Push/email notifications | ✅ | ✅ | Deferred | v1.1 |

### Complete negotiation flow

```
Buyer: "I offer 26,000"     → pending (notification: offer_received to seller)
Seller: "How about 30,000?"  → countered + message (notification: offer_countered to buyer)
Buyer: "How about 28,000?"   → countered (buyer re-counters)
Seller: "29,000 final?"       → countered
Buyer: [Accept 29,000]        → accepted (listing marked sold)
```

### Audit trail (offer_events)

Every state change writes an event: `offer_id`, `actor_id`, `from_status`, `to_status`, `amount`, `message`, `created_at`. Buyers and sellers see the full negotiation timeline on the offer detail page.

### In-app notifications

| Event | Recipient | Message |
|-------|-----------|---------|
| offer_received | Seller | "New offer on your listing" + amount |
| offer_accepted | Buyer | "Your offer was accepted!" |
| offer_declined | Buyer | "Your offer was declined" |
| offer_countered | Buyer | "Counter-offer received" + amount |
| offer_counter_declined | Seller | "Your counter-offer was declined" |
| review_received | Seller | "You received a new review" |
| report_resolved | Reporter | "Your report has been resolved" |

## The demo transparency contract

Every monetization surface that shows simulated data carries a visible marker:

- **Boosted listing card** — `(demo)` next to the analytics line
- **AI assistant** — `Demo AI` badge next to the credits pill
- **Pricing page** — `Demo mode — Chapa test transactions only` banner at the top of the tier table

No simulated data is presented without a marker. A judge tapping a boosted listing sees a real listing with real boost-window expiry; the *analytics* line is the only simulated piece, and it says so.

## What production adds (post-challenge)

These are the items ticket #97 and the roadmap carry forward:

1. **Real boost analytics** — impression / click / inquiry event pipeline feeding the boosted-listing card (replaces the mock line).
2. **Recurring Pro billing** — Chapa subscription plan, not one-time payment; grace period, proration, self-serve downgrade.
3. **In-platform wallet (optional)** — lets buyers fund, sellers receive, platform escrow before buyer-confirms-receipt.
4. **AI credit overage / rollover** — configurable policy in `lib/plans/constants.ts`.
5. **Tax receipts** — generated on each successful Pro billing cycle.

## Judge-facing script

> "The offer system supports full multi-round negotiation — buyers and sellers can counter back and forth with messages, and every state change is logged in an audit trail. The monetization loop works end-to-end in Chapa sandbox: boost records a paid window and surfaces analytics; Pro upgrade mutates the seller's tier when Chapa test-mode checkout completes; AI credits enforce a real monthly quota. In production the same Chapa integration handles recurring subscriptions and the analytics pipeline feeds real impression data. The `(demo)` badges mark exactly where we're showing simulated data — everything else is wired to the database."

## Related documents

- `docs/01-prd/04-functional-requirements.md` — FR numbering for boost, AI, tier
- `docs/01-prd/06-feature-specifications.md` — feature-level acceptance criteria
- `docs/02-architecture/01-architecture-decision-records.md` — ADR-021 (no payments in MVP), ADR-014 (Chapa seam)
- `docs/03-engineering/06-implementation-roadmap.md` — post-challenge monetization tickets
