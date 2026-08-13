/**
 * Pure reviews domain value objects.
 *
 * Framework-agnostic constants and helpers shared by Server and Client
 * modules. This module intentionally has NO `server-only` import and imports no
 * Supabase client, so Client Components can consume it directly without pulling
 * the server seam into the client graph. `@/lib/reviews` re-exports everything
 * here (`export *`) so existing server-side imports keep resolving.
 */

// Rating range mirrors the DB check (rating between 1 and 5).
export const RATING_MIN = 1
export const RATING_MAX = 5

// Comment cap mirrors the reviews_comment_length check.
export const REVIEW_COMMENT_MAX = 1000

// A review is only possible once the offer is accepted (INV-008).
export const REVIEWABLE_OFFER_STATUS = "accepted" as const

// Trust Score reflects the seller's average rating on a 0-100 scale
// (rating 1-5 -> score 20-100). Kept here so the SQL formula and any client
// preview of it cannot drift.
export function ratingAverageToTrustScore(average: number | null): number {
  if (average === null) return 50
  return Math.round((Math.min(Math.max(average, RATING_MIN), RATING_MAX) / RATING_MAX) * 100)
}
