"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"

export async function markPhoneVerified() {
  const user = await requireUser()
  const supabase = await createClient()

  // Soft-delete any prior live row so the one-live-per-type index stays clean,
  // then insert a verified audit row. This keeps the verifications table in
  // sync with the profiles.phone_verified flag so the profile page and public
  // profile agree on status.
  await supabase
    .from("verifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("type", "phone")
    .is("deleted_at", null)

  const { error: insertErr } = await supabase
    .from("verifications")
    .insert({
      user_id: user.id,
      type: "phone",
      status: "verified",
      verified_at: new Date().toISOString(),
    })

  if (insertErr) {
    return { error: "Failed to record verification." }
  }

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
