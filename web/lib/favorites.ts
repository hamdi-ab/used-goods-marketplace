import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
import {
  isValidUuid,
  mapBrowseListing,
  type BrowseListing,
  type RawListingRow,
} from "@/lib/listings"
import { toggleFavoriteState } from "@/lib/favorites/constants"

export * from "@/lib/favorites/constants"

// ---- Reads ----

export async function fetchFavoriteIds(
  userId: string,
  client?: Supabase
): Promise<string[]> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
  if (error) {
    console.error("fetchFavoriteIds:", error.message)
    return []
  }
  return (data ?? []).map((row) => row.listing_id)
}

// The favorites feed: rows are joined against listings, so RLS already drops
// listings that are no longer readable (unpublished, deleted, sold). Only
// still-available favorites are returned, most recently favorited first.
export async function fetchFavoriteListings(
  userId: string,
  client?: Supabase
): Promise<BrowseListing[]> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from("favorites")
    .select(
      `created_at,
        listing:listings(id, title, price, condition, city, published_at,
          seller:profiles(id, full_name, avatar_url, role, trust_score, phone_verified, fayda_verified),
          images:listing_images(id, image_url, display_order))`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchFavoriteListings:", error.message)
    return []
  }

  // supabase-js without generated types types embedded resources as arrays,
  // but listing_id -> listings is a to-one join: PostgREST returns a single
  // row (or null when the listing is no longer readable under RLS).
  const rows = (data ?? []) as unknown as {
    listing: RawListingRow | null
  }[]

  return rows
    .map((row) => row.listing)
    .filter((listing): listing is RawListingRow => listing !== null)
    .map(mapBrowseListing)
}

// ---- Writes (called by the toggle server action) ----

export interface ToggleFavoriteResult {
  ok: boolean
  error: string | null
}

// Persists the toggle: reads the current row state, applies the shared
// toggleFavoriteState reducer, then inserts or deletes to reach the target.
// The reducer is the same one the client's useOptimistic applies, so the
// optimistic frame and the final server state always agree.
export async function toggleFavoriteRow(
  userId: string,
  listingId: string
): Promise<ToggleFavoriteResult> {
  if (!isValidUuid(listingId)) {
    return { ok: false, error: "invalid listing id" }
  }
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle()
  const shouldFavor = toggleFavoriteState(Boolean(existing))

  if (shouldFavor) {
    // A new favorite requires a published, non-deleted listing (RLS would also
    // return null for anything else, but the explicit check keeps the write
    // from inserting a row for an unreadable listing).
    const { data: listing } = await supabase
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .eq("status", "published")
      .maybeSingle()
    if (!listing) return { ok: false, error: "listing not found" }
  }

  // Deleting is always allowed: a favorite can outlive its listing's
  // publish status (a listing sold or unpublished while saved), and the
  // owner must still be able to clear that stale row.
  const result = shouldFavor
    ? await supabase.from("favorites").insert({
        user_id: userId,
        listing_id: listingId,
      })
    : await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId)

  if (result.error) {
    console.error("toggleFavoriteRow:", result.error.message)
    return { ok: false, error: result.error.message }
  }
  return { ok: true, error: null }
}
