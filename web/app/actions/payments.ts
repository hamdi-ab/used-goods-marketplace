"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { confirmOfferReceipt, payOffer } from "@/lib/payments"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const offerIdSchema = z.object({
  // Lenient UUID format — the DB RPC (begin_payment) re-checks format
  // and existence server-side, so we only need to ensure a UUID-like
  // string is present here. Seed data uses deterministic IDs that may
  // not have strict v4 version/variant bits.
  offerId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid offer ID"),
})

export type PayOfferState = {
  message?: string
  checkoutUrl?: string
  ok?: boolean
}

// #97 — the buyer starts payment for an accepted offer. On success the client
// component redirects to Chapa's hosted checkout via the returned checkoutUrl.
export async function payOfferAction(
  _prevState: PayOfferState,
  formData: FormData
): Promise<PayOfferState> {
  const parsed = offerIdSchema.safeParse({
    offerId: formValue(formData, "offerId"),
  })
  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await payOffer(parsed.data.offerId)
  if (!result.ok) {
    return { message: result.error }
  }

  return {
    ok: true,
    checkoutUrl: result.checkoutUrl,
  }
}

export type ConfirmReceiptState = {
  message?: string
  ok?: boolean
}

// #97 — the buyer-protection signal: the buyer confirms they received the item
// after payment, closing the deal for both parties.
export async function confirmReceiptAction(
  _prevState: ConfirmReceiptState,
  formData: FormData
): Promise<ConfirmReceiptState> {
  const parsed = offerIdSchema.safeParse({
    offerId: formValue(formData, "offerId"),
  })
  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await confirmOfferReceipt(parsed.data.offerId)
  if (!result.ok) {
    return { message: result.error ?? "Could not confirm receipt" }
  }

  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}
