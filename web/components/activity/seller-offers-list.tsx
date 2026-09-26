import { fetchSellerOffers } from "@/lib/offers"
import { createClient } from "@/lib/supabase/server"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { SellerResponseForm } from "@/components/reviews/seller-response-form"
import { ReviewStars } from "@/components/reviews/review-stars"
import { formatPrice } from "@/lib/listings"
import { formatShortDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export async function SellerOffersList({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { offers } = await fetchSellerOffers(userId, { limit: 20, offset: 0 }, supabase)

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">📥</div>
        <h3 className="font-semibold mb-1">No incoming offers</h3>
        <p className="text-sm text-muted-foreground mb-4">Offers on your listings will appear here.</p>
        <Button asChild><Link href="/sell">Create a listing</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <Card key={offer.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {offer.listing?.image_url && (
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  <img src={offer.listing.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/listings/${offer.listing_id}`} className="font-medium text-sm hover:underline truncate">
                    {offer.listing?.title ?? "Listing"}
                  </Link>
                  <OfferStatusBadge status={offer.status} />
                </div>
                <div className="text-primary font-bold text-sm mt-1">{formatPrice(offer.amount)}</div>
                {offer.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.message}</p>}
                <div className="text-xs text-muted-foreground mt-1">{formatShortDate(offer.created_at)}</div>
                {offer.status === "accepted" && offer.review && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <ReviewStars rating={offer.review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">Buyer review</span>
                    </div>
                    {offer.review.comment && (
                      <p className="text-sm text-foreground whitespace-pre-wrap">{offer.review.comment}</p>
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
    </div>
  )
}