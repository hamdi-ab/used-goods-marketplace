import { randomBytes } from "node:crypto"

import { signJwt, verifyJwt } from "@/lib/fayda/jwt"
import { derivePkceChallenge } from "@/lib/fayda/constants"
import { FAYDA_SCOPE, FAYDA_TEST_SUB, FAYDA_MOCK_KID } from "@/lib/fayda/constants"

/**
 * The mock eSignet provider core (#25 / ADR-020). Pure logic — no Next.js
 * routing, no cookies, no network — so every authorize/token/userinfo rule the
 * real eSignet enforces is directly testable. The route handler
 * (`web/app/mock-fayda/[...path]/route.ts`) is a thin shell around these
 * functions and the in-memory code store.
 *
 * Faithfulness contract (ADR-020 D5): exact redirect_uri match, S256 PKCE
 * verified at the token endpoint, `scope=openid` required, client auth via
 * `client_assertion` RS256 (private_key_jwt) only, and verify-only userinfo
 * returning nothing but `sub`.
 */

export interface MockAuthorizeParams {
  responseType: string
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
  codeChallengeMethod: string
  registeredRedirectUri: string
}

export type AuthorizeValidation =
  | { ok: true }
  | { ok: false; error: "invalid_request" | "invalid_client" | "invalid_scope" }

// One issued code, bound to its challenge and redirect (RFC 7636 §4.4). Codes
// are single-use; used ones are deleted from the store.
export interface MockCodeRecord {
  client_id: string
  redirect_uri: string
  state: string
  code_challenge: string
  code_challenge_method: string
}

export type MockCodeStore = Map<string, MockCodeRecord>

export interface MockKeys {
  privateKeyPem: string
  publicKeyPem: string
}

export interface IssueCodeParams {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  codeChallengeMethod: string
}

export interface ExchangeParams {
  code: string
  redirectUri: string
  codeVerifier: string
  clientAssertion: string
  clientPublicKeyPem: string
  tokenEndpoint: string
  providerKeys: MockKeys
}

export type ExchangeResult =
  | { ok: true; accessToken: string; idToken: string }
  | { ok: false; error: string }

const AUTH_CODE_BYTES = 24

// The authorize endpoint's gate: response_type=code, the registered redirect
// must match exactly, scope must include openid, and a S256 challenge must be
// present (OIDC Core §3.1.2.1; research §1.2).
export function validateAuthorizeRequest(
  params: MockAuthorizeParams
): AuthorizeValidation {
  if (params.responseType !== "code") return { ok: false, error: "invalid_request" }
  if (params.redirectUri !== params.registeredRedirectUri) {
    return { ok: false, error: "invalid_request" }
  }
  const scopes = params.scope.split(/\s+/)
  if (!scopes.includes(FAYDA_SCOPE)) return { ok: false, error: "invalid_scope" }
  if (!params.codeChallenge || params.codeChallengeMethod !== "S256") {
    return { ok: false, error: "invalid_request" }
  }
  return { ok: true }
}

// Issue a single-use auth code bound to its challenge and redirect. The
// caller (route) renders the mock consent page then calls this on approval.
export function issueAuthorizationCode(
  store: MockCodeStore,
  params: IssueCodeParams
): { code: string; state: string } {
  const code = randomBytes(AUTH_CODE_BYTES).toString("base64url")
  store.set(code, {
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod,
  })
  return { code, state: params.state }
}

// The token endpoint: PKCE S256 verified against the stored challenge
// (RFC 7636 §4.6) and the client authenticated by its RS256 client_assertion
// JWT (private_key_jwt — the only method eSignet supports, research §1.3).
// On success the code is consumed (single-use) and signed access/id tokens
// issued under the provider's key.
export async function exchangeAuthorizationCode(
  store: MockCodeStore,
  params: ExchangeParams
): Promise<ExchangeResult> {
  const record = store.get(params.code)
  if (!record) return { ok: false, error: "invalid_grant" }

  if (record.redirect_uri !== params.redirectUri) {
    return { ok: false, error: "invalid_grant" }
  }
  if (
    record.code_challenge_method !== "S256" ||
    derivePkceChallenge(params.codeVerifier) !== record.code_challenge
  ) {
    return { ok: false, error: "invalid_grant" }
  }

  const assertion = verifyJwt(params.clientAssertion, params.clientPublicKeyPem, {
    issuer: record.client_id,
    audience: params.tokenEndpoint,
  })
  if (!assertion) return { ok: false, error: "invalid_client" }

  store.delete(params.code)

  return {
    ok: true,
    accessToken: signJwt({ sub: FAYDA_TEST_SUB }, params.providerKeys.privateKeyPem, { kid: FAYDA_MOCK_KID }),
    idToken: signJwt(
      { iss: "fayda-mock", sub: FAYDA_TEST_SUB, aud: record.client_id },
      params.providerKeys.privateKeyPem,
      { kid: FAYDA_MOCK_KID }
    ),
  }
}

// The userinfo endpoint: verify-only — a signed JWT carrying the unique `sub`
// plus issuer/audience metadata the client validates (OIDC Core §5.3.2: a signed
// UserInfo Response MUST name the OAuth client as `aud`). No PII claims are ever
// added; in verify-only mode only `sub` is returned (research §1.4).
export function issueUserinfo(
  providerKeys: MockKeys,
  issuer: string,
  clientId: string,
  sub: string = FAYDA_TEST_SUB
): string {
  return signJwt(
    { iss: issuer, aud: clientId, sub },
    providerKeys.privateKeyPem,
    { kid: FAYDA_MOCK_KID }
  )
}