import "server-only"

import { createPrivateKey } from "node:crypto"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"
import {
  faydaConfigured,
  faydaMockMode,
  completeFaydaAuthorization,
  createFaydaTransport,
} from "@/lib/fayda/verification"
import { getDevClientKeys } from "@/lib/fayda/keys"
import { FAYDA_ENV } from "@/lib/fayda/constants"

// The IdP returns here with `?code=…&state=…` after the user authenticates at
// the (mocked or real) eSignet. This handler is the back half of the auth-code
// flow: validate CSRF + PKCE, exchange the code, fetch & signature-validate the
// verify-only Userinfo JWT, and record the self-issued verification (#25, ADR-020).
//
// All real work — including the network — is delegated to the testable seam in
// lib/fayda/verification: `createFaydaTransport` is the one place that performs
// discovery / JWKS / token-exchange / userinfo fetches, and both the mock
// provider and the real esignet.ida.et are reached through it. This file is
// only the cookie/session boundary + config wiring.
export async function GET(request: Request): Promise<Response> {
  if (!faydaConfigured()) {
    return new NextResponse("Fayda verification is not configured.", { status: 503 })
  }

  const user = await requireUser()
  const cookieStore = await cookies()
  const state = cookieStore.get("fayda_state")?.value
  const codeVerifier = cookieStore.get("fayda_verifier")?.value

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const returnedState = url.searchParams.get("state")

  const fail = (error: string) =>
    NextResponse.redirect(`/profile?verified=fayda&error=${encodeURIComponent(error)}`, { status: 303 })

  if (!state || !code || !returnedState || state !== returnedState) {
    return fail("invalid_state")
  }
  if (!codeVerifier) return fail("invalid_request")

  const transport = createFaydaTransport({
    issuerUrl: process.env[FAYDA_ENV.ISSUER_URL]!,
    clientId: process.env[FAYDA_ENV.CLIENT_ID]!,
    redirectUri: process.env[FAYDA_ENV.REDIRECT_URI] ?? "",
    clientKey: resolveClientKey(),
  })

  const result = await completeFaydaAuthorization(await createClient(), user.id, {
    code,
    state: returnedState,
    cookieState: state,
    codeVerifier,
    clientId: process.env[FAYDA_ENV.CLIENT_ID]!,
    transport,
  })

  if (!result.ok) {
    // §11: the outcome is surfaced to the user via the redirect below; the
    // technical detail belongs in the server log, never in the URL.
    console.error("[verify-fayda] callback failed:", result.error)
  }

  const dest = new URL("/profile", url.origin)
  if (result.ok) {
    dest.searchParams.set("verified", "fayda")
  } else {
    dest.searchParams.set("verified", "fayda")
    dest.searchParams.set("error", result.error ?? "verification_failed")
  }
  return NextResponse.redirect(dest, { status: 303 })
}

function resolveClientKey(): { privateKeyPem: string } {
  if (faydaMockMode()) return { privateKeyPem: getDevClientKeys().privateKeyPem }
  // Real path: FAYDA_CLIENT_PRIVATE_JWK is a JSON JWK string from onboarding
  // (production-only — the demo exercises the mock path).
  const jwkJson = process.env[FAYDA_ENV.CLIENT_PRIVATE_JWK]
  if (!jwkJson) throw new Error("FAYDA_CLIENT_PRIVATE_JWK is not configured")
  const pem = createPrivateKey({
    key: JSON.parse(jwkJson),
    format: "jwk",
  }).export({ type: "pkcs8", format: "pem" }) as string
  return { privateKeyPem: pem }
}