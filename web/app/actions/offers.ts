"use server"

import { revalidatePath } from "next/cache"

import { formValue } from "@/lib/form-value"
import { requireTrader } from "@/lib/auth"
import { consumeRateBudget } from "@/lib/rate-limit"
import { createNotification } from "@/lib/notifications/service"
import { createClient } from "@/lib/supabase/server"
import {
  acceptOfferRow,
  counterOfferRow,
  declineOfferRow,
  declineCounterRow,
  submitOfferRow,
  abandonSaleRow,
} from "@/lib/offers"
import { uuidSchema } from "@/lib/uuid"
import {
  submitOfferSchema,
  offerActionSchema,
  abandonSaleSchema,
  parseSubmitOfferForm,
  parseOfferActionForm,
  parseAbandonSaleForm,
} from "@/lib/schemas"

export type SubmitOfferState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export async function submitOffer(
  _prevState: SubmitOfferState,
  formData: FormData
): Promise<SubmitOfferState> {
  const parsed = submitOfferSchema.safeParse(parseSubmitOfferForm(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await requireTrader()

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await submitOfferRow({
    listingId: parsed.data.listingId,
    amount: parsed.data.amount,
    message: parsed.data.message ?? null,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not submit your offer" }
  }

  // Notify seller of new offer (best-effort, non-blocking)
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", parsed.data.listingId)
    .single()
  if (listing?.seller_id) {
    createNotification({
      userId: listing.seller_id,
      type: "offer_received",
      title: "New offer received",
      body: `You received an offer of $${parsed.data.amount}`,
      metadata: { listing_id: parsed.data.listingId },
    }).catch(() => {})
  }

  revalidatePath("/")
  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}

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
  const parsed = offerActionSchema.safeParse(parseOfferActionForm(formData))

  if (!parsed.success) {
    const amountErrors = parsed.error.flatten().fieldErrors.amount
    return { message: amountErrors?.[0] ?? "Invalid offer request" }
  }

  if (parsed.data.action === "counter" && parsed.data.amount === undefined) {
    return { message: "Enter a counter amount" }
  }

  // Gate on a signed-in trader session before reaching the RPC; the RPC itself
  // re-checks that the caller owns the offer's listing.
  await requireTrader()

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result =
    parsed.data.action === "accept"
      ? await acceptOfferRow(parsed.data.offerId)
      : parsed.data.action === "decline"
        ? await declineOfferRow(parsed.data.offerId)
        : await counterOfferRow(parsed.data.offerId, parsed.data.amount as number, formValue(formData, "message"))

  if (!result.ok) {
    return { message: result.error ?? "Could not update the offer" }
  }

  // Notify buyer of offer status change (best-effort, non-blocking)
  const supabase = await createClient()
  const { data: offer } = await supabase
    .from("offers")
    .select("buyer_id")
    .eq("id", parsed.data.offerId)
    .single()
  if (offer?.buyer_id) {
    const notificationType =
      parsed.data.action === "accept" ? "offer_accepted" :
      parsed.data.action === "decline" ? "offer_declined" :
      "offer_countered"
    const notificationTitle =
      parsed.data.action === "accept" ? "Offer accepted" :
      parsed.data.action === "decline" ? "Offer declined" :
      "Counter-offer received"
    createNotification({
      userId: offer.buyer_id,
      type: notificationType,
      title: notificationTitle,
      metadata: { offer_id: parsed.data.offerId, listing_id: parsed.data.listingId },
    }).catch(() => {})
  }

  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}

export type AbandonSaleState = {
  message?: string
  ok?: boolean
}

// The seller's recovery path: cancel an accepted sale that never got paid,
// reopening the listing to the market (RPC-guarded on no paid payment having
// landed). Shown on accepted offers with no paid payment once the buyer has
// had time to complete the checkout.
export async function abandonSaleAction(
  _prevState: AbandonSaleState,
  formData: FormData
): Promise<AbandonSaleState> {
  const parsed = abandonSaleSchema.safeParse(parseAbandonSaleForm(formData))
  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  await requireTrader()

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await abandonSaleRow(parsed.data.offerId)
  if (!result.ok) {
    return { message: result.error ?? "Could not cancel the sale" }
  }

  revalidatePath(`/listings/${parsed.data.listingId}`)
  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}

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
