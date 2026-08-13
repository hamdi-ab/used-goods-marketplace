import Link from "next/link"

import { Button } from "@/components/ui/button"
import { fetchCategories, fetchListings, PAGE_SIZE } from "@/lib/listings"
import { buildBrowseUrl, nextOffset, parseBrowseParams } from "@/lib/browse"
import { CategoryCard } from "@/components/categories/category-card"
import { ListingCard } from "@/components/listings/listing-card"

function NoResultsIcon({ className }: { className?: string }) {
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const { categorySlug, offset } = parseBrowseParams(sp)

  const categoriesPromise = fetchCategories()
  const { listings, hasMore, error } = await fetchListings({
    limit: PAGE_SIZE,
    offset,
    categorySlug,
  })
  const categories = await categoriesPromise

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12">
      <section className="mb-12 text-center">
        <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          Marketplace for trusted second-hand goods
        </h1>
        <p className="mt-3 max-w-xl text-balance text-muted-foreground">
          Buy and sell used items confidently across Addis Ababa.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="#listings">Browse listings</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sell">Start selling</Link>
          </Button>
        </div>
      </section>

      <section aria-label="Browse by category" className="mb-10">
        <h2 className="font-heading text-xl font-semibold">
          Browse by category
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              active={categorySlug === c.slug}
            />
          ))}
        </div>
        {categorySlug ? (
          <Link
            href={buildBrowseUrl(undefined, 0)}
            className="mt-3 inline-block text-sm underline"
          >
            All categories
          </Link>
        ) : null}
      </section>

      <section id="listings" aria-label="Listings">
        <h2 className="sr-only">Listings</h2>
        {error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              We could not load listings.
            </p>
            <Link
              href={buildBrowseUrl(categorySlug, offset)}
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              Retry
            </Link>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <NoResultsIcon className="mb-3 h-10 w-10 text-muted-foreground/60" />
            <h3 className="font-heading text-lg font-semibold">
              {categorySlug
                ? "No listings in this category yet."
                : "No listings found."}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {categorySlug
                ? "Try another category or clear your filter."
                : "Be the first to list — sellers are adding listings all the time."}
            </p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              {categorySlug ? (
                <Button asChild size="sm">
                  <Link href={buildBrowseUrl(undefined, 0)}>All categories</Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link href="/sell">Start selling</Link>
                </Button>
              )}
              <Link
                href={buildBrowseUrl(undefined, 0)}
                className="text-sm underline"
              >
                Refresh
              </Link>
            </div>
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
                   href={buildBrowseUrl(categorySlug, nextOffset(offset))}
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
