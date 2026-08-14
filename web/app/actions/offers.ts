"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import {
  acceptOfferRow,
  counterOfferRow,
  declineOfferRow,
  submitOfferRow,
  OFFER_AMOUNT_MAX,
  OFFER_MESSAGE_MAX,
} from "@/lib/offers"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

// One amount rule for submitting an offer and countering it, so both paths
// validate (and reject) identically.
const amountSchema = z.coerce
  .number({ message: "Enter an amount" })
  .gt(0, "Amount must be greater than 0")
  .max(OFFER_AMOUNT_MAX, "Amount is too large")

const submitOfferSchema = z.object({
  listingId: z.string().uuid(),
  amount: amountSchema,
  message: z.string().max(OFFER_MESSAGE_MAX, "Keep the message under 500 characters").optional(),
})

export type SubmitOfferState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export async function submitOffer(
  _prevState: SubmitOfferState,
  formData: FormData
): Promise<SubmitOfferState> {
  const parsed = submitOfferSchema.safeParse({
    listingId: formValue(formData, "listingId"),
    amount: formData.get("amount"),
    message: formValue(formData, "message"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await requireUser()
  const result = await submitOfferRow({
    listingId: parsed.data.listingId,
    amount: parsed.data.amount,
    message: parsed.data.message ?? null,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not submit your offer" }
  }

  revalidatePath("/")
  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}

const offerActionSchema = z.object({
  action: z.enum(["accept", "decline", "counter"]),
  offerId: z.string().uuid(),
  listingId: z.string().uuid(),
  amount: amountSchema.optional(),
})

export type OfferActionState = {
  message?: string
  ok?: boolean
}

// Seller-side status transition: accept, decline, or counter an incoming offer.
// The route is chosen server-side so the form stays a plain progressive-enhancement
// form; the RPC itself re-checks that the caller owns the offer's listing.
export async function offerAction(
  _prevState: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  const parsed = offerActionSchema.safeParse({
    action: formValue(formData, "action"),
    offerId: formValue(formData, "offerId"),
    listingId: formValue(formData, "listingId"),
    amount: formData.get("amount") ?? undefined,
  })

  if (!parsed.success) {
    const amountErrors = parsed.error.flatten().fieldErrors.amount
    return { message: amountErrors?.[0] ?? "Invalid offer request" }
  }

  if (parsed.data.action === "counter" && parsed.data.amount === undefined) {
    return { message: "Enter a counter amount" }
  }

  // Gate on a signed-in session before reaching the RPC; the RPC itself
  // re-checks that the caller owns the offer's listing.
  await requireUser()

  const result =
    parsed.data.action === "accept"
      ? await acceptOfferRow(parsed.data.offerId)
      : parsed.data.action === "decline"
        ? await declineOfferRow(parsed.data.offerId)
        : await counterOfferRow(parsed.data.offerId, parsed.data.amount as number)

  if (!result.ok) {
    return { message: result.error ?? "Could not update the offer" }
  }

  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}
