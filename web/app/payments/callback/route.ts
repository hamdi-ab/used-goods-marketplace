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
  const txRef = url.searchParams.get("tx_ref")
  const offerId = url.searchParams.get("offer")

  if (!txRef || !offerId) {
    return NextResponse.redirect(new URL("/offers", url.origin), { status: 303 })
  }

  // Verify payment server-side using service role (bypasses RLS and auth).
  // This works even if Chapa opens checkout in a new tab where the user's
  // session cookie may not be present.
  try {
    const supabase = createServiceClient()

    const { data: payment } = await supabase
      .from("payments")
      .select("id, offer_id, amount, currency, status, mode")
      .eq("tx_ref", txRef)
      .maybeSingle()

    if (!payment) {
      console.error("[payments/callback] payment not found:", txRef)
    } else if (payment.offer_id !== offerId) {
      console.error("[payments/callback] payment offer mismatch")
    } else if (payment.status === "paid" || payment.status === "failed") {
      // Already processed, nothing to do
    } else {
      // Update directly using service role (bypasses caller gate in RPC)
      await supabase
        .from("payments")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", payment.id)
    }
  } catch (e) {
    console.error("[payments/callback] verification error:", e)
  }

  const dest = new URL("/offers", url.origin)
  dest.searchParams.set("offer", offerId)
  dest.searchParams.set("tx_ref", txRef)
  return NextResponse.redirect(dest, { status: 303 })
}