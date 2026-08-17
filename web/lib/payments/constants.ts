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
export const PAYMENT_CURRENCY = "ETB"

// The payment row embedded on an offer. Buyer and seller both read it via RLS;
// the offer fetch embeds the raw rows and maps them with pickPayment.
export interface OfferPayment {
  id: string
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
