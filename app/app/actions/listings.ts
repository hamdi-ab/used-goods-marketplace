"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const CONDITIONS = ["Brand New", "Lightly Used", "Fair"] as const
const STATUSES = ["draft", "published", "sold", "archived"] as const
const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGES = 10
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const conditionEnum = z.enum(CONDITIONS)
const statusEnum = z.enum(STATUSES)
const photoSchema = z
  .instanceof(File)
  .refine((f) => f && f.size > 0, "Choose at least one photo")
  .refine((f) => ALLOWED_IMAGE_MIME.includes(f.type), "JPG, PNG or WebP only")
  .refine(
    (f) => f.size <= MAX_IMAGE_BYTES,
    "Each photo must be 5 MB or smaller"
  )

const baseListingFields = {
  title: z.string().min(5, "Title needs at least 5 characters").max(120),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().gt(0, "Price must be greater than 0"),
  condition: conditionEnum,
  categoryId: z.string().uuid().optional(),
  city: z.string().min(1, "Enter a city").max(100),
  subCity: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  negotiable: z.boolean().optional(),
}

const createListingSchema = z.object({
  ...baseListingFields,
  photos: z
    .array(photoSchema)
    .min(1, "Add at least one photo")
    .max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos allowed`),
})

const editListingSchema = z.object({
  ...baseListingFields,
  id: z.string().uuid(),
  status: statusEnum.optional(),
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

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

export async function createListing(
  _prevState: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  const files = (formData.getAll("photos") as File[]).filter(
    (f) => f && f.size > 0
  )

  const parsed = createListingSchema.safeParse({
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

  const supabase = await createClient()

  if (parsed.data.categoryId) {
    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("id", parsed.data.categoryId)
    if (!count) {
      return { errors: { categoryId: ["Picked category is not available"] } }
    }
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      category_id: parsed.data.categoryId ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      condition: parsed.data.condition,
      city: parsed.data.city,
      sub_city: parsed.data.subCity ?? null,
      address: parsed.data.address ?? null,
      negotiable: parsed.data.negotiable ?? false,
      status: "published",
    })
    .select("id")
    .single()

  if (error || !listing) {
    return { message: error?.message ?? "Could not create listing" }
  }

  const uploadError = await uploadListingPhotos(
    supabase,
    listing.id,
    user.id,
    parsed.data.photos ?? []
  )
  if (uploadError) {
    return { message: uploadError }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/listings/${listing.id}`)
  return { ok: true, listingId: listing.id }
}

export async function updateListing(
  _prevState: EditListingState,
  formData: FormData
): Promise<EditListingState> {
  const parsed = editListingSchema.safeParse({
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

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .update({
      category_id: parsed.data.categoryId ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      condition: parsed.data.condition,
      city: parsed.data.city,
      sub_city: parsed.data.subCity ?? null,
      address: parsed.data.address ?? null,
      negotiable: parsed.data.negotiable ?? false,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    })
    .eq("id", parsed.data.id)
    .eq("seller_id", user.id)
    .select("id")

  // RLS + the seller_id filter both block non-owners; .select() lets us detect
  // the zero-rows case instead of silently no-op'ing.
  if (error) {
    return { message: error.message }
  }
  if (!data || data.length === 0) {
    return { message: "Listing not found" }
  }

  revalidatePath(`/listings/${parsed.data.id}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function deleteListing(
  _prevState: DeleteListingState,
  formData: FormData
): Promise<DeleteListingState> {
  const id = formValue(formData, "id")
  if (!id) return { message: "Missing listing id", ok: false }

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", user.id)
    .select("id")

  if (error) {
    return { message: error.message, ok: false }
  }
  if (!data || data.length === 0) {
    return { message: "Listing not found", ok: false }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/listings/${id}`)
  return { ok: true }
}

async function uploadListingPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  sellerId: string,
  files: File[]
): Promise<string | null> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = (file.name.split(".").pop() || "png").toLowerCase()
    const path = `listings/${listingId}/${Date.now()}-${i}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("listings")
      .upload(path, file, { upsert: true })

    if (uploadError) {
      return uploadError.message
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("listings").getPublicUrl(path)

    const { error: imageError } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      image_url: publicUrl,
      display_order: i,
      alt_text: null,
    })

    if (imageError) {
      return imageError.message
    }
  }
  return null
}
