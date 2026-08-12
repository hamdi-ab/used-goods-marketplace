"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth"
import {
  createListing as createListingRow,
  updateListing as updateListingRow,
  softDeleteListing,
  CONDITIONS,
  STATUSES,
  MAX_IMAGES,
} from "@/lib/listings"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const createSchema = z.object({
  title: z.string().min(5, "Title needs at least 5 characters").max(120),
  description: z.string().max(2000).optional().refine((v) => !v || v.length >= 20, "Description needs at least 20 characters"),
  price: z.coerce
    .number({ message: "Enter a price" })
    .gt(0, "Price must be greater than 0"),
  condition: z.enum(CONDITIONS),
  categoryId: z.string().uuid().optional(),
  city: z.string().min(1, "Enter a city").max(100),
  subCity: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  negotiable: z.boolean().optional(),
  photos: z.array(z.instanceof(File)).min(1, "Add at least one photo").max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos allowed`),
})

const editSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5, "Title needs at least 5 characters").max(120),
  description: z.string().max(2000).optional().refine((v) => !v || v.length >= 20, "Description needs at least 20 characters"),
  price: z.coerce
    .number({ message: "Enter a price" })
    .gt(0, "Price must be greater than 0"),
  condition: z.enum(CONDITIONS),
  categoryId: z.string().uuid().optional(),
  city: z.string().min(1, "Enter a city").max(100),
  subCity: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  negotiable: z.boolean().optional(),
  status: z.enum(STATUSES).optional(),
})

export type CreateListingState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
  listingId?: string
}

export type EditListingState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export type DeleteListingState = {
  message?: string
  ok?: boolean
}

export async function createListing(
  _prevState: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  const files = (formData.getAll("photos") as File[]).filter(
    (f) => f && f.size > 0
  )

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formValue(formData, "description"),
    price: formData.get("price"),
    condition: formData.get("condition"),
    categoryId: formValue(formData, "categoryId"),
    city: formData.get("city"),
    subCity: formValue(formData, "subCity"),
    address: formValue(formData, "address"),
    negotiable: formData.get("negotiable") === "on",
    photos: files.length ? files : undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getCurrentUser()
  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    redirect("/profile")
  }

  try {
    const result = await createListingRow(
      { ...parsed.data, negotiable: parsed.data.negotiable ?? false },
      user.id
    )

    if ("error" in result) {
      return { message: result.error }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/listings/${result.id}`)
    return { ok: true, listingId: result.id }
  } catch (e) {
    return {
      message: e instanceof Error ? e.message : "Could not create listing",
    }
  }
}

export async function updateListing(
  _prevState: EditListingState,
  formData: FormData
): Promise<EditListingState> {
  const parsed = editSchema.safeParse({
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
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getCurrentUser()
  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    redirect("/profile")
  }

  try {
    const result = await updateListingRow(
      {
        id: parsed.data.id,
        title: parsed.data.title,
        description: parsed.data.description,
        price: parsed.data.price,
        condition: parsed.data.condition,
        categoryId: parsed.data.categoryId,
        city: parsed.data.city,
        subCity: parsed.data.subCity,
        address: parsed.data.address,
        negotiable: parsed.data.negotiable ?? false,
        status: parsed.data.status,
      },
      user.id
    )

    if (!result.ok) {
      return { message: result.error ?? "Could not update listing" }
    }

    revalidatePath(`/listings/${parsed.data.id}`)
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    return {
      message: e instanceof Error ? e.message : "Could not update listing",
    }
  }
}

export async function deleteListing(
  _prevState: DeleteListingState,
  formData: FormData
): Promise<DeleteListingState> {
  const id = formValue(formData, "id")
  if (!id) return { message: "Missing listing id", ok: false }

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  try {
    const result = await softDeleteListing(id, user.id)
    if (!result.ok) {
      return { message: result.error ?? "Could not archive listing", ok: false }
    }
    revalidatePath("/dashboard")
    revalidatePath(`/listings/${id}`)
    return { ok: true }
  } catch (e) {
    return {
      message: e instanceof Error ? e.message : "Could not archive listing",
      ok: false,
    }
  }
}
