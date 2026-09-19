"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireTrader } from "@/lib/auth"
import { consumeRateBudget } from "@/lib/rate-limit"
import { submitReviewRow } from "@/lib/reviews"
import { createClient } from "@/lib/supabase/server"
import {
  RATING_MAX,
  RATING_MIN,
  REVIEW_COMMENT_MAX,
} from "@/lib/reviews/constants"
import { uuidSchema } from "@/lib/uuid"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const reviewSchema = z.object({
  offerId: uuidSchema,
  rating: z.coerce
    .number({ message: "Pick a rating" })
    .int()
    .min(RATING_MIN, "Pick a rating from 1 to 5")
    .max(RATING_MAX, "Pick a rating from 1 to 5"),
  comment: z
    .string()
    .max(REVIEW_COMMENT_MAX, `Keep the comment under ${REVIEW_COMMENT_MAX} characters`)
    .optional(),
})

export type ReviewState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

// Buyer reviews a completed transaction (an accepted offer). The RPC itself
// re-checks that the caller is the accepted-offer buyer and derives the seller
// from the offer, so the action only needs to validate shape + session.
export async function submitReview(
  _prevState: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    offerId: formValue(formData, "offerId"),
    rating: formData.get("rating"),
    comment: formValue(formData, "comment"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  // Require a trader session so the RPC's auth.uid() resolves; the RPC itself
  // re-checks that the caller is the accepted-offer buyer. (Mirrors offers/offerAction.)
  await requireTrader()

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await submitReviewRow({
    offerId: parsed.data.offerId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not submit your review" }
  }

  // Notify seller of new review (best-effort, non-blocking)
  if (result.sellerId) {
    const { createNotification } = await import("@/lib/notifications/service")
    createNotification({
      userId: result.sellerId,
      type: "review_received",
      title: "New review received",
      body: `You received a ${parsed.data.rating}-star review`,
      metadata: { offer_id: parsed.data.offerId },
    }).catch(() => {})
  }

  revalidatePath("/offers")
  if (result.sellerId) revalidatePath(`/users/${result.sellerId}`)
  return { ok: true }
}

export type SubmitReviewResponseState = {
  message?: string
  ok?: boolean
}

export async function submitReviewResponse(
  _prevState: SubmitReviewResponseState,
  formData: FormData
): Promise<SubmitReviewResponseState> {
  const reviewId = formData.get("reviewId")
  const comment = formData.get("comment")

  const parsed = uuidSchema.safeParse(reviewId)
  if (!parsed.success) {
    return { message: "Invalid review" }
  }

  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    return { message: "Comment is required" }
  }

  if (comment.length > 1000) {
    return { message: "Comment must be under 1000 characters" }
  }

  await requireTrader()

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("submit_review_response", {
    p_review_id: parsed.data,
    p_comment: comment.trim(),
  })

  if (error) {
    console.error("submitReviewResponse:", error.message)
    return { message: "Could not submit response" }
  }

  const result = data as { ok?: boolean; error?: string }
  if (!result?.ok) {
    return { message: result?.error ?? "Could not submit response" }
  }

  revalidatePath("/activity")
  revalidatePath("/dashboard")
  return { ok: true }
}

export type RemoveReviewState = {
  message?: string
  ok?: boolean
}

// Admin removes a review that violates guidelines. The RPC recomputes the
// seller's trust score after removal.
export async function removeReview(
  _prevState: RemoveReviewState,
  formData: FormData
): Promise<RemoveReviewState> {
  const reviewId = formData.get("reviewId")
  const reason = formData.get("reason")

  const parsed = uuidSchema.safeParse(reviewId)
  if (!parsed.success) {
    return { message: "Invalid review" }
  }

  if (!reason || typeof reason !== "string") {
    return { message: "Reason is required" }
  }

  const { requireAdmin } = await import("@/lib/auth")
  await requireAdmin()

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("remove_review", {
    p_review_id: parsed.data,
    p_reason: reason,
  })

  if (error) {
    console.error("removeReview:", error.message)
    return { message: "Could not remove review" }
  }

  const result = data as { ok?: boolean; error?: string; seller_id?: string }
  if (!result?.ok) {
    return { message: result?.error ?? "Could not remove review" }
  }

  revalidatePath("/admin/reviews")
  revalidatePath("/dashboard")
  if (result.seller_id) revalidatePath(`/users/${result.seller_id}`)
  return { ok: true }
}
