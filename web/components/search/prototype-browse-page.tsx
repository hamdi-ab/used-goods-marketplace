import Link from "next/link"

import type { Category } from "@/lib/listings/constants"
import type { BrowseListing } from "@/lib/listings"
import { buildSearchUrl, nextOffset, type SearchQuery } from "@/lib/search"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { PrototypeListingCard } from "@/components/listings/prototype-listing-card"
import { PrototypeSearchControls } from "@/components/search/prototype-search-controls"
import { PrototypeLoadMore } from "@/components/search/prototype-load-more"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

// PROTOTYPE — browse-page redesign (moodboard #1 + #3): pill categories,
// collapsible filter sheet, result header with count + sort, removable chips,
// and a spinner on Load more. Gated by ?variant= and removed with the machinery.
export function PrototypeBrowsePage({
  variant,
  categories,
  filters,
  listings,
  count,
  hasMore,
  error,
}: {
  variant: VariantKey
  categories: Category[]
  filters: SearchQuery
  listings: BrowseListing[]
  count: number
  hasMore: boolean
  error: boolean
}) {
  const title = filters.q ? `Results for “${filters.q}”` : "Browse listings"

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>

        <div className="mt-6">
          <PrototypeSearchControls
            categories={categories}
            filters={filters}
            variant={variant}
            count={error ? 0 : count}
            title={error ? undefined : title}
          />
        </div>

        <section aria-label="Search results" className="mt-8">
          {error ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                We could not load listings.
              </p>
              <Link
                href={withVariant(buildSearchUrl(filters), variant)}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Retry
              </Link>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No results found.
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try a different keyword, or widen your filters.
              </p>
            <Link
              href={withVariant("/search", variant)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Clear all filters
            </Link>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((l) => (
                  <li key={l.id}>
                    <PrototypeListingCard listing={l} />
                  </li>
                ))}
              </ul>
              {hasMore ? (
                <div className="mt-10 flex justify-center">
                  <PrototypeLoadMore
                    href={withVariant(
                      buildSearchUrl({
                        ...filters,
                        offset: nextOffset(filters.offset),
                      }),
                      variant
                    )}
                  />
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
      <PrototypeFooter variant={variant} flush />
    </>
  )
}