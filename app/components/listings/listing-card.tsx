import Link from "next/link"

import type { BrowseListing } from "@/lib/listings"
import { formatPrice } from "@/lib/listings"
import { ConditionChip } from "@/components/listings/condition-chip"
import { SellerBadge } from "@/components/listings/seller-badge"

export function ListingCard({ listing }: { listing: BrowseListing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block w-full">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
      </div>
      <div className="mt-2 space-y-1">
        <p className="line-clamp-1 font-medium">{listing.title}</p>
        <p className="font-semibold">{formatPrice(listing.price)}</p>
        <div className="flex items-center gap-2">
          <ConditionChip condition={listing.condition} />
          {listing.city ? (
            <span className="text-sm text-muted-foreground">{listing.city}</span>
          ) : null}
        </div>
        <SellerBadge listing={listing} />
      </div>
    </Link>
  )
}
