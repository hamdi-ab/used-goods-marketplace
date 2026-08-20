import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { SendIcon } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { fetchBuyerOffers } from "@/lib/offers"
import { verifyOfferPayment } from "@/lib/payments"
import { formatPrice } from "@/lib/listings"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { formatShortDate } from "@/lib/utils"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { BuyerOfferActions } from "@/components/offers/buyer-offer-actions"
import { BuyerPayment } from "@/components/offers/buyer-payment"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewStars } from "@/components/reviews/review-stars"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My offers",
  description: "Offers you have made on the VinTech Marketplace.",
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireUser()
  const params = await searchParams
  const offset = parseOffset(params.offset)

  const { offers, hasMore, error } = await fetchBuyerOffers(user.id, {
    offset,
  })

  // #97 — the buyer returns here from Chapa's hosted checkout with the tx_ref
  // in the URL. The /payments/callback route already verified server-side, so
  // by the time we render the row is terminal (paid/failed): banner from the
  // embedded row, no second Chapa call (coding standard §20). The verify below
  // only runs as the resume fallback when the callback was skipped (direct hit
  // on a return URL with a still-pending payment).
  let verifyResult: { ok: true; amount: number } | { ok: false; error: string } | null = null
  if (typeof params.tx_ref === "string" && typeof params.offer === "string") {
    const row = offers.find((o) => o.id === params.offer)?.payment
    if (!row || row.status === "pending") {
      const result = await verifyOfferPayment({
        offerId: params.offer,
        txRef: params.tx_ref,
      })
      verifyResult = result.ok
        ? { ok: true, amount: result.amount }
        : { ok: false, error: result.error }
    } else if (row.status === "paid") {
      verifyResult = { ok: true, amount: row.amount }
    } else {
      verifyResult = { ok: false, error: "Payment not completed" }
    }
  }

  let body: ReactNode
  if (error) {
    body = (
      <p className="py-8 text-sm text-muted-foreground">
        Could not load offers. Try again.
      </p>
    )
  } else if (offers.length === 0) {
    body = (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <SendIcon className="size-6 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-lg font-semibold">No offers yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When you make an offer on a listing it shows up here, where you can
          see whether the seller accepted, declined, or countered it.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/">Browse listings</Link>
        </Button>
      </div>
    )
  } else {
    body = (
      <>
        {verifyResult ? (
          verifyResult.ok ? (
            <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">
                Payment received —{" "}
                {formatPrice(verifyResult.amount, { maxFractionDigits: 2 })}
              </p>
              <p className="mt-1">
                Confirm receipt below once you have the item to close the deal.
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Payment not completed</p>
              <p className="mt-1">
                {verifyResult.error} You can try the payment again on the offer
                below.
              </p>
            </div>
          )
        ) : null}

        <ul className="flex flex-col gap-4">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {offer.listing?.image_url ? (
                        <Image
                          src={offer.listing.image_url}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {offer.listing ? (
                        <Link
                          href={`/listings/${offer.listing.id}`}
                          className="line-clamp-1 font-medium hover:underline"
                        >
                          {offer.listing.title}
                        </Link>
                      ) : (
                        <p className="font-medium text-muted-foreground">
                          Listing no longer available
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold">
                        Your offer:{" "}
                        {formatPrice(offer.amount, { maxFractionDigits: 2 })}
                      </p>
                      {offer.message ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {offer.message}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {formatShortDate(offer.created_at)}
                      </p>
                      {offer.status === "pending" && offer.expires_at ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expires {formatShortDate(offer.expires_at)}
                        </p>
                      ) : null}
                    </div>

                    <OfferStatusBadge status={offer.status} />
                  </div>

                  {offer.status === "countered" ? (
                    <div className="mt-4 border-t pt-3">
                      <BuyerOfferActions offer={offer} />
                    </div>
                  ) : null}

                  {offer.status === "accepted" ? (
                    <>
                      <BuyerPayment offer={offer} />
                      <div className="mt-4 border-t pt-3">
                        {offer.review ? (
                          <div className="flex items-center gap-2">
                            <ReviewStars rating={offer.review.rating} />
                            <span className="text-sm text-muted-foreground">
                              You rated this transaction {offer.review.rating}/5
                            </span>
                          </div>
                        ) : (
                          <ReviewForm
                            offerId={offer.id}
                            listingTitle={offer.listing?.title}
                          />
                        )}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <Link
              href={`/offers?offset=${nextOffset(offset)}`}
              className="text-sm font-medium underline"
            >
              Load more
            </Link>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          My offers
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/offers/seller">View incoming offers →</Link>
        </Button>
      </div>

      {body}
    </main>
  )
}