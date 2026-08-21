"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

// Demo-only intent capture. No billing and no tier mutation — strategy §32.
// The plan is ALWAYS "pro" on the client, and the action ignores any tier the
// client sends (upgraded plans are admin/assignment-only, never self-service):
// a tampered tier field is silently dropped rather than stored.
const intentSchema = z.object({
  email: z.string().email("Enter a valid email").optional(),
})

export interface UpgradeIntentState {
  ok?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
}

export async function submitUpgradeIntent(
  _prevState: UpgradeIntentState,
  formData: FormData
): Promise<UpgradeIntentState> {
  const parsed = intentSchema.safeParse({
    email: formValue(formData, "email"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await requireUser()
  const email = parsed.data.email ?? user.email

  const supabase = await createClient()
  const { error } = await supabase.from("upgrade_intents").insert({
    user_id: user.id,
    email,
    tier: "pro",
  })

  if (error) {
    console.error("submitUpgradeIntent:", error.message)
    return {
      message: "Could not record your request — please try again later.",
    }
  }

  revalidatePath("/pricing")
  return {
    ok: true,
    message: "Noted — we'll notify you when billing opens. No charges today.",
  }
}
