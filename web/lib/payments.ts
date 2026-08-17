import "server-only"

import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import { requireUser } from "@/lib/auth"
import { SITE_URL } from "@/lib/site"
import type { OfferResult } from "@/lib/offers"
import {
  chapaConfigured,
  chapaTxRef,
  initializeChapaTransaction,
  verifyChapaTransaction,
} from "@/lib/chapa"
import { PAYMENT_CURRENCY } from "@/lib/payments/constants"

export * from "@/lib/payments/constants"

export type PayOfferResult =
  | { ok: true; checkoutUrl: string; amount: number; demo: boolean }
  | { ok: false; error: string }

export type VerifyOfferPaymentResult =
  | { ok: true; amount: number }
  | { ok: false; error: string }

// Same { ok, error } envelope every write-RPC caller lands on (see OfferResult).
export type PaymentResult = OfferResult

// The buyer returns here after Chapa's hosted checkout (or, in demo fallback
// mode, immediately). The tx_ref in the query drives the verify on the /offers
// page, so a refresh of the return URL just re-verifies idempotently.
async function paymentReturnUrl(offerId: string, txRef: string): Promise<string> {
  const h = await headers()
  const host = h.get("host")
  const proto =
    h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  const base = host ? `${proto}://${host}` : SITE_URL
  return `${base}/offers?tx_ref=${encodeURIComponent(txRef)}&offer=${encodeURIComponent(offerId)}`
}

// The buyer starts payment for an accepted offer. Pins the agreed amount in a
// pending payment row (begin_payment), then sends the buyer to Chapa's hosted
// checkout. If Chapa's initialize fails, the row is marked failed so the buyer
// can retry (begin_payment allows a new row after a failed one).
export async function payOffer(offerId: string): Promise<PayOfferResult> {
  const user = await requireUser()
  const supabase = await createClient()

  if (!chapaConfigured()) {
    return { ok: false, error: "Payments are not set up for this demo yet" }
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id, amount, status, buyer_id")
    .eq("id", offerId)
    .eq("buyer_id", user.id)
    .maybeSingle()

  if (!offer) {
    return { ok: false, error: "Offer not found" }
  }
  if (offer.status !== "accepted") {
    return { ok: false, error: "Only accepted offers can be paid" }
  }

  const txRef = chapaTxRef()
  const begin = await callOutcomeRpc(supabase, "begin_payment", {
    p_offer_id: offerId,
    p_tx_ref: txRef,
    p_amount: offer.amount,
    p_currency: PAYMENT_CURRENCY,
  }, "payOffer")
  if (!begin.ok) {
    return { ok: false, error: begin.error ?? "Could not start the payment" }
  }

  const init = await initializeChapaTransaction({
    txRef,
    amount: offer.amount,
    currency: PAYMENT_CURRENCY,
    email: user.email,
    firstName: user.fullName,
    returnUrl: await paymentReturnUrl(offerId, txRef),
  })

  if (!init.ok) {
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: txRef }, "payOffer")
    return { ok: false, error: init.error }
  }

  return {
    ok: true,
    checkoutUrl: init.checkoutUrl,
    amount: offer.amount,
    demo: init.demo,
  }
}

// Server-side verify after the buyer returns from checkout. Fulfillment is
// gated on Chapa reporting success in test mode, and the complete_payment RPC
// re-checks the reported mode/amount/currency against the row pinned at begin
// time. Idempotent — re-verifying an already-paid tx_ref stays successful.
export async function verifyOfferPayment(params: {
  offerId: string
  txRef: string
}): Promise<VerifyOfferPaymentResult> {
  // Require a session (redirects signed-out users). Both participants (buyer
  // and seller) can read a payment via RLS, so the fetch below is scoped by RLS
  // rather than an explicit user filter; complete_payment re-checks the caller.
  await requireUser()
  const supabase = await createClient()
  const { data: payment } = await supabase
    .from("payments")
    .select("id, offer_id, amount, currency, status")
    .eq("tx_ref", params.txRef)
    .maybeSingle()

  if (!payment) {
    return { ok: false, error: "Payment not found" }
  }
  if (payment.offer_id !== params.offerId) {
    return { ok: false, error: "Payment does not match this offer" }
  }
  if (payment.status === "failed") {
    return { ok: false, error: "This payment was not completed" }
  }
  if (payment.status === "paid") {
    return { ok: true, amount: payment.amount }
  }

  const verified = await verifyChapaTransaction(params.txRef, {
    amount: payment.amount,
    currency: payment.currency,
  })
  if (!verified.ok) {
    // The buyer came back without a completed payment (abandoned checkout,
    // failed card). Mark the attempt failed so begin_payment allows a retry.
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: params.txRef }, "verifyOfferPayment")
    return { ok: false, error: verified.error }
  }
  if (verified.status !== "success" || verified.mode !== "test") {
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: params.txRef }, "verifyOfferPayment")
    return { ok: false, error: "Payment was not completed in test mode" }
  }

  const complete = await callOutcomeRpc(supabase, "complete_payment", {
    p_tx_ref: params.txRef,
    p_mode: verified.mode,
    p_amount: verified.amount,
    p_currency: verified.currency,
  }, "verifyOfferPayment")
  if (!complete.ok) {
    // complete_payment rejected (e.g. currency/amount drift). The row is still
    // pending, which would block a retry — fail it so the buyer can pay again.
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: params.txRef }, "verifyOfferPayment")
    return { ok: false, error: complete.error ?? "Could not confirm the payment" }
  }

  return { ok: true, amount: payment.amount }
}

// The buyer-protection signal: the buyer confirms they received the item,
// closing the deal. Requires a paid payment on the offer (RPC-enforced).
export async function confirmOfferReceipt(offerId: string): Promise<PaymentResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(supabase, "confirm_payment_receipt", {
    p_offer_id: offerId,
  }, "confirmOfferReceipt")
  return { ok: result.ok === true, error: result.error ?? null }
}
