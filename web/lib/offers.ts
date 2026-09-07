import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import { isValidUuid, PAGE_SIZE, type BrowseListing } from "@/lib/listings/constants"
import { mapNestedBrowseListing } from "@/lib/mappings/browse"
import type { NestedBrowseRow } from "@/lib/mappings/browse"
import {
  OPEN_OFFER_STATUSES,
  type OfferStatus,
} from "@/lib/offers/constants"
import {
  type OfferPayment,
  pickPayment,
} from "@/lib/payments/constants"

export * from "@/lib/offers/constants"

// ---- Reads ----

export interface BuyerOfferRow {
  id: string
  listing_id: string
  amount: number
  message: string | null
  status: OfferStatus
  created_at: string
  expires_at: string | null
  listing: BrowseListing | null
  // The review on this offer, if the buyer has already rated the seller (T10).
  review: { id: string; rating: number } | null
  // The payment on this offer (#97); null until a payment is begun.
  payment: OfferPayment | null
}

export interface SellerOfferRow extends BuyerOfferRow {
  buyer: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

/**
 * Paged result for an offers feed. `hasMore` is derived from the server count
 * so the UI can stop rendering "Load more" without guessing (P1.14, #81).
 * Generic over the row shape so the buyer feed stays `BuyerOfferRow[]`-typed
 * and the seller feed stays `SellerOfferRow[]`-typed at the call site.
 */
export interface OffersPage<T extends OfferRow = OfferRow> {
  offers: T[]
  count: number | null
  hasMore: boolean
  error: string | null
}

export type OfferRow = BuyerOfferRow | SellerOfferRow

// A join row from the raw PostgREST shape. The embedded `listing` may lack a
// `seller` join (buyer dashboard never asks for it); mapNestedBrowseListing
// treats a missing seller as null, so the cast is safe.
type RawOfferListingRow = Omit<NestedBrowseRow, "seller"> & {
  seller?: NestedBrowseRow["seller"]
}

interface RawOfferRow {
  id: string
  listing_id: string
  amount: number
  message: string | null
  status: OfferStatus
  created_at: string
  expires_at: string | null
}

function mapOfferListing(
  listing: RawOfferListingRow | null
): BrowseListing | null {
  return listing ? mapNestedBrowseListing(listing as NestedBrowseRow) : null
}

function mapRawOfferRow(
  row: RawOfferRow & {
    listing: RawOfferListingRow | null
    buyer?: { id: string; full_name: string | null; avatar_url: string | null } | null
    review?: { id: string; rating: number } | null
    payment?: OfferPayment[] | null
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
    expires_at: row.expires_at,
    listing: mapOfferListing(row.listing),
    review: row.review ?? null,
    payment: pickPayment(row.payment),
    buyer: withBuyer ? (row.buyer ?? null) : null,
  }
}

const OFFER_COLUMNS = "id, listing_id, amount, message, status, created_at, expires_at"

/** Shared paging args for the offers feeds. limit/offset mirror the browse
 * pattern (fetchListings): PAGE_SIZE rows per window, newest first, with a
 * server count so the UI can render "Load more" without guessing (P1.14, #81).
 * Offers don't touch the 1000-row browse ceiling — the MAX_PAGING_OFFSET
 * guard stays scoped to search/browse only, as the audit notes. */
export interface OffersPageArgs {
  limit?: number
  offset?: number
}

function resolveWindow(args: OffersPageArgs): { limit: number; offset: number } {
  return {
    limit: Math.min(args.limit ?? PAGE_SIZE, PAGE_SIZE),
    offset: args.offset ?? 0,
  }
}

// The buyer's offer history, newest first. RLS keeps this to the user's own
// offers; the listing join drops rows for listings the buyer can no longer see
// (deleted, unpublished, or sold without an accepted offer of theirs).
export async function fetchBuyerOffers(
  userId: string,
  args: OffersPageArgs = {},
  client?: SupabaseClient
): Promise<OffersPage<BuyerOfferRow>> {
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)
  const { data, error, count } = await supabase
    .from("offers")
    .select(
      `${OFFER_COLUMNS},
       listing:listings(id, title, price, condition, city, published_at,
         images:listing_images(id, image_url, display_order)),
review:reviews(id, rating),
       payment:payments(id, tx_ref, amount, currency, status, mode, buyer_confirmed, paid_at, confirmed_at)`,
      { count: "exact" }
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchBuyerOffers:", error.message)
    return { offers: [], count, hasMore: false, error: error.message }
  }

  const offers = (data ?? []) as unknown as {
    id: string
    listing_id: string
    amount: number
    message: string | null
    status: OfferStatus
    created_at: string
    expires_at: string | null
    listing: RawOfferListingRow | null
    review: { id: string; rating: number } | null
    payment: OfferPayment[] | null
  }[]

  const mapped = offers.map((row) => mapRawOfferRow(row, false))
  const hasMore = typeof count === "number" && offset + mapped.length < count
  return { offers: mapped, count, hasMore, error: null }
}

