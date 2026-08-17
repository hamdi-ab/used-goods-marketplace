"use server"

import { revalidatePath } from "next/cache"

import { requireTrader } from "@/lib/auth"
import { toggleFavoriteRow } from "@/lib/favorites"

export async function toggleFavorite(formData: FormData): Promise<void> {
  const user = await requireTrader()
  const listingId = formData.get("listingId")
  if (typeof listingId !== "string" || listingId.length === 0) return

  await toggleFavoriteRow(user.id, listingId)

  // Re-sync the optimistic heart regardless of outcome: on success the DB
  // changed; on failure it did not, but the flipped frame must revert either
  // way. Revalidation re-renders the route with fresh server state.
  revalidatePath("/")
  revalidatePath(`/listings/${listingId}`)
  revalidatePath("/favorites")
}
