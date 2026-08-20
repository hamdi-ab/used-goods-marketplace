import { fetchSimilarListings } from "@/lib/listings"

import { ListingCard } from "@/components/listings/listing-card"

/** "Similar Listings" section on the detail page (P1.10, #78). Reuses
 * ListingCard so the cover/seller/contract never forks from the browse feed.
 * Renders nothing when the source listing produced no similar rows (or the
 * RPC errored, since a failed similar-section shouldn't break the page). */
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
