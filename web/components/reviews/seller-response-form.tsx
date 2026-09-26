"use client"

import { useActionState } from "react"
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
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-xs text-muted-foreground">Your response</span>
          {dateStr && <span className="text-xs text-muted-foreground">{dateStr}</span>}
        </div>
        <p className="text-foreground whitespace-pre-wrap">{text}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <Textarea
        name="comment"
        placeholder="Respond to this review..."
        maxLength={1000}
        rows={3}
        disabled={pending}
      />
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      {state.ok && <p className="text-sm text-green-600">Response sent</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending..." : "Respond"}
      </Button>
    </form>
  )
}