import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { SendIcon } from "lucide-react"

import { requireTrader } from "@/lib/auth"
import { fetchBuyerOffers, fetchOfferEvents } from "@/lib/offers"
import { verifyOfferPayment } from "@/lib/payments"
import type { OfferPayment } from "@/lib/payments/constants"
import { formatPrice } from "@/lib/listings"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { formatShortDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { BuyerOfferActions } from "@/components/offers/buyer-offer-actions"
import { BuyerPayment } from "@/components/offers/buyer-payment"
import { OfferHistory } from "@/components/offers/offer-history"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewStars } from "@/components/reviews/review-stars"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My offers",
  description: "Offers you have made on Dagim Gebeya.",
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireTrader()
  const params = await searchParams
  const offset = parseOffset(params.offset)
  const supabase = await createClient()

  const { offers, hasMore, error } = await fetchBuyerOffers(user.id, {
    offset,
  })

  const offersWithEvents = await Promise.all(
    offers.map(async (offer) => ({
      offer,
      events: await fetchOfferEvents(offer.id),
    }))
  )

  let verifyResult: { ok: true; amount: number } | { ok: false; error: string } | null = null
  if (typeof params.tx_ref === "string") {
    // Find the offer either by the offer param, or by looking up the payment row
    // by tx_ref (Chapa sometimes mangles the offer param in the callback URL).
    let offer = typeof params.offer === "string"
      ? offers.find((o) => o.id === params.offer)
      : undefined
    if (!offer) {
      const { data: paymentByTxRef } = await supabase
        .from("payments")
        .select("offer_id")
        .eq("tx_ref", params.tx_ref)
        .maybeSingle()
      if (paymentByTxRef) {
        offer = offers.find((o) => o.id === paymentByTxRef.offer_id)
      }
    }
    const row = offer?.payment
    const effectiveOfferId = offer?.id ?? (typeof params.offer === "string" ? params.offer : null)
    if (effectiveOfferId && (!row || row.status === "pending")) {
      const result = await verifyOfferPayment({
        offerId: effectiveOfferId,
        txRef: params.tx_ref,
      })
      verifyResult = result.ok
        ? { ok: true, amount: result.amount }
        : { ok: false, error: result.error }
    } else if (row?.status === "paid") {
      verifyResult = { ok: true, amount: row.amount }
    } else {
      verifyResult = { ok: false, error: "Payment not completed" }
    }
    // After a callback-driven verify, re-fetch this offer's payment so the child
    // component (BuyerPayment) always sees the latest state from the DB.
    if (verifyResult?.ok && offer) {
      const { data: freshPayment } = await supabase
        .from("payments")
        .select("id, amount, currency, status, mode, buyer_confirmed, paid_at, confirmed_at, hold_expires_at, tx_ref, abandoned_at")
        .eq("offer_id", offer.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (freshPayment) {
        offer.payment = {
          id: freshPayment.id,
          amount: Number(freshPayment.amount),
          currency: freshPayment.currency,
          status: freshPayment.status as OfferPayment["status"],
          mode: freshPayment.mode,
          buyer_confirmed: freshPayment.buyer_confirmed,
          paid_at: freshPayment.paid_at,
          confirmed_at: freshPayment.confirmed_at,
          hold_expires_at: freshPayment.hold_expires_at,
          tx_ref: freshPayment.tx_ref,
          abandoned_at: freshPayment.abandoned_at,
        }
      }
    }
  }

  let body: ReactNode
  if (error) {
    body = (
      <div className="flex flex-col items-center rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] px-4 py-20 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white">
          <SendIcon className="size-6 text-[#2563EB]" />
        </div>
        <h2 className="font-heading text-lg font-semibold">
          Something went wrong
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We could not load your offers right now. Try again.
        </p>
        <Button asChild className="mt-4 h-11">
          <Link href="/offers">Retry</Link>
        </Button>
      </div>
    )
  } else if (offers.length === 0) {
    body = (
      <div className="flex flex-col items-center rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] px-4 py-20 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white">
          <SendIcon className="size-6 text-[#2563EB]" />
        </div>
        <h2 className="font-heading text-lg font-semibold">No offers yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When you make an offer on a listing it shows up here, where you can
          see whether the seller accepted, declined, or countered it.
        </p>
        <Button asChild size="lg" className="mt-4 h-11">
          <Link href="/search">Browse listings</Link>
        </Button>
      </div>
    )
  } else {
    body = (
      <>
        {verifyResult ? (
          verifyResult.ok ? (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">
                Payment received —{" "}
                {formatPrice(verifyResult.amount, { maxFractionDigits: 2 })}
              </p>
              <p className="mt-1">
                Confirm receipt below once you have the item to close the deal.
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Payment not completed</p>
              <p className="mt-1">
                {verifyResult.error} You can try the payment again on the offer
                below.
              </p>
            </div>
          )
        ) : null}

        <ul className="flex flex-col gap-4">
          {offersWithEvents.map(({ offer, events }) => (
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

                  {events.length > 0 ? (
                    <div className="mt-4 border-t pt-3">
                      <OfferHistory events={events} />
                    </div>
                  ) : null}

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          My offers
        </h1>
      </div>

      {body}
    </main>
  )
}
