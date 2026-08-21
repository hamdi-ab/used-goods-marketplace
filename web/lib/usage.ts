import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
import {
  TIER_LIMITS,
  activeListingLimit,
  isAtCap,
  resolveTier,
  type Tier,
  LISTING_LIMIT_MESSAGE,
} from "@/lib/plans/constants"
import { countAiGenerationsThisMonth } from "@/lib/ai/quota"

// ---- Tier resolution (T24) ----

/** Resolve a seller's account tier from the session. Server-only seam: no
 * client can set its own tier (the DB guard `profiles_guard_tier_change`
 * blocks self-promotion), so this is a trusted read. */
export async function fetchSellerTier(
  userId: string,
  client?: Supabase
): Promise<Tier> {
  const supabase = client ?? (await createClient())
  const { data } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle()
  return resolveTier(data?.tier ?? null)
}

// ---- Listing quota (T26) ----

/** Count the seller's currently active (published, non-deleted) listings.
 * Drafts/archived/sold do NOT count against the cap. */
export async function countActiveListings(
  sellerId: string,
  client?: Supabase
): Promise<number> {
  const supabase = client ?? (await createClient())
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("status", "published")
    .is("deleted_at", null)
  return count ?? 0
}

/** Enforce the listing cap for a publish/republish attempt. Returns ok:false
 * (with the §26 message) only when the seller is over the cap. Admins are
 * exempt (admin-created listings bypass the cap per T26). Cap + message now
 * come from the `plans/constants` seam (strat §36, §26). */
export async function enforceListingCap(
  sellerId: string,
  role: "buyer" | "seller" | "admin" | null,
  client?: Supabase
): Promise<{ ok: boolean; used: number; limit: number; message?: string }> {
  if (role === "admin") return { ok: true, used: 0, limit: Infinity }
  const supabase = client ?? (await createClient())
  const tier = await fetchSellerTier(sellerId, supabase)
  const limit = activeListingLimit(tier)
  const used = await countActiveListings(sellerId, supabase)
  if (isAtCap(used, limit)) {
    return { ok: false, used, limit, message: LISTING_LIMIT_MESSAGE }
  }
  return { ok: true, used, limit }
}

// ---- Dashboard usage surface (T28) ----

export interface QuotaUsage {
  used: number
  limit: number | null
}

export interface AccountUsage {
  tier: Tier
  activeListings: QuotaUsage
  aiGenerations: QuotaUsage
}

/** Live, real-data snapshot of a seller's tier + usage for the dashboard card
 *  and near-limit meter. AI usage is read unconditionally (even when the tier
 *  is uncapped) so the Business meter shows real consumption rather than a
 *  stale 0. Listing + AI caps/predicates come from the shared
 *  `plans/constants` seam (one source of truth for T24/T25/T26/T28). */
export async function fetchAccountUsage(userId: string): Promise<AccountUsage> {
  const supabase = await createClient()
  const [tier, activeListings, aiUsed] = await Promise.all([
    fetchSellerTier(userId, supabase),
    countActiveListings(userId, supabase),
    countAiGenerationsThisMonth(supabase),
  ])
  const limits = TIER_LIMITS[tier]
  return {
    tier,
    activeListings: { used: activeListings, limit: limits.activeListings },
    aiGenerations: {
      used: aiUsed,
      limit: limits.aiGenerationsPerMonth,
    },
  }
}

// ---- Listing boost read helpers live in lib/boost.ts (client-safe) ----
