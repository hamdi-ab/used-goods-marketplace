import Link from "next/link"

import { Button } from "@/components/ui/button"
import { fetchCategories, fetchListings, PAGE_SIZE } from "@/lib/listings"
import { CategoryCard } from "@/components/categories/category-card"
import { ListingCard } from "@/components/listings/listing-card"

function buildHref(categorySlug: string | undefined, offset: number) {
  const params = new URLSearchParams()
  if (categorySlug) params.set("category", categorySlug)
  if (offset) params.set("offset", String(offset))
  return `/?${params.toString()}`
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const categorySlug =
    typeof sp.category === "string" ? sp.category : undefined
  const offset = Number(
    typeof sp.offset === "string" && sp.offset ? sp.offset : 0
  )

  const categoriesPromise = fetchCategories()
  const { listings, hasMore } = await fetchListings({
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
            href={buildHref(undefined, 0)}
            className="mt-3 inline-block text-sm underline"
          >
            All categories
          </Link>
        ) : null}
      </section>

      <section id="listings" aria-label="Listings">
        <h2 className="sr-only">Listings</h2>
        {listings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">
              {categorySlug
                ? "No listings in this category yet."
                : "No listings found."}
            </p>
            {categorySlug ? (
              <Link
                href={buildHref(undefined, 0)}
                className="mt-2 inline-block text-sm underline"
              >
                Clear filters
              </Link>
            ) : null}
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
                  href={buildHref(categorySlug, offset + PAGE_SIZE)}
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
