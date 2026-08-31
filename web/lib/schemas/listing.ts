import { z } from "zod"

import { uuidSchema } from "@/lib/uuid"
import { CONDITIONS, MAX_IMAGES, STATUSES } from "@/lib/listings/constants"
import type { ListingStatus } from "@/lib/listings/constants"

export const createListingSchema = z.object({
  title: z.string().min(5, "Title needs at least 5 characters").max(120),
  description: z
    .string()
    .max(2000)
    .optional()
    .refine((v) => !v || v.length >= 20, "Description needs at least 20 characters"),
  price: z.coerce
    .number({ message: "Enter a price" })
    .gt(0, "Price must be greater than 0"),
  condition: z.enum(CONDITIONS),
  categoryId: uuidSchema.optional(),
  city: z.string().min(1, "Enter a city").max(100),
  subCity: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  negotiable: z.boolean().optional(),
  ai_assisted: z.boolean().optional(),
  photos: z
    .array(z.instanceof(File))
    .min(1, "Add at least one photo")
    .max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos allowed`),
})

export const editListingSchema = z.object({
  id: uuidSchema,
  title: z.string().min(5, "Title needs at least 5 characters").max(120),
  description: z
    .string()
    .max(2000)
    .optional()
    .refine((v) => !v || v.length >= 20, "Description needs at least 20 characters"),
  price: z.coerce
    .number({ message: "Enter a price" })
    .gt(0, "Price must be greater than 0"),
  condition: z.enum(CONDITIONS),
  categoryId: uuidSchema.optional(),
  city: z.string().min(1, "Enter a city").max(100),
  subCity: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  negotiable: z.boolean().optional(),
  status: z.enum(STATUSES).optional(),
})

export const boostSchema = z.object({
  id: uuidSchema,
  preset: z.enum(["standard", "premium"]).default("premium"),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type EditListingInput = z.infer<typeof editListingSchema>
export type BoostInput = z.infer<typeof boostSchema>

export function parseCreateListingForm(formData: FormData): Record<string, unknown> {
  const files = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0)
  return {
    title: formData.get("title"),
    description: formValue(formData, "description"),
    price: formData.get("price"),
    condition: formData.get("condition"),
    categoryId: formValue(formData, "categoryId"),
    city: formData.get("city"),
    subCity: formValue(formData, "subCity"),
    address: formValue(formData, "address"),
    negotiable: formData.get("negotiable") === "on",
    ai_assisted: formData.get("ai_assisted") === "on",
    photos: files,
  }
}

export function parseEditListingForm(formData: FormData): Record<string, unknown> {
  return {
    id: formValue(formData, "id"),
    title: formData.get("title"),
    description: formValue(formData, "description"),
    price: formData.get("price"),
    condition: formData.get("condition"),
    categoryId: formValue(formData, "categoryId"),
    city: formData.get("city"),
    subCity: formValue(formData, "subCity"),
    address: formValue(formData, "address"),
    negotiable: formData.get("negotiable") === "on",
    status: formValue(formData, "status"),
  }
}

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}
