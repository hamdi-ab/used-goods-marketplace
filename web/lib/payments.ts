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
import {
  formatEtb,
  PLATFORM_FEE_PERCENTAGE,
  WITHDRAWAL_MINIMUM,
} from "@/lib/payments/constants"

export type PayOfferResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string }

export type VerifyOfferPaymentResult =
  | { ok: true; amount: number }
  | { ok: false; error: string }

export type WithdrawalResult =
  | { ok: true; id: string; fee: number; netAmount: number }
  | { ok: false; error: string }

export type AbandonmentResult =
  | { ok: true; canAbandon: boolean; daysRemaining: number }
  | { ok: false; error: string }

// Same { ok, error } envelope every write-RPC caller lands on (see OfferResult).
export type PaymentResult = OfferResult

// The buyer returns here after Chapa's hosted checkout (or, in demo fallback
// mode, immediately). The tx_ref in the query drives the verify on the
// /payments/callback route, so a refresh of the return URL just re-verifies
// idempotently (and the /offers page keeps the same verify-on-render as a
// resume fallback for the case where the callback was skipped).
async function paymentReturnUrl(offerId: string, txRef: string): Promise<string> {
  const h = await headers()
  const host = h.get("host")
  const proto =
    h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  const base = host ? `${proto}://${host}` : SITE_URL
  return `${base}/payments/callback?tx_ref=${encodeURIComponent(txRef)}&offer=${encodeURIComponent(offerId)}`
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
  const money = formatEtb(offer.amount)

  if (!user.email) {
    return { ok: false, error: "Your account needs an email address to make payments" }
  }
  const begin = await callOutcomeRpc(supabase, "begin_payment", {
    p_offer_id: offerId,
    p_tx_ref: txRef,
    p_amount: money.amount,
    p_currency: money.currency,
  }, "payOffer")
  if (!begin.ok) {
    return { ok: false, error: begin.error ?? "Could not start the payment" }
  }

  const init = await initializeChapaTransaction({
    txRef,
    amount: money.amount,
    currency: money.currency,
    email: user.email,
    firstName: user.fullName,
    returnUrl: await paymentReturnUrl(offerId, txRef),
    title: "Dagim Gebeya",
    description: "Payment for your marketplace purchase",
  })

  if (!init.ok) {
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: txRef }, "payOffer")
    return { ok: false, error: init.error }
  }

  return {
    ok: true,
    checkoutUrl: init.checkoutUrl,
  }
}

// Server-side verify after the buyer returns from checkout. Fulfillment is
// gated inside the Chapa adapter (status === "success" AND mode === "test");
// the complete_payment RPC re-checks the reported mode/amount/currency against
// the row pinned at begin time. Idempotent — re-verifying an already-paid
// tx_ref stays successful. A failed verify marks the attempt failed so
// begin_payment allows a retry.
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
    // failed card, or a live tx not in Chapa test mode). Mark the attempt
    // failed so begin_payment allows a retry.
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: params.txRef }, "verifyOfferPayment")
    return { ok: false, error: verified.error }
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



