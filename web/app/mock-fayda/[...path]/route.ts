import "server-only"

import { NextResponse } from "next/server"

import { faydaMockMode } from "@/lib/fayda/verification"
import { getProviderKeys, getDevClientKeys, toJwks } from "@/lib/fayda/keys"
import type { FaydaKeyPair } from "@/lib/fayda/keys"
import { FAYDA_MOCK_KID, FAYDA_TEST_SUB, FAYDA_ENV } from "@/lib/fayda/constants"
import { faydaIssuerBase, faydaRedirectUri } from "@/lib/site"
import {
  validateAuthorizeRequest,
  issueAuthorizationCode,
  exchangeAuthorizationCode,
  issueUserinfo,
  type MockCodeStore,
} from "@/lib/fayda/mock"

// In-memory store of issued auth codes (dev-only mock, single process).
// Codes are bound to their PKCE challenge + redirect_uri and are single-use
// (RFC 7636 §4.4) — mirrors the real eSignet's one-time-code semantics. There
// is no persistence: codes expire when the dev server restarts, acceptable for a
// mock that never ships to production.
const codes: MockCodeStore = new Map()

// The provider signing key that backs the mock's jwks.json. Re-used across
// requests (same process) so the client's kid-matched verification holds.
function providerKeys(): FaydaKeyPair {
  return getProviderKeys()
}

function registeredRedirectUri(): string {
  return faydaRedirectUri()
}

function issuerBase(request: Request): string {
  return faydaIssuerBase()
}

// Discovery: a faithful eSignet surface so the marketplace's discovery-fetching
// code is exercised unchanged. Token auth is `private_key_jwt` only (research
// §1.3) — advertising client_secret_basic here would teach wrong behaviour.
function discoveryDocument(base: string): Record<string, unknown> {
  return {
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/v1/esignet/oauth/token`,
    userinfo_endpoint: `${base}/v1/esignet/oidc/userinfo`,
    jwks_uri: `${base}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["private_key_jwt"],
    scopes_supported: ["openid"],
  }
}

function consentHtml(approvePath: string, params: URLSearchParams): string {
  return `<!doctype html><html><head><title>Fayda (demo)</title></head>
<body style="font-family:sans-serif;max-width:420px;margin:40px auto">
<h1>Fayda (demo)</h1>
<p>Dev-only mock of Ethiopia's national digital ID provider (NIDP Fayda/eSignet). Not for production.</p>
<p>Demo identity: <b>${FAYDA_TEST_SUB}</b></p>
<form method="post" action="${approvePath}">
  <input type="hidden" name="state" value="${params.get("state") ?? ""}" />
  <input type="hidden" name="client_id" value="${params.get("client_id") ?? ""}" />
  <input type="hidden" name="redirect_uri" value="${params.get("redirect_uri") ?? ""}" />
  <input type="hidden" name="code_challenge" value="${params.get("code_challenge") ?? ""}" />
  <input type="hidden" name="code_challenge_method" value="S256" />
  <button type="submit" style="padding:8px 16px">Approve (demo)</button>
</form>
</body></html>`
}

function redirectError(dest: string | null, error: string): NextResponse {
  if (!dest) return NextResponse.json({ error }, { status: 400 })
  const url = new URL(dest)
  url.searchParams.set("error", error)
  return NextResponse.redirect(url, { status: 303 })
}

// Demo-mode gate: the mock provider is active whenever FAYDA_MOCK=true.
// For the competition demo we run the mock in the deployed build (no real
// eSignet credentials available). Set FAYDA_MOCK=false + real FAYDA_ISSUER_URL
// to switch to production Fayda — the OIDC surface is identical.
function mockAllowed(): boolean {
  return faydaMockMode()
}

export async function GET(request: Request): Promise<Response> {
  if (!mockAllowed()) return new NextResponse("Not found", { status: 404 })
  const url = new URL(request.url)
  const segments = url.pathname.split("/").filter(Boolean)
  // segments[0] === "mock-fayda"
  const path = segments.slice(1)
  const base = issuerBase(request)

  if (path[0] === ".well-known" && path[1] === "openid-configuration") {
    return NextResponse.json(discoveryDocument(base))
  }
  if (path[0] === ".well-known" && path[1] === "jwks.json") {
    return NextResponse.json(toJwks(providerKeys(), FAYDA_MOCK_KID))
  }
  if (path[0] === "v1" && path[1] === "esignet" && path[2] === "oidc" && path[3] === "userinfo") {
    // verify-only: a signed JWT carrying nothing but the `sub` plus the
    // iss/audience metadata the client validates (research §1.4, OIDC Core
    // §5.3.2). No PII is ever disclosed here.
    const token = issueUserinfo(
      providerKeys(),
      base,
      process.env[FAYDA_ENV.CLIENT_ID] ?? "",
      FAYDA_TEST_SUB
    )
    return new NextResponse(token, {
      headers: { "content-type": "application/jwt" },
    })
  }

  if (path[0] === "authorize") {
    const p = url.searchParams
    const validation = validateAuthorizeRequest({
      responseType: p.get("response_type") ?? "",
      clientId: p.get("client_id") ?? "",
      redirectUri: p.get("redirect_uri") ?? "",
      scope: p.get("scope") ?? "",
      state: p.get("state") ?? "",
      codeChallenge: p.get("code_challenge") ?? "",
      codeChallengeMethod: p.get("code_challenge_method") ?? "",
      registeredRedirectUri: registeredRedirectUri(),
    })
    if (!validation.ok) {
      return redirectError(p.get("redirect_uri"), validation.error)
    }
    return new NextResponse(consentHtml(`${base}/authorize`, p), {
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  }

  return new NextResponse("Not found", { status: 404 })
}

export async function POST(request: Request): Promise<Response> {
  if (!mockAllowed()) return new NextResponse("Not found", { status: 404 })
  const url = new URL(request.url)
  const segments = url.pathname.split("/").filter(Boolean)
  const path = segments.slice(1)
  const base = issuerBase(request)

  if (path[0] === "authorize") {
    const form = await request.formData()
    const params: Record<string, string> = {}
    for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : ""
    const validation = validateAuthorizeRequest({
      responseType: "code",
      clientId: params.client_id,
      redirectUri: params.redirect_uri,
      scope: "openid",
      state: params.state ?? "",
      codeChallenge: params.code_challenge,
      codeChallengeMethod: "S256",
      registeredRedirectUri: registeredRedirectUri(),
    })
    if (!validation.ok) {
      return redirectError(params.redirect_uri, validation.error)
    }
    const issued = issueAuthorizationCode(codes, {
      clientId: params.client_id,
      redirectUri: params.redirect_uri,
      state: params.state ?? "",
      codeChallenge: params.code_challenge,
      codeChallengeMethod: "S256",
    })
    const dest = new URL(params.redirect_uri)
    dest.searchParams.set("code", issued.code)
    dest.searchParams.set("state", issued.state)
    return NextResponse.redirect(dest, { status: 303 })
  }

  if (
    path[0] === "v1" &&
    path[1] === "esignet" &&
    path[2] === "oauth" &&
    path[3] === "token"
  ) {
    const form = await request.formData()
    const toStr = (k: string) => (form.get(k) ?? "") as string
    const result = await exchangeAuthorizationCode(codes, {
      code: toStr("code"),
      redirectUri: toStr("redirect_uri"),
      codeVerifier: toStr("code_verifier"),
      clientAssertion: toStr("client_assertion"),
      clientPublicKeyPem: getDevClientKeys().publicKeyPem,
      tokenEndpoint: `${url.origin}${url.pathname}`,
      issuer: base,
      providerKeys: providerKeys(),
    })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({
      access_token: result.accessToken,
      id_token: result.idToken,
      token_type: "Bearer",
      expires_in: 3600,
    })
  }

  return new NextResponse("Not found", { status: 404 })
}