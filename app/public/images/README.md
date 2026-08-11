# VinTech Image & Illustration Asset Set

> **Project:** VinTech Challenge 2026 — Used Goods Marketplace
>
> **Scope:** T18 (issue #22) — core image/illustration assets defined in
> `docs/04-design/08-image-asset-strategy.md`
>
> **Style lock:** design-token blue family — primary `#2563EB` + neutral navy `#172554`
> (`docs/04-design/00-design-foundations.md`), one coherent flat-vector illustration
> language across the whole set.

## What is here

```
app/public/images/
├── README.md                  this manifest
├── illustrations/             SVG source + 2x PNG for every illustration
│   ├── signature-vintech-hero.*
│   ├── onboarding-create-account.* / onboarding-list-item.* / onboarding-receive-offers.*
│   ├── empty-search-results.* / empty-favorites.* / empty-listings.* / empty-offers.*
│   ├── error-404.* / error-500.* / error-offline.*
│   ├── ai-before-after.*
│   └── trust-verified-seller.* / trust-safe-transactions.* / trust-community-marketplace.*
├── photos/                    hero "photos" as rich flat-vector scenes (4:3)
│   ├── photo-modern-apartment.*
│   ├── photo-seller-taking-photos.*
│   └── photo-buyer-meeting-seller.*
└── _tools/                    build tooling (generator + rasterizer) — not app assets
    ├── generate.js
    └── render.sh
```

18 assets total: 1 signature hero + 11 Tier-1 illustrations + 3 trust illustrations
+ 3 hero photos. Each ships as a source SVG (scalable, token-exact) and a 2x PNG
raster (ready to drop into `<img>` / Next.js `Image`). PNG dimensions:

| Asset family | Design box | PNG |
|---|---|---|
| Signature hero | 1600×1000 | 3200×2000 |
| Onboarding / trust | 1200×1000 | 2400×2000 |
| Empty states / errors | 1024×1024 | 2048×2048 |
| AI before/after | 1600×800 | 3200×1600 |
| Hero photos | 1600×1200 | 3200×2400 |

## Asset-by-asset usage

### Tier 1 — must-have

| File | Intended usage |
|---|---|
| `signature-vintech-hero` | VinTech visual identity: landing/marketing hero. Isometric Ethiopian neighborhood, buyers/sellers linked by blue connection lines, floating marketplace cards, trust badges, verification shields, AI sparkles. |
| `onboarding-create-account` | Onboarding step 1 — sign-up screen on phone, green verified badge, shield, wave figure. |
| `onboarding-list-item` | Onboarding step 2 — seller photographs a lamp; "your item is now live" listing card. |
| `onboarding-receive-offers` | Onboarding step 3 — offer notification card between buyer and seller, "+ offer" indicator. |
| `empty-search-results` | Search results empty state (magnifier with ✕, dashed ring). |
| `empty-favorites` | Favorites empty state (heart with falling-heart motif). |
| `empty-listings` | My Listings empty state (three empty slots + "List an item" button). |
| `empty-offers` | Inbox/offers empty state (empty chat bubble). |
| `error-404` | Not-found page ("off the map" compass + 404). |
| `error-500` | Server error page (server stack + wrench + 500). |
| `error-offline` | Offline page (cloud + cut Wi-Fi arcs). |
| `ai-before-after` | AI Listing Assistant differentiator: raw phone photo → polished live listing with AUTO-ENHANCE / AI transition. |

### Tier 2

| File | Intended usage |
|---|---|
| `trust-verified-seller` | Trust section: verified-seller ID card + Fayda verified shield avatar. |
| `trust-safe-transactions` | Trust section: two hands on a phone, escrow card, shield, ETB coin. |
| `trust-community-marketplace` | Trust section: three figures around a neighborhood storefront, connected by blue lines. |
| `photo-modern-apartment` | Hero/lifestyle photo stand-in: bright Addis-style apartment with jebena, plants, warm light. |
| `photo-seller-taking-photos` | Hero/lifestyle photo stand-in: seller shooting a lamp under a ring light. |
| `photo-buyer-meeting-seller` | Hero/lifestyle photo stand-in: handover meet-up in a café with the item on the table. |

### Tier 3 — not produced
Category covers, micro-icons, background graphics, product placeholders were cut
per the strategy doc ("cut freely"); the set above meets the ~12 core-asset bar.

## Generation notes

- **No image-generation API was usable in this environment.** Gemini image models
  (`gemini-2.5-flash-image`, `gemini-3-pro-image`, …) exist on the project's Google
  key but the free tier reports quota `limit: 0` for image generation, and
  `gemini-2.5-flash` is text-only. Rather than block, the set was **crafted by hand
  as token-locked SVG vector illustrations** — the standard illustration-system
  production method (Linear/Stripe/Notion-style), which guarantees zero style drift
  between scenes by construction.
- **One batch, one style:** every scene is emitted by a single generator
  (`_tools/generate.js`) from shared primitives — palette constants, gradient/shadow
  defs, the `person` figure, phone/product-card mockups, shield/check/sparkle glyphs,
  iso-box builder, `chip`/`connector` helpers. All scenes share the same rounded
  flat-vector grammar, 8pt-ish spacing, elevation shadows, and blue-family palette.
- **Semantic accents** are the only non-blue tones and are used sparingly:
  success `#22C55E` (verified/trusted), warning `#F59E0B` (sparkles/coins),
  error `#EF4444` (error states), warm skin tones.
- **Photos are vector scenes**, not raster photography: no stock/photo budget exists
  yet. They reuse the same palette/grammar at 4:3 with warmer lighting so the whole
  set stays coherent. Swap in licensed photos later by keeping the filenames.
- **Rasterization:** `_tools/render.sh` inlines each SVG into an HTML page sized 2x
  and screenshots it with headless Chrome (`_tools/generate.js` writes the SVGs at
  design size; `render.sh` re-emits them at 2x). Re-run `bash _tools/render.sh` after
  editing `generate.js` to refresh PNGs.
- **Regeneration:** `cd app/public/images/_tools && node generate.js && bash render.sh`
- All SVGs are self-contained (no external references), so they can be used directly.

## Guidelines when editing

- Keep every asset on the blue family; reuse the primitives in `_tools/generate.js`
  instead of hand-writing ad hoc scenes (drift kills the effect).
- SVG files are the source of truth; PNGs are raster mirrors. Update both together.
- Do not renumber or restructure this folder without updating the tracker-referenced
  strategy doc (`docs/04-design/08-image-asset-strategy.md`).
