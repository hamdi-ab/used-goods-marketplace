import Link from "next/link"
import { AlertCircleIcon, HeartIcon } from "lucide-react"

import { fetchFavoriteListings } from "@/lib/favorites"
import { ListingCard } from "@/components/listings/listing-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

export async function FavoritesList({ userId }: { userId: string }) {
  const { listings, error } = await fetchFavoriteListings(userId, { limit: 20 })

  if (error) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Unable to load favorites"
        description="There was a problem loading your favorite listings. Please try again."
        iconClassName="bg-destructive/10 text-destructive"
        action={
          <Button
            variant="outline"
            asChild
            className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Link href="/activity?tab=favorites">Try again</Link>
          </Button>
        }
      />
    )
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={HeartIcon}
        title="No favorites yet"
        description="Save listings you love to easily find and compare them here later."
        action={
          <Button
            asChild
            className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Link href="/search">Browse listings</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
