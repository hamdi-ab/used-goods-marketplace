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

## 1. Demo accounts (use these in the video)

| Account | Email | Password | Role |
|---|---|---|---|
| Seller (phone-verified) | `amira.sellers@vintch.local` | `demo1234` | Posts listings |
| Seller (Fayda-verified) | `fayad.verified@vintch.local` | `demo1234` | Trust-badge variety |
| Buyer | `biniam.buyer@vintch.local` | `demo1234` | Searches, offers |
| Admin | `admin@vintch.local` | `admin1234` | Moderation queue (optional) |

## 2. Shot list

Pacing: each shot advances exactly one story step; total ≤ 5:00.

### Shot 1 — Brand hero (~10 s)
- **Screen:** Home page, signature neighborhood hero illustration, marketplace name.
- **Voice:** "The fastest and most trustworthy way to buy and sell used goods in Addis Ababa."

### Shot 2 — Seller creates a listing (~60 s)
- **Screen:** Sign in as **Amira** → `/sell`. Fill title, description, price in ETB, condition, Addis location; pick the AI Listing Assistant to suggest a title/description/category (AI differentiator, optional path).
- **Voice:** "Listing is effortless — and the AI assistant writes a convincing post in seconds."

### Shot 3 — Listing goes live (~20 s)
- **Screen:** Publish → the listing card appears on the home page with condition badge, ETB price, Addis location.
- **Voice:** "Live instantly, with the trust bar buyers look for."

### Shot 4 — Buyer searches and filters (~30 s)
- **Screen:** Sign in as **Biniam**. Keyword search + filters (category / price / condition / city) → results snap in.
- **Voice:** "Discovery is fast — search, filter, and it is there in seconds."

### Shot 5 — Result → detail with trust bar (~20 s)
- **Screen:** Open a card → listing detail shows the seller's Trust score and verified badges.
- **Voice:** "Every listing carries the seller's trust history, so buyers know who they are dealing with."

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

## 3. Time budget

| Block | Time |
|---|---|
| Brand hero | 0:10 |
| Seller flow (create + AI + publish) | 1:20 |
| Buyer flow (search, detail, contact, offer) | 1:50 |
| Admin (optional) | 0:30 |
| Closing | 0:15 |
| **Total** | **~4:05** |

Cut the admin shot and trim AI assist to land comfortably under 5:00.

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