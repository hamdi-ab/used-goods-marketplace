import "server-only"

import { createClient } from "@/lib/supabase/server"
import {
  isValidUuid,
  mapBrowseListing,
  type BrowseListing,
  type RawListingRow,
} from "@/lib/listings"
import {
  OPEN_OFFER_STATUSES,
  type OfferStatus,
} from "@/lib/offers/constants"

export * from "@/lib/offers/constants"

// ---- Reads ----

export interface BuyerOfferRow {
  id: string
  listing_id: string
  amount: number
  message: string | null
  status: OfferStatus
  created_at: string
  listing: BrowseListing | null
  // The review on this offer, if the buyer has already rated the seller (T10).
  review: { id: string; rating: number } | null
}

export interface SellerOfferRow extends BuyerOfferRow {
  buyer: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

// A join row from the raw PostgREST shape. The embedded `listing` may lack a
// `seller` join (buyer dashboard never asks for it); mapBrowseListing treats a
// missing seller as null, so the cast is safe.
type RawOfferListingRow = Omit<RawListingRow, "seller"> & {
  seller?: RawListingRow["seller"]
}

interface RawOfferRow {
  id: string
  listing_id: string
  amount: number
  message: string | null
  status: OfferStatus
  created_at: string
}

function mapOfferListing(
  listing: RawOfferListingRow | null
): BrowseListing | null {
  return listing ? mapBrowseListing(listing as RawListingRow) : null
}

function mapRawOfferRow(
  row: RawOfferRow & {
    listing: RawOfferListingRow | null
    buyer?: { id: string; full_name: string | null; avatar_url: string | null } | null
    review?: { id: string; rating: number } | null
  },
  withBuyer: boolean
): SellerOfferRow {
  return {
    id: row.id,
    listing_id: row.listing_id,
    amount: row.amount,
    message: row.message,
    status: row.status,
    created_at: row.created_at,
    listing: mapOfferListing(row.listing),
    review: row.review ?? null,
    buyer: withBuyer ? (row.buyer ?? null) : null,
  }
}

const OFFER_COLUMNS = "id, listing_id, amount, message, status, created_at"

// The buyer's offer history, newest first. RLS keeps this to the user's own
// offers; the listing join drops rows for listings the buyer can no longer see
// (deleted, unpublished, or sold without an accepted offer of theirs).
export async function fetchBuyerOffers(userId: string): Promise<BuyerOfferRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("offers")
    .select(
      `${OFFER_COLUMNS},
       listing:listings(id, title, price, condition, city, published_at,
         images:listing_images(id, image_url, display_order)),
       review:reviews(id, rating)`
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchBuyerOffers:", error.message)
    return []
  }

  const rows = (data ?? []) as unknown as {
    id: string
    listing_id: string
    amount: number
    message: string | null
    status: OfferStatus
    created_at: string
    listing: RawOfferListingRow | null
    review: { id: string; rating: number } | null
  }[]

  return rows.map((row) => mapRawOfferRow(row, false))
}

// The seller's incoming offers, newest first. RLS restricts this to offers on
// the seller's own listings; the explicit seller filter is a query hint that
// keeps PostgREST from scanning the whole table. The buyer profile join names
// the person behind each offer.
export async function fetchSellerOffers(userId: string): Promise<SellerOfferRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("offers")
    .select(
      `${OFFER_COLUMNS},
       listing:listings(id, title, price, condition, city, published_at,
         seller:profiles(id, full_name, avatar_url, role, trust_score),
         images:listing_images(id, image_url, display_order)),
       buyer:profiles(id, full_name, avatar_url)`
    )
    .eq("listing.seller_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchSellerOffers:", error.message)
    return []
  }

  const rows = (data ?? []) as unknown as {
    id: string
    listing_id: string
    amount: number
    message: string | null
    status: OfferStatus
    created_at: string
    listing: RawOfferListingRow | null
    buyer: { id: string; full_name: string | null; avatar_url: string | null } | null
  }[]

  return rows.map((row) => mapRawOfferRow(row, true))
}

// Open offers (pending or countered) on the seller's listings, for the dashboard
// summary. RLS scopes the count to the caller's own listings; the explicit
// seller filter is the same PostgREST hint used by fetchSellerOffers.
export async function countIncomingOffers(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("listing.seller_id", userId)
    .in("status", OPEN_OFFER_STATUSES)

  if (error) {
    console.error("countIncomingOffers:", error.message)
    return 0
  }
  return count ?? 0
}

// ---- Writes ----

export interface OfferResult {
  ok: boolean
  error: string | null
}

// A new offer. RLS enforces the published + not-own-listing rules (INV-005,
// ListingMarkedSold); the explicit uuid gate keeps junk ids from reaching the DB.
export async function submitOfferRow(input: {
  userId: string
  listingId: string
  amount: number
  message: string | null
}): Promise<OfferResult> {
  if (!isValidUuid(input.listingId)) {
    return { ok: false, error: "invalid listing id" }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("offers").insert({
    listing_id: input.listingId,
    buyer_id: input.userId,
    amount: input.amount,
    message: input.message?.trim() || null,
  })
  if (error) {
    console.error("submitOfferRow:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true, error: null }
}

async function runOfferRpc(
  fn: "accept_offer" | "decline_offer" | "counter_offer",
  args: Record<string, string | number>
): Promise<OfferResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(fn, args)
  if (error) {
    console.error(`${fn}:`, error.message)
    return { ok: false, error: error.message }
  }
  const result = (data ?? {}) as { ok?: boolean; error?: string | null }
  return { ok: result.ok === true, error: result.error ?? null }
}

export function acceptOfferRow(offerId: string): Promise<OfferResult> {
  return runOfferRpc("accept_offer", { p_offer_id: offerId })
}

export function declineOfferRow(offerId: string): Promise<OfferResult> {
  return runOfferRpc("decline_offer", { p_offer_id: offerId })
}

export function counterOfferRow(
  offerId: string,
  amount: number
): Promise<OfferResult> {
  return runOfferRpc("counter_offer", { p_offer_id: offerId, p_amount: amount })
}
