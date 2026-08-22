import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { fetchBuyerOffers } from "@/lib/offers";
import { formatPrice } from "@/lib/listings";
import { parseOffset } from "@/lib/pagination";
import { formatShortDate } from "@/lib/utils";
import { OfferStatusBadge } from "@/components/offers/offer-status-badge";
import { BuyerOfferActions } from "@/components/offers/buyer-offer-actions";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewStars } from "@/components/reviews/review-stars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PrototypeHeader } from "@/components/home/prototype/prototype-header";
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer";
import { PrototypeLoadMore } from "@/components/search/prototype-load-more";
import { withVariant, type VariantKey } from "@/components/search/prototype-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My offers",
  description: "Offers you have made on the VinTech Marketplace.",
};

export async function PrototypeOffersPage({
  variant,
  searchParams,
}: {
  variant: VariantKey;
  searchParams: Promise<{ offset?: string }>;
}) {
  // PROTOTYPE — the redesign variant (?variant=A|B, dev only). Authenticated
  // buyers see their own offers with the live Accept/Decline counter actions;
  // an unauthenticated reviewer simply sees the empty state (getCurrentUser
  // is used in place of requireUser so the variant renders without a session).
  const user = await getCurrentUser();
  const { offset: raw } = await searchParams;
  const offset = parseOffset(raw);
  const { offers, hasMore, error } = user
    ? await fetchBuyerOffers(user.id, { offset })
    : { offers: [], hasMore: false, error: null };

  let body: ReactNode;
  if (error) {
    body = (
      <div className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border p-10 py-20 text-center",
        variant === "B"
          ? "border-[#2563EB]/30 bg-[#EEF4FF]"
          : "border-border bg-muted/30",
      )}>
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
            <circle cx="12" cy="11" r="3" />
            <path d="M2 11c4-6 6-9 10-9s6 3 10 9c-4 6-6 9-10 9s-6-3-10-9Z" />
          </svg>
        </div>
        <h2 className="font-heading text-lg font-semibold">
          Something went wrong
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          We could not load your offers right now. Try again.
        </p>
        <Link
          href={withVariant("/", variant)}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Retry
        </Link>
      </div>
    );
  } else if (offers.length === 0) {
    body = (
      <div className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border p-10 py-20 text-center",
        variant === "B"
          ? "border-[#2563EB]/30 bg-[#EEF4FF]"
          : "border-border bg-muted/30",
      )}>
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
        <h2 className="font-heading text-lg font-semibold">
          No offers yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          When you make an offer on a listing it shows up here, where you can
          see whether the seller accepted, declined, or countered it.
        </p>
        <Link
          href={withVariant("/", variant)}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Browse listings
        </Link>
      </div>
    );
  } else {
    body = (
      <>
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
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <PrototypeLoadMore
              href={`/offers?offset=${offset + 10}&variant=${variant}`}
            />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
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
      <PrototypeFooter variant={variant} />
    </>
  );
}
