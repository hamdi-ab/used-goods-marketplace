"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { completeOwnProfile, updateOwnProfile, promoteToSellerRow } from "@/lib/profiles"
import { uploadObjects } from "@/lib/media"
import { avatarAdapter } from "@/lib/media/avatar-adapter"
import {
  onboardingSchema,
  editProfileSchema,
  parseOnboardingForm,
  parseEditProfileForm,
} from "@/lib/schemas"

export type CompleteProfileState = {
  errors?: Record<string, string[] | undefined>
  message?: string
}

export async function completeProfile(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const parsed = onboardingSchema.safeParse(parseOnboardingForm(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getSession()
  if (!user) redirect("/login")

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
  revalidatePath("/sell")
  redirect(formData.get("redirectTo") === "sell" ? "/sell" : "/profile")
}

export type EditProfileState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export async function updateProfile(
  _prevState: EditProfileState,
  formData: FormData
): Promise<EditProfileState> {
  const parsed = editProfileSchema.safeParse(parseEditProfileForm(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getSession()
  if (!user) redirect("/login")

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
  const user = await getSession()
  if (!user || user.id !== uid) {
    return { url: null, error: "Not authorized" }
  }

  const file = formData.get("avatar") as File | null
  if (!file || !file.size) {
    return { url: null, error: "Choose an image to upload" }
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

// T21/FS-014: one-click buyer→seller promotion (fix #71). Idempotent —
// delegates to the promote_to_seller RPC which derives identity from auth.uid().
export async function promoteToSeller(_formData: FormData): Promise<void> {
  const user = await getSession()
  if (!user) redirect("/login")

  const result = await promoteToSellerRow()
  if (!result.ok) {
    redirect("/dashboard?error=" + encodeURIComponent(result.error ?? "Could not start selling"))
    return
  }

  revalidatePath("/dashboard")
  redirect("/sell")
}
