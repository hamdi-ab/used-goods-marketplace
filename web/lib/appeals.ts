import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"

export type ReviewAppealStatus = "pending" | "approved" | "denied"

export interface ReviewAppealWithRelations {
  id: string
  review_id: string
  reviewer_id: string
  reason: string
  status: ReviewAppealStatus
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  reviewer: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  review: {
    id: string
    rating: number
    comment: string | null
    deleted_reason: string | null
    deleted_at: string | null
    seller: {
      id: string
      full_name: string | null
    } | null
    listing: {
      id: string
      title: string
    } | null
  } | null
}

const APPEAL_JOINS = `
  id,
  review_id,
  reviewer_id,
  reason,
  status,
  admin_note,
  created_at,
  resolved_at,
  reviewer:profiles!review_appeals_reviewer_id_fkey(id, full_name, avatar_url),
  review:reviews!review_appeals_review_id_fkey(
    id,
    rating,
    comment,
    deleted_reason,
    deleted_at,
    seller:profiles!reviews_seller_id_fkey(id, full_name),
    offer:offers!reviews_offer_id_fkey(
      listing:listings(id, title)
    )
  )
`

interface RawAppealRow {
  id: string
  review_id: string
  reviewer_id: string
  reason: string
  status: string
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  reviewer: { id: string; full_name: string | null; avatar_url: string | null } | null
  review: {
    id: string
    rating: number | string
    comment: string | null
    deleted_reason: string | null
    deleted_at: string | null
    seller?: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null
    offer?: {
      listing?: { id: string; title: string } | { id: string; title: string }[] | null
    } | {
      listing?: { id: string; title: string } | { id: string; title: string }[] | null
    }[] | null
  } | null
}

function normalizeAppeal(row: RawAppealRow): ReviewAppealWithRelations {
  const review = row.review
  let seller = null
  let listing = null

  if (review?.seller) {
    seller = Array.isArray(review.seller) ? review.seller[0] : review.seller
  }

  if (review?.offer) {
    const offerObj = Array.isArray(review.offer) ? review.offer[0] : review.offer
    if (offerObj?.listing) {
      listing = Array.isArray(offerObj.listing) ? offerObj.listing[0] : offerObj.listing
    }
  }

  return {
    id: row.id,
    review_id: row.review_id,
    reviewer_id: row.reviewer_id,
    reason: row.reason,
    status: (row.status ?? "pending") as ReviewAppealStatus,
    admin_note: row.admin_note,
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    reviewer: row.reviewer,
    review: review
      ? {
          id: review.id,
          rating: Number(review.rating),
          comment: review.comment,
          deleted_reason: review.deleted_reason,
          deleted_at: review.deleted_at,
          seller: seller ? { id: seller.id, full_name: seller.full_name } : null,
          listing: listing ? { id: listing.id, title: listing.title } : null,
        }
      : null,
  }
}

/**
 * Admin: Fetch all pending review appeals.
 */
export async function fetchAdminReviewAppeals(
  client?: SupabaseClient
): Promise<ReviewAppealWithRelations[]> {
  const supabase = client ?? (await createClient())

  const { data, error } = await supabase
    .from("review_appeals")
    .select(APPEAL_JOINS)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchAdminReviewAppeals:", error.message)
    return []
  }

  return ((data ?? []) as unknown as RawAppealRow[]).map(normalizeAppeal)
}

/**
 * Reviewer: Submit an appeal for a removed review.
 */
export async function appealReviewRemoval(
  reviewId: string,
  reason: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()

  const result = await callOutcomeRpc(
    supabase,
    "appeal_review_removal",
    {
      p_review_id: reviewId,
      p_reason: reason.trim(),
    },
    "appealReviewRemoval"
  )

  return { ok: result.ok === true, error: result.error ?? null }
}

/**
 * Admin: Resolve a review appeal (approve or deny).
 */
export async function resolveReviewAppeal(
  appealId: string,
  action: "approve" | "deny",
  adminNote?: string | null
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()

  const result = await callOutcomeRpc(
    supabase,
    "resolve_review_appeal",
    {
      p_appeal_id: appealId,
      p_action: action,
      p_admin_note: adminNote?.trim() || null,
    },
    "resolveReviewAppeal"
  )

  return { ok: result.ok === true, error: result.error ?? null }
}
