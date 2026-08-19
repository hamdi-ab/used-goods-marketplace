# Architecture Decision Records (ADR)

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Accepted
>
> **Owner:** CTO

# Introduction

This document records the significant architectural decisions made during the design of the marketplace.

Each ADR explains:

- The problem
- Available options
- Decision
- Rationale
- Trade-offs
- Consequences

This ensures future contributors understand *why* technologies and patterns were selected.

# ADR-001
## Architecture Style

### Status

Accepted

### Problem

The platform requires rapid development, zero infrastructure cost, strong scalability, and minimal DevOps overhead.

### Options

- Monolithic Server
- Serverless Architecture
- Microservices

### Decision

Adopt a **Serverless Architecture**.

### Rationale

Serverless eliminates server management, reduces operational complexity, and aligns with the challenge's budget constraints.

Supabase and Vercel provide managed infrastructure that scales automatically.

### Trade-offs

**Pros:** Zero server maintenance, Automatic scaling, Fast development, Low operational cost

**Cons:** Vendor dependence, Execution time limits for serverless functions, Less control over infrastructure

# ADR-002
## Frontend Framework

### Status

Accepted

### Problem

The frontend must provide excellent SEO, responsiveness, and developer productivity.

### Options

- React + Vite
- Next.js
- Nuxt
- Angular

### Decision

Use **Next.js App Router**.

### Rationale

Next.js provides:

- Server Components
- Built-in routing
- Image optimization
- Metadata management
- Excellent SEO
- Vercel integration

These capabilities directly benefit a marketplace application.

### Trade-offs

**Pros:** SEO, Performance, Routing, Server Actions, Built-in optimization

**Cons:** Steeper learning curve, More conventions

# ADR-003
## Backend Platform

### Status

Accepted

### Problem

The application requires authentication, database, storage, and APIs without building a custom backend.

### Options

- Firebase
- Supabase
- PocketBase
- Custom Express API

### Decision

Use **Supabase**.

### Rationale

Supabase offers:

- PostgreSQL
- Authentication
- Storage
- Realtime
- Edge Functions
- Row Level Security

This reduces implementation effort while maintaining flexibility.

### Trade-offs

**Pros:** SQL database, Open-source ecosystem, Powerful security, Excellent developer experience

**Cons:** Vendor dependence, Fewer managed services than some cloud providers

# ADR-004
## Database Selection

### Status

Accepted

### Problem

Marketplace data contains relationships between users, listings, images, offers, reviews, favorites, and reports.

### Options

- PostgreSQL
- MongoDB
- Firestore

### Decision

Use **PostgreSQL**.

### Rationale

Marketplace data is relational by nature.

PostgreSQL provides:

- ACID transactions
- Foreign keys
- Constraints
- Indexing
- Full-text search
- Mature tooling

### Trade-offs

**Pros:** Strong consistency, Excellent relational support, Powerful querying

**Cons:** More structured schema design, Slightly higher learning curve than NoSQL

# ADR-005
## Authentication

### Status

Accepted

### Decision

Use **Supabase Authentication**.

### Rationale

Provides:

- Secure password hashing
- JWT sessions
- Email verification
- Password reset
- Session management

without custom implementation.

# ADR-006
## Authorization

### Status

Accepted

### Decision

Use **Row Level Security (RLS)** as the primary authorization mechanism.

### Rationale

Authorization rules remain close to the data.

Example:

Users can only update their own listings.

### Trade-offs

**Pros:** Centralized security, Reduced application logic, Lower risk of accidental data exposure

**Cons:** More complex SQL policies

# ADR-007
## UI Component Library

### Status

Accepted

### Options

- Material UI
- Chakra UI
- Ant Design
- shadcn/ui

### Decision

Use **shadcn/ui**.

### Rationale

Provides accessible, customizable components without imposing a visual style.

Allows the product to establish its own brand identity.

### Trade-offs

**Pros:** Full customization, Accessibility, Modern design

**Cons:** More implementation effort than opinionated libraries

# ADR-008
## Styling Framework

### Status

Accepted

### Decision

Use **Tailwind CSS**.

### Rationale

Supports rapid UI development while maintaining design consistency.

### Trade-offs

**Pros:** Utility-first workflow, Small production bundle, Responsive design

**Cons:** Long class names, Requires discipline for consistency

# ADR-009
## AI Provider

### Status

Accepted

### Options

- Gemini
- OpenAI
- Claude

### Decision

Use **Google Gemini**, specifically a **flash-class multimodal model** (vision + text) in the current Gemini flash generation (`gemini-2.5-flash` / `gemini-3-flash`; pin at T14). The AI Listing Assistant is a **vision task**: it consumes the seller's photos, so the model must accept image input, not just text.

