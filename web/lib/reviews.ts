import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import { isValidUuid } from "@/lib/listings"

export * from "@/lib/reviews/constants"

// ---- Reads ----

export interface SellerReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  buyer: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

export interface SellerRatingSummary {
  average: number | null
  count: number
}

// PostgREST returns every embedded relation as an array, even a singular one,
// so `buyer:profiles(...)` arrives as `{...}[] | null`. Flatten to a single row.
interface RawReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  buyer:
    | { id: string; full_name: string | null; avatar_url: string | null }[]
    | null
}

const REVIEW_COLUMNS =
  "id, rating, comment, created_at, buyer:profiles!reviews_buyer_id_fkey(id, full_name, avatar_url)"

// The seller's reviews, newest first, with the reviewer's public identity.
// RLS exposes every review to the public, so any visitor can render the list.
export async function fetchSellerReviews(
  sellerId: string,
  client?: Supabase
): Promise<SellerReviewRow[]> {
  if (!isValidUuid(sellerId)) return []
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchSellerReviews:", error.message)
    return []
  }
  const rows = (data as RawReviewRow[] | null) ?? []
  return rows.map((row) => ({
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment,
    created_at: row.created_at,
    buyer: row.buyer?.[0] ?? null,
  }))
}

// Aggregate rating for the profile header. Computed from the same rows the
// review list renders, so the summary and list can never disagree.
export function summarizeRating(reviews: SellerReviewRow[]): SellerRatingSummary {
  if (reviews.length === 0) return { average: null, count: 0 }
  const total = reviews.reduce((sum, r) => sum + r.rating, 0)
  return { average: total / reviews.length, count: reviews.length }
}

// ---- Writes ----

export interface ReviewResult {
  ok: boolean
  error: string | null
  sellerId: string | null
}

/** Result shape the submit_review RPC returns (jsonb { ok, error, seller_id }). */
interface ReviewRpcData {
  ok?: boolean
  error?: string | null
  seller_id?: string | null
}

// A new review, written by the buyer of an accepted offer. The RPC derives the
// seller from the offer and recomputes the seller's trust score (AC5).
export async function submitReviewRow(input: {
  offerId: string
  rating: number
  comment: string | null
}): Promise<ReviewResult> {
  if (!isValidUuid(input.offerId)) {
    return { ok: false, error: "invalid offer id", sellerId: null }
  }
  const supabase = await createClient()
  const result = await callOutcomeRpc<ReviewRpcData>(
    supabase,
    "submit_review",
    {
      p_offer_id: input.offerId,
      p_rating: input.rating,
      p_comment: input.comment?.trim() || null,
    },
    "submitReviewRow"
  )
  return {
    ok: result.ok === true,
    error: result.error ?? null,
    sellerId: result.seller_id ?? null,
  }
}
