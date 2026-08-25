"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { abandonStalePayment, confirmOfferReceipt, payOffer, requestWithdrawal } from "@/lib/payments"
import { uuidSchema } from "@/lib/uuid"

export function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const offerIdSchema = z.object({
  offerId: uuidSchema,
})

const amountSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
})

const txRefSchema = z.object({
  txRef: z.string().min(1, "Transaction reference is required"),
})

export type PayOfferState = {
  message?: string
}

// #97 — the buyer starts payment for an accepted offer. On success, redirect
// directly to Chapa's hosted checkout in the same tab.
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

  redirect(result.checkoutUrl)
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

export type WithdrawalState = {
  message?: string
  ok?: boolean
}

// Seller requests a withdrawal of available earnings to their payout method.
export async function requestWithdrawalAction(
  _prevState: WithdrawalState,
  formData: FormData
): Promise<WithdrawalState> {
  const parsed = amountSchema.safeParse({
    amount: formValue(formData, "amount"),
  })
  if (!parsed.success) {
    return { message: parsed.error.flatten().fieldErrors.amount?.[0] ?? "Invalid amount" }
  }

  const result = await requestWithdrawal(parsed.data.amount)
  if (!result.ok) {
    return { message: result.error ?? "Could not process withdrawal" }
  }

  revalidatePath("/offers/seller")
  revalidatePath("/dashboard")
  return { ok: true }
}

export type AbandonStaleState = {
  message?: string
  ok?: boolean
}

// Seller abandons a stale payment after the 7-day window elapses.
export async function abandonStalePaymentAction(
  _prevState: AbandonStaleState,
  formData: FormData
): Promise<AbandonStaleState> {
  const parsed = txRefSchema.safeParse({
    txRef: formValue(formData, "txRef"),
  })
  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await abandonStalePayment(parsed.data.txRef)
  if (!result.ok) {
    return { message: result.error ?? "Could not abandon payment" }
  }

  revalidatePath("/offers")
  revalidatePath("/offers/seller")
  return { ok: true }
}
