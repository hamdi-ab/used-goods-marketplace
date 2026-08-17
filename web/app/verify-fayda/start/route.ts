import "server-only"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { requireUser } from "@/lib/auth"
import { faydaConfigured, startFaydaAuthorization } from "@/lib/fayda/verification"

// The entry point for a seller's Fayda verification: build the PKCE pair +
// the authorize URL, stash the verifier/state in a short-lived httpOnly cookie
// (CSRF/nonces never hit the client graph), and redirect to the IdP. The mock
// provider renders a one-click "Approve" page; the real esignet.ida.et renders
// the national-ID login. Same code, config-driven issuer (ADR-020 D7).
export async function GET(): Promise<Response> {
  if (!faydaConfigured()) {
    return new NextResponse("Fayda verification is not configured.", { status: 503 })
  }

  // The exchange needs the signed-in user id to record their own verification
  // (the RPC is auth.uid()-scoped for own profile only).
  await requireUser()

  let start: ReturnType<typeof startFaydaAuthorization>
  try {
    start = startFaydaAuthorization()
  } catch {
    // Missing FAYDA_REDIRECT_URI / issuer env — surface a dev-friendly error
    // instead of leaking config to the client.
    return new NextResponse("Fayda verification is not configured.", { status: 503 })
  }

  const cookieStore = await cookies()
  const oneMinute = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 }
  cookieStore.set("fayda_state", start.state, oneMinute)
  cookieStore.set("fayda_verifier", start.codeVerifier, oneMinute)
  cookieStore.set("fayda_challenge", start.codeChallenge, oneMinute)

  return NextResponse.redirect(start.authorizeUrl)
}
