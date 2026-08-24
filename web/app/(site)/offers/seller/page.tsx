import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { InboxIcon } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { fetchSellerOffers, OPEN_OFFER_STATUSES } from "@/lib/offers"
import { formatPrice } from "@/lib/listings"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { formatShortDate, initials, cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { SellerOfferActions } from "@/components/offers/seller-offer-actions"
import { SellerPaymentBadge } from "@/components/offers/seller-payment-badge"
import { SellerEarningsCard } from "@/components/offers/seller-earnings-card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Incoming offers",
  description: "Offers buyers have made on your listings.",
}

export default async function SellerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const user = await requireUser()
  const offset = parseOffset(typeof sp.offset === "string" ? sp.offset : undefined)
  const { offers, hasMore, error } = await fetchSellerOffers(user.id, {
    offset,
  })

  const openCount = offers.filter((o) =>
    OPEN_OFFER_STATUSES.includes(o.status)
  ).length

  const stateCard = (children: ReactNode) => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] p-10 py-20 text-center">
      {children}
    </div>
  )

  let body: ReactNode
  if (error) {
    body = stateCard(
      <>
        <div className="flex size-14 items-center justify-center rounded-full bg-white">
          <InboxIcon className="size-6 text-[#2563EB]" />
        </div>
        <h2 className="font-heading text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We could not load your offers right now. Try again.
        </p>
        <Button asChild className="mt-4 h-11">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </>
    )
  } else if (offers.length === 0) {
    body = stateCard(
      <>
        <div className="flex size-14 items-center justify-center rounded-full bg-white">
          <InboxIcon className="size-6 text-[#2563EB]" />
        </div>
        <h2 className="font-heading text-lg font-semibold">No offers yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When a buyer makes an offer on one of your listings it appears here
          for you to accept, decline, or counter.
        </p>
        <Button asChild className="mt-4 h-11">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </>
    )
  } else {
    body = (
      <>
        <ul className="flex flex-col gap-4">
          {offers.map((offer) => {
            const open = OPEN_OFFER_STATUSES.includes(offer.status)
            return (
              <li
                key={offer.id}
                className={cn(
                  "relative rounded-2xl border bg-card p-4 shadow-sm transition",
                  open ? "border-[#2563EB]/40" : "border-border"
                )}
              >
                {open ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-4 h-[calc(100%-2rem)] w-1 rounded-r-full bg-[#2563EB]"
                  />
                ) : null}
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

                    <p className="mt-2 text-2xl font-extrabold text-[#2563EB]">
                      {formatPrice(offer.amount, { maxFractionDigits: 2 })}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      for{" "}
                      {offer.listing ? (
                        <Link
                          href={`/listings/${offer.listing.id}`}
                          className="font-medium text-foreground hover:text-[#2563EB] hover:underline"
                        >
                          {offer.listing.title}
                        </Link>
                      ) : (
                        <span>a listing that is no longer available</span>
                      )}
                    </p>

                    {offer.message ? (
                      <p className="mt-1 text-sm text-foreground/80">
                        {offer.message}
                      </p>
                    ) : null}

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Offered {formatShortDate(offer.created_at)}</span>
                      {offer.status === "pending" && offer.expires_at ? (
                        <span>Expires {formatShortDate(offer.expires_at)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3">
                  <SellerPaymentBadge offer={offer} />
                  <SellerOfferActions offer={offer} />
                </div>
              </li>
            )
          })}
        </ul>
        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <Link
              href={`/offers/seller?offset=${nextOffset(offset)}`}
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
    <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Incoming offers
          </h1>
          {openCount > 0 ? (
            <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
              {openCount} open
            </span>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/offers">← View my offers</Link>
        </Button>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Offers from buyers on your listings. Accept the right price and the
        listing is marked sold.
      </p>

      {offers.length > 0 ? <SellerEarningsCard offers={offers} /> : null}

      {body}
    </main>
  )
}
