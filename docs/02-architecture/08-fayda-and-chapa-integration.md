# Fayda & Chapa Integration Research

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Status:** Research
>
> **Owner:** CTO / Engineering Team
>
> **Last Updated:** August 2026

# 1. Purpose

This scoping document captures the current APIs for two optional / future integrations named in the PRD and ADRs — **Fayda** identity verification (ADR-015) and **Chapa** payments (ADR-014) — and the full step-by-step implementation path for each, even though both are **deferred from the MVP**.

It is deliberately a research artifact, not a decision. It records what the live APIs expose now (verified August 2026), the exact integration steps, and where each would hook into the marketplace's existing system. Nothing here lands in the MVP build plan.

Current posture in the docs:

- ADR-014 — Payments deferred; Chapa/Telebirr are "optional enhancements" (`docs/02-architecture/01-architecture-decision-records.md`).
- ADR-015 — Verification is a modular service; Fayda is a "future integration" for stronger trust.
- NFR-15 — Future readiness lists Fayda, Telebirr, Chapa, etc. without major redesign.

# 2. Fayda (National ID) — Integration Research

## 2.1 Context

Fayda is Ethiopia's national digital identity. The National ID Program (NIDP) exposes a **partner SSO API** built on **OAuth 2.0 + OpenID Connect (OIDC)**, through an **eSignet** provider ("VeriFayda 2.0"). A partner applies via the **Fayda Partner Portal**, is onboarded, gets client credentials and an RSA private key, then runs a standard OIDC **authorization-code + PKCE** flow so a person logs in with their Fayda.

This is exactly the shape put aside in ADR-015 (modular verification service, Fayda future).

## 2.2 Canonical endpoints

| What | Where |
|---|---|
| Developer/API info page | `https://id.gov.et/api` |
| Partner Portal (onboarding) | `https://partner.fayda.et` |
| eSignet authorize (browser) | `https://esignet.ida.et/authorize` |
| Token exchange (backend) | `https://esignet.ida.et/v1/esignet/oauth/token` |
| UserInfo | `https://esignet.ida.et/v1/esignet/oidc/userinfo` |
| OIDC discovery | `https://esignet.ida.et/v1/esignet/oauth/.well-known/openid-configuration` |
| Relying-party integration doc | (NIDP wiki) "Fayda eSignet Relying Party Integration Documentation" |

## 2.3 Authorization request (redirect from browser)

`GET https://esignet.ida.et/authorize` with:

- `client_id` — registered partner client.
- `response_type=code`
- `redirect_uri` — must exactly match the registered callback.
- `scope=openid profile email`
- `state` — CSRF nonce.
- `code_challenge` / `code_challenge_method=S256` (PKCE).
- `claims` (optional) — URL-encoded JSON requesting `name`,`phone_number`,`email`,`picture`,`gender`,`birthdate`,`address`.
- `acr_values` (optional) — OTP-only vs OTP-or-biometrics.

Callback success: `?code=...&state=...`; failure: `?error=...&error_description=...`.

## 2.4 Token exchange (backend only)

`POST https://esignet.ida.et/v1/esignet/oauth/token`

Form-encoded (`application/x-www-form-urlencoded`), `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier`, plus a **client_assertion**: a JWT signed RS256 with the partner's RSA private key, `alg=RS256`, payload `{iss, sub, aud}` where `aud` = the token endpoint. Response: `access_token`, `id_token`, `token_type=Bearer`, `expires_in=3600`.

## 2.5 UserInfo / claims

`GET https://esignet.ida.et/v1/esignet/oidc/userinfo` with `Authorization: Bearer <access_token>` → returns a signed JWT containing `sub` (unique Fayda ID), `name`, `email`, `phone_number`, `picture`, `gender`, `birthdate`, `address`. Amharic variants (`name#am`, `address#am`) available when `claims_locales=en am`.

For **verify-only** (no PII): `scope=openid` without claims.

## 2.6 Signing / key model

Partner's private key is delivered as a **base64-encoded JWK set** (RSA). The provider's public keys are read from the OIDC discovery documents' `jwks_uri`; ID-token/userinfo signatures are verified against that (`kid`-matched) — needed only when you actually validate the returned claims (recommended in production).

## 2.7 Steps to implement (why it matters even if deferred)