// The seller's incoming offers, newest first. RLS restricts this to offers on
// the seller's own listings; the explicit seller filter is a query hint that
// keeps PostgREST from scanning the whole table. The buyer profile join names
// the person behind each offer.
export async function fetchSellerOffers(
  userId: string,
  args: OffersPageArgs = {},
  client?: SupabaseClient
): Promise<OffersPage<SellerOfferRow>> {
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)
  const { data, error, count } = await supabase
    .from("offers")
    .select(
      `${OFFER_COLUMNS},
       listing:listings(id, title, price, condition, city, published_at,
         seller:profiles!listings_seller_id_fkey(id, full_name, avatar_url, role, trust_score),
         images:listing_images(id, image_url, display_order)),
buyer:profiles(id, full_name, avatar_url),
       payment:payments(id, amount, currency, status, mode, buyer_confirmed, paid_at, confirmed_at)`,
      { count: "exact" }
    )
    .eq("listing.seller_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchSellerOffers:", error.message)
    return { offers: [], count, hasMore: false, error: error.message }
  }

  const offers = (data ?? []) as unknown as {
    id: string
    listing_id: string
    amount: number
    message: string | null
    status: OfferStatus
    created_at: string
    expires_at: string | null
    listing: RawOfferListingRow | null
    buyer: { id: string; full_name: string | null; avatar_url: string | null } | null
    payment: OfferPayment[] | null
  }[]

  const mapped = offers.map((row) => mapRawOfferRow(row, true))
  const hasMore = typeof count === "number" && offset + mapped.length < count
  return { offers: mapped, count, hasMore, error: null }
}

// Open offers (pending or countered) on the seller's listings, for the dashboard
// summary. RLS scopes the count to the caller's own listings; the explicit
// seller filter is the same PostgREST hint used by fetchSellerOffers.
export async function countIncomingOffers(
  userId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? (await createClient())
  const { count, error } = await supabase
    .from("offers")
    .select("listing:listings!offers_listing_id_fkey(id)", { count: "exact", head: true })
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

// A new offer. The submit_offer RPC enforces the published + not-own-listing
// rules (INV-005, ListingMarkedSold), validates amount/message, and applies a
// per-buyer-per-listing rate limit; the explicit uuid gate keeps junk ids from
// reaching the DB. The buyer is resolved from the session inside the RPC.
export async function submitOfferRow(input: {
  listingId: string
  amount: number
  message: string | null
}): Promise<OfferResult> {
  if (!isValidUuid(input.listingId)) {
    return { ok: false, error: "invalid listing id" }
  }
  const supabase = await createClient()
  const result = await callOutcomeRpc(supabase, "submit_offer", {
    p_listing_id: input.listingId,
    p_amount: input.amount,
    p_message: input.message?.trim() || null,
  }, "submitOfferRow")
  return { ok: result.ok === true, error: result.error ?? null }
}

export async function acceptOfferRow(offerId: string): Promise<OfferResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "accept_offer",
    { p_offer_id: offerId },
    "acceptOfferRow"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

export async function declineOfferRow(offerId: string): Promise<OfferResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "decline_offer",
    { p_offer_id: offerId },
    "declineOfferRow"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

export async function counterOfferRow(
  offerId: string,
  amount: number,
  message?: string | null
): Promise<OfferResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "counter_offer",
    { p_offer_id: offerId, p_amount: amount, p_message: message?.trim() || null },
    "counterOfferRow"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

// Buyer declines a seller's counter-offer (walk away from negotiation).
export async function declineCounterRow(offerId: string): Promise<OfferResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "decline_counter",
    { p_offer_id: offerId },
    "declineCounterRow"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

// The seller's recovery path after an accepted offer never gets paid: fails any
// pending payment attempts, declines the offer, and reopens the listing to the
// market (RPC-guarded on no paid payment having landed). This is what keeps the
// "listing sold at accept" state machine from stranding a listing forever when
// the buyer abandons the checkout (#97 / payment recovery migration).
export async function abandonSaleRow(offerId: string): Promise<OfferResult> {
  const supabase = await createClient()
  const result = await callOutcomeRpc(
    supabase,
    "abandon_sale",
    { p_offer_id: offerId },
    "abandonSaleRow"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}

// ---- Offer events (audit trail) ----

export interface OfferEventRow {
  id: string
  offer_id: string
  actor_id: string
  from_status: OfferStatus | null
  to_status: OfferStatus
  amount: number | null
  message: string | null
  created_at: string
}

// Fetch the full negotiation history for an offer, oldest first.
export async function fetchOfferEvents(
  offerId: string,
  client?: SupabaseClient
): Promise<OfferEventRow[]> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from("offer_events")
    .select("id, offer_id, actor_id, from_status, to_status, amount, message, created_at")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchOfferEvents:", error.message)
    return []
  }
  return (data ?? []) as OfferEventRow[]
}
