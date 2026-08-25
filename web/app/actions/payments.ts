"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { abandonStalePayment, approveWithdrawal, confirmOfferReceipt, payOffer, rejectWithdrawal, requestWithdrawal } from "@/lib/payments"
import { uuidSchema } from "@/lib/uuid"
import { formValue } from "@/lib/form-value"

const offerIdSchema = z.object({
  offerId: uuidSchema,
})

const amountSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payoutMethod: z.enum(["bank_transfer", "mobile_money"]).default("bank_transfer"),
  accountNumber: z.string().optional(),
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
  fee?: number
  netAmount?: number
  payoutMethod?: string
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

  const accountNumber = formValue(formData, "accountNumber")
  if (!accountNumber || !accountNumber.trim()) {
    return { message: "Please enter your account number" }
  }

  const result = await requestWithdrawal(parsed.data.amount, parsed.data.payoutMethod, accountNumber.trim())
  if (!result.ok) {
    return { message: result.error ?? "Could not process withdrawal" }
  }

  revalidatePath("/offers/seller")
  revalidatePath("/dashboard")
  return { ok: true, fee: result.fee, netAmount: result.netAmount, payoutMethod: parsed.data.payoutMethod }
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

export type ApproveWithdrawalState = {
  message?: string
  ok?: boolean
}

export async function approveWithdrawalAction(
  _prevState: ApproveWithdrawalState,
  formData: FormData
): Promise<ApproveWithdrawalState> {
  const withdrawalId = formValue(formData, "withdrawalId")
  if (!withdrawalId) {
    return { message: "Invalid request" }
  }

  const result = await approveWithdrawal(withdrawalId)
  if (!result.ok) {
    return { message: result.error ?? "Could not approve withdrawal" }
  }

  revalidatePath("/admin/withdrawals")
  return { ok: true }
}

export async function rejectWithdrawalAction(
  _prevState: ApproveWithdrawalState,
  formData: FormData
): Promise<ApproveWithdrawalState> {
  const withdrawalId = formValue(formData, "withdrawalId")
  const reason = formValue(formData, "reason")
  if (!withdrawalId) {
    return { message: "Invalid request" }
  }

  const result = await rejectWithdrawal(withdrawalId, reason || undefined)
  if (!result.ok) {
    return { message: result.error ?? "Could not reject withdrawal" }
  }

  revalidatePath("/admin/withdrawals")
  return { ok: true }
}
