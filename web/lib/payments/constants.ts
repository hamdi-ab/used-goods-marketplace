/**
 * Pure payments domain value objects (#97).
 *
 * Client-safe: no `server-only` import and no Supabase client, so Client
 * Components (e.g. BuyerPayment) can consume the status types, the offer's
 * embedded payment row, and the pure helpers without pulling the server seam
 * into the client graph.
 */

export const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// The demo only ever moves ETB (mirrors the payments_currency_etb check).
export const PAYMENT_CURRENCY = "ETB" as const

// The domain's Money value object (domain model §11): a non-negative amount in
// the marketplace's single supported currency. The currency literal is the TS
// mirror of the DB's payments_currency_etb check — the DB stays the authority;
// this is the one place TS names the rule.
export interface Money {
  amount: number
  currency: typeof PAYMENT_CURRENCY
}

// The one construction site for the money pair, so callers never assemble
// { amount, currency } by hand and drift the currency.
export function etb(amount: number): Money {
  return { amount, currency: PAYMENT_CURRENCY }
}

// The payment row embedded on an offer. Buyer and seller both read it via RLS;
// the offer fetch embeds the raw rows and maps them with pickPayment.
export interface OfferPayment {
  id: string
  tx_ref: string | null
  amount: number
  currency: string
  status: PaymentStatus
  mode: string
  buyer_confirmed: boolean
  paid_at: string | null
  confirmed_at: string | null
}

export type PaymentPhase = "unpaid" | "paid" | "confirmed"

// Where the deal stands from a participant's view: nothing has been paid, the
// payment landed and awaits the buyer's confirm, or the buyer confirmed receipt
// and the deal is closed. Shared by the buyer and seller surfaces.
export function paymentPhase(payment: OfferPayment | null): PaymentPhase {
  if (payment?.status !== "paid") return "unpaid"
  return payment.buyer_confirmed ? "confirmed" : "paid"
}

// The offers table keeps one active payment per offer (begin_payment allows a
// retry only after a failed attempt), but a retry leaves the failed row behind
// so the embed is a small array. Pick the row that best describes the deal:
// paid > pending > failed.
const PAYMENT_PRIORITY: Record<PaymentStatus, number> = {
  paid: 0,
  pending: 1,
  failed: 2,
}

export function pickPayment(
  rows: OfferPayment[] | null | undefined
): OfferPayment | null {
  if (!rows?.length) return null
  return rows.reduce((best, row) =>
    PAYMENT_PRIORITY[row.status] < PAYMENT_PRIORITY[best.status] ? row : best
  )
}
