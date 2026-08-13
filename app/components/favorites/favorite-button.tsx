"use client"

import Link from "next/link"
import { useOptimistic, useRef } from "react"
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
}: {
  listingId: string
  /** Server truth: true = favorited, false = not, null = signed out. */
  initial: boolean | null
}) {
  const [favorite, setFavorite] = useOptimistic(initial === true)
  const pathname = usePathname()
  const formRef = useRef<HTMLFormElement>(null)

  // Signed-out visitors get a heart that routes through login (with a ?next=
  // back to this listing) instead of a form that would just redirect.
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

  return (
    <form ref={formRef} action={toggleFavorite}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        onClick={() => {
          // Flip the heart on the current frame via the shared reducer, then
          // let the form submit run the server action (revalidatePath re-syncs
          // this optimistic frame with DB truth when the transition settles).
          setFavorite(toggleFavoriteState)
          formRef.current?.requestSubmit()
        }}
        aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
        aria-pressed={favorite}
        className={heartClasses(favorite)}
      >
        <Heart className={cn("size-4", favorite && "fill-current")} />
      </button>
    </form>
  )
}