// Seller requests a withdrawal of available earnings. Validates minimum amount,
// calculates fee if applicable, and creates a pending withdrawal row.
export async function requestWithdrawal(
  amount: number,
  payoutMethod: "bank_transfer" | "mobile_money" = "bank_transfer",
  accountNumber?: string
): Promise<WithdrawalResult> {
  const user = await requireUser()
  if (!user.email) {
    return { ok: false, error: "Your account needs an email address" }
  }

  if (amount < WITHDRAWAL_MINIMUM) {
    return { ok: false, error: `Minimum withdrawal is ${WITHDRAWAL_MINIMUM} ETB` }
  }

  const supabase = await createClient()

  // Verify seller has sufficient available earnings (hold period elapsed)
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, buyer_confirmed, hold_expires_at")
    .eq("seller_id", user.id)
    .eq("status", "paid")

  let available = 0
  for (const p of payments ?? []) {
    if (!p.buyer_confirmed) continue
    if (p.hold_expires_at && new Date(p.hold_expires_at) > new Date()) continue
    available += p.amount * (1 - PLATFORM_FEE_PERCENTAGE / 100)
  }

  if (amount > available) {
    return { ok: false, error: `Insufficient available balance (${available.toFixed(2)} ETB)` }
  }

  const payoutDetails = accountNumber
    ? JSON.stringify({ account_number: accountNumber })
    : null

  const result = await callOutcomeRpc<{ ok: boolean; error: string | null; id?: string; fee?: number; netAmount?: number }>(supabase, "request_withdrawal", {
    p_seller_id: user.id,
    p_amount: amount,
    p_payout_method: payoutMethod,
    p_payout_details: payoutDetails,
  }, "requestWithdrawal")

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Could not process withdrawal" }
  }

  return { ok: true, id: result.id ?? "", fee: result.fee ?? 0, netAmount: result.netAmount ?? amount }
}



// Seller abandons a stale payment after the 7-day window. Fails the payment
// and reopens the offer/listing to the market.
export async function abandonStalePayment(txRef: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(supabase, "abandon_stale_payment", {
    p_tx_ref: txRef,
  }, "abandonStalePayment")

  return { ok: result.ok === true, error: result.error ?? null }
}

export interface SellerEarnings {
  totalSales: number
  platformFees: number
  netEarnings: number
  availableForWithdrawal: number
  pendingClearance: number
  onHold: number
  pendingWithdrawals: number
}

// Server-side earnings calculation for use in dashboard/offers pages.
export async function fetchSellerEarnings(userId: string): Promise<SellerEarnings> {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, buyer_confirmed, hold_expires_at, status")
    .eq("seller_id", userId)
    .eq("status", "paid")

  let totalSales = 0
  let platformFees = 0
  let netEarnings = 0
  let availableForWithdrawal = 0
  let pendingClearance = 0
  let onHold = 0

  for (const p of payments ?? []) {
    const amount = Number(p.amount)
    totalSales += amount
    const fee = (amount * PLATFORM_FEE_PERCENTAGE) / 100
    platformFees += fee
    netEarnings += amount - fee

    if (p.buyer_confirmed) {
      if (p.hold_expires_at && new Date(p.hold_expires_at) > new Date()) {
        onHold += amount - fee
      } else {
        availableForWithdrawal += amount - fee
      }
    } else {
      pendingClearance += amount - fee
    }
  }

  // Subtract pending and processing withdrawals from available balance.
  // Industry standard (Stripe, PayPal): when a payout is initiated, the
  // amount is immediately reserved/frozen — it cannot be withdrawn again
  // until the payout settles (completed) or fails (returns to available).
  const { data: pendingWithdrawals } = await supabase
    .from("withdrawals")
    .select("amount")
    .eq("seller_id", userId)
    .in("status", ["pending", "processing"])

  const pendingWithdrawalTotal = (pendingWithdrawals ?? []).reduce(
    (sum, w) => sum + Number(w.amount),
    0
  )

  availableForWithdrawal = Math.max(0, availableForWithdrawal - pendingWithdrawalTotal)

  return {
    totalSales,
    platformFees,
    netEarnings,
    availableForWithdrawal,
    pendingClearance,
    onHold,
    pendingWithdrawals: pendingWithdrawalTotal,
  }
}

export interface WithdrawalRow {
  id: string
  amount: number
  fee: number
  net_amount: number
  status: string
  payout_method: string
  payout_details: string | null
  created_at: string
  processed_at: string | null
}

export async function fetchSellerWithdrawals(userId: string): Promise<WithdrawalRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("withdrawals")
    .select("id, amount, fee, net_amount, status, payout_method, payout_details, created_at, processed_at")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("fetchSellerWithdrawals:", error.message)
    return []
  }
  return data ?? []
}
