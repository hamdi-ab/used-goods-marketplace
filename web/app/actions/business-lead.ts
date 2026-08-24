"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const businessLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email").max(255),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  needs: z.string().max(1000).optional(),
})

export type BusinessLeadState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[] | undefined>
}

export async function submitBusinessLead(
  _prevState: BusinessLeadState,
  formData: FormData
): Promise<BusinessLeadState> {
  const parsed = businessLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    needs: formData.get("needs") || undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase.rpc("submit_business_lead", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone || null,
    p_company: parsed.data.company || null,
    p_needs: parsed.data.needs || null,
  })

  if (error) {
    console.error("submitBusinessLead:", error.message)
    return { message: "Could not submit your request. Please try again." }
  }

  if (result && typeof result === "object" && "ok" in result && !result.ok) {
    return { message: (result as { error?: string }).error ?? "Could not submit your request." }
  }

  return { ok: true }
}
