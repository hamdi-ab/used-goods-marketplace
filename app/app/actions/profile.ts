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