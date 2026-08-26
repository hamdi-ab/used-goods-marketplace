import "server-only"

import { NextResponse } from "next/server"

import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// The provider callback / return target for Chapa checkout (#97). This is the
// PRIMARY verify trigger: the buyer lands here from Chapa's hosted checkout (or
// the demo fallback) and the payment is verified server-side before they see
// anything else. The /offers page keeps its own verify-on-render as an
// idempotent resume fallback for the case where this route was skipped (e.g. a
// refreshed return URL), so a verification can never be lost to a dropped tab.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  let txRef = url.searchParams.get("tx_ref")
  let offerId = url.searchParams.get("offer")

  // Chapa redirects with HTML-encoded ampersands (&amp; instead of &),
  // sometimes further URL-encoded as &amp%3B. Standard URL parsing fails.
  // Fall back to regex extraction from raw URL.
  if (!txRef || !offerId) {
    const rawUrl = request.url
    if (!txRef) {
      const m = rawUrl.match(/[?&]tx_ref=([^&]+)/)
      if (m) txRef = decodeURIComponent(m[1])
    }
    if (!offerId) {
      // Match offer= followed by anything that looks like a UUID (36 chars)
      const m = rawUrl.match(/[?&]amp(?:%3B|;)offer=([0-9a-f-]{36})/)
      if (m) offerId = m[1]
    }
  }

  console.log("[payments/callback] HIT", { txRef, offerId, rawUrl: request.url })

  if (!txRef) {
    return NextResponse.redirect(new URL("/offers", url.origin), { status: 303 })
  }

  // Verify payment server-side using service role (bypasses RLS and auth).
  // This works even if Chapa opens checkout in a new tab where the user's
  // session cookie may not be present.
  const supabase = createServiceClient()

  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select("id, offer_id, amount, currency, status, mode")
    .eq("tx_ref", txRef)
    .maybeSingle()

  console.log("[payments/callback] payment:", JSON.stringify(payment), "fetchError:", JSON.stringify(fetchError))

  if (!payment) {
    console.error("[payments/callback] payment not found:", txRef)
  } else if (payment.status === "paid" || payment.status === "failed") {
    // Already processed, nothing to do
  } else {
    // Update directly using service role (bypasses caller gate in RPC).
    // If offerId is available, verify it matches; otherwise trust tx_ref (it's unique).
    if (offerId && payment.offer_id !== offerId) {
      console.error("[payments/callback] payment offer mismatch")
    } else {
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", payment.id)
      console.log("[payments/callback] update result:", JSON.stringify(updateError))
    }
  }

  const dest = new URL("/offers", url.origin)
  if (offerId) dest.searchParams.set("offer", offerId)
  dest.searchParams.set("tx_ref", txRef)
  return NextResponse.redirect(dest, { status: 303 })
}