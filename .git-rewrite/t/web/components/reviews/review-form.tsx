"use client"

import { useActionState, useState } from "react"
import { StarIcon } from "lucide-react"

import { submitReview, type ReviewState } from "@/app/actions/reviews"
import { RATING_MAX, REVIEW_COMMENT_MAX } from "@/lib/reviews/constants"
import { TEXTAREA_CLASS } from "@/lib/form-fields"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function ReviewForm({
  offerId,
  listingTitle,
}: {
  offerId: string
  listingTitle?: string
}) {
  const [rating, setRating] = useState<number>(0)
  const [state, formAction, pending] = useActionState(submitReview, {} as ReviewState)

  // Once the review is persisted the server action revalidates /offers and the
  // seller profile; here we just swap the form for a thank-you line.
  if (state.ok) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        Thanks for your review{listingTitle ? ` of “${listingTitle}”` : ""}.
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="offerId" value={offerId} />

      <div className="space-y-2">
        <label className="block text-sm font-medium">Your rating</label>
        <div className="flex items-center gap-1">
          {Array.from({ length: RATING_MAX }, (_, i) => {
            const value = i + 1
            return (
              <label key={value} htmlFor={`review-rating-${offerId}-${value}`}>
                <input
                  type="radio"
                  name="rating"
                  id={`review-rating-${offerId}-${value}`}
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  required
                  className="sr-only"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                />
                <StarIcon
                  className={cn(
                    "size-6 shrink-0 cursor-pointer transition-colors",
                    value <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40 hover:text-muted-foreground/70"
                  )}
                />
              </label>
            )
          })}
        </div>
        <FieldError message={state.errors?.rating?.[0]} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`review-comment-${offerId}`} className="block text-sm font-medium">
          Comment (optional)
        </label>
        <textarea
          id={`review-comment-${offerId}`}
          name="comment"
          rows={4}
          maxLength={REVIEW_COMMENT_MAX}
          placeholder="What was the transaction like?"
          className={TEXTAREA_CLASS}
        />
        <FieldError message={state.errors?.comment?.[0]} />
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || rating === 0}>
        {pending ? "Sending…" : "Submit review"}
      </Button>
    </form>
  )
}
