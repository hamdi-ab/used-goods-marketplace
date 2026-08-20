import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import { isValidUuid } from "@/lib/uuid"
import {
  pagedHasMore,
  resolveWindow,
  type PagingArgs,
} from "@/lib/pagination"

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
// One PAGE_SIZE window per request (P1.14, #81); `hasMore` comes from the
// server count so the UI can stop rendering "Load more" without guessing.
export interface ReviewsPage {
  reviews: SellerReviewRow[]
  count: number | null
  hasMore: boolean
  error: string | null
}

export async function fetchSellerReviews(
  sellerId: string,
  args: PagingArgs = {},
  client?: Supabase
): Promise<ReviewsPage> {
  if (!isValidUuid(sellerId)) {
    return { reviews: [], count: 0, hasMore: false, error: null }
  }
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)
  const { data, error, count } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS, { count: "exact" })
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchSellerReviews:", error.message)
    return { reviews: [], count, hasMore: false, error: error.message }
  }
  const rows = (data as RawReviewRow[] | null) ?? []
  const reviews = rows.map((row) => ({
    id: row.id,
    rating: Number(row.rating),
    comment: row.comment,
    created_at: row.created_at,
    buyer: row.buyer?.[0] ?? null,
  }))
  return {
    reviews,
    count,
    hasMore: pagedHasMore(offset, reviews.length, count),
    error: null,
  }
}

// Aggregate rating for the profile header. With the review list paginated the
// summary can no longer be derived from the visible rows, so it is its own
// cheap read over just the rating column — one number + count instead of the
// full joined list (P1.14, #81).
export async function fetchSellerRatingSummary(
  sellerId: string,
  client?: Supabase
): Promise<SellerRatingSummary> {
  if (!isValidUuid(sellerId)) return { average: null, count: 0 }
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("seller_id", sellerId)

  if (error) {
    console.error("fetchSellerRatingSummary:", error.message)
    return { average: null, count: 0 }
  }
  const ratings = ((data ?? []) as { rating: number | string }[]).map((r) =>
    Number(r.rating)
  )
  const count = ratings.length
  if (count === 0) return { average: null, count: 0 }
  return {
    average: ratings.reduce((sum, r) => sum + r, 0) / count,
    count,
  }
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
