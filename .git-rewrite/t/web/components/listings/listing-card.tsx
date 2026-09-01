import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import type { BrowseListing } from "@/lib/listings"
import {
  formatPrice,
  LISTING_STATUS_LABELS,
} from "@/lib/listings/constants"
import { isBoostActive } from "@/lib/boost"
import { ConditionChip } from "@/components/listings/condition-chip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  sellerVerificationBadges,
  type VerificationBadge as VerificationBadgeType,
} from "@/lib/verifications/constants"

function initials(name: string | null): string {
  if (!name) return "S"
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

const TRUST_LABELS: Record<VerificationBadgeType, string> = {
  "verified-seller": "Verified seller",
  phone: "Phone verified",
  fayda: "Fayda verified",
}

export function ListingCard({
  listing,
  favoriteButton,
}: {
  listing: BrowseListing
  favoriteButton?: ReactNode
}) {
  const href = `/listings/${listing.id}`
  const seller = listing.seller
  const trustBadges = sellerVerificationBadges(seller)

  return (
    <div className="group w-full overflow-hidden rounded-xl border bg-card transition-shadow duration-200 hover:shadow-lg">
      <div className="relative">
        <Link href={href} aria-label={listing.title}>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            {listing.image_url ? (
              <Image
                src={listing.image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-transform duration-200 group-hover:scale-105 ${
                  listing.status === "sold" ? "opacity-50" : ""
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No photo
              </div>
            )}
            {listing.status === "sold" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-md bg-foreground/80 px-3 py-1 text-sm font-bold uppercase tracking-wider text-background">
                  {LISTING_STATUS_LABELS.sold}
                </span>
              </div>
            ) : null}
          </div>
        </Link>
        {isBoostActive(listing.boosted_until) ? (
          <Badge
            variant="default"
            className="absolute left-2 top-2 bg-amber-400 text-amber-950"
          >
            Boosted
          </Badge>
        ) : null}
        {favoriteButton ? (
          <div className="absolute right-2 top-2">{favoriteButton}</div>
        ) : null}
      </div>

      <Link href={href} className="block space-y-1.5 px-3.5 pb-4 pt-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {listing.title}
        </p>
        <p className="text-[15px] font-extrabold text-primary">
          {formatPrice(listing.price)}
        </p>
        <div className="flex items-center gap-2">
          <ConditionChip condition={listing.condition} />
          {listing.city ? (
            <span className="text-sm text-muted-foreground">{listing.city}</span>
          ) : null}
        </div>
        {seller ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={seller.avatar_url ?? ""}
                alt={seller.full_name ?? "seller"}
              />
              <AvatarFallback className="text-[10px]">
                {initials(seller.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-foreground">
              {seller.full_name ?? "Seller"}
            </span>
            {trustBadges[0] ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold text-green-600"
                aria-label={TRUST_LABELS[trustBadges[0]]}
              >
                <span className="flex size-3.5 items-center justify-center rounded-full bg-green-600 text-[9px] text-white">
                  ✓
                </span>
                {TRUST_LABELS[trustBadges[0]]}
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>
    </div>
  )
}