### Rationale

The free tier is suitable for MVP development and supports the vision tasks required by the AI Listing Assistant (ADR-019 covers image token/cost math). Gemini 2.5 Flash and 3 Flash are the current free-tier flash models; Gemini 2.0 Flash was deprecated and shut down in 2026 and must not be pinned. Response is a **structured JSON** (title, description, category, keywords, condition, quality score), constrained by a JSON schema so the provider returns typed enums we can render directly.

### Trade-offs

**Pros:** Cost-effective (free tier covers image input), Strong text + vision generation, Easy API integration

**Cons:** Dependency on external service, Response latency varies, Rate limits (RPM/RPD/TPM) on the free tier bound high-volume listing creation

### Cost & limits

- MVP target: **free tier, $0**. Gemini 2.5 Flash and 3 Flash count image input inside the same per-token limits and are free on the free tier.
- **Image allowance:** up to **3,600 image files per request**; each image ≈ **258 tokens** at ≤384 px, tiled larger images in 768 px tiles also ~258 tokens/tile (a 960×540 image ≈ 6 tiles ≈ 1,548 input tokens).
- **Free-tier rate limits** (Google AI Studio free key, project-level): ~20–250 RPD, ~5–10 RPM, ~250K–1M TPM depending on model — fine for a demo and a few hundred seed listings, tight for heavy batch generation.
- **Paid fallback** (only if the quota is ever hit mid-demo): Gemini 2.5 Flash ≈ $0.15–$0.30 / 1M input tokens and $3.50 / 1M thinking-output tokens. A single AI listing call (1 photo + prompt) is a few thousand input tokens, i.e. fraction-of-a-cent; even 1,000 AI-assisted listings on the paid tier is well under $1 — see ADR-019.

# ADR-010
## State Management

### Status

Accepted

### Decision

Use:

- Server Components for data fetching
- TanStack Query for client-side server state
- React Context for lightweight global UI state

### Rationale

Avoid introducing a large state management library unless complexity demands it.

# ADR-011
## Image Storage

### Status

Accepted

### Decision

Store images in **Supabase Storage**.

### Rationale

Benefits include:

- Integrated authentication
- CDN delivery
- Signed URLs
- Simplified permissions

# ADR-012
## Search Strategy

### Status

Accepted

### Decision

Use PostgreSQL search capabilities for the MVP.

### Rationale

Expected data volume does not justify introducing Elasticsearch or Meilisearch.

Future migration remains possible if search requirements grow.

# ADR-013
## Communication Strategy

### Status

Accepted

### Decision

Use external communication channels rather than building an in-app chat.

Supported channels:

- Telegram
- Phone call

### Rationale

This aligns with existing user behavior in Ethiopia and significantly reduces development effort.

### Trade-offs

**Pros:** Faster MVP, Familiar user experience, No chat moderation

**Cons:** Conversations occur outside the platform

# ADR-014
## Payments

### Status

Deferred

### Decision

Exclude payment processing from the MVP.

### Rationale

The challenge lists Telebirr and Chapa as optional enhancements.

Excluding payments reduces scope while preserving a clear integration path.

# ADR-015
## Identity Verification

### Status

Deferred (Fayda: designed — self-issued OIDC, verify-only; see ADR-020)

### Decision

Design verification as a modular service.

Initial trust indicators include:

- Email verified
- Phone verified
- Telegram linked

Future integration:

- Fayda digital identity verification

### Rationale

Keeps the MVP simple while enabling stronger trust features later.

Fayda integration is designed but deferred from the MVP build (live integration needs partner onboarding). The designed shape: a dev-only eSignet OIDC mock (ADR-020) driving a verify-only flow that stores only the unique Fayda `sub`; the real `esignet.ida.et` is a config swap. Tracker: issue #25 (T21, stretch).

# ADR-016
## Analytics

### Status

Accepted

### Decision

Track product and user events from day one.

Examples:

- Listing created
- Listing viewed
- Search performed
- Offer submitted
- Favorite added

### Rationale

Analytics support future product improvements and provide insights into user behavior.

# ADR-017
## Deployment

### Status

Accepted

### Decision

Deploy using:

- GitHub
- GitHub Actions
- Vercel
- Supabase

### Rationale

This stack provides continuous deployment with minimal operational overhead.

# ADR-018
## API Design

### Status

Accepted

### Decision

Adopt RESTful APIs with consistent resource naming and versioning.

Example:

```
/api/v1/listings
/api/v1/offers
/api/v1/users
```

### Rationale

Predictable APIs simplify frontend integration and future maintenance.

# ADR-019
## Gemini Vision: Image Input Budget & Cost

### Status

Accepted

### Dependencies

