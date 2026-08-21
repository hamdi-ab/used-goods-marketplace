"use client"

import Link from "next/link"
import { useOptimistic } from "react"
import { usePathname } from "next/navigation"
import { Heart } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  buildLoginUrl,
  toggleFavoriteState,
} from "@/lib/favorites/constants"
import { toggleFavorite } from "@/app/actions/favorites"

export function heartClasses(active: boolean, className?: string): string {
  return cn(
    "inline-flex size-9 items-center justify-center rounded-full",
    "bg-white/90 text-slate-700 shadow-sm ring-1 ring-black/5",
    "transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2",
    active && "text-primary",
    className
  )
}

export function FavoriteButton({
  listingId,
  initial,
  isOwner,
  className,
  onChange,
}: {
  listingId: string
  /** Server truth: true = favorited, false = not, null = signed out. */
  initial: boolean | null
  /** The listing's owner shouldn't favorite their own listing. */
  isOwner?: boolean
  /** Optional sizing/overrides merged over the default heart style. */
  className?: string
  /** Called with the new state after the optimistic flip (before the action). */
  onChange?: (favorite: boolean, listingId: string) => void
}) {
  const [favorite, setFavorite] = useOptimistic(initial === true)
  const pathname = usePathname()

  // T15: a seller never favorites their own listing.
  if (isOwner) return null

  // Signed-out visitors get a heart that routes through login (with a ?next=
  // back to this listing) instead of a form that would just redirect.
  if (initial === null) {
    return (
      <Link
        href={buildLoginUrl(pathname)}
        aria-label="Sign in to save this listing"
        className={heartClasses(false, className)}
      >
        <Heart className="size-4" />
      </Link>
    )
  }

  // Client wrapper around the server action: flip the heart on the current
  // frame via the shared reducer, then run the action. Revalidation re-syncs
  // this optimistic frame with DB truth when the transition settles.
  const submitFavorite = async (formData: FormData) => {
    const next = !favorite
    setFavorite(toggleFavoriteState)
    onChange?.(next, listingId)
    await toggleFavorite(formData)
  }

  return (
    <form action={submitFavorite}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
        aria-pressed={favorite}
        className={heartClasses(favorite, className)}
      >
        <Heart className={cn("size-4", favorite && "fill-current")} />
      </button>
    </form>
  )
}
