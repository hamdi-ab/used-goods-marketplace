import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { fetchCategories, fetchListings, PAGE_SIZE } from "@/lib/listings"
import { fetchFavoriteIds } from "@/lib/favorites"
import { buildBrowseUrl, nextOffset, parseBrowseParams } from "@/lib/browse"
import { CategoryCard } from "@/components/categories/category-card"
import { ListingCard } from "@/components/listings/listing-card"
import { FavoriteButton } from "@/components/favorites/favorite-button"
// PROTOTYPE — home-page redesign variants, gated by ?variant= (dev only).
import {
  PrototypeSwitcher,
} from "@/components/home/prototype/switcher"
import { PROTOTYPE_VARIANTS } from "@/components/home/prototype/variants"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { HomePage as PrototypeHomePage } from "@/components/home/prototype/home-page"

export const metadata: Metadata = {
  title: "Marketplace for trusted second-hand goods",
  description:
    "Buy and sell used goods confidently across Addis Ababa with VinTech Marketplace.",
}

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

  // Favorites state is per-user: kick the (cached) session read off up front,
  // then fetch favorite ids only for signed-in visitors. Anonymous browsing
  // adds no favorites round-trip.
  const userPromise = getCurrentUser()
  const categoriesPromise = fetchCategories()
  const browsePromise = fetchListings({
    limit: PAGE_SIZE,
    offset,
    categorySlug,
  })
  const user = await userPromise
  const favoriteIds = user ? new Set(await fetchFavoriteIds(user.id)) : null
  const { listings, hasMore, error } = await browsePromise
  const categories = await categoriesPromise

  // PROTOTYPE — when a variant is requested, render that home layout with the
  // same data. The default (no ?variant=) keeps the current production page.
  if (sp.variant) {
    return (
      <>
        <PrototypeHeader variant={sp.variant as "B"} />
        <PrototypeHomePage
          categories={categories}
          listings={listings}
          favoriteIds={favoriteIds}
        />
        <PrototypeFooter variant={sp.variant as "B"} />
      </>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">
      <section className="relative mb-14 overflow-hidden rounded-2xl bg-gradient-to-b from-primary/5 via-muted/40 to-background px-4 py-12 text-center sm:px-8 sm:py-16 border border-border/60 shadow-xs">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20 mb-5">
            <span>✨ Trusted Second-Hand Marketplace in Addis Ababa</span>
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl text-balance">
            Buy and sell used goods with total confidence
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-balance mx-auto max-w-xl">
            Discover verified local sellers, inspect quality items, and transact securely across Addis Ababa.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
            <Button asChild size="lg" className="shadow-sm font-medium">
              <Link href="/search">Browse listings</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-xs font-medium bg-background">
              <Link href="/sell">Start selling</Link>
            </Button>
          </div>
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
                  <ListingCard
                    listing={l}
                    favoriteButton={
                      <FavoriteButton
                        listingId={l.id}
                        initial={favoriteIds?.has(l.id) ?? null}
                      />
                    }
                  />
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
