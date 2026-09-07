"use server"

import { revalidatePath } from "next/cache"

import { requireTrader } from "@/lib/auth"
import { toggleFavoriteRow } from "@/lib/favorites"
import { consumeRateBudget } from "@/lib/rate-limit"

export type ToggleFavoriteResult = {
  ok: boolean
  message?: string
}

export async function toggleFavorite(formData: FormData): Promise<ToggleFavoriteResult> {
  const user = await requireTrader()
  const listingId = formData.get("listingId")
  if (typeof listingId !== "string" || listingId.length === 0) {
    return { ok: false, message: "Invalid listing" }
  }

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    // Rate-limited: don't toggle, surface the message so the UI can explain
    // why the heart snapped back.
    return { ok: false, message: budget.message }
  }

  const result = await toggleFavoriteRow(user.id, listingId)
  if (!result.ok) {
    return { ok: false, message: result.error ?? "Could not update favorite" }
  }

  revalidatePath("/")
  revalidatePath(`/listings/${listingId}`)
  revalidatePath("/favorites")
  return { ok: true }
}
