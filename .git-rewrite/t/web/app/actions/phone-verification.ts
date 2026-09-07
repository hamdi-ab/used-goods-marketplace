"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"

export async function markPhoneVerified() {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ phone_verified: true })
    .eq("id", user.id)

  if (error) {
    return { error: "Failed to update verification status." }
  }

  revalidatePath("/verify-phone")
  revalidatePath("/profile")
  return { success: true }
}
