import Link from "next/link"
import Image from "next/image"
import { AlertCircleIcon, InboxIcon } from "lucide-react"

import { fetchBuyerOffers } from "@/lib/offers"
import { createClient } from "@/lib/supabase/server"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { HandoffBanner } from "@/components/activity/handoff-banner"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewStars } from "@/components/reviews/review-stars"
import { EmptyState } from "@/components/ui/empty-state"
import { formatPrice } from "@/lib/listings"
import { formatShortDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export async function OffersList({
  userId,
  offset = 0,
}: {
  userId: string
  offset?: number
}) {
  const supabase = await createClient()
  const { offers, error, hasMore } = await fetchBuyerOffers(
    userId,
    { limit: 20, offset },
    supabase
  )

  if (error) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Unable to load offers"
        description="There was a problem loading your offers. Please try again."
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
        title="No offers yet"
        description="When you make an offer on a listing, it will appear here."
        action={
          <Button asChild>
            <Link href="/search">Browse listings</Link>
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
                  isBuyer={true}
                />

                {offer.status === "accepted" && !offer.review && (
                  <div className="mt-3">
                    <ReviewForm
                      offerId={offer.id}
                      listingTitle={offer.listing?.title}
                    />
                  </div>
                )}
                {offer.status === "accepted" && offer.review && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <ReviewStars rating={offer.review.rating} size="sm" />
                    <span className="text-muted-foreground">
                      You rated this transaction
                    </span>
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