1. **Onboard a partner account** at `partner.fayda.et` → submit organization, get approval, receive `client_id` + private key (base64 JWK). Register exactly one `redirect_uri` (production + dev).
2. **Store secrets** — client_id + private key in the deployment config/Hashicorp-style secret store, not the repo.
3. **Backend prerequisites in the marketplace** — a **verification service** (ADR-015's "modular verification service" seam): because the OIDC token exchange must run server-side, add backend API routes `/verify-fayda/start` (returns the authorize URL) and `/verify-fayda/callback` (exchanges the code, validates JWT, records verify result). The marketplace has no such route today; this is the plumbing layer ADR-015 described.
4. **Frontend** — a "Verify with Fayda" button on the profile / seller-verification screen that triggers the redirect. UX may allow "verify later".
5. **PKCE specifics** — implement per spec: S256, no padding on the challenge.
6. **Map the returned identity to the marketplace** — store a verified claim subset (e.g. normalized name, phone, unique Fayda `sub`) against the user record; do NOT store the raw JWT.
7. **Explicit consent** — country-local consent wording before redirect.
8. **Safety/dependency** — nonblocking: if Fayda is down or rate-limits, the app must not require it for core flows (purchase, browse).

## 2.8 Notes / risks

- Onboarding is **human-reviewed** and takes time — budget weeks of lead time before any launch.
- Requires production HTTPS (callbacks) and a stable partner org.
- eSignet is evolving (VeriFayda 2.0); check the OIDC discovery document (`/.well-known/openid-configuration`) for current URLs at implementation time.
- Do not store the private key in the client bundle; it must live on a backend.

# 3. Chapa (Payments) — Integration Research

## 3.1 Context

Chapa is Ethiopia's developer-friendly payment-gateway API, aggregating Telebirr, CBE Birr, bank transfers, cards, and PayPal (depending on account & approval) into one hosted checkout. ETB + USD are supported. For a marketplace, **Chapa = the "pay for listing / simulated escrow gateway" future** that ADR-014 parked.

## 3.2 API credentials

- `SECRET_KEY` / `PUBLIC_KEY` — from dashboard (test key `CHASECK_TEST-...`).
- Live mode requires **Compliance / identity approval** of the business.
- Header auth: `Authorization: Bearer <secret key>`.

## 3.3 Core flow to implement (recommended path for the marketplace)

**Preferred integration: Redirect (`transaction/initialize`) → user pays in Chapa checkout → callback/webhook → verify.**

### Step A — Initialize

`POST https://api.chapa.co/v1/transaction/initialize`

Body (JSON): `amount`, `currency` (ETB/USD), `email`, `first_name`, `last_name`, `phone_number` (10-digit `09x`/`07x`), `tx_ref` (unique per charge, generated server-side), `callback_url` (server webhook), `return_url` (after-pay redirect shown to user), and metadata/customization (title/logo; receipt customization). 

Response: `data.checkout_url` to redirect the user to Chapa's hosted checkout page.

### Step B — Redirect

User lands on `data.checkout_url`, Chapa collects payment (telebirr popup, card, CBE…).

### Step C — Callback and verify (mandatory)

After payment, Chapa:

1. Redirects to your `return_url`,
2. Sends `GET` to your `callback_url` with `{ "tx_ref": "...", "ref_id": "APqDvYw1okk2", "status": "success" }`.

Backend must **verify** via:

`GET https://api.chapa.co/v1/transaction/verify/{tx_ref}` (Bearer secret) → confirm `status`, `amount`, `currency`.

### Step D — Webhook (production-grade)

Enable a webhook URL + **secret hash**. Chapa POSTs to it on `charge.success` (and `charge.refunded`, `charge.reversed`, `charge.failed/cancelled`). 

- Verify `x-chapa-signature` header: HMAC-SHA256 of the payload with your secret key; if invalid → reject.
- Idempotency — same event can redeliver; ack with 200.
- Always re-verify the transaction against the verify endpoint before fulfilling (matches Chapa's documented best practice).

### Step E — Reconciliation/state machine

Record payment as a row in the DB (payment status: `pending → paid/…`) keyed by `tx_ref`; the listing/sale status flips only after both verify-success + idempotency guard.

## 3.4 Chapa-specific notes for the marketplace

- `tx_ref` must be generated server-side and be unique per order/charge.
- Two currencies: ETB (default) and USD (needs separate approval).
- Fees & settlement per Chapa plan; contact support for rates.
- A "Cancel" flow exists (`transaction-cancel`).

## 3.5 Test environment

- Test keys: `sk_test_...` + `CHASECK_TEST-...`.
- Test cards listed in docs "Testing Cards"; test mobile (telebirr) numbers in "Testing Mobile".
- Works against the same endpoints in test mode.
- Chapa only supports ETB/USD; do not gate the whole checkout on a live Chapa in the MVP (page demo).

---

# 4. Where each would plug in (future wiring)

Both are specifically placed as **inner hooks** in the existing docs so they can land later with no big redesign:

- **Fayda** → into ADR-015's **verification service**; UI via profile/verified badges. Adds a high-trust replacement for phone/email steps.
- **Chapa** → into ADR-014's deferred Payment domain (the `MerchandiseListing`-payments relationship in the DB spec), hooking the checkout step between "Pending" and "Live" listing states.

Neither changes the core trusted-search / listing / contacts model.

# 5. Research sources (verified August 2026)

| Topic | Source |
|---|---|
| Fayda API | `https://id.gov.et/api`, `https://partner.fayda.et`, OIDC discovery doc, Fayda eSignet RP integration wiki, `haptome/fayda-sdk` GitHub (API reference extracted from `id.gov.et` + NIDL wiki). |
| Chapa docs | `https://developer.chapa.co` (Accept Payment, Verify Transaction, Webhooks, Test Mode vs Live, SDK & Plugins, Responses). |
| PHP/community Chapa guides | cross-checked basic flow (no auth-cookie changes). |

# 6. Open items / next steps

1. Decide whether either integration is worth adding to the roadmap as stretch (post-MVP).
2. If pursued, do a pilot on **Chapa test mode** (sandbox) first and verify the hosted-checkout → webhook → verify flow end-to-end before any live keys.
3. Fay integration lead time is weeks due to partner review — budget it before a hard deadline.
4. Keep these notes as `Research`; promote to a `decision` doc / ADR only when the captain decides to build.