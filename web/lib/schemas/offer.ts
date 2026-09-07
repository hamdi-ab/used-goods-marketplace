import { z } from "zod"

import { uuidSchema } from "@/lib/uuid"
import { OFFER_AMOUNT_MAX, OFFER_MESSAGE_MAX } from "@/lib/offers/constants"

export const amountSchema = z.coerce
  .number({ message: "Enter an amount" })
  .gt(0, "Amount must be greater than 0")
  .max(OFFER_AMOUNT_MAX, "Amount is too large")

export const submitOfferSchema = z.object({
  listingId: uuidSchema,
  amount: amountSchema,
  message: z
    .string()
    .max(OFFER_MESSAGE_MAX, "Keep the message under 500 characters")
    .optional(),
})

export const offerActionSchema = z.object({
  action: z.enum(["accept", "decline", "counter"]),
  offerId: uuidSchema,
  listingId: uuidSchema,
  amount: amountSchema.optional(),
})

export const abandonSaleSchema = z.object({
  offerId: uuidSchema,
  listingId: uuidSchema,
})

export type SubmitOfferInput = z.infer<typeof submitOfferSchema>
export type OfferActionInput = z.infer<typeof offerActionSchema>
export type AbandonSaleInput = z.infer<typeof abandonSaleSchema>

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

export function parseSubmitOfferForm(formData: FormData): Record<string, unknown> {
  return {
    listingId: formValue(formData, "listingId"),
    amount: formData.get("amount"),
    message: formValue(formData, "message"),
  }
}

export function parseOfferActionForm(formData: FormData): Record<string, unknown> {
  return {
    action: formValue(formData, "action"),
    offerId: formValue(formData, "offerId"),
    listingId: formValue(formData, "listingId"),
    amount: formData.get("amount") ?? undefined,
  }
}

export function parseAbandonSaleForm(formData: FormData): Record<string, unknown> {
  return {
    offerId: formValue(formData, "offerId"),
    listingId: formValue(formData, "listingId"),
  }
}
