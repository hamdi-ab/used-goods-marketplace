"use client"

import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { submitReviewResponse, type SubmitReviewResponseState } from "@/app/actions/reviews"

const initialState: SubmitReviewResponseState = {}

export function SellerResponseForm({
  reviewId,
  existingResponse,
}: {
  reviewId: string
  existingResponse?: { comment: string; created_at?: string } | string | null
}) {
  const [state, formAction, pending] = useActionState(submitReviewResponse, initialState)

  if (existingResponse) {
    const text = typeof existingResponse === "string" ? existingResponse : existingResponse.comment
    const dateStr = typeof existingResponse === "string" || !existingResponse.created_at
      ? null
      : new Date(existingResponse.created_at).toLocaleDateString()

    return (
      <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Your response</span>
          {dateStr && <span className="text-xs text-muted-foreground">{dateStr}</span>}
        </div>
        <p className="whitespace-pre-wrap text-foreground">{text}</p>
      </div>
    )
  }

  return (
    <form action={formAction} aria-busy={pending} className="mt-3 space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label htmlFor={`response-comment-${reviewId}`} className="sr-only">
        Your response to this review
      </label>
      <Textarea
        id={`response-comment-${reviewId}`}
        name="comment"
        placeholder="Respond to this review..."
        maxLength={1000}
        rows={3}
        disabled={pending}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state.ok && <p className="text-sm text-green-600">Response sent</p>}
      <Button
        type="submit"
        size="sm"
        disabled={pending}
        className="min-h-[40px] px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {pending ? (
          <>
            <Loader2Icon className="mr-2 size-3.5 animate-spin" />
            Sending...
          </>
        ) : (
          "Respond"
        )}
      </Button>
    </form>
  )
}