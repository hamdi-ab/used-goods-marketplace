# Demo Script — 5-Minute Walkthrough

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Owner:** Engineering Team
>
> **Status:** Draft

This is the recorded demo screenplay for the submission (tracker T16 AC-5,
issue #20). It turns the plan in
[`10-submission-readiness.md`](10-submission-readiness.md) §4 into a concrete,
timed run against the **hosted production URL** with the seeded Addis Ababa
marketplace. Target length: **3–5 minutes, ≤ 5:00**.

## 0. Pre-flight checklist

- [ ] Hosted app deployed (see [`12-deployment-guide.md`](12-deployment-guide.md)).
- [ ] Seed data applied to hosted; demo accounts sign in.
- [ ] No local stack in the video — record against the production URL.
- [ ] Recording tool ready (OS-native or OBS); trim to ≤ 5:00.
- [ ] Browser window clean, e.g. 1440×900, no bookmarks bar clutter.

## 1. Demo accounts

Use the demo accounts (canonical table in
[`web/README.md`](../../web/README.md) under "Database migrations"): sign in as
the buyer (`biniam.buyer@vintch.local`) for the search/offer flow, and as a
seller (e.g. `amira.sellers@vintch.local`) for the create-listing flow.

## 2. Shot list

Pacing: each shot advances exactly one story step; total ≤ 5:00.

### Shot 1 — Brand hero (~10 s)
- **Screen:** Home page, signature neighborhood hero illustration, marketplace name.
- **Voice:** "The fastest and most trustworthy way to buy and sell used goods in Addis Ababa."

### Shot 2 — Seller creates a listing (~60 s)
- **Screen:** Sign in as **Amira** → `/sell`. Fill title, description, price in ETB, condition, Addis location; pick the AI Listing Assistant to suggest a title/description/category (AI differentiator, optional path).
- **Voice:** "Listing is effortless — and the AI assistant writes a convincing post in seconds."

### Shot 3 — Listing goes live, with the trust bar (~20 s)
- **Screen:** Publish → the listing card appears on the home page with condition badge, ETB price, Addis location, and the seller's trust bar (`SellerBadge`).
- **Voice:** "Live instantly — with the trust bar buyers look for." (Trust beats T2–T4.)

### Shot 4 — Buyer searches and filters (~30 s)
- **Screen:** Sign in as **Biniam**. Keyword search + filters (category / price / condition / city / **Verified seller only**) → results snap in.
- **Voice:** "Discovery is fast — and buyers can ask for verified sellers only." (Trust beat T5.)

### Shot 5 — Result → detail with trust bar (~20 s)
- **Screen:** Open a card → listing detail shows the seller's Trust score and verified badges.
- **Voice:** "Every listing carries the seller's trust history, so buyers know who they are dealing with." (Trust beat T6.)

### Shot 6 — Buyer contacts the seller (~20 s)
- **Screen:** Telegram / call buttons; a contact attempt is recorded (t.me deep-link / `tel:`).
- **Voice:** "Talk first, in the way that suits Addis — Telegram or a call."

### Shot 7 — Offer lifecycle (~40 s)
- **Screen:** Buyer submits an offer → seller's `/offers/seller` shows it → seller accepts.
- **Voice:** "Then make an offer, and the seller sees it on their dashboard the moment it lands."

### Shot 8 — (optional) Admin moderation (~30 s)
- **Screen:** Admin queue sees the new listing / a reported listing; toggle on/off.
- **Voice:** "And there is a real governance layer behind the marketplace."

### Shot 9 — Closing (~15 s)
- **Screen:** Value-proposition card.
- **Voice:** "Speed, trust, and simplicity — a marketplace that works the way Addis does. This is VinTech."

## 2b. Trust storyline — screen-by-screen walkthrough of the real app

Deliverable of tracker #101 (part of #98). The trust beats are driven by the
**real surfaces** already in the app — no redesign needed. Every step names the
account, the screen, the exact control, and what changes on screen. The arc:
*frictionless become-a-seller → best-effort phone OTP → one-click Fayda →
trust score jumps → buyer filters verified sellers → badge in the decision
path*. This is the mapping of the three decided signals (#99 phone, #100 email,
#102 benchmark) onto what the judge actually sees.

Demo accounts (from `web/supabase/seed.sql`, all `demo1234`):

| Account | Email | Badges shown | Trust |
|---|---|---|---|
| Amira Sellers | `amira.sellers@vintch.local` | Verified Seller + Phone | 85 |
| Fayad Verified | `fayad.verified@vintch.local` | Verified Seller + Fayda | 75 |
| Kebede Trader | `kebede.trader@vintch.local` | Verified Seller only | 60 |
| Biniam Buyer | `biniam.buyer@vintch.local` | (buyer — none) | 50 |

### Trust beat T1 — become a seller is one tap (Shot 2)
- **Account:** a fresh buyer (Biniam) or the judge's own signup.
- **Screen:** dashboard → the seller CTA (the #71 become-a-seller path).
- **What happens on screen:** role flips to seller; the user is at `/sell` with
  the listing form. No verification wall anywhere.
- **Narrator:** "Anyone can start selling instantly — no forms, no gates. Trust
  is earned, not demanded."

### Trust beat T2 — the trust bar on every listing card (Shot 3)
- **Account:** any.
- **Screen:** home page / search results. Each `ListingCard` shows the
  `SellerBadge` (`components/listings/seller-badge.tsx`): avatar, name,
  "Trust 85", and the badge row (`components/verification/seller-trust-badges.tsx`).
- **What the judge sees side by side:** Amira's card carries *Verified Seller +
  Phone Verified*; Kebede's carries only *Verified Seller*; a buyer's listing
  shows the "Not verified yet" empty state.
- **Narrator:** "Every card carries the seller's earned badges and a trust
  score — the same on home, search, and the detail page."

### Trust beat T3 — earn a phone badge, best-effort OTP (Shot 3)
- **Account:** Amira Sellers (`/profile`).
- **Screen:** the Verification card (`components/profile/verification-card.tsx`)
  under the profile form.
- **What happens on screen:** Phone row shows *Verified* (seed). For a fresh
  seller: "Request verification" → the #99 decision — the in-profile OTP panel
  (Supabase test-OTP sandbox) auto-badges on success; on SMS failure it falls
  back to the admin-reviewed request.
- **Narrator:** "Phone verification is offered, not forced — and if a code
  can't be delivered, an admin can confirm it instead. It never blocks listing."

### Trust beat T4 — one-click Fayda verification (Shot 3)
- **Account:** Fayad Verified (`/profile`).
- **Screen:** the same Verification card, Fayda row.
- **What happens on screen:** one click → the mock Fayda OIDC (T21, live on
  hosted) → `record_fayda_verification` flips `fayda_verified` and the badge
  row gains *Fayda Verified*; trust jumps (50 → 70 on a fresh seller).
- **Narrator:** "Fayda ID verification is a login, not a document upload —
  seconds, no PII stored. Verified sellers rank higher in search."

### Trust beat T5 — the buyer filters verified sellers (Shot 4)
- **Account:** Biniam Buyer → `/search`.
- **Screen:** the filters panel, "Verified seller only" checkbox
  (`components/search/search-filters.tsx:216`).
- **What happens on screen:** ticking it filters results to sellers with
  verification; the badge set rides along on every remaining card.
- **Narrator:** "Buyers can ask for verified sellers only — the badge sits in
  the decision path, where it changes behavior."

### Trust beat T6 — trust on the detail page (Shot 5)
- **Account:** Biniam Buyer → a listing by Fayad.
- **Screen:** listing detail — the seller trust section (score + badges) in the
  sidebar, plus "Contact seller" (Telegram / call).
- **Narrator:** "And on the listing itself, buyers see exactly who they are
  dealing with before they make an offer."

### What is NOT shown in the demo
- No email badge — #100 decided email is a quiet trust-score input, not a
  badge (everyone has it; a badge 100% of sellers hold is noise).
- No document KYC, no face recognition, no signup wall — benchmark #102
  (§7) and the #99/#100 decisions keep the core loop frictionless.
- No live payment processing in the shipped app — ADR-021: money and goods
  move outside the app via direct communication. Chapa appears only as the
  optional bonus beat below.

## 2c. Transaction bonus beat — Chapa sandbox (optional, ~20 s)

Deliverable of ticket #97 (stretch, ADR-021). A single optional shot that shows
the *purchase* moment the challenge brief mentions ("Telebirr or chapa payment
gateway integration is a plus") **without merging payment code into the shipped
MVP**. Runs from the `fm/chapa-sandbox-demo` branch with
`CHAPA_DEMO_FALLBACK=true` — the full state machine works with no network or
Chapa account. If time is tight, cut this beat before cutting the trust beat.

### Shot 7b — Pay with Chapa, confirm receipt (~20 s)
- **Account:** Biniam Buyer → the accepted offer (Shot 7 leaves it accepted).
- **Screen:** on the accepted offer, **Pay with Chapa** → hosted checkout
  (fallback) → test card (Visa `4200 0000 0000 0000`, CVV `123`, expiry
  `12/34`) → return to `/offers?tx_ref=…` → **Paid ETB — confirm receipt** →
  seller sees **Paid ETB X — buyer confirmed receipt**.
- **Voice:** "The brief lists payments as a plus — here is payment readiness,
  demonstrated in Chapa test mode. The live app stays free of payment
  infrastructure, so nothing can break the core loop."
- **Judging note:** frame this as ADR-021's argument: money and goods move
  outside the app (meetup + Telegram/call, as Addis does today); Chapa/Fayda
  are the mapped migration path as trust and volume grow. Turns the missing
  payment from a gap into a feasibility + technical-execution point.

## 2d. Monetization storyline — quotas → boost → pricing (demo centrepiece 2)

Deliverable of wayfinder #54 build slice (T24–T29) + benchmark research
`docs/agents/research/04-marketplace-monetization-benchmark.md`. The arc the
judge sees: *usage meters show headroom → hit the 5-listing cap → sell a slot
and free it → boost a listing for visibility → pricing page frames the ladder*.
Per the benchmark, **boosts are the monetization centerpiece** (the proven
emerging-market surface — OLX +17.6%…+97.4% conversion, Vinted 3/7-day Bump,
Jiji Boost Packages), and the quota meters sell headroom, not restriction.

### Monetization beat M1 — the VinTech account card (Shot 2/3)
- **Account:** Amira Sellers (dashboard).
- **Screen:** dashboard "VinTech account" card (T28): `Active listings 2/5` and
  `AI credits 1/3` progress bars, plan label **Free**, an "Upgrade to Pro" CTA.
- **Narrator:** "Every seller sees live usage — the free plan is a real starter,
  with headroom shown as headroom."

### Monetization beat M2 — hit the cap, sell a slot (Shot 7)
- **Account:** Kebede Trader (already near the 5-listing cap) → `/sell`.
- **Screen:** publishing an over-cap listing is rejected with the §26 message
  ("You've reached your free plan's limit") + actions `[Manage Listings]`
  `[Upgrade to Pro]`; listing still works via selling/archiving (sold frees a
  slot — meter drops 5/5 → 4/5).
- **Narrator:** "The cap is enforced server-side — and selling frees a slot.
  It's an upgrade trigger, not a wall."

### Monetization beat M3 — boost for visibility (the centerpiece, Shot 3/5)
- **Account:** Amira Sellers → dashboard listing row → **Boost**.
- **Screen:** Standard 49 ETB / 3 days or Premium 99 ETB / 7 days dialog
  (T29); confirm → row shows "Boosted until <date>". In the buyer's search,
  boosted listings float to the top and Premium carries a "Boosted" badge.
- **Narrator:** "Want more eyes on an item? Boost it — 3 or 7 days, Standard or
  Premium. This is the model Vinted, OLX, and Jiji prove: sellers pay for
  visibility, never for listing." (Optional: cite OLX +17.6%→+97.4% conversion.)

### Monetization beat M4 — the pricing ladder (Shot 9, before closing)
- **Account:** any; footer → `/pricing`.
- **Screen:** Free / Pro / Business three-column table (T27); Pro highlighted
  at **199 ETB/month** with a "pricing being validated" note; Business "Contact
  us / coming soon"; "Start Pro" captures email as intent only — mock success,
  no billing.
- **Narrator:** "Free stays genuinely usable. Pro is capacity for frequent
  sellers. And when billing opens, the intent we capture today becomes the
  waitlist."

### What is NOT in the monetization storyline
- No real billing/payment anywhere (ADR-021 + §17) — boosts and Pro are demo
  surfaces; the Chapa bonus beat (2c) is the only "money moves" moment and it
  is optional.
- No listing fees, no paywall on core listing/search/contact.

## 3. Time budget

| Block | Time |
|---|---|
| Brand hero | 0:10 |
| Seller flow (create + AI + publish) | 1:20 |
| **Trust beat (profile verification card — phone + one-click Fayda)** | **0:40** |
| **Monetization beat (account card → boost → pricing, M1–M4)** | **0:50** |
| Buyer flow (search, detail, contact, offer) | 1:50 |
| **Transaction bonus (Chapa sandbox, optional)** | **0:20** |
| Admin (optional) | 0:30 |
| Closing | 0:15 |
| **Total (core)** | **~5:35** |
| **Total (with Chapa bonus)** | **~5:55** |

The trust beat is the demo's centrepiece (trust beats T3–T4): on the seller's
profile, show the Verification card — phone already verified, then one-click
Fayda verification (T21 mock OIDC) flipping the badge and bumping trust.
The monetization beat (M1–M4) is centrepiece 2: account card with live usage,
the cap-triggered upgrade nudge, the boost flow (Standard/Premium + reorder +
badge), and the `/pricing` ladder. Total is over 5:00 — pick the two strongest
beats per section and cut the rest: e.g. drop the admin shot entirely, trim AI
assist, run M2 and M4 in one quick pass (cap message → pricing page), and keep
M3 (boost) as the monetization anchor. Land the recording ≤ 5:00.

## 4. Recording & hosting

- Record with OS-native capture or OBS at 1080p; trim in the editor to ≤ 5:00.
- Host the recording (Vercel static file or external link) and record the URL
  in the submission-readiness Decisions-so-far when chosen (T16/T17 tooling
  note, `10-submission-readiness.md` §4).
- Verify audio level and subtitles if adding voiceover.

## 5. Related docs

- Demo plan & decisions: `10-submission-readiness.md` §4
- Winning strategy voice: `../../00-strategy/00-winning-strategy.md`
- Deployment: `12-deployment-guide.md`
- Video deliverables: `06-implementation-roadmap.md` §12