"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { Heart } from "lucide-react"

import type { BrowseListing } from "@/lib/listings/constants"
import { toggleFavorite } from "@/app/actions/favorites"
import { cn } from "@/lib/utils"
import type { VariantKey } from "@/components/search/prototype-utils"
import { withVariant } from "@/components/search/prototype-utils"
import { PrototypeListingCard } from "@/components/listings/prototype-listing-card"
import { heartClasses } from "@/components/favorites/favorite-button"
import { Button } from "@/components/ui/button"

// PROTOTYPE — favorites grid as a client island so the heart is a REAL
// optimistic toggle (unsave with an undo toast), not an inert preview control.
// The grid owns the heart so state flips synchronously in the click handler —
// FavoriteButton's form action runs inside a transition, so its updates only
// commit after the async server action resolves (the revalidation refresh lands
// first and would swallow the optimistic removal + toast).
export function PrototypeFavoritesGrid({
  variant,
  listings,
}: {
  variant: VariantKey
  listings: BrowseListing[]
}) {
  const [items, setItems] = useState(listings)
  const [undo, setUndo] = useState<{
    listingId: string
    listing: BrowseListing
  } | null>(null)
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-sync with server truth when the toggle action revalidates: props change
  // after an unsave/restore, so local state must follow or the list goes stale.
  // React-sanctioned "adjust state when props change" pattern (no effect).
  const [prevListings, setPrevListings] = useState(listings)
  if (prevListings !== listings) {
    setPrevListings(listings)
    setItems(listings)
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const showUndo = (listing: BrowseListing) => {
    setUndo({ listingId: listing.id, listing })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setUndo(null), 6000)
  }

  const handleRemove = (listing: BrowseListing) => {
    setItems((cur) => cur.filter((l) => l.id !== listing.id))
    showUndo(listing)
    const fd = new FormData()
    fd.set("listingId", listing.id)
    startTransition(() => void toggleFavorite(fd))
  }

  const handleUndo = () => {
    if (!undo) return
    setItems((cur) => [undo.listing, ...cur])
    setUndo(null)
    if (timer.current) clearTimeout(timer.current)
    const fd = new FormData()
    fd.set("listingId", undo.listingId)
    startTransition(() => void toggleFavorite(fd))
  }

  return (
    <>
      {items.length === 0 ? (
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
              className="text-foreground/70"
              aria-hidden="true"
            >
              <path d="M19 14c1.5-1.4 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.1 3 5.5l7 7Z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold">
            No favorites yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            Tap the heart on any listing to save it here and find it again
            later.
          </p>
          <Button asChild size="lg" className="mt-4 h-11">
            <Link href={withVariant("/search", variant)}>Browse listings</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                variant === "B"
                  ? "bg-[#2563EB]/10 text-[#2563EB]"
                  : "bg-muted text-foreground/70"
              )}
            >
              {items.length} saved
            </span>
          </div>

          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((l) => (
              <li key={l.id}>
                <PrototypeListingCard
                  listing={l}
                  favoriteButton={
                    <button
                      type="button"
                      aria-label="Remove from favorites"
                      aria-pressed={true}
                      className={heartClasses(true, "size-11")}
                      onClick={() => handleRemove(l)}
                    >
                      <Heart className="size-4 fill-current" aria-hidden="true" />
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {undo ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in items-center justify-between gap-3 rounded-xl border bg-foreground px-4 py-3 text-background shadow-lg fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
        >
          <p className="text-sm font-medium">
            Removed from favorites
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              onClick={handleUndo}
            >
              Undo
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}