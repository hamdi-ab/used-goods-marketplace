import type { Metadata } from "next"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { fetchFavoriteListings } from "@/lib/favorites"
import { cn } from "@/lib/utils"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { PrototypeListingCard } from "@/components/listings/prototype-listing-card"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your favorites",
  description: "Listings you have saved to revisit later.",
}

// PROTOTYPE — favorites redesign: a "saved" gallery. Real favorited listings
// render in the tightened PrototypeListingCard; the header carries a live count
// and the heart is inert so the prototype never writes. Signed-out reviewers
// see the empty state.
export async function PrototypeFavoritesPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()
  const listings = user ? await fetchFavoriteListings(user.id) : []

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Your favorites
          </h1>
          {listings.length > 0 ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                variant === "B"
                  ? "bg-[#2563EB]/10 text-[#2563EB]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {listings.length} saved
            </span>
          ) : null}
        </div>

        {listings.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center rounded-2xl border px-4 py-20 text-center",
              variant === "B"
                ? "border-[#2563EB]/30 bg-[#EEF4FF]"
                : "border-border bg-muted/30"
            )}
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/70"
                aria-hidden="true"
              >
                <path d="M19 14c1.5-1.4 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.1 3 5.5l7 7Z" />
              </svg>
            </div>
            <h2 className="font-heading text-lg font-semibold">
              No favorites yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tap the heart on any listing to save it here and find it again
              later.
            </p>
            <Link
              href={withVariant("/browse", variant)}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l) => (
              <li key={l.id}>
                <PrototypeListingCard
                  listing={l}
                  favoriteButton={
                    <button
                      type="button"
                      title="Prototype preview — heart is inactive"
                      className="flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur"
                      aria-label="Saved"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#2563EB"
                        aria-hidden="true"
                      >
                        <path d="M19 14c1.5-1.4 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.1 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      <PrototypeFooter variant={variant} />
    </>
  )
}