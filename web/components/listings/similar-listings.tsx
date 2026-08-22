import { fetchSimilarListings } from "@/lib/listings"

import { ListingCard } from "@/components/listings/listing-card"

export async function SimilarListings({
  listingId,
  count = 6,
}: {
  listingId: string
  count?: number
}) {
  const { listings, error } = await fetchSimilarListings(listingId, count)

  if (error || listings.length === 0) {
    return null
  }

  return (
    <section aria-label="Similar listings" className="mt-12">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Similar listings
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  )
}
