"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { uuidSchema } from "@/lib/uuid"
import { requireSeller } from "@/lib/auth"
import { recordAiUsage } from "@/lib/ai/telemetry"
import { enforceListingCap } from "@/lib/usage"
import {
  createListing as createListingRow,
  fetchListing,
  updateListing as updateListingRow,
  softDeleteListing,
  boostListing as boostListingRow,
  CONDITIONS,
  STATUSES,
  MAX_IMAGES,
} from "@/lib/listings"
import type { ListingStatus } from "@/lib/listings/constants"

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
  categoryId: uuidSchema.optional(),
  city: z.string().min(1, "Enter a city").max(100),
  subCity: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  negotiable: z.boolean().optional(),
  ai_assisted: z.boolean().optional(),
  photos: z.array(z.instanceof(File)).min(1, "Add at least one photo").max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos allowed`),
})

const editSchema = z.object({
  id: uuidSchema,
  title: z.string().min(5, "Title needs at least 5 characters").max(120),
  description: z.string().max(2000).optional().refine((v) => !v || v.length >= 20, "Description needs at least 20 characters"),
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
     ai_assisted: formData.get("ai_assisted") === "on",
     photos: files,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await requireSeller()

  // T26: enforce the free-tier active-listing cap before insert. Creating a
  // listing always publishes it, so the seller must be under their cap. The
  // §26 message keeps it a nudge, not a wall; selling or archiving frees a slot
  // immediately, and existing over-limit sellers are grandfathered by the same
  // guard (no destructive archive).
  const cap = await enforceListingCap(user.id, user.role)
  if (!cap.ok) {
    return { message: cap.message }
  }

  try {
    const result = await createListingRow(
      { ...parsed.data, negotiable: parsed.data.negotiable ?? false },
      user.id
    )

    if ("error" in result) {
      return { message: result.error }
    }

    // FS-005 analytics: a listing created with AI assistance counts as an
    // accepted suggestion (the seller pressed Apply, not just generated).
    if (parsed.data.ai_assisted) recordAiUsage("ai_accepted")

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

  const user = await requireSeller()

  // T26: republishing (draft/archived/sold → published) consumes a slot. If the
  // seller is at their cap, reject with the §26 nudge. Edits to an already-
  // published listing (status unchanged) stay allowed — count unchanged.
  const toStatus: ListingStatus | undefined = parsed.data.status as ListingStatus | undefined
  if (toStatus === "published") {
    const current = await fetchListing(parsed.data.id, undefined, undefined)
    const wasPublished = current?.listing?.status === "published"
    if (!wasPublished) {
      const cap = await enforceListingCap(user.id, user.role)
      if (!cap.ok) {
        return { message: cap.message }
      }
    }
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

  const user = await requireSeller()

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

const boostSchema = z.object({
  id: uuidSchema,
  preset: z.enum(["standard", "premium"]).default("premium"),
})

interface BoostState {
  ok: boolean
  message?: string
}

/** T29: Promote a listing to the top of search for a paid window. Payment is
 * handled off-platform (ADR-021); this action only records the boost against
 * the seller's own published listing, ownership + published enforced in the
 * SECURITY DEFINER RPC. */
export async function boostListing(
  _prevState: BoostState,
  formData: FormData
): Promise<BoostState> {
  const id = formValue(formData, "id")
  const presetRaw = formValue(formData, "preset") ?? "premium"
  const parsed = boostSchema.safeParse({
    id: id ?? undefined,
    preset: presetRaw,
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await requireSeller()

  try {
    const result = await boostListingRow(parsed.data.id, parsed.data.preset)
    if (!result.ok) {
      return { ok: false, message: result.error ?? "Could not boost listing" }
    }
    revalidatePath("/dashboard")
    revalidatePath(`/listings/${parsed.data.id}`)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Could not boost listing",
    }
  }
}
