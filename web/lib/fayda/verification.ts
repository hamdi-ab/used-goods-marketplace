import "server-only"

import type { Supabase } from "@/lib/supabase/types"
import {
  FAYDA_ENV,
  derivePkceChallenge,
  buildAuthorizeUrl,
} from "@/lib/fayda/constants"
import type {
  DiscoveryDocument,
  TokenResponse,
} from "@/lib/fayda/constants"
import {
  verifyJwt,
  randomState,
  randomVerifier,
} from "@/lib/fayda/jwt"

/**
 * Fayda verification server seam (#25 / ADR-020). Server-only.
 *
 * Owns the *app side* of the Fayda OIDC flow: config detection, the authorize
 * redirect, and — after a verified exchange — recording the verification. The
 * mock provider lives in `fayda/mock.ts` + the `mock-fayda/` route; the network
 * glue lives here.
 */

export interface RecordFaydaVerificationResult {
  ok: boolean
  error: string | null
}

// The app side never touches the admin-gated `record_verification` RPC. This
// self-issued RPC (ADR-020 D3) is the only path that flips the fayda flag from
// a user's own successful exchange — it takes the verified `sub` as proof.
//
// NOTE (binding phase): the `record_fayda_verification` name is intentionally
// not added to `RpcName` in `lib/supabase/rpc.ts` yet, because that file is
// being edited by another in-flight ticket (#73); the union promotion lands in
// the binding phase once #73 merges. For now we call the RPC by string literal,
// exactly as record_verification is reached via callOutcomeRpc elsewhere.
export async function recordFaydaVerification(
  supabase: Supabase,
  params: { userId: string; sub: string }
): Promise<RecordFaydaVerificationResult> {
  const { data, error } = await supabase.rpc(
    "record_fayda_verification",
    { p_user_id: params.userId, p_sub: params.sub }
  )

  if (error) {
    return { ok: false, error: error.message }
  }
  const outcome = (data ?? {}) as { ok?: boolean; error?: string | null }
  return {
    ok: outcome.ok === true,
    error: outcome.error ?? null,
  }
}

// Dev-only detection. In demo mode the issuer is the in-app mock provider and
// the client assertion is signed against the mock's demo keypair (ADR-020 D6).
export function faydaConfigured(): boolean {
  return Boolean(process.env[FAYDA_ENV.ISSUER_URL])
}

export function faydaMockMode(): boolean {
  return process.env[FAYDA_ENV.MOCK] === "true"
}

// Start the OIDC flow: generate a fresh PKCE pair + CSRF state, build the
// authorize URL (verify-only: scope=openid, no claims) and hand back what the
// caller must stash in a cookie to validate the callback. The URL builder itself
// is pure and tested in the constants suite.
export function startFaydaAuthorization(): StartResult {
  const codeVerifier = randomVerifier()
  const codeChallenge = derivePkceChallenge(codeVerifier)
  const state = randomState()
  const issuerBase = process.env[FAYDA_ENV.ISSUER_URL]
  if (!issuerBase) throw new Error("FAYDA_ISSUER_URL is not configured")
  const clientId = process.env[FAYDA_ENV.CLIENT_ID]
  if (!clientId) throw new Error("FAYDA_CLIENT_ID is not configured")
  const redirectUri = process.env[FAYDA_ENV.REDIRECT_URI]
  if (!redirectUri) throw new Error("FAYDA_REDIRECT_URI is not configured")
  const authorizeUrl = buildAuthorizeUrl({
    issuerBase,
    clientId,
    redirectUri,
    state,
    codeChallenge,
  })
  return { authorizeUrl, codeVerifier, state, codeChallenge }
}

export interface StartResult {
  authorizeUrl: string
  codeVerifier: string
  state: string
  codeChallenge: string
}

// Verify the signed Userinfo JWT (the IdP's `sub` is the only claim we request
// in verify-only mode) and, on success, record the self-issued verification.
// Public-key resolution (kid → PEM) is done by the caller; the route fetches
// the discovery doc + JWKS and passes the matched provider public key in. This
// keeps signature/claim validation + the RPC call testable without network: the
// route is thin glue, this is the seam.
export interface VerifyFaydaOptions {
  jws: string
  providerPublicKeyPem: string
  issuer: string
  audience: string // the registered client_id the provider signed the JWT for
}

export async function verifyAndRecord(
  supabase: Supabase,
  userId: string,
  opts: VerifyFaydaOptions
): Promise<RecordFaydaVerificationResult> {
  const claims = verifyJwt(opts.jws, opts.providerPublicKeyPem, {
    issuer: opts.issuer,
    audience: opts.audience,
  })
  if (!claims) {
    return { ok: false, error: "token_invalid" }
  }
  const sub =
    typeof claims.sub === "string" && claims.sub.length > 0
      ? claims.sub
      : null
  if (!sub) {
    return { ok: false, error: "missing_sub" }
  }
  return recordFaydaVerification(supabase, { userId, sub })
}

// Injectable OAuth transport: the network-bound pieces the route performs.
// Defaults (used in production) do real fetches against FAYDA_ISSUER_URL; tests
// inject fakes so the happy-path / failure-path orchestration is verifiable
// without a network or a running IdP.
export interface OAuthTransport {
  fetchDiscovery: () => Promise<DiscoveryDocument>
  fetchToken: () => Promise<TokenResponse>
  fetchUserinfo: (accessToken: string) => Promise<string>
}

export interface CompleteFaydaParams {
  // PKCE + CSRF state, echoed back from the IdP. Validated in order: state
  // first (CSRF), then the PKCE verifier against the stored challenge.
  code: string
  state: string
  cookieState: string
  codeVerifier: string
  cookieCodeChallenge: string
  // Resolved by the caller from the provider's JWKS (kid-matched).
  providerPublicKeyPem: string
  clientId: string
  transport: OAuthTransport
}

export interface CompleteFaydaResult {
  ok: boolean
  error: string | null
}

// Drive the back half of the auth-code flow: validate CSRF + PKCE, exchange the
// code, fetch & signature-validate the verify-only userinfo JWT, then record
// the self-issued verification. Every failure resolves to a safe envelope; a
// failure before the exchange never reaches the DB.
export async function completeFaydaAuthorization(
  supabase: Supabase,
  userId: string,
  params: CompleteFaydaParams
): Promise<CompleteFaydaResult> {
  if (!params.state || params.state !== params.cookieState) {
    return { ok: false, error: "invalid_state" }
  }
  if (
    params.codeVerifier &&
    params.cookieCodeChallenge &&
    derivePkceChallenge(params.codeVerifier) !== params.cookieCodeChallenge
  ) {
    return { ok: false, error: "invalid_grant" }
  }

  let discovery: DiscoveryDocument
  try {
    discovery = await params.transport.fetchDiscovery()
  } catch {
    return { ok: false, error: "discovery_failed" }
  }

  // Assemble the token request (PKCE verifier + client_assertion RS256). The
  // client_assertion itself is built by the caller (it needs the client private
  // key) and threaded through the transport; the body here is what the real
  // route POSTs and what the fake returns from.
  let tokens: TokenResponse
  try {
    tokens = await params.transport.fetchToken()
  } catch {
    return { ok: false, error: "token_exchange_failed" }
  }

  let userinfoJws: string
  try {
    userinfoJws = await params.transport.fetchUserinfo(tokens.accessToken)
  } catch {
    return { ok: false, error: "userinfo_failed" }
  }

  return verifyAndRecord(supabase, userId, {
    jws: userinfoJws,
    providerPublicKeyPem: params.providerPublicKeyPem,
    issuer: discovery.issuer,
    audience: params.clientId,
  })
}