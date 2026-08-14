import Image from "next/image"
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
              <Image
                src={listing.image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
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
      <Link href={href} className="mt-2 block space-y-1">
        <p className="line-clamp-1 font-medium">{listing.title}</p>
        <p className="font-semibold">{formatPrice(listing.price)}</p>
        <div className="flex items-center gap-2">
          <ConditionChip condition={listing.condition} />
          {listing.city ? (
            <span className="text-sm text-muted-foreground">{listing.city}</span>
          ) : null}
        </div>
        <SellerBadge listing={listing} />
      </Link>
    </div>
  )
}
