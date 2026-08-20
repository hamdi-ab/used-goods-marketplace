// Server-free constants for the VinTech account-tier model (T24, map #54).
// Single source of truth for what each tier allows; both server guards and the
// client UI read from here. Numbers per monetization strategy §36 + wayfinder
// #54 decision #56 (free 5/10/3, pro 25/10/30, business 100+/10+/higher).

export const TIERS = ["free", "pro", "business"] as const
export type Tier = (typeof TIERS)[number]

export const DEFAULT_TIER: Tier = "free"

export const TIER_LABELS: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
}

export interface TierLimits {
  /** Max concurrent published listings. Always finite — business is capped at
   * 100 (strat §36), never "unlimited". */
  activeListings: number
  /** Max images per listing. */
  imagesPerListing: number
  /** Max AI listing generations per calendar month (null = unlimited). */
  aiGenerationsPerMonth: number | null
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: { activeListings: 5, imagesPerListing: 10, aiGenerationsPerMonth: 3 },
  pro: { activeListings: 25, imagesPerListing: 10, aiGenerationsPerMonth: 30 },
  business: { activeListings: 100, imagesPerListing: 10, aiGenerationsPerMonth: null },
}

/** T29: listing-boost preset economics (strat §15: 49 ETB / 3d, 99 ETB / 7d).
 * Label/price only — the DB `boost_listing` RPC owns the authoritative window
 * (client can't be trusted to set its own expiry, ADR-021). */
export const BOOST_PRESETS = {
  standard: { days: 3, priceEtb: 49 },
  premium: { days: 7, priceEtb: 99 },
} as const
export type BoostPreset = keyof typeof BOOST_PRESETS

/** §26 friendly copy shown when the active-listing quota is hit. */
export const LISTING_LIMIT_MESSAGE =
  "You've reached your 5 active listing limit. Mark an item as sold or archive an old one to free a slot, or upgrade to Pro."

/** §26 friendly copy shown when the monthly AI quota is exhausted. */
export const AI_LIMIT_MESSAGE =
  "You've used your free AI listing credits for this month. You can still create your listing manually."

/** One cap predicate for both limits: `null` means uncapped (Business AI),
 * which is never "at cap". Replaces the old isAtListingCap/isAtAiLimit pair. */
export function isAtCap(used: number, limit: number | null): boolean {
  return limit === null ? false : used >= limit
}

/** Active-listing cap for a tier (always finite per TierLimits). */
export function activeListingLimit(tier: Tier): number {
  return TIER_LIMITS[tier].activeListings
}

/** Monthly AI cap for a tier (null = uncapped). */
export function aiLimit(tier: Tier): number | null {
  return TIER_LIMITS[tier].aiGenerationsPerMonth
}

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value)
}

/** Resolve any DB value to a known tier, defaulting to free. */
export function resolveTier(value: string | null | undefined): Tier {
  return isTier(value) ? value : DEFAULT_TIER
}

/** Resolve a tier's limits. */
export function resolveLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier]
}