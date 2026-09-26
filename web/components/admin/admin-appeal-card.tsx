"use client"

import { useActionState, useEffect } from "react"
import { CheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { adminResolveReviewAppeal } from "@/app/actions/appeals"
import type { ReviewAppealWithRelations } from "@/lib/appeals"
import { ReviewStars } from "@/components/reviews/review-stars"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AdminAppealCard({
  appeal,
}: {
  appeal: ReviewAppealWithRelations
}) {
  const [state, action, pending] = useActionState(adminResolveReviewAppeal, {})

  useEffect(() => {
    if (state?.ok) {
      toast.success("Appeal resolved")
    }
  }, [state?.ok])

  const review = appeal.review

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <span className="font-medium">Review Appeal</span>
          </CardTitle>
          <Badge
            variant={
              appeal.status === "approved"
                ? "success"
                : appeal.status === "denied"
                ? "outline"
                : "secondary"
            }
            className={
              appeal.status === "denied"
                ? "border-destructive/30 text-destructive"
                : ""
            }
          >
            {appeal.status.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          Appealed by{" "}
          <span className="font-medium">
            {appeal.reviewer?.full_name ?? "Reviewer"}
          </span>{" "}
          · {new Date(appeal.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Context of the removed review */}
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                {appeal.reviewer?.avatar_url ? (
                  <AvatarImage
                    src={appeal.reviewer.avatar_url}
                    alt={appeal.reviewer.full_name ?? "Reviewer"}
                  />
                ) : null}
                <AvatarFallback className="text-[10px]">
                  {appeal.reviewer?.full_name?.[0]?.toUpperCase() ?? "R"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {appeal.reviewer?.full_name ?? "Reviewer"}
              </span>
            </div>
            {review ? <ReviewStars rating={review.rating} size="xs" /> : null}
          </div>

          {review?.comment ? (
            <p className="text-sm italic text-foreground/90">
              &ldquo;{review.comment}&rdquo;
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              No written comment
            </p>
          )}

          {review?.deleted_reason ? (
            <p className="text-xs text-destructive">
              <span className="font-medium">Removal reason:</span>{" "}
              {review.deleted_reason}
            </p>
          ) : null}

          {review?.listing ? (
            <p className="text-xs text-muted-foreground">
              On listing:{" "}
              <a
                href={`/listings/${review.listing.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {review.listing.title}
              </a>
            </p>
          ) : null}
        </div>

        {/* Appellant's explanation */}
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Appeal Explanation:
          </p>
          <p className="mt-1 text-sm text-foreground/90">{appeal.reason}</p>
        </div>

        {state?.message && state.ok !== true ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        {appeal.status === "pending" ? (
          <div className="mt-4 flex flex-col flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
            <form action={action}>
              <input type="hidden" name="appealId" value={appeal.id} readOnly />
              <input type="hidden" name="action" value="approve" readOnly />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending}
                className="border-green-200 text-green-800 hover:bg-green-50"
              >
                <CheckIcon className="mr-1.5 size-3.5" />
                Approve (Restore review)
              </Button>
            </form>

            <form action={action}>
              <input type="hidden" name="appealId" value={appeal.id} readOnly />
              <input type="hidden" name="action" value="deny" readOnly />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={pending}
                className="text-destructive hover:bg-destructive/10"
              >
                <XIcon className="mr-1.5 size-3.5" />
                Deny appeal
              </Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
