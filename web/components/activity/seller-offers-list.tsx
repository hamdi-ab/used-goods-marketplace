import Link from "next/link"
import Image from "next/image"
import { AlertCircleIcon, InboxIcon } from "lucide-react"

import { fetchSellerOffers } from "@/lib/offers"
import { createClient } from "@/lib/supabase/server"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { HandoffBanner } from "@/components/activity/handoff-banner"
import { SellerResponseForm } from "@/components/reviews/seller-response-form"
import { ReviewStars } from "@/components/reviews/review-stars"
import { EmptyState } from "@/components/ui/empty-state"
import { formatPrice } from "@/lib/listings"
import { formatShortDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export async function SellerOffersList({
  userId,
  offset = 0,
}: {
  userId: string
  offset?: number
}) {
  const supabase = await createClient()
  const { offers, error, hasMore } = await fetchSellerOffers(
    userId,
    { limit: 20, offset },
    supabase
  )

  if (error) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Unable to load incoming offers"
        description="There was a problem loading your incoming offers. Please try again."
        iconClassName="bg-destructive/10 text-destructive"
        action={
          <Button variant="outline" asChild>
            <Link href="/activity?tab=offers">Try again</Link>
          </Button>
        }
      />
    )
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No incoming offers"
        description="Offers made by buyers on your listings will appear here."
        action={
          <Button asChild>
            <Link href="/sell">Create a listing</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <Card key={offer.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {offer.listing?.image_url && (
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted relative">
                  <Image
                    src={offer.listing.image_url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/listings/${offer.listing_id}`}
                    className="truncate text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                  >
                    {offer.listing?.title ?? "Listing"}
                  </Link>
                  <OfferStatusBadge status={offer.status} />
                </div>
                <div className="mt-1 text-sm font-bold text-primary">
                  {formatPrice(offer.amount)}
                </div>
                {offer.message && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground break-words">
                    {offer.message}
                  </p>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatShortDate(offer.created_at)}
                </div>

                <HandoffBanner
                  status={offer.status}
                  paymentStatus={offer.payment?.status}
                  isBuyer={false}
                />

                {offer.status === "accepted" && offer.review && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <ReviewStars rating={offer.review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        Buyer review
                      </span>
                    </div>
                    {offer.review.comment && (
                      <p className="whitespace-pre-wrap text-sm text-foreground break-words">
                        {offer.review.comment}
                      </p>
                    )}
                    <SellerResponseForm
                      reviewId={offer.review.id}
                      existingResponse={offer.review.response ?? null}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="pt-2 text-center">
          <Button
            variant="outline"
            asChild
            className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Link href={`/activity?tab=offers&offset=${offset + 20}`}>
              Load older offers
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}