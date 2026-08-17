/**
 * Pure offers domain value objects.
 *
 * Framework-agnostic constants, types and helpers shared by Server and Client
 * modules. This module intentionally has NO `server-only` import and imports no
 * Supabase client, so Client Components can consume it directly without pulling
 * the server seam into the client graph. `@/lib/offers` re-exports everything
 * here (`export *`) so existing server-side imports keep resolving.
 */

export const OFFER_EXPIRY_MS = 7 * 24 * 3_600_000

export const OFFER_STATUSES = ["pending", "countered", "accepted", "declined", "expired"] as const

export type OfferStatus = (typeof OFFER_STATUSES)[number]

// Statuses that still need a reply from the seller. The dashboard's open-offers
// count uses these; accepted/declined are terminal for the seller.
export const OPEN_OFFER_STATUSES: OfferStatus[] = ["pending", "countered"]

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: "Pending",
  countered: "Countered",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
}

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  countered: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
}

// App-side ceiling, enforced at the DB write boundary by the offers_amount_cap
// check (create_offers migration) and by counter_offer — a counter cannot
// exceed the cap any more than a new offer can. Message cap mirrors the
// offers_message_length check.
export const OFFER_AMOUNT_MAX = 100_000_000
export const OFFER_MESSAGE_MAX = 500

// The login redirect target for the "Make an offer" CTA, shared across
// signed-out CTAs (see lib/nav.ts for the single definition).
export { buildLoginUrl } from "@/lib/nav"
