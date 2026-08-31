import "server-only"

import { headers } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import { requireUser } from "@/lib/auth"
import { SITE_URL } from "@/lib/site"
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

export type PaymentResult = { ok: boolean; error: string | null }

async function paymentReturnUrl(offerId: string, txRef: string): Promise<string> {
  const h = await headers()
  const host = h.get("host")
  const proto =
    h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  const base = host ? `${proto}://${host}` : SITE_URL
  return `${base}/payments/callback?tx_ref=${encodeURIComponent(txRef)}&offer=${encodeURIComponent(offerId)}`
}

export async function beginPayment(offerId: string): Promise<PayOfferResult> {
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
  const begin = await callOutcomeRpc(
    supabase,
    "begin_payment",
    {
      p_offer_id: offerId,
      p_tx_ref: txRef,
      p_amount: money.amount,
      p_currency: money.currency,
    },
    "beginPayment"
  )
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
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: txRef }, "beginPayment")
    return { ok: false, error: init.error }
  }

  return { ok: true, checkoutUrl: init.checkoutUrl }
}

export async function verifyPayment(params: {
  offerId: string
  txRef: string
}): Promise<VerifyOfferPaymentResult> {
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
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: params.txRef }, "verifyPayment")
    return { ok: false, error: verified.error }
  }

  const complete = await callOutcomeRpc(
    supabase,
    "complete_payment",
    {
      p_tx_ref: params.txRef,
      p_mode: verified.mode,
      p_amount: verified.amount,
      p_currency: verified.currency,
    },
    "verifyPayment"
  )
  if (!complete.ok) {
    await callOutcomeRpc(supabase, "fail_payment", { p_tx_ref: params.txRef }, "verifyPayment")
    return { ok: false, error: complete.error ?? "Could not confirm the payment" }
  }

  return { ok: true, amount: payment.amount }
}

export async function confirmReceipt(offerId: string): Promise<PaymentResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "confirm_payment_receipt",
    { p_offer_id: offerId },
    "confirmReceipt"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

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

  const result = await callOutcomeRpc<
    { ok: boolean; error: string | null; id?: string; fee?: number; netAmount?: number }
  >(
    supabase,
    "request_withdrawal",
    {
      p_seller_id: user.id,
      p_amount: amount,
      p_payout_method: payoutMethod,
      p_payout_details: payoutDetails,
    },
    "requestWithdrawal"
  )

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Could not process withdrawal" }
  }

  return {
    ok: true,
    id: result.id ?? "",
    fee: result.fee ?? 0,
    netAmount: result.netAmount ?? amount,
  }
}

export async function abandonStalePayment(
  txRef: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "abandon_stale_payment",
    { p_tx_ref: txRef },
    "abandonStalePayment"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

export async function approveWithdrawal(
  withdrawalId: string
): Promise<{ ok: boolean; error: string | null; sellerId?: string }> {
  const supabase = await createClient()
  const result = await callOutcomeRpc<
    { ok: boolean; error: string | null; seller_id?: string }
  >(
    supabase,
    "approve_withdrawal",
    { p_withdrawal_id: withdrawalId },
    "approveWithdrawal"
  )
  return {
    ok: result.ok === true,
    error: result.error ?? null,
    sellerId: result.seller_id,
  }
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reason?: string
): Promise<{ ok: boolean; error: string | null; sellerId?: string }> {
  const supabase = await createClient()
  const result = await callOutcomeRpc<
    { ok: boolean; error: string | null; seller_id?: string }
  >(
    supabase,
    "reject_withdrawal",
    { p_withdrawal_id: withdrawalId, p_reason: reason ?? null },
    "rejectWithdrawal"
  )
  return {
    ok: result.ok === true,
    error: result.error ?? null,
    sellerId: result.seller_id,
  }
}

export interface AdminWithdrawalRow {
  id: string
  seller_id: string
  seller_name: string | null
  amount: number
  fee: number
  net_amount: number
  status: string
  payout_method: string
  payout_details: string | null
  created_at: string
  processed_at: string | null
}

export async function fetchAdminWithdrawals(
  status?: string
): Promise<AdminWithdrawalRow[]> {
  try {
    const supabase = createServiceClient()
    let query = supabase
      .from("withdrawals")
      .select(
        `
        id, seller_id, amount, fee, net_amount, status, payout_method, payout_details, created_at, processed_at,
        seller:profiles!withdrawals_seller_id_fkey(full_name)
      `
      )
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(
        `Supabase error: ${error.message} | Details: ${error.details} | Hint: ${error.hint}`
      )
    }

    return (data ?? []).map(
      (row: {
        seller: { full_name: string | null } | Array<{ full_name: string | null }>
      } & Record<string, unknown>) => ({
        ...row,
        seller_name: Array.isArray(row.seller)
          ? row.seller[0]?.full_name ?? null
          : row.seller?.full_name ?? null,
      })
    ) as unknown as AdminWithdrawalRow[]
  } catch (err) {
    throw new Error(
      `fetchAdminWithdrawals: ${err instanceof Error ? err.message : String(err)}`
    )
  }
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

export async function fetchSellerWithdrawals(
  userId: string
): Promise<WithdrawalRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("withdrawals")
    .select(
      "id, amount, fee, net_amount, status, payout_method, payout_details, created_at, processed_at"
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("fetchSellerWithdrawals:", error.message)
    return []
  }
  return data ?? []
}
