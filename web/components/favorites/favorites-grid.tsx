"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { Heart } from "lucide-react"

import type { BrowseListing } from "@/lib/listings/constants"
import { toggleFavorite } from "@/app/actions/favorites"
import { cn } from "@/lib/utils"
import { ListingCard } from "@/components/listings/listing-card"
import { heartClasses } from "@/components/favorites/favorite-button"
import { Button } from "@/components/ui/button"

export function FavoritesGrid({
  listings,
}: {
  listings: BrowseListing[]
}) {
  const [items, setItems] = useState(listings)
  const [undo, setUndo] = useState<{
    listingId: string
    listing: BrowseListing
  } | null>(null)
  const [, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setItems(listings)
  }, [listings])

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
        <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 px-4 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <Heart className="size-6 text-foreground/70" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-lg font-semibold">
            No favorites yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            Tap the heart on any listing to save it here and find it again
            later.
          </p>
          <Button asChild size="lg" className="mt-4 h-11">
            <Link href="/search">Browse listings</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground/70">
              {items.length} saved
            </span>
          </div>

          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((l) => (
              <li key={l.id}>
                <ListingCard
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
