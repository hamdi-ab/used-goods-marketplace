import type { Metadata } from "next"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { fetchFavoriteListings } from "@/lib/favorites"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { PrototypeFavoritesGrid } from "@/components/favorites/prototype-favorites-grid"
import { Button } from "@/components/ui/button"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your favorites",
  description: "Listings you have saved to revisit later.",
}

// PROTOTYPE — favorites redesign: a "saved" gallery. Real favorited listings
// render in the tightened PrototypeListingCard with a LIVE optimistic heart
// (unsave + undo); the header carries a live count. Signed-out reviewers see
// the empty state.
export async function PrototypeFavoritesPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()
  const { listings, error } = user
    ? await fetchFavoriteListings(user.id)
    : { listings: [], error: null }

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Your favorites
          </h1>
        </div>

        {error ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 px-4 py-16 text-center">
            <h2 className="font-heading text-lg font-semibold">
              Couldn&apos;t load your favorites
            </h2>
            <p className="mt-1 max-w-sm text-sm text-foreground/70">
              Something went wrong on our end. Please try again.
            </p>
            <Button asChild className="mt-4">
              <Link href={withVariant("/favorites", variant)}>Try again</Link>
            </Button>
          </div>
        ) : (
          <PrototypeFavoritesGrid variant={variant} listings={listings} />
        )}
      </main>
      <PrototypeFooter variant={variant} />
    </>
  )
}