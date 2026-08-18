/**
 * Pure verification domain value objects.
 *
 * Framework-agnostic constants, types and helpers shared by Server and Client
 * modules. This module intentionally has NO `server-only` import and imports no
 * Supabase client, so Client Components can consume it directly without pulling
 * the server seam into the client graph. (Mirrors lib/reviews/constants.)
 *
 * Badge semantics (documented in the verifications migration, T12):
 *   - verified-seller ("Verified Seller"): profiles.role = 'seller'
 *   - phone ("Phone Verified"):        profiles.phone_verified
 *   - fayda ("Fayda Verified"):        profiles.fayda_verified (placeholder, AC-1)
 *   - empty state "Not verified yet":  none of the above are active.
 */

// Order matters: the seller's own "Verified Seller" (role) is surfaced first,
// then identity verifications (phone, fayda). Components render in this order.
export const VERIFICATION_BADGES = ["verified-seller", "phone", "fayda"] as const
export type VerificationBadge = (typeof VERIFICATION_BADGES)[number]

/**
 * DB enum mirrors (public.verification_type / public.verification_status in the
 * verifications migration). Used to type the record_verification RPC args and
 * the admin Moderation Context, not the badge set (which derives from
 * SellerVerification above).
 */
export type VerificationType = "email" | "phone" | "telegram" | "fayda"
export type VerificationStatus = "pending" | "verified" | "rejected"

export const VERIFICATION_BADGE_LABELS: Record<VerificationBadge, string> = {
  "verified-seller": "Verified Seller",
  phone: "Phone Verified",
  fayda: "Fayda Verified",
}

export const VERIFICATION_BADGE_NOTE = "Not verified yet"

/** Full DB enum mirrors. */
export type SelfServeType = "phone" | "fayda"
export const VERIFICATION_TYPES: [VerificationType, ...VerificationType[]] = [
  "email",
  "phone",
  "telegram",
  "fayda",
]
export const SELF_SERVE_TYPES: [SelfServeType, ...SelfServeType[]] = [
  "phone",
  "fayda",
]

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  email: "Email",
  phone: "Phone",
  telegram: "Telegram",
  fayda: "Fayda ID",
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
}

export const VERIFICATION_NOTES_MAX = 500

export interface SellerVerification {
  role: string | null
  phone_verified?: boolean | null
  fayda_verified?: boolean | null
}

// The active badge set for a seller, in render order. Used by every seller
// surface so badge rules never fork between listing cards and profiles.
export function sellerVerificationBadges(
  seller: SellerVerification | null | undefined
): VerificationBadge[] {
  if (!seller) return []
  const badges: VerificationBadge[] = []
  if (seller.role === "seller") badges.push("verified-seller")
  if (seller.phone_verified) badges.push("phone")
  if (seller.fayda_verified) badges.push("fayda")
  return badges
}

export function hasVerification(
  seller: SellerVerification | null | undefined
): boolean {
  return sellerVerificationBadges(seller).length > 0
}
