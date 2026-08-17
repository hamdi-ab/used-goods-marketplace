# Fayda Verification — Real Flow & the T21 Mock Shape

> **Project:** Used Goods Marketplace (VinTech Challenge 2026)
> **Version:** 1.1
> **Owner:** Research (issue #25 — T21 stretch, resolves scout #20 / #24)
> **Status:** Research — fed design for T21 "Mock Fayda OIDC flow" (D1–D7, ADR-020; v1.1 adds decided-shape pointer)

## 1. Real Fayda verification flow (primary sources)

Fayda = Ethiopia's national digital ID. NIDP exposes a partner SSO on **OAuth 2.0 + OIDC via eSignet ("VeriFayda 2.0")**; a partner is onboarded at `partner.fayda.et`, receives `client_id` + an RSA private key (base64 JWK), then runs a standard **authorization-code + PKCE** flow (docs/02-architecture/08-fayda-and-chapa-integration.md §2.1–2.2). eSignet is MOSIP's open-source IdP, so the MOSIP docs mirror the deployed protocol.

### 1.1 Discovery

`GET https://esignet.ida.et/v1/esignet/oauth/.well-known/openid-configuration` returns `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`, `scopes_supported`, `acr_values_supported`, `response_types_supported=["code"]`, `grant_types_supported=["authorization_code"]`, `id_token_signing_alg_values_supported=["RS256"]` (08-fayda-and-chapa-integration.md §2.2, §2.8; sample at docs.esignet.io openid-configuration). Endpoints MUST be fetched from discovery, never hard-coded — the token path has versioned variants (`/v1/esignet/oauth/token` vs `/v1/esignet/oauth/v2/token`) (08-…md §2.8; docs.esignet.io development-and-integration-with-esignet).

### 1.2 Authorize (browser redirect)

`GET https://esignet.ida.et/authorize` with `client_id`, `response_type=code`, `redirect_uri` (**must exactly match** the registered callback), `scope=openid profile email`, `state` (CSRF nonce), `code_challenge` + `code_challenge_method=S256` (PKCE), optional `claims` (URL-encoded JSON for `name`, `phone_number`, `email`, `picture`, `gender`, `birthdate`, `address`) and `acr_values` (OTP-only vs OTP-or-biometrics). Success → `?code=…&state=…`; failure → `?error=…&error_description=…` (08-…md §2.3; OIDC Core §3.1.2.1). `openid` scope is REQUIRED and must be present (OIDC Core §3.1.2.1); eSignet rejects non-openid scope/claims requests (mosip/esignet oauth-details validation #5–6).

### 1.3 Token exchange (backend only)

`POST https://esignet.ida.et/v1/esignet/oauth/token`, `application/x-www-form-urlencoded`: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier`, plus **`client_assertion`** — a JWT `alg=RS256`, payload `{iss: client_id, sub: client_id, aud: token-endpoint-URL, iat, exp}`, signed with the partner's RSA private key — and `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`. Response: `access_token`, `id_token`, `token_type=Bearer`, `expires_in=3600` (08-…md §2.4; fayda-sdk API Reference §Endpoint 2).

**Token endpoint auth method: `private_key_jwt` only.** eSignet discovery advertises `token_endpoint_auth_methods_supported=["private_key_jwt"]` and docs state "Only private_key_jwt is supported for token endpoint client authentication" (docs.esignet.io openid-configuration + development-and-integration-with-esignet). There is no `client_secret` in the flow — the RS256 `client_assertion` *is* the client authentication (OIDC Core §9; RFC 7523 JWT-bearer pattern).

### 1.4 UserInfo / claims

`GET https://esignet.ida.et/v1/esignet/oidc/userinfo`, `Authorization: Bearer <access_token>` → a **signed JWT (JWS, RS256)**, not plain JSON, verified against `jwks_uri` by `kid` (08-…md §2.5–2.6). Claims: `sub` = **unique Fayda ID / PSUT** (always returned — OIDC Core §5.3.2), `name`, `email`, `phone_number` (E.164), `picture`, `gender`, `birthdate`, `address`. Amharic variants (`name#am`, `address#am`) via `claims_locales=en am` (08-…md §2.5; fayda-sdk API Reference §Endpoint 3). The `sub` in UserInfo MUST exactly match the `sub` in the ID Token (OIDC Core §5.3.2).

**Verify-only:** `scope=openid` with no `claims` → UserInfo returns `sub` without PII (08-…md §2.5; fayda-sdk API Reference §Claims Reference). This is the mode the marketplace needs.

### 1.5 Signing / key model

Partner private key delivered as a **base64-encoded RSA JWK set**; ID-token/userinfo signatures verified against the provider's `jwks_uri` (`kid`-matched) — recommended in production (08-…md §2.6; fayda-sdk §Private Key Format).

## 2. What a Fayda verification looks like IN THIS APP

| Concern | Shape |
|---|---|
| Data stored | **Only** the unique Fayda `sub` + `fayda_verified` flag on the user's `profiles` row. NO PII (name/email/phone/picture), NO raw JWT (issue #25 scope; 08-…md §2.7 step 6). |
| Badge | Existing `fayda` badge "Fayda Verified" (purple) from `sellerVerificationBadges()` renders once `profiles.fayda_verified=true` (web/lib/verifications/constants.ts:18,30-54; web/components/verification/verification-badge.tsx:25). |
| Write seam | `record_verification` RPC (web/supabase/migrations/20260814000000_create_verifications.sql:104-169) is the single writer: it soft-deletes the prior live row for (user, fayda), inserts an audit row, flips `profiles.fayda_verified`, and bumps `trust_score` +20 (clamped 0-100). Invoked via `recordVerification` (web/lib/verifications.ts:30-60). |
| Type | `type='fayda'` in the `verification_type` enum (email/phone/telegram/fayda) — constants.ts:27; migration:28. |
| One live row | Unique index `verifications_one_active_per_type` on (user_id, type) where status in (pending, verified) — re-verify supersedes (migration:48-50). |
| Search surface | `search_listings` RPC already returns `seller_fayda_verified` so listing cards render the same badge (migration:176-206). |

**Flow the mock drives:** user clicks "Verify with Fayda" on the profile/seller-verification UI (issue #25) → `/verify-fayda/start` builds the authorize URL (PKCE verifier + challenge, `state`, `scope=openid`, `claims` omitted for verify-only) → browser redirects to the IdP → user authenticates/consents → `/verify-fayda/callback` receives `code`+`state` → exchanges at token endpoint (server-side) → calls UserInfo → validates the signed JWT → records `record_verification(user_id, 'fayda', 'verified')` → badge appears.

**Key wrinkle:** `record_verification` is **admin-gated** (`is_admin()`, migration:118-120) and resolves the actor from the session — it cannot be called by the flow's own user. T21 must either add a self-serve/system path to the RPC (e.g. a service-role or `p_user_id=auth.uid()` branch guarded by a successful Fayda exchange) or a sibling "fayda_verified by OIDC" RPC that mirrors its flag-flip + trust-bump logic. This is the one place the mock changes existing behavior, and it overlaps issue #92/#73 (verification workflow is unreachable from UI today).

## 3. The mock (T21) — drop-in swappable with real eSignet

A dev-only OIDC provider implementing the same protocol surface so the marketplace's client code is identical for mock and real IdP.

| Endpoint (mirrors real) | Behavior to implement |
|---|---|
| `/.well-known/openid-configuration` | Static JSON advertising the mock's own URLs as issuer; `response_types=["code"]`, `grant_types=["authorization_code"]`, `token_endpoint_auth_methods_supported=["private_key_jwt"]`, `scopes_supported=["openid","profile","email","phone"]`, `id_token_signing_alg_values_supported=["RS256"]` (mirror docs.esignet.io sample). |
| `/authorize` | Validate `response_type=code`, `client_id`, **exact `redirect_uri` match**, `scope` contains `openid`, `code_challenge`+`S256`, `state`. Render a mock login/consent page with a fixed test identity. On submit, store `{code, code_challenge, redirect_uri, state}` (codes single-use, challenge bound — RFC 7636 §4.4), 302 to `redirect_uri?code=…&state=…`. Errors: `invalid_request`, `invalid_client`, `access_denied`. |
| `/v1/esignet/oauth/token` | Form-encoded; verify `grant_type=authorization_code`, code exists/not-reused, `redirect_uri` + `code_verifier` → **`BASE64URL(SHA256(code_verifier)) == code_challenge`** (RFC 7636 §4.6; mismatch → `invalid_grant`), client auth per §1.3. Return `access_token`, `id_token` (signed), `token_type=Bearer`, `expires_in=3600`. |
| `/v1/esignet/oidc/userinfo` | `Authorization: Bearer` → signed JWT with `sub` (the fixed test Fayda ID) and — for verify-only requests (`scope=openid`, no claims) — **nothing but `sub`** (OIDC Core §5.3.2; 08-…md §2.5). |
| JWKS | `/.well-known/jwks.json` exposing the mock's RSA public key (`kid`-matched) so the marketplace's signature validation path can be exercised end-to-end. |

**Fixed test identity:** `sub="fayda-test-0001"`, `name` (en+am), `email`, `phone_number`, `birthdate`, `address` — returned only if the corresponding claims/scopes were requested.

**Client auth decision:** mirror the real provider — accept **`private_key_jwt`** (`client_assertion` RS256 JWT, `aud`=token endpoint, verify signature against the mock-registered partner JWK). Do **not** fall back to `client_secret_basic`: the real eSignet does not offer it (§1.3), so accepting it would make the mock diverge from the swap target. Use `jose` (already common in Next.js) for sign/verify.

**Env-config seam (the "swap"):** a single client config — `FAYDA_ISSUER_URL` (mock base URL ↔ `https://esignet.ida.et`), `FAYDA_CLIENT_ID`, `FAYDA_CLIENT_PRIVATE_JWK`, `FAYDA_REDIRECT_URI`, `FAYDA_JWKS_URL` — drives `/verify-fayda/start` + `/callback`. Discovery is fetched at runtime, so pointing the issuer at the real esignet.ida.et (plus real credentials + registered redirect_uri) is a config change, per 08-…md §2.7 step 2 and issue #25.

**Dev-only guardrails:** mount the mock provider + `/verify-fayda/*` routes only when `NODE_ENV !== "production"` (or an explicit `FAYDA_MOCK=1` flag that the production build refuses); never bundle the mock's private key in the client; the real integration needs production HTTPS callbacks and a partner org (08-…md §2.8).

## 4. Open questions / risks

| # | Item | Detail |
|---|---|---|
| 1 | Token auth ambiguity | Resolved for the real eSignet: **`private_key_jwt` only** (docs.esignet.io). But production discovery was NOT re-verifiable live (below) — confirm `token_endpoint_auth_methods_supported` from esignet.ida.et at implementation time; token path may be `/v1/esignet/oauth/token` or `…/v2/token`. |
| 2 | Sign JWTs or skip? | Mock should sign real RS256 JWTs so the app's signature-validation path is exercised; but if validation is skipped in dev, the mock can issue unsigned/`alg=HS256` tokens — only acceptable if the client code still runs the same validation code against real esignet. Recommend signing. |
| 3 | redirect_uri registration | Real partner must register the exact production + dev callback; mock must enforce exact-match too or it teaches a wrong redirect rule (OIDC Core §3.1.2.1). |
| 4 | `record_verification` is admin-only | T21 needs a self-serve/system write path (or a new RPC) so the exchange can flip the user's own `fayda_verified`; conflicts with the current `is_admin()` gate — see §2 and issues #92/#73. |
| 5 | `sub` column | No `profiles.fayda_sub` column exists today (migration:61-63 adds only flags). Store `sub` in `verifications.notes` (≤2000 chars) or add a dedicated column; keep it non-PII-bearing per issue #25. |
| 6 | Dev-only leakage | Guardrails in §3 must be enforced — a mock provider that ships to a production build is a fake-identity vulnerability (issue #25 marks the mock "dev-only"). |
| 7 | acr_values | Repo doc says OTP-only vs OTP-or-biometrics; fayda-sdk lists `mosip:idp:acr:generated-code` / `…:generated-code:biometrics` while MOSIP sample lists `mosip:idp:acr:biometrics` — verify the deployed values via discovery. |

## 5. Sources

| Claim | Source |
|---|---|
| Endpoints, authorize/token/userinfo shape, PKCE, client_assertion, signing | `docs/02-architecture/08-fayda-and-chapa-integration.md` §2.1–2.8 (verified Aug 2026, incl. `https://esignet.ida.et/v1/esignet/oauth/.well-known/openid-configuration`) |
| `private_key_jwt` only; signed JWT userinfo; claims; scopes; discovery sample | `https://docs.esignet.io/esignet-authentication/develop/configuration/.well-known/openid-configuration` and `…/integration/relying-party/development-and-integration-with-esignet` (fetched); `https://github.com/mosip/esignet/blob/master/docs/esignet-openapi.yaml` |
| Client assertion JWT payload; token/userinfo error codes; claims JSON; JWK format | `https://github.com/haptome/fayda-sdk/blob/main/docs/FAYDA_API_REFERENCE.md` (extracted from id.gov.et + NIDL wiki) |
| Auth-code flow steps, token request/response, UserInfo contract, `sub` always returned | OIDC Core 1.0 — `https://openid.net/specs/openid-connect-core-1_0.html` §3.1.1, §3.1.3, §5.3 |
| PKCE S256, verifier length, challenge derivation, token-endpoint verification | RFC 7636 — `https://datatracker.ietf.org/doc/html/rfc7636` §4.1–4.6 |
| Onboarding / partner portal | `https://partner.fayda.et` (portal + `/docs` landing, fetched; doc content auth-gated), `https://id.gov.et/api` (login-gated) |
| App seam: badges, RPC, migration, trust score | `web/lib/verifications.ts:30-60`, `web/lib/verifications/constants.ts:18,27,30-54`, `web/supabase/migrations/20260814000000_create_verifications.sql:28,48-50,104-169,176-206` |
| T21 scope | GitHub issue `hamdi-ab/used-goods-marketplace#25` |

## 6. Unverified live / caveats

- **`esignet.ida.et` discovery was unreachable** during this research (transport error, HTTP `000`; Wayback has no snapshot) — its exact live payload could not be re-verified; the facts above rest on the repo's Aug-2026 integration doc (which recorded it live) + MOSIP eSignet docs + fayda-sdk. Re-fetch `/.well-known/openid-configuration` before building T21.
- `id.gov.et/api` and `partner.fayda.et` serve an auth-gated portal; public doc content behind login. `partner.fayda.et/docs` confirmed the doc sections exist (Quick Start, API Reference, Client Assertion & JWT, Error Handling & FAQs) but their body is login-gated.
- `chapa-sandbox-payments.md` (the usual style reference) does not exist in this repo; conventions followed from `docs/agents/research/*` siblings.

## 7. One-Line Recommendation

**Build the T21 mock as a faithful `private_key_jwt` eSignet (signed RS256 tokens, strict redirect/PKCE/state checks, verify-only `scope=openid`, fixed test `sub`, jwks served) behind an issuer URL that can be repointed to `https://esignet.ida.et` at runtime, and add the self-serve write path that today's admin-only `record_verification` lacks.**
