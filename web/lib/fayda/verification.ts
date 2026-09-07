import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  FAYDA_ENV,
  derivePkceChallenge,
  buildAuthorizeUrl,
  buildClientAssertion,
  buildTokenRequestBody,
  parseDiscovery,
  parseTokenResponse,
  selectJwkByKid,
  type DiscoveryDocument,
  type JwksDocument,
  type TokenResponse,
} from "@/lib/fayda/constants"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import {
  verifyJwt,
  parseJwt,
  randomState,
  randomVerifier,
} from "@/lib/fayda/jwt"
import { jwkToPublicKeyPem } from "@/lib/fayda/keys"

/**
 * Fayda verification server seam (#25 / ADR-020). Server-only.
 *
 * Owns the *app side* of the Fayda OIDC flow: config detection, the authorize
 * redirect, and — after a verified exchange — recording the verification. The
 * mock provider lives in `fayda/mock.ts` + the `mock-fayda/` route; the network
 * glue lives here behind `OAuthTransport`, the one seam that reaches the IdP.
 */

export interface RecordFaydaVerificationResult {
  ok: boolean
  error: string | null
}

// The app side never touches the admin-gated `record_verification` RPC. This
// self-issued RPC (ADR-020 D3) is the only path that flips the fayda flag from
// a user's own successful exchange — it takes the verified `sub` as proof. It
// is part of the typed RPC union in `lib/supabase/rpc.ts`, so a renamed or
// dropped RPC fails to compile instead of surfacing as a runtime magic-string
// typo (the same seam `record_verification` reaches via callOutcomeRpc).
export async function recordFaydaVerification(
  supabase: SupabaseClient,
  params: { userId: string; sub: string }
): Promise<RecordFaydaVerificationResult> {
  return callOutcomeRpc(
    supabase,
    "record_fayda_verification",
    { p_user_id: params.userId, p_sub: params.sub },
    "recordFaydaVerification"
  )
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
// is pure and tested in the constants suite. Only the verifier (and state) are
// stored server-side; the S256 challenge is derived from the verifier, so
// storing it too would be redundant state that could silently weaken the check.
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
// Signature/claim validation + the RPC call are testable without network; the
// network lives in the OAuthTransport behind the same seam.
export interface VerifyFaydaOptions {
  jws: string
  providerPublicKeyPem: string
  issuer: string
  audience: string // the registered client_id the provider signed the JWT for
}

export async function verifyAndRecord(
  supabase: SupabaseClient,
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

// The OAuth transport: the network-bound pieces of the flow. The default
// implementation (createFaydaTransport) does real fetches against the configured
// issuer — the in-app mock provider and the real esignet.ida.et both speak this
// same OIDC surface, so the network path exercises the exact seam the tests
// exercise. Tests inject fakes so orchestration + failure paths are verifiable
// without a network or a running IdP.
export interface OAuthTransport {
  fetchDiscovery: () => Promise<DiscoveryDocument>
  fetchJwks: () => Promise<JwksDocument>
  exchangeCode: (params: { code: string; codeVerifier: string }) => Promise<TokenResponse>
  fetchUserinfo: (accessToken: string) => Promise<string>
}

export interface FaydaTransportConfig {
  issuerUrl: string
  clientId: string
  redirectUri: string
  clientKey: { privateKeyPem: string }
}

// The default transport: real network against the configured issuer. Discovery
// is fetched once and memoised, so the token exchange and userinfo calls ride
// on a single discovery fetch. Token auth is the RS256 `client_assertion`
// (private_key_jwt — the only client-auth method eSignet supports).
export function createFaydaTransport(config: FaydaTransportConfig): OAuthTransport {
  let discoveryPromise: Promise<DiscoveryDocument> | null = null
  const discovery = (): Promise<DiscoveryDocument> => {
    discoveryPromise ??= fetch(`${config.issuerUrl}/.well-known/openid-configuration`)
      .then((res) => {
        if (!res.ok) throw new Error(`discovery failed: ${res.status}`)
        return res.json() as Promise<Record<string, unknown>>
      })
      .then(parseDiscovery)
    return discoveryPromise
  }

  return {
    fetchDiscovery: discovery,
    async fetchJwks() {
      const doc = await discovery()
      const res = await fetch(doc.jwks_uri)
      if (!res.ok) throw new Error(`jwks fetch failed: ${res.status}`)
      return res.json() as Promise<JwksDocument>
    },
    async exchangeCode({ code, codeVerifier }) {
      const doc = await discovery()
      const assertion = buildClientAssertion({
        clientId: config.clientId,
        tokenEndpoint: doc.token_endpoint,
        privateKeyPem: config.clientKey.privateKeyPem,
      })
      const body = buildTokenRequestBody({
        tokenEndpoint: doc.token_endpoint,
        clientId: config.clientId,
        code,
        redirectUri: config.redirectUri,
        codeVerifier,
        clientAssertion: assertion.assertion,
      })
      const res = await fetch(doc.token_endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      })
      if (!res.ok) throw new Error(`token exchange failed: ${res.status}`)
      return parseTokenResponse(await res.json())
    },
    async fetchUserinfo(accessToken) {
      const doc = await discovery()
      const res = await fetch(doc.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error(`userinfo fetch failed: ${res.status}`)
      return res.text()
    },
  }
}

export interface CompleteFaydaParams {
  // PKCE + CSRF state, echoed back from the IdP. Validated in order: state
  // first (CSRF), then the PKCE verifier (its S256 challenge was derived at
  // start and validated by the IdP at the token endpoint — no separate stored
  // challenge to compare against).
  code: string
  state: string
  cookieState: string
  codeVerifier: string
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
  supabase: SupabaseClient,
  userId: string,
  params: CompleteFaydaParams
): Promise<CompleteFaydaResult> {
  if (!params.state || params.state !== params.cookieState) {
    return { ok: false, error: "invalid_state" }
  }
  // PKCE is unconditional: the verifier must be present. It can only have come
  // from our own httpOnly cookie, set at start — there is no way for the IdP's
  // callback to conjure it. The S256 challenge is derived from this verifier
  // and the IdP validates the code against it at the token endpoint.
  if (!params.codeVerifier) {
    return { ok: false, error: "invalid_request" }
  }

  let discovery: DiscoveryDocument
  try {
    discovery = await params.transport.fetchDiscovery()
  } catch {
    return { ok: false, error: "discovery_failed" }
  }

  let tokens: TokenResponse
  try {
    tokens = await params.transport.exchangeCode({
      code: params.code,
      codeVerifier: params.codeVerifier,
    })
  } catch {
    return { ok: false, error: "token_exchange_failed" }
  }

  let userinfoJws: string
  try {
    userinfoJws = await params.transport.fetchUserinfo(tokens.accessToken)
  } catch {
    return { ok: false, error: "userinfo_failed" }
  }

  // Resolve the provider's signing key from its JWKS, kid-matched to the
  // userinfo JWS header. OIDC Core §5.3.2 does not guarantee the id_token and
  // userinfo are signed under the same key, so we match the token we are
  // actually validating (the mock signs both under FAYDA_MOCK_KID).
  let jwks: JwksDocument
  try {
    jwks = await params.transport.fetchJwks()
  } catch {
    return { ok: false, error: "discovery_failed" }
  }
  const userinfoHeader = parseJwt(userinfoJws)?.header
  const providerKey = selectJwkByKid(jwks, userinfoHeader?.kid)
  if (!providerKey) {
    return { ok: false, error: "token_invalid" }
  }
  const providerPublicKeyPem = jwkToPublicKeyPem(providerKey)

  return verifyAndRecord(supabase, userId, {
    jws: userinfoJws,
    providerPublicKeyPem,
    issuer: discovery.issuer,
    audience: params.clientId,
  })
}