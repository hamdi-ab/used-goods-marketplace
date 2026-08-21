import { fetchSimilarListings } from "@/lib/listings"

import { ListingCard } from "@/components/listings/listing-card"
import { PrototypeListingCard } from "@/components/listings/prototype-listing-card"
import type { VariantKey } from "@/components/search/prototype-utils"

/** "Similar Listings" section on the detail page (P1.10, #78). Reuses
 * ListingCard so the cover/seller/contract never forks from the browse feed.
 * Renders nothing when the source listing produced no similar rows (or the
 * RPC errored, since a failed similar-section shouldn't break the page).
 *
 * During PROTOTYPE reviews (?variant=A|B) the section switches to the
 * redesigned PrototypeListingCard so it stays in sync with the browse-page
 * redesign. */
export async function SimilarListings({
  listingId,
  count = 6,
  variant,
}: {
  listingId: string
  count?: number
  variant?: VariantKey
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
            {variant ? (
              <PrototypeListingCard listing={listing} />
            ) : (
              <ListingCard listing={listing} />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
