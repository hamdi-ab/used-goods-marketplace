"use client"

import Image from "next/image"
import { useActionState, useEffect } from "react"
import { ExternalLinkIcon, TrashIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { adminResolveReport } from "@/app/actions/reports"
import type { ReportWithRelations } from "@/lib/reports"
import { REPORT_REASON_LABELS } from "@/lib/reports/constants"
import { ReportStatusBadge } from "@/components/reports/report-status-badge"
import { ReviewStars } from "@/components/reviews/review-stars"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function ReportTarget({ report }: { report: ReportWithRelations }) {
  const listing = report.listing
  const seller = report.seller
  const review = report.review

  if (listing) {
    return (
      <div className="flex items-start gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
          {listing.image_url ? (
            <Image
              src={listing.image_url}
              alt={listing.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={`/listings/${listing.id}`}
            className="line-clamp-1 font-medium hover:underline"
          >
            {listing.title}
          </a>
          <p className="text-sm text-muted-foreground">
            Price: {listing.price} ETB
          </p>
          {listing.seller ? (
            <p className="text-xs text-muted-foreground">
              Seller: {listing.seller.full_name ?? "Unnamed"}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  if (seller) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {(seller.full_name?.[0] ?? seller.id[0].toUpperCase()).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={`/users/${seller.id}`}
            className="font-medium hover:underline"
          >
            {seller.full_name ?? "Unnamed seller"}
          </a>
          <p className="text-sm text-muted-foreground">
            Role: {seller.role ?? "buyer"} · Trust: {seller.trust_score ?? 0}
          </p>
        </div>
      </div>
    )
  }

  if (review) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              {review.buyer?.avatar_url ? (
                <AvatarImage
                  src={review.buyer.avatar_url}
                  alt={review.buyer.full_name ?? "Buyer"}
                />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {review.buyer?.full_name?.[0]?.toUpperCase() ?? "B"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {review.buyer?.full_name ?? "Buyer"}
            </span>
          </div>
          <ReviewStars rating={review.rating} size="xs" />
        </div>
        {review.comment ? (
          <p className="text-sm italic text-foreground/90">
            &ldquo;{review.comment}&rdquo;
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            No written comment
          </p>
        )}
        {review.listing ? (
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
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      Target no longer available
    </p>
  )
}

export function AdminReportCard({
  report,
}: {
  report: ReportWithRelations
}) {
  const [state, action, pending] = useActionState(adminResolveReport, {})

  useEffect(() => {
    if (state?.ok) {
      toast.success("Report resolved")
    }
  }, [state?.ok])

  const canRemoveListing = report.reported_listing_id !== null
  const canBlockSeller = report.reported_seller_id !== null
  const canRemoveReview = report.review_id !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <span className="font-medium">
              {REPORT_REASON_LABELS[report.reason]}
            </span>
          </CardTitle>
          <ReportStatusBadge status={report.status} />
        </div>
        <CardDescription>
          Reported by{" "}
          <span className="font-medium">
            {report.reporter?.full_name ?? "Unknown"}
          </span>{" "}
          · {new Date(report.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ReportTarget report={report} />

        {report.note ? (
          <p className="mt-3 text-sm text-foreground/80">{report.note}</p>
        ) : null}

        {state?.message && state.ok !== true ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
          {canRemoveListing && report.listing ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/listings/${report.listing.id}`}>
                <ExternalLinkIcon className="mr-1.5 size-3.5" />
                View listing
              </a>
            </Button>
          ) : null}

          {canBlockSeller ? (
            <form action={action}>
              <input type="hidden" name="reportId" value={report.id} readOnly />
              <input type="hidden" name="action" value="block_seller" readOnly />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending}
                className="border-orange-200 text-orange-800 hover:bg-orange-50"
              >
                Block seller
              </Button>
            </form>
          ) : null}

          {canRemoveListing ? (
            <form action={action}>
              <input type="hidden" name="reportId" value={report.id} readOnly />
              <input type="hidden" name="action" value="remove_listing" readOnly />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending}
                className="border-red-200 text-red-800 hover:bg-red-50"
              >
                <TrashIcon className="mr-1.5 size-3.5" />
                Remove listing
              </Button>
            </form>
          ) : null}

          {canRemoveReview ? (
            <form action={action}>
              <input type="hidden" name="reportId" value={report.id} readOnly />
              <input type="hidden" name="action" value="remove_review" readOnly />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending}
                className="border-red-200 text-red-800 hover:bg-red-50"
              >
                <TrashIcon className="mr-1.5 size-3.5" />
                Remove review
              </Button>
            </form>
          ) : null}

          <form action={action}>
            <input type="hidden" name="reportId" value={report.id} readOnly />
            <input type="hidden" name="action" value="reject" readOnly />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              <XIcon className="mr-1.5 size-3.5" />
              Reject
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
