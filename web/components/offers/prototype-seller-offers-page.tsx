import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { fetchSellerOffers, OPEN_OFFER_STATUSES } from "@/lib/offers"
import { formatPrice } from "@/lib/listings"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { formatShortDate, initials, cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OfferStatusBadge } from "@/components/offers/offer-status-badge"
import { SellerOfferActions } from "@/components/offers/seller-offer-actions"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/home/header"
import { SiteFooter } from "@/components/home/footer"
import { PrototypeLoadMore } from "@/components/search/prototype-load-more"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Incoming offers",
  description: "Offers buyers have made on your listings.",
}

// PROTOTYPE — incoming-offers redesign variants (?variant=A|B, dev only).
// Option A "Decision Queue" (moodboard #1): full-width rows with listing
// thumbnail + amount as the hero number + inline Accept/Counter/Decline.
// Open offers (pending/countered) carry a blue left accent; settled rows fade.
// Actions are live: the form below each row drives the real accept/decline/
// counter server action (revalidates /offers/seller), not stubs.
export async function PrototypeSellerOffersPage({
  variant,
  searchParams,
}: {
  variant: VariantKey
  searchParams: Promise<{ offset?: string }>
}) {
  const user = await getCurrentUser()
  const { offset: raw } = await searchParams
  const offset = parseOffset(raw)

  const { offers, hasMore, error } = user
    ? await fetchSellerOffers(user.id, { offset })
    : { offers: [], hasMore: false, error: null }

  const openCount = offers.filter((o) =>
    OPEN_OFFER_STATUSES.includes(o.status)
  ).length

  const stateCard = (children: ReactNode) => (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border p-10 py-20 text-center",
        variant === "B"
          ? "border-[#2563EB]/30 bg-[#EEF4FF]"
          : "border-border bg-muted/30"
      )}
    >
      {children}
    </div>
  )

  let body: ReactNode
  if (error) {
    body = stateCard(
      <>
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <span className="text-muted-foreground/70">!</span>
        </div>
        <h2 className="font-heading text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We could not load your incoming offers right now. Try again.
        </p>
        <Link
          href={withVariant("/dashboard", variant)}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to dashboard
        </Link>
      </>
    )
  } else if (offers.length === 0) {
    body = stateCard(
      <>
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground/70"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </div>
        <h2 className="font-heading text-lg font-semibold">No offers yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When a buyer makes an offer on one of your listings it appears here
          for you to accept, decline, or counter.
        </p>
        <Link
          href={withVariant("/dashboard", variant)}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to dashboard
        </Link>
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
                  "rounded-2xl border bg-card shadow-sm transition",
                  open
                    ? variant === "B"
                      ? "border-[#2563EB]/40 bg-[#EEF4FF]/50"
                      : "border-primary/30 bg-primary/5"
                    : "opacity-70"
                )}
              >
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-4">
                    {/* Listing thumbnail */}
                    {offer.listing?.image_url ? (
                      <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={offer.listing.image_url}
                          alt={offer.listing.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] w-24 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage
                              src={offer.buyer?.avatar_url ?? undefined}
                              alt={offer.buyer?.full_name ?? "Buyer"}
                            />
                            <AvatarFallback className="text-xs">
                              {initials(offer.buyer?.full_name ?? "")}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium">
                            {offer.buyer?.full_name ?? "Anonymous buyer"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {open ? (
                            <span
                              className="size-2 rounded-full bg-[#2563EB]"
                              aria-hidden="true"
                            />
                          ) : null}
                          <OfferStatusBadge status={offer.status} />
                        </div>
                      </div>

                      <p className="mt-2 text-2xl font-extrabold text-[#2563EB]">
                        {formatPrice(offer.amount, { maxFractionDigits: 2 })}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        for{" "}
                        {offer.listing ? (
                          <Link
                            href={withVariant(
                              `/listings/${offer.listing.id}`,
                              variant
                            )}
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

                  <div className="border-t pt-3">
                    <SellerOfferActions offer={offer} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <PrototypeLoadMore
              href={`/offers/seller?offset=${nextOffset(offset)}&variant=${variant}`}
              label="Load more"
            />
          </div>
        ) : null}
      </>
    )
  }

  return (
    <>
      <SiteHeader variant={variant} />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Incoming offers
            </h1>
            {openCount > 0 ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  variant === "B"
                    ? "bg-[#2563EB]/10 text-[#1D4ED8]"
                    : "bg-muted text-foreground"
                )}
              >
                {openCount} open
              </span>
            ) : null}
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={withVariant("/offers", variant)}>← View my offers</Link>
          </Button>
        </div>
        <p className="mb-8 text-sm text-muted-foreground">
          Offers from buyers on your listings. Accept the right price and the
          listing is marked sold.
        </p>

        {body}
      </main>
      <SiteFooter variant={variant} />
    </>
  )
}