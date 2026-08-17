import type { Metadata } from "next"
import Link from "next/link"
import { InboxIcon } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { fetchSellerOffers } from "@/lib/offers"
import { formatPrice } from "@/lib/listings"
import { formatShortDate, initials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { SellerOfferActions } from "@/components/offers/seller-offer-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Incoming offers",
  description: "Offers buyers have made on your listings.",
}

export default async function SellerOffersPage() {
  const user = await requireUser()
  const offers = await fetchSellerOffers(user.id)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Incoming offers
        </h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/offers">← View my offers</Link>
        </Button>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Offers from buyers on your listings. Accept the right price and the
        listing is marked sold.
      </p>

      {offers.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <InboxIcon className="size-6 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-lg font-semibold">No offers yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When a buyer makes an offer on one of your listings it appears here
            for you to accept, decline, or counter.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={offer.buyer?.avatar_url ?? undefined}
                        alt={offer.buyer?.full_name ?? "Buyer"}
                      />
                      <AvatarFallback className="text-sm">
                        {initials(offer.buyer?.full_name ?? "")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {offer.buyer?.full_name ?? "Anonymous buyer"}
                        </p>
                        <OfferStatusBadge status={offer.status} />
                      </div>

                      <p className="mt-1 text-sm font-semibold">
                        {formatPrice(offer.amount, { maxFractionDigits: 2 })}
                        {" for "}
                        {offer.listing ? (
                          <Link
                            href={`/listings/${offer.listing.id}`}
                            className="text-primary hover:underline"
                          >
                            {offer.listing.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            a listing that is no longer available
                          </span>
                        )}
                      </p>

                      {offer.message ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {offer.message}
                        </p>
                      ) : null}

                      <p className="mt-1 text-xs text-muted-foreground">
                        Offered {formatShortDate(offer.created_at)}
                      </p>
                      {offer.status === "pending" && offer.expires_at ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expires {formatShortDate(offer.expires_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-3">
                    <SellerOfferActions offer={offer} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
