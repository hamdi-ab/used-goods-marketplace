import { z } from "zod"

import { uuidSchema } from "@/lib/uuid"

export const offerIdSchema = z.object({
  offerId: uuidSchema,
})

export const withdrawalSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payoutMethod: z.enum(["bank_transfer", "mobile_money"]).default("bank_transfer"),
  accountNumber: z.string().optional(),
})

export const amountSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
})

export const txRefSchema = z.object({
  txRef: z.string().min(1, "Transaction reference is required"),
})

export type OfferIdInput = z.infer<typeof offerIdSchema>
export type AmountInput = z.infer<typeof amountSchema>
export type TxRefInput = z.infer<typeof txRefSchema>

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

export function parseOfferIdForm(formData: FormData): Record<string, unknown> {
  return {
    offerId: formValue(formData, "offerId"),
  }
}

export function parseAmountForm(formData: FormData): Record<string, unknown> {
  return {
    amount: formValue(formData, "amount"),
  }
}

export function parseWithdrawalForm(formData: FormData): Record<string, unknown> {
  return {
    amount: formValue(formData, "amount"),
    payoutMethod: formValue(formData, "payoutMethod") ?? "bank_transfer",
    accountNumber: formValue(formData, "accountNumber"),
  }
}

export function parseTxRefForm(formData: FormData): Record<string, unknown> {
  return {
    txRef: formValue(formData, "txRef"),
  }
}
