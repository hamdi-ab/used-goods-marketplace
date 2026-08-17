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

function heartClasses(active: boolean): string {
  return cn(
    "inline-flex size-8 items-center justify-center rounded-full",
    "bg-white/90 text-slate-700 shadow-sm ring-1 ring-black/5",
    "transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2",
    active && "text-primary"
  )
}

export function FavoriteButton({
  listingId,
  initial,
  isOwner,
}: {
  listingId: string
  /** Server truth: true = favorited, false = not, null = signed out. */
  initial: boolean | null
  /** The signed-in user owns this listing; a seller never favorites own item. */
  isOwner?: boolean
}) {
  const [favorite, setFavorite] = useOptimistic(initial === true)
  const pathname = usePathname()

  // A seller never favorites their own listing; signed-out visitors route their
  // heart through login (with a ?next= back to this listing) instead of a form.
  if (isOwner) return null
  if (initial === null) {
    return (
      <Link
        href={buildLoginUrl(pathname)}
        aria-label="Sign in to save this listing"
        className={heartClasses(false)}
      >
        <Heart className="size-4" />
      </Link>
    )
  }

  // Client wrapper around the server action: flip the heart on the current
  // frame via the shared reducer, then run the action. Revalidation re-syncs
  // this optimistic frame with DB truth when the transition settles.
  const submitFavorite = async (formData: FormData) => {
    setFavorite(toggleFavoriteState)
    await toggleFavorite(formData)
  }

  return (
    <form action={submitFavorite}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
        aria-pressed={favorite}
        className={heartClasses(favorite)}
      >
        <Heart className={cn("size-4", favorite && "fill-current")} />
      </button>
    </form>
  )
}
