"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentUser, requireTrader } from "@/lib/auth"
import { consumeRateBudget } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { completeOwnProfile, promoteToSellerRow, updateOwnProfile } from "@/lib/profiles"
import { uploadObjects } from "@/lib/media"
import { avatarAdapter } from "@/lib/media/avatar-adapter"

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  city: z.string().min(1, "Enter your city"),
  subCity: z.string().optional(),
  phone: z.string().optional(),
  telegramUsername: z.string().optional(),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
})

export type CompleteProfileState = {
  errors?: Record<string, string[] | undefined>
  message?: string
}

export async function completeProfile(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    city: formData.get("city"),
    subCity: formData.get("subCity"),
    phone: formData.get("phone"),
    telegramUsername: formData.get("telegramUsername"),
    bio: formData.get("bio"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await completeOwnProfile(user.id, {
    fullName: parsed.data.fullName,
    city: parsed.data.city,
    subCity: parsed.data.subCity,
    phone: parsed.data.phone,
    telegramUsername: parsed.data.telegramUsername,
    bio: parsed.data.bio,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not save your profile" }
  }

  revalidatePath("/profile")
  redirect("/profile")
}

const editProfileSchema = z.object({
  city: z.string().min(1, "Enter your city").max(100),
  subCity: z.string().max(100).optional(),
  phone: z.string().max(30, "Phone number is too long").optional(),
  telegramUsername: z
    .string()
    .max(50, "Too long")
    .transform((v) => (v ? v.replace(/^@/, "") : v))
    .optional(),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional(),
  phonePublic: z.boolean().optional(),
})

export type EditProfileState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export async function updateProfile(
  _prevState: EditProfileState,
  formData: FormData
): Promise<EditProfileState> {
  const parsed = editProfileSchema.safeParse({
    city: formData.get("city"),
    subCity: formData.get("subCity") || undefined,
    phone: formData.get("phone") || undefined,
    telegramUsername: formData.get("telegramUsername") || undefined,
    bio: formData.get("bio") || undefined,
    phonePublic: formData.get("phonePublic") === "on",
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await updateOwnProfile(user.id, {
    city: parsed.data.city,
    subCity: parsed.data.subCity,
    phone: parsed.data.phone,
    telegramUsername: parsed.data.telegramUsername,
    bio: parsed.data.bio,
    phonePublic: parsed.data.phonePublic,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not update your profile" }
  }

  revalidatePath("/profile")
  revalidatePath(`/users/${user.id}`)
  return { ok: true }
}

export async function uploadAvatar(
  uid: string,
  _prevState: { url: string | null; error: string | null },
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const user = await getCurrentUser()
  if (!user || user.id !== uid) {
    return { url: null, error: "Not authorized" }
  }

  const file = formData.get("avatar") as File | null
  if (!file || !file.size) {
    return { url: null, error: "Choose an image to upload" }
  }

  // Charge the global budget only for a genuine upload attempt (after the
  // cheap client-input checks above).
  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { url: null, error: budget.message ?? null }
  }

  const supabase = await createClient()
  // The avatar adapter lives in the media layer (see lib/media/avatar-adapter)
  // — magic-byte validation matching the listing-image path, so both adapters
  // share one security surface.
  const result = await uploadObjects(
    [{ file, index: 0 }],
    avatarAdapter({ uid, supabase }),
    supabase
  )

  if (!result.ok) return { url: null, error: result.error }

  revalidatePath("/profile")
  revalidatePath(`/users/${user.id}`)
  return { url: result.publicUrls[0], error: null }
}

// Become-a-seller (fix #71): promote the signed-in trader via the idempotent
// RPC. The dashboard "Start selling" CTA and the profile-page nudge both
// submit this via plain forms (void return); success is self-evident because
// revalidation re-renders the dashboard into the seller view and hides the
// nudge (the role is read fresh on the next render). Spam is harmless — a
// re-promotion is a no-op, so no global rate budget is charged.
export async function promoteToSeller(): Promise<void> {
  await requireTrader()

  const result = await promoteToSellerRow()
  if (!result.ok) {
    // Rare failure — the promotion is idempotent and the main rejections
    // redirect in requireTrader, so leave the page unchanged rather than throw.
    return
  }

  revalidatePath("/dashboard")
  revalidatePath("/profile")
}
