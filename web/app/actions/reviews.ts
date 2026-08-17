"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireTrader } from "@/lib/auth"
import { submitReviewRow } from "@/lib/reviews"
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

  const result = await submitReviewRow({
    offerId: parsed.data.offerId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not submit your review" }
  }

  revalidatePath("/offers")
  if (result.sellerId) revalidatePath(`/users/${result.sellerId}`)
  return { ok: true }
}
