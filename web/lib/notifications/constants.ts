/**
 * Pure notifications domain value objects (fix #72).
 *
 * Framework-agnostic constants and helpers shared by Server and Client modules
 * (mirrors lib/reports/constants, lib/verifications/constants). The DB stores
 * `type` as text (DB spec §14); the typed union + labels live here so the
 * inbox, the toast copy, and the RLS trigger bodies never fork.
 */

export const NOTIFICATION_TYPES = [
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "offer_countered",
  "offer_counter_accepted",
  "offer_counter_declined",
  "review_received",
  "report_resolved",
  "business_lead",
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  offer_received: "New offer",
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
  offer_countered: "Counter-offer received",
  offer_counter_accepted: "Counter accepted",
  offer_counter_declined: "Counter declined",
  review_received: "New review",
  report_resolved: "Report reviewed",
  business_lead: "Business lead",
}

// The inbox page cap and the client poll interval (config.toml realtime is
// disabled locally, so the useNotifications hook polls for new rows instead of
// subscribing; the interval is deliberately modest to keep the dev stack quiet).
export const NOTIFICATION_MAX_ITEMS = 50
export const NOTIFICATION_POLL_MS = 15000

/** Deep-link target for a notification, from its metadata, or null for types
 * with no page to jump to. Offer/review events land on the surfaces where the
 * user can act: offer_received goes to the seller's incoming-offers queue
 * (accept/decline/counter live there, not on the listing page); accepted
 * offers and reviews land on the buyer's offers surface. */
export function notificationHref(
  type: NotificationType,
  metadata: Record<string, string | number | null>
): string | null {
  void metadata
  switch (type) {
    case "offer_received":
      return "/offers/seller"
    case "offer_accepted":
    case "offer_counter_accepted":
      return "/offers"
    case "offer_declined":
    case "offer_countered":
    case "offer_counter_declined":
      return "/offers"
    case "review_received":
      return "/offers"
    case "report_resolved":
      return null
    case "business_lead":
      return "/admin"
    default:
      return null
  }
}