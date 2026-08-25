"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { completeOwnProfile } from "@/lib/profiles"
import { promoteToSellerRow } from "@/lib/profiles"

const startSellingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  city: z.string().min(1, "Enter your city"),
})

export type StartSellingState = {
  errors?: Record<string, string[] | undefined>
  message?: string
}

/**
 * One-step "Start selling" action: promotes buyer to seller and completes
 * the minimal profile fields (name + city) needed to list. Redirects back
 * to /sell so the user can immediately create their listing.
 */
export async function startSelling(
  _prevState: StartSellingState,
  formData: FormData
): Promise<StartSellingState> {
  const parsed = startSellingSchema.safeParse({
    fullName: formData.get("fullName"),
    city: formData.get("city"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Promote buyer → seller (idempotent — safe if already seller)
  const promoteResult = await promoteToSellerRow()
  if (!promoteResult.ok) {
    return { message: promoteResult.error ?? "Could not start selling" }
  }

  // Complete minimal profile (name + city)
  const result = await completeOwnProfile(user.id, {
    fullName: parsed.data.fullName,
    city: parsed.data.city,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not save your profile" }
  }

  revalidatePath("/profile")
  revalidatePath("/sell")
  return { message: "Ready to sell! Create your first listing below." }
}
