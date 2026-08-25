import "server-only"

import { NextResponse } from "next/server"

import { createServiceClient } from "@/lib/supabase/service"
import { verifyChapaTransaction } from "@/lib/chapa"

export const dynamic = "force-dynamic"

// The provider callback / return target for Chapa checkout (#97). This is the
// PRIMARY verify trigger: the buyer lands here from Chapa's hosted checkout and
// the payment is verified server-side against Chapa's API before they see
// anything else.
export async function GET(request: Request): Promise<Response> {
  // Chapa redirects with HTML-encoded ampersands in the URL. The entity &amp;
  // may arrive as-is (&amp;) or with the semicolon URL-encoded (&amp%3B). Normalize
  // both forms back to a plain & before parsing query params.
  const rawUrl = request.url.replace(/&amp%3B/g, "&").replace(/&amp;/g, "&")
  const parsedUrl = new URL(rawUrl)
  const txRef = parsedUrl.searchParams.get("tx_ref")
  const offerId = parsedUrl.searchParams.get("offer")

  console.log(`[payments/callback] request.url="${request.url}"`)
  console.log(`[payments/callback] rawUrl="${rawUrl}"`)
  console.log(`[payments/callback] START tx_ref=${txRef} offer=${offerId}`)

  if (!txRef || !offerId) {
    console.log("[payments/callback] missing params, redirecting")
    return NextResponse.redirect(new URL("/offers", parsedUrl.origin), { status: 303 })
  }

  try {
    const supabase = createServiceClient()

    const { data: payment } = await supabase
      .from("payments")
      .select("id, offer_id, amount, currency, status, mode")
      .eq("tx_ref", txRef)
      .maybeSingle()

    console.log(`[payments/callback] payment found: ${payment ? `id=${payment.id} status=${payment.status}` : "null"}`)

    if (!payment) {
      console.error("[payments/callback] payment not found:", txRef)
    } else if (payment.offer_id !== offerId) {
      console.error("[payments/callback] payment offer mismatch:", payment.offer_id, "vs", offerId)
    } else if (payment.status === "paid" || payment.status === "failed") {
      console.log("[payments/callback] already processed, status:", payment.status)
    } else {
      console.log("[payments/callback] verifying with Chapa...")
      const verified = await verifyChapaTransaction(txRef, {
        amount: Number(payment.amount),
        currency: payment.currency,
      })
      console.log(`[payments/callback] Chapa verify result: ok=${verified.ok} ${!verified.ok ? `error=${verified.error}` : ""}`)
      if (verified.ok) {
        await supabase
          .from("payments")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", payment.id)
        console.log("[payments/callback] marked as paid")
      } else {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id)
        console.log("[payments/callback] marked as failed")
      }
    }
  } catch (e) {
    console.error("[payments/callback] ERROR:", e)
  }

  console.log("[payments/callback] DONE, redirecting to /offers")
  const dest = new URL("/offers", parsedUrl.origin)
  dest.searchParams.set("offer", offerId)
  dest.searchParams.set("tx_ref", txRef)
  return NextResponse.redirect(dest, { status: 303 })
}