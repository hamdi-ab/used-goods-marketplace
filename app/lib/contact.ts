import "server-only"

import { createClient } from "@/lib/supabase/server"
import { CONTACT_METHODS } from "./contact/constants"

export * from "./contact/constants"

// ---- Row shapes ----

export interface SellerContactInfo {
  telegram_username: string | null
  phone: string | null
  phone_public: boolean
}

export interface ContactAttemptResult {
  ok: boolean
  error: string | null
}

// ---- Reads ----

/**
 * Fetch the contact surface for a seller. Phone is only returned when the
 * owner has opted in (phone_public), mirroring the column-level RLS read-guard
 * from T03 and the existing fetchPublicProfile pattern.
 */
export async function fetchSellerContactInfo(
  sellerId: string
): Promise<SellerContactInfo | null> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("telegram_username, phone_public")
    .eq("id", sellerId)
    .maybeSingle()

  if (error || !profile) return null

  const info: SellerContactInfo = {
    telegram_username: profile.telegram_username ?? null,
    phone: null,
    phone_public: profile.phone_public ?? false,
  }

  // Phone is fetched only when the owner has opted in — Privacy (AC4).
  if (info.phone_public) {
    const { data: withPhone } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", sellerId)
      .maybeSingle()
    info.phone = withPhone?.phone ?? null
  }

  return info
}

// ---- Writes ----

export async function recordContactAttempt(params: {
  contactMethod: (typeof CONTACT_METHODS)[number]
  listingId?: string | null
  sellerId: string
}): Promise<ContactAttemptResult> {
  const supabase = await createClient()

  const { error } = await supabase.from("contact_attempts").insert({
    contact_method: params.contactMethod,
    listing_id: params.listingId ?? null,
    seller_id: params.sellerId,
  })

  if (error) {
    console.error("recordContactAttempt:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true, error: null }
}
