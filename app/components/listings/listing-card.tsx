import Link from "next/link"
import type { ReactNode } from "react"

import type { BrowseListing } from "@/lib/listings"
import { formatPrice } from "@/lib/listings/constants"
import { ConditionChip } from "@/components/listings/condition-chip"
import { SellerBadge } from "@/components/listings/seller-badge"

export function ListingCard({
  listing,
  favoriteButton,
}: {
  listing: BrowseListing
  /** Optional per-card action overlay (e.g. the favorites heart). */
  favoriteButton?: ReactNode
}) {
  const href = `/listings/${listing.id}`
  return (
    <div className="group w-full">
      <div className="relative">
        <Link href={href} aria-label={listing.title}>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted">
            {listing.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.image_url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No photo
              </div>
            )}
          </div>
        </Link>
        {favoriteButton ? (
          <div className="absolute right-2 top-2">{favoriteButton}</div>
        ) : null}
      </div>
      <div className="mt-2 space-y-1">
        <Link href={href} className="block">
          <p className="line-clamp-1 font-medium">{listing.title}</p>
        </Link>
        <p className="font-semibold">{formatPrice(listing.price)}</p>
        <div className="flex items-center gap-2">
          <ConditionChip condition={listing.condition} />
          {listing.city ? (
            <span className="text-sm text-muted-foreground">{listing.city}</span>
          ) : null}
        </div>
        <SellerBadge listing={listing} />
      </div>
    </div>
  )
}