- ADR-009 (AI provider = Google Gemini, flash-class multimodal)

### Why this ADR exists

The AI Listing Assistant's input is *photos*. This ADR pins how much image we send, how it is tokenized/costed, and keeps the MVP inside the free tier, so T14 doesn't re-derive it.

### Decision

1. **Model:** use a **flash-class multimodal model** (`gemini-2.5-flash` or the newer `gemini-3-flash`, whichever is the current stable flash in the pack). A model stream is verified at T14. Never pin `gemini-2.0-flash` (deprecated & shut down 2026).
2. **Image budget per listing:** send **1–4 photos** for listing analysis (the first 1–2 are the core content; 3–4 only add context). This matches the roadmap's "1–2 photos" seller demo and keeps token spend tiny.
3. **Resize before send:** downscale photos server-side to ≤1024 px before calling Gemini (aligns with the storage/compression flow in backend-architecture §10). Smaller images are tiled cheaper:
   - ≤384 px → **258 tokens/image**.
   - Larger → 768 px tiles, each ≈258 tokens; a 960×540 photo ≈ 6 tiles ≈ 1,548 input tokens.
   - Practical per-call image cost ≈ **0.3k–1.6k input tokens** for 1–4 resized photos.
4. **Structured output:** request JSON-object response via a strict schema (title, description, category enum, keywords, condition enum, quality score). Enums map 1:1 to our domain (category/condition values in the handbook section 10 / DB spec). No freeform prose.
5. **Free tier, $0:** the MVP lives on the Gemini free tier. Hitting the free quota (RPM/RPD) mid-demo is handled by graceful degradation to manual listing (feature "AI never publishes; manual listing always available" per FS-005).

### Cost math (single listing call)

Assumptions: 1 photo ≈ 0.3k–1.6k input tokens (post-resize), prompt + schema overhead ≈ 0.5–1k tokens, output ≈ 0.2–0.5k tokens.

| Scenario | Input tokens | Output tokens | Free tier cost | Paid fallback cost (1M/≈$0.15–0.30 in) |
|---|---|---|---|---|
| 1 photo | ~0.5k–2.6k | ~0.2–0.5k | $0 | ~$0.0001–0.0004 |
| 4 photos | ~1.3k–7.4k | ~0.2–0.5k | $0 | ~$0.0002–0.0011 |
| 1,000 listings (batch) | ~1M–7M | ~0.2–0.5M | $0 (within quota if ~70–280 RPD for days) | ≈ $0.15–2.10 |

**Bottom line:** the MVP's AI listing generation is free on the free tier; even a 1,000-listing paid run is ~$0.15–$2.10. The real constraint is **free-tier RPM/RPD**, not money — hence the 1–4 photo budget and server-side resize.

### Trade-offs

**Pros:** $0 MVP, image input inside the flash tier, tiny cost if paid is ever needed

**Cons:** Free-tier rate limits cap concurrent listing generation; auto-tiling is provider-controlled, so actual token counts vary slightly and must be checked with `countTokens` at T14

# ADR-020
## Fayda Verification: Self-Issued OIDC (Verify-Only)

### Status

