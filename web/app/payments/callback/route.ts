import "server-only"

import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { verifyOfferPayment } from "@/lib/payments"

export const dynamic = "force-dynamic"

// The provider callback / return target for Chapa checkout (#97). This is the
// PRIMARY verify trigger: the buyer lands here from Chapa's hosted checkout (or
// the demo fallback) and the payment is verified server-side before they see
// anything else. The /offers page keeps its own verify-on-render as an
// idempotent resume fallback for the case where this route was skipped (e.g. a
// refreshed return URL), so a verification can never be lost to a dropped tab.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const txRef = url.searchParams.get("tx_ref")
  const offerId = url.searchParams.get("offer")

  if (!txRef || !offerId) {
    return NextResponse.redirect(new URL("/offers", url.origin), { status: 303 })
  }

  // Verify, then bounce to the offer list with the same params the page's own
  // verify-on-render reads — the banner is rendered there (idempotent refresh).
  console.log("[payments/callback] verifying tx_ref:", txRef, "offer:", offerId)
  const result = await verifyOfferPayment({ offerId, txRef })
  console.log("[payments/callback] verify result:", JSON.stringify(result))

  if (!result.ok) {
    // §11: the page banners the failure via the terminal row; the technical
    // detail belongs in the server log, never in the redirect URL.
    console.error("[payments] callback verify failed:", result.error)
  }

  const dest = new URL("/offers", url.origin)
  dest.searchParams.set("offer", offerId)
  dest.searchParams.set("tx_ref", txRef)
  return NextResponse.redirect(dest, { status: 303 })
}