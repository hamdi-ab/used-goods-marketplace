import Link from "next/link"
import { Heart } from "lucide-react"

import { requireTrader } from "@/lib/auth"
import { fetchFavoriteListings } from "@/lib/favorites"
import { Button } from "@/components/ui/button"
import { FavoritesGrid } from "@/components/favorites/favorites-grid"

export const dynamic = "force-dynamic"

export default async function FavoritesPage() {
  const user = await requireTrader()
  const { listings, error } = await fetchFavoriteListings(user.id)

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12 min-h-[60vh]">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Your favorites
        </h1>
      </div>

      {error ? (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 px-4 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <Heart className="size-6 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-lg font-semibold">
            Couldn&apos;t load your favorites
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Something went wrong on our end. Please try again.
          </p>
          <Button asChild className="mt-4">
            <Link href="/favorites">Try again</Link>
          </Button>
        </div>
      ) : (
        <FavoritesGrid listings={listings} />
      )}
    </main>
  )
}
