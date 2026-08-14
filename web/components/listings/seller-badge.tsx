import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SellerTrustBadges } from "@/components/verification/seller-trust-badges"

import type { BrowseListing } from "@/lib/listings"

function initials(name: string | null): string {
  if (!name) return "S"
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

export function SellerBadge({ listing }: { listing: BrowseListing }) {
  const seller = listing.seller
  if (!seller) return null
  const trust = seller.trust_score

  return (
    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
      <Avatar className="h-6 w-6">
        <AvatarImage
          src={seller.avatar_url ?? ""}
          alt={seller.full_name ?? "seller"}
        />
        <AvatarFallback className="text-xs">{initials(seller.full_name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-foreground">
        {seller.full_name ?? "Seller"}
      </span>
      {trust != null && (
        <span aria-label={`Trust score ${Math.round(trust)}`}>
          Trust {Math.round(trust)}
        </span>
      )}
      <SellerTrustBadges seller={seller} />
    </div>
  )
}
