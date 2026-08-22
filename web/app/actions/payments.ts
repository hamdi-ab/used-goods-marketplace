"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { confirmOfferReceipt, payOffer } from "@/lib/payments"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const offerIdSchema = z.object({
  // UUID format validation is intentionally lenient — the DB RPC
  // (begin_payment) re-checks the format and existence server-side,
  // so this schema only needs to ensure a non-empty string is present.
  offerId: z.string().min(32),
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
