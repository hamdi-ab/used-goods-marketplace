import { createHash } from "node:crypto"

import { signJwt } from "@/lib/fayda/jwt"

/**
 * Pure Fayda verification value objects (#25 / ADR-020).
 *
 * Server-free: no `server-only` import and no Supabase client, so the pure
 * helpers (PKCE, authorize-URL builder, discovery/token parsing) are directly
 * testable and reusable by both the app routes and the mock provider.
 *
 * Domain contract (ADR-020, verify-only): the marketplace only ever requests
 * `scope=openid` with no `claims`, so UserInfo returns just the unique Fayda
 * `sub` — zero PII. The mock and the real esignet.ida.et are interchangeable
 * because both speak this same OIDC surface.
 */

// Verify-only scope. `openid` is REQUIRED by OIDC Core §3.1.2.1; requesting
// anything beyond it (profile/email) would pull PII claims back.
export const FAYDA_SCOPE = "openid"

// The mock provider's fixed test identity (research §3). Only the `sub` is
// ever returned in verify-only mode.
export const FAYDA_TEST_SUB = "fayda-test-0001"

// The mock JWKS `kid` (research §3). The client validates signed JWTs by this
// key; the real provider matches its own `kid` from its jwks_uri.
export const FAYDA_MOCK_KID = "fayda-mock-key-1"

// Env-config seam (research §3): pointing FAYDA_ISSUER_URL at the real
// esignet.ida.et plus real credentials is the whole "swap" story.
// The JWKS is always resolved from the issuer's discovery document, never from
// a separate env value — FAYDA_JWKS_URL was a dead config and is deliberately
// absent (a second, unvetted key source would only weaken signature checks).
export const FAYDA_ENV = {
  ISSUER_URL: "FAYDA_ISSUER_URL",
  CLIENT_ID: "FAYDA_CLIENT_ID",
  CLIENT_PRIVATE_JWK: "FAYDA_CLIENT_PRIVATE_JWK",
  REDIRECT_URI: "FAYDA_REDIRECT_URI",
  MOCK: "FAYDA_MOCK",
} as const

export interface ClientAssertionParams {
  clientId: string
  tokenEndpoint: string
  privateKeyPem: string
}

export interface ClientAssertion {
  assertion: string
  assertionType: string
}

// The RS256 `client_assertion` JWT the app sends at the token endpoint
// (private_key_jwt — the only client-auth method eSignet supports, research §1.3).
// Payload: iss/sub = client_id, aud = token endpoint, iat + a short exp.
export function buildClientAssertion(params: ClientAssertionParams): ClientAssertion {
  const now = Math.floor(Date.now() / 1000)
  return {
    assertion: signJwt(
      {
        iss: params.clientId,
        sub: params.clientId,
        aud: params.tokenEndpoint,
        iat: now,
        exp: now + 300,
      },
      params.privateKeyPem,
      {}
    ),
    assertionType: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  }
}

export interface DiscoveryDocument {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  scopes_supported?: string[]
}

export interface JwksDocument {
  keys: Array<{ kid?: string } & Record<string, unknown>>
}

// Pick the JWK matching a JWT's `kid`. When the JWT names a kid, an exact match
// is required — a mismatched key must fail, not silently fall back to the first
// key. The no-kid fallback to `keys[0]` is the demo-mock tolerance only (the
// mock signs everything under FAYDA_MOCK_KID and serves a single-key JWKS).
export function selectJwkByKid(jwks: JwksDocument, kid?: string): JwksDocument["keys"][number] | null {
  if (kid) {
    return jwks.keys.find((k) => k.kid === kid) ?? null
  }
  return jwks.keys[0] ?? null
}

export interface AuthorizeUrlParams {
  issuerBase: string
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
}

export interface TokenRequestBodyParams {
  tokenEndpoint: string
  clientId: string
  code: string
  redirectUri: string
  codeVerifier: string
  clientAssertion: string
}

export interface TokenResponse {
  accessToken: string
  idToken: string
}

// RFC 7636 §4.2: BASE64URL(SHA256(verifier)) — the S256 PKCE challenge.
export function derivePkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url")
}

// The authorize URL the app sends the user to. Verify-only: `scope=openid`,
// no `claims`, no `acr_values` (research §1.2). redirect_uri must match the
// registered callback exactly (OIDC Core §3.1.2.1).
export function buildAuthorizeUrl(params: AuthorizeUrlParams): string {
  const url = new URL(`${params.issuerBase}/authorize`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", params.clientId)
  url.searchParams.set("redirect_uri", params.redirectUri)
  url.searchParams.set("scope", FAYDA_SCOPE)
  url.searchParams.set("state", params.state)
  url.searchParams.set("code_challenge", params.codeChallenge)
  url.searchParams.set("code_challenge_method", "S256")
  return url.toString()
}

// Parse the OIDC discovery document. Endpoints are always read from here
// (never hard-coded) so the mock and the real eSignet both resolve correctly.
export function parseDiscovery(doc: Record<string, unknown>): DiscoveryDocument {
  const required = [
    "issuer",
    "authorization_endpoint",
    "token_endpoint",
    "userinfo_endpoint",
    "jwks_uri",
  ] as const
  for (const key of required) {
    if (typeof doc[key] !== "string" || !doc[key]) {
      throw new Error(`discovery document is missing ${key}`)
    }
  }
  return {
    issuer: doc.issuer as string,
    authorization_endpoint: doc.authorization_endpoint as string,
    token_endpoint: doc.token_endpoint as string,
    userinfo_endpoint: doc.userinfo_endpoint as string,
    jwks_uri: doc.jwks_uri as string,
    scopes_supported: Array.isArray(doc.scopes_supported)
      ? (doc.scopes_supported as string[])
      : undefined,
  }
}

// The form-encoded token request body. Client authentication is the RS256
// `client_assertion` (private_key_jwt — eSignet offers no client_secret),
// per research §1.3.
export function buildTokenRequestBody(params: TokenRequestBodyParams): URLSearchParams {
  return new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
    client_assertion: params.clientAssertion,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  })
}

export function parseTokenResponse(json: Record<string, unknown>): TokenResponse {
  const { access_token: accessToken, id_token: idToken } = json
  if (typeof accessToken !== "string" || typeof idToken !== "string") {
    throw new Error("token response is missing access_token or id_token")
  }
  return { accessToken, idToken }
}