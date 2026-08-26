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
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card hover-lift">
      <div className="relative">
        <Link href={href} aria-label={listing.title}>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            {listing.image_url ? (
              <Image
                src={listing.image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-transform duration-300 ease-out group-hover:scale-105 ${
                  listing.status === "sold" ? "opacity-50" : ""
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No photo
              </div>
            )}
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

      <Link href={href} className="flex flex-1 flex-col space-y-1.5 px-3.5 pb-4 pt-3">
        <p
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground"
          title={listing.title}
        >
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
          <div className="mt-auto flex items-center gap-1.5 pt-0.5">
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
