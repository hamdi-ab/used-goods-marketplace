"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

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

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      city: parsed.data.city,
      sub_city: parsed.data.subCity || null,
      phone: parsed.data.phone || null,
      telegram_username: parsed.data.telegramUsername
        ? parsed.data.telegramUsername.replace(/^@/, "")
        : null,
      bio: parsed.data.bio || null,
      profile_completion: 100,
    })
    .eq("id", user.id)

  if (error) {
    return { message: error.message }
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

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      city: parsed.data.city,
      sub_city: parsed.data.subCity || null,
      phone: parsed.data.phone || null,
      telegram_username: parsed.data.telegramUsername || null,
      bio: parsed.data.bio || null,
      phone_public: parsed.data.phonePublic ?? false,
    })
    .eq("id", user.id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/profile")
  revalidatePath(`/users/${user.id}`)
  return { ok: true }
}

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

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
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { url: null, error: "Upload a JPG, PNG or WebP image" }
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { url: null, error: "Avatar must be 5 MB or smaller" }
  }

  const supabase = await createClient()
  const ext = (file.name.split(".").pop() || "png").toLowerCase()
  const path = `avatars/${uid}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("profiles")
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profiles").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", uid)

  if (updateError) {
    return { url: publicUrl, error: updateError.message }
  }

  revalidatePath("/profile")
  revalidatePath(`/users/${user.id}`)
  return { url: publicUrl, error: null }
}
