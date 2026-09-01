"use server"

import { revalidatePath } from "next/cache"

import { requireTrader } from "@/lib/auth"
import { declineCounterRow } from "@/lib/offers"
import { uuidSchema } from "@/lib/uuid"

export type DeclineCounterState = {
  message?: string
  ok?: boolean
}

// Buyer declines a seller's counter-offer (walks away from negotiation).
export async function declineCounterAction(
  _prevState: DeclineCounterState,
  formData: FormData
): Promise<DeclineCounterState> {
  const offerId = formData.get("offerId")
  const listingId = formData.get("listingId")

  const parsed = uuidSchema.safeParse(offerId)
  if (!parsed.success) {
    return { message: "Invalid offer" }
  }

  await requireTrader()
  const result = await declineCounterRow(parsed.data)

  if (!result.ok) {
    return { message: result.error ?? "Could not decline counter-offer" }
  }

  revalidatePath(`/listings/${listingId}`)
  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}