Accepted (stretch — T21, issue #25)

### Why this ADR exists

ADR-015 defers Fayda. When designed, a future reader must know *how* a Fayda verification is recorded and why the `record_verification` RPC (admin-only) is not reused. This ADR pins the two RPCs and the PII boundary.

### Decision

1. **Goal:** demonstrate the real integration seam, not a live national check. The Fayda badge means "identity authenticated against the national-ID (OIDC)".
2. **Verify-only:** request `scope=openid`, no `claims`. Store only the unique Fayda `sub` on the `verifications` audit row (new `sub` column) plus the `profiles.fayda_verified` cached flag. Zero PII; no raw JWT.
3. **Self-issued write path:** new SECURITY DEFINER RPC `record_fayda_verification`, callable by `auth.uid()` for their own profile only, guarded by a successful server-side OIDC exchange (verified `sub` passed as proof). Mirrors `record_verification`'s flag-flip + trust-bump (+20, clamped 0-100) + audit-row logic for `type='fayda'`. The admin-gated `record_verification` stays untouched, keeping the two issuance paths distinct (domain model §Verification).
4. **Mock fidelity:** the dev-only eSignet mock signs real RS256 JWTs and serves JWKS so the client's signature-validation path runs end-to-end; `private_key_jwt` client auth only (no `client_secret` — the real eSignet offers none).
5. **Guardrail:** mock + `/verify-fayda/*` mounted only under `FAYDA_MOCK=1`; the production build hard-refuses the flag.

### Rationale

A user's own successful national-ID login is a *self-issued* trust signal — the admin-only RPC models *admin-issued* signals (email/phone/telegram), and conflating them would widen the admin function or force an impossible admin step into the flow. Verify-only keeps the profile free of national-ID-derived PII (Ethiopia PDP Proclamation 1321/2024) while still proving the integration seam.

### Trade-offs

**Pros:** real seam proved end-to-end (config swap to esignet.ida.et); no PII; admin RPC security posture unchanged; mock teaches correct client-auth behavior

**Cons:** mock cannot exercise a live revocation/validity check; verify-only surrenders name auto-fill; extra RPC vs reusing `record_verification`; `esignet.ida.et` discovery must be re-verified at build time

# ADR-021
## Transaction Handling (Sale → Money → Goods)

### Status

Accepted

### Why this ADR exists

ADR-014 defers payments but does not say how a sale is *settled*. This ADR pins the full transaction model for the submission, driven by the challenge brief: payment is listed as a "plus" ("Telebirr or chapa payment gateway integration is a plus"), not a required capability — while the *required* capabilities are discovery, direct communication (Telegram/call), and trust & safety. The deal loop must work end-to-end without payment infrastructure.

### Decision

1. **The deal is recorded in-app; money and goods move outside the app.** An accepted offer flips the listing to `sold` with `sold_to_buyer_id` (`accept_offer`); the buyer and seller then settle through the direct-communication layer (Telegram deep-link / phone call, ADR-013), exactly as Addis' P2P market operates today (cash, Telebirr, CBE Birr). No escrow, no wallet, no payout, no payment row.
2. **No in-app payments ship in the MVP.** This is the operational form of ADR-014; it keeps the product honest and deployable and avoids the regulatory/compliance weight of unregulated financial rails (refunds, disputes, fraud, payout-KYC).
3. **Chapa appears in the demo only, as a recorded bonus beat, not in the shipped app.** The `fm/chapa-sandbox-demo` branch (ticket #97) is a stretch artifact: with `CHAPA_DEMO_FALLBACK=true` it shows the full state machine (Pay with Chapa → test card → paid → buyer confirms receipt) with no network or account. It is recorded as a ~20 s optional shot and kept unmerged from the submission branch.
4. **Judge-facing framing:** "The brief lists payments as a plus. We kept the core loop free of payment rails and demonstrated payment readiness in Chapa test mode — the migration path (Chapa) and national ID (Fayda) are mapped as trust and volume grow." This turns the absence of live payments from a gap into an architectural argument scored on Technical Execution and Scalability/Feasibility.
5. **Post-challenge roadmap:** ticket #97 stays open; Chapa (and escrow, monetization doc §18) remain the genuine future path once the product outgrows meetup settlement.

### Rationale

The challenge brief's required capabilities (condition status, filters, search, direct contact, verification indicators, report/flag, ratings) are all satisfied without payment rails; "purchase" is enabled by the offer→accept→sold loop plus direct contact. Keeping money and goods out of the MVP maximizes feasibility and demo reliability 7 days before the Aug 26 deadline.

### Trade-offs

**Pros:** zero payment-infra risk in the demo; honest, immediately deployable; matches the brief's "payment is a plus"; Chapa seam preserved for later; strong feasibility story

**Cons:** no in-app payment revenue or buyer-protection escrow; "verify at cash-out" industry pattern (benchmark §5, tier 3) is deferred until a payout exists — the equivalent friction point in the MVP is contact-unlock / high-price ceiling / listing caps (benchmark §7.4)

# ADR Summary

| ADR | Decision |
|------|----------|
| ADR-001 | Serverless Architecture |
| ADR-002 | Next.js App Router |
| ADR-003 | Supabase Backend |
| ADR-004 | PostgreSQL Database |
| ADR-005 | Supabase Authentication |
| ADR-006 | Row Level Security |
| ADR-007 | shadcn/ui Components |
| ADR-008 | Tailwind CSS |
| ADR-009 | Google Gemini |
| ADR-010 | TanStack Query + React Context |
| ADR-011 | Supabase Storage |
| ADR-012 | PostgreSQL Search |
| ADR-013 | Telegram & Phone Communication |
| ADR-014 | No Payments in MVP |
| ADR-015 | Modular Verification (Fayda-ready) |
| ADR-016 | Product Analytics |
| ADR-017 | Vercel Deployment |
| ADR-018 | RESTful API Design |
| ADR-019 | Gemini Vision: Image Input Budget & Cost |
| ADR-020 | Fayda Verification: Self-Issued OIDC (Verify-Only) |
| ADR-021 | Transaction Handling (Sale → Money → Goods) |

# Conclusion

These Architecture Decision Records capture the engineering rationale behind the marketplace.

They provide a historical record for future contributors, reduce repeated discussions, and ensure technical consistency as the project evolves.