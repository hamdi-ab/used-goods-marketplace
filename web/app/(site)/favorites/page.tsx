import Link from "next/link"
import { Heart } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { fetchFavoriteListings } from "@/lib/favorites"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/listings/listing-card"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { PrototypeFavoritesPage } from "@/components/favorites/prototype-favorites-page"

export const dynamic = "force-dynamic"

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { variant } = await searchParams
  const key = variant === "A" || variant === "B" ? (variant as "A" | "B") : null

  // PROTOTYPE - the redesign variant is view-only during review and bypasses
  // the auth redirect (see proxy.ts) so ?variant=A|B renders without a session.
  if (key) {
    return <PrototypeFavoritesPage variant={key} />
  }

  const user = await requireUser()
  const offset = parseOffset((await searchParams).offset)
  const { listings, hasMore, error } = await fetchFavoriteListings(user.id, {
    offset,
  })

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12 min-h-[60vh]">
      <h1 className="font-heading mb-8 text-2xl font-semibold text-foreground">
        Your favorites
      </h1>

      {error ? (
        <p className="py-8 text-sm text-muted-foreground">
          Could not load favorites. Try again.
        </p>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <Heart className="size-6 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-lg font-semibold">
            No favorites yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any listing to save it here and find it again
            later.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/">Browse listings</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l) => (
              <li key={l.id}>
                <ListingCard
                  listing={l}
                  favoriteButton={
                    <FavoriteButton listingId={l.id} initial={true} />
                  }
                />
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <Link
                href={`/favorites?offset=${nextOffset(offset)}`}
                className="text-sm font-medium underline"
              >
                Load more
              </Link>
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}
