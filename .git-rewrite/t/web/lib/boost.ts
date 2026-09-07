/** T29: client-safe read helpers for a listing's boost expiry. These live
 * outside `lib/usage.ts` (which is `server-only`) so the dashboard listing row
 * and the buyer-facing listing card can render them without pulling server
 * modules into the client bundle. */

/** True when a listing's boost expiry is still in the future. Safe to call from
 * client components: it only inspects the `boosted_until` string already fetched
 * from the server. */
export function isBoostActive(boostedUntil: string | null | undefined): boolean {
  if (!boostedUntil) return false
  return new Date(boostedUntil).getTime() > Date.now()
}

/** A short human-readable countdown used on the dashboard row, e.g. "expires in
 * 2 days". Falls back to a generic label when the window is ambiguous. */
export function boostLabel(boostedUntil: string | null | undefined): string {
  if (!isBoostActive(boostedUntil)) return "not boosted"
  const remaining = new Date(boostedUntil!).getTime() - Date.now()
  const days = Math.ceil(remaining / (1000 * 60 * 60 * 24))
  if (days >= 1) return days === 1 ? "expires in 1 day" : `expires in ${days} days`
  return "expires soon"
}
