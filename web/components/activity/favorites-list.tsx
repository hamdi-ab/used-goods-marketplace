import Link from "next/link"
import { fetchFavoriteListings } from "@/lib/favorites"
import { ListingCard } from "@/components/listings/listing-card"
import { Button } from "@/components/ui/button"

export async function FavoritesList({ userId }: { userId: string }) {
  const { listings, error } = await fetchFavoriteListings(userId, { limit: 20 })

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">Could not load favorite listings.</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-2xl">
          ❤️
        </div>
        <h3 className="mb-1 font-semibold">Favorites</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Save listings you love and find them here later.
        </p>
        <Button asChild>
          <Link href="/search">Browse listings</Link>
        </Button>
      </div>
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
