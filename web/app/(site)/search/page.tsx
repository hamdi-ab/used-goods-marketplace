import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { fetchCategories, searchListings } from "@/lib/listings"
import { buildSearchUrl, nextOffset, parseSearchParams } from "@/lib/search"
import { ListingCard } from "@/components/listings/listing-card"
import { SearchFilters } from "@/components/search/search-filters"
// PROTOTYPE — browse-page redesign variants, gated by ?variant= (dev only).
import { PrototypeBrowsePage } from "@/components/search/prototype-browse-page"
import type { VariantKey } from "@/components/search/prototype-utils"

export const metadata: Metadata = {
  title: "Search listings",
  description:
    "Search and filter used goods listings on VinTech Marketplace by keyword, category, price, condition, and city.",
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M21 21l-4.35-4.35M9.5 18a8.5 8.5 0 110-17 8.5 8.5 0 010 17z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="7.5"
        cy="7.5"
        r="1.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const filters = parseSearchParams(sp)

  const variant =
    sp.variant === "A" || sp.variant === "B" ? (sp.variant as VariantKey) : null

  const categoriesPromise = fetchCategories()
  const { listings, count, hasMore, error } = await searchListings({
    q: filters.q || undefined,
    categorySlug: filters.categorySlug,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    condition: filters.condition,
    city: filters.city || undefined,
    sellerVerified: filters.sellerVerified,
    sort: filters.sort,
    offset: filters.offset,
  })
  const categories = await categoriesPromise

  // PROTOTYPE — when a variant is requested, render the redesigned browse page
  // with the same data. The default (no ?variant=) keeps the current page.
  if (variant) {
    return (
      <PrototypeBrowsePage
        variant={variant}
        categories={categories}
        filters={filters}
        listings={listings}
        count={count}
        hasMore={hasMore}
        error={Boolean(error)}
      />
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12">
      <section className="mb-8">
        <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {filters.q ? `Results for “${filters.q}”` : "Browse listings"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {error
            ? "We could not run your search."
            : `${count} ${count === 1 ? "listing" : "listings"}`}
        </p>
      </section>

      <SearchFilters categories={categories} filters={filters} />

      <section aria-label="Search results" className="mt-8">
        {error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              We could not load listings.
            </p>
            <Link
              href={buildSearchUrl(filters)}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              Retry
            </Link>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchIcon className="mb-3 h-10 w-10 text-muted-foreground/60" />
            <h2 className="font-heading text-lg font-semibold">
              No results found.
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try a different keyword, or widen your filters.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/search">Clear all filters</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => (
                <li key={l.id}>
                  <ListingCard listing={l} />
                </li>
              ))}
            </ul>
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <Link
                  href={buildSearchUrl({
                    ...filters,
                    offset: nextOffset(filters.offset),
                  })}
                  className="text-sm font-medium underline"
                >
                  Load more
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  )
}
