import "server-only"

import { createPrivateKey } from "node:crypto"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"
import { faydaConfigured, faydaMockMode, completeFaydaAuthorization } from "@/lib/fayda/verification"
import {
  parseDiscovery,
  parseTokenResponse,
  buildTokenRequestBody,
  buildClientAssertion,
  selectJwkByKid,
  type DiscoveryDocument,
  type JwksDocument,
} from "@/lib/fayda/constants"
import { getDevClientKeys, jwkToPublicKeyPem } from "@/lib/fayda/keys"
import { parseJwt } from "@/lib/fayda/jwt"

// The IdP returns here with `?code=…&state=…` after the user authenticates at
// the (mocked or real) eSignet. This handler is the back half of the auth-code
// flow: validate CSRF + PKCE, exchange the code, fetch & signature-validate the
// verify-only Userinfo JWT, and record the self-issued verification (#25, ADR-020).
//
// All real work is delegated to the testable seam in lib/fayda/verification +
// lib/fayda/{jwt,keys,constants, mock}; this file is only the fetch glue +
// cookie/session boundary.
export async function GET(request: Request): Promise<Response> {
  if (!faydaConfigured()) {
    return new NextResponse("Fayda verification is not configured.", { status: 503 })
  }

  const user = await requireUser()
  const cookieStore = await cookies()
  const state = cookieStore.get("fayda_state")?.value
  const codeVerifier = cookieStore.get("fayda_verifier")?.value
  const codeChallenge = cookieStore.get("fayda_challenge")?.value

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const returnedState = url.searchParams.get("state")

  const fail = (error: string) =>
    NextResponse.redirect(`/profile?verified=fayda&error=${encodeURIComponent(error)}`, { status: 303 })

  if (!state || !code || !returnedState || state !== returnedState) {
    return fail("invalid_state")
  }
  if (!codeVerifier) return fail("invalid_request")

  const issuerUrl = process.env.FAYDA_ISSUER_URL!
  const clientId = process.env.FAYDA_CLIENT_ID!

  // Resolve the provider's signing key from its JWKS (kid-matched), so userinfo
  // signature validation exercises the real key-distribution path the client
  // will use against esignet.ida.et.
  const discovery = await fetchDiscovery(issuerUrl)
  const jwks = await fetchJson<JwksDocument>(discovery.jwks_uri)
  const clientKey = resolveClientKey()
  const tokenResponse = await fetchToken(discovery, clientId, code, codeVerifier, clientKey)
  if (!tokenResponse) return fail("token_exchange_failed")

  const idHeader = parseJwt(tokenResponse.idToken)?.header
  const providerKey = selectJwkByKid(jwks, idHeader?.kid)
  if (!providerKey) return fail("token_invalid")
  const providerPublicKeyPem = jwkToPublicKeyPem(providerKey)

  const userinfoJws = await fetch(`${discovery.userinfo_endpoint}`, {
    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
  }).then((r) => (r.ok ? r.text() : ""))

  if (!userinfoJws) return fail("userinfo_failed")

  const result = await completeFaydaAuthorization(await createClient(), user.id, {
    code,
    state: returnedState,
    cookieState: state,
    codeVerifier,
    cookieCodeChallenge: codeChallenge ?? "",
    providerPublicKeyPem,
    clientId,
    transport: {
      fetchDiscovery: () => Promise.resolve(discovery),
      fetchToken: () => Promise.resolve(tokenResponse),
      fetchUserinfo: () => Promise.resolve(userinfoJws),
    },
  })

  const dest = result.ok
    ? "/profile?verified=fayda"
    : `/profile?verified=fayda&error=${encodeURIComponent(result.error ?? "verification_failed")}`
  return NextResponse.redirect(dest, { status: 303 })
}

function resolveClientKey(): { privateKeyPem: string } {
  if (faydaMockMode()) return { privateKeyPem: getDevClientKeys().privateKeyPem }
  // Real path: FAYDA_CLIENT_PRIVATE_JWK is a JSON JWK string from onboarding
  // (production-only — the demo exercises the mock path).
  const jwkJson = process.env.FAYDA_CLIENT_PRIVATE_JWK
  if (!jwkJson) throw new Error("FAYDA_CLIENT_PRIVATE_JWK is not configured")
  const pem = createPrivateKey({
    key: JSON.parse(jwkJson),
    format: "jwk",
  }).export({ type: "pkcs8", format: "pem" }) as string
  return { privateKeyPem: pem }
}

async function fetchDiscovery(issuerUrl: string): Promise<DiscoveryDocument> {
  const res = await fetch(`${issuerUrl}/.well-known/openid-configuration`)
  if (!res.ok) throw new Error(`discovery failed: ${res.status}`)
  return parseDiscovery(await res.json())
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function fetchToken(
  discovery: DiscoveryDocument,
  clientId: string,
  code: string,
  codeVerifier: string,
  clientKey: { privateKeyPem: string }
): Promise<{ accessToken: string; idToken: string } | null> {
  const assertion = buildClientAssertion({
    clientId,
    tokenEndpoint: discovery.token_endpoint,
    privateKeyPem: clientKey.privateKeyPem,
  })
  const body = buildTokenRequestBody({
    tokenEndpoint: discovery.token_endpoint,
    clientId,
    code,
    redirectUri: process.env.FAYDA_REDIRECT_URI ?? "",
    codeVerifier,
    clientAssertion: assertion.assertion,
  })
  const res = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) return null
  try {
    return parseTokenResponse(await res.json())
  } catch {
    return null
  }
}