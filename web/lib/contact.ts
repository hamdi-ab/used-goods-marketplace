import "server-only"

import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import type { SellerContactInfo, ContactMethod } from "./contact/constants"

export * from "./contact/constants"

// ---- Row shapes ----

export interface ContactAttemptResult {
  ok: boolean
  error: string | null
}

// ---- Reads ----

/**
 * Fetch the contact surface for a seller. Phone is always selected from the DB
 * but the column-level RLS policy on profiles.phone (grants only when
 * phone_public = true) means the value is NULL unless the owner opted in.
 */
export async function fetchSellerContactInfo(
  sellerId: string
): Promise<SellerContactInfo | null> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("telegram_username, phone, phone_public")
    .eq("id", sellerId)
    .maybeSingle()

  if (error || !profile) return null

  return {
    telegram_username: profile.telegram_username ?? null,
    phone: profile.phone ?? null,
    phone_public: profile.phone_public ?? false,
  }
}

// ---- Writes ----

export async function recordContactAttempt(params: {
  contactMethod: ContactMethod
  listingId?: string | null
  sellerId: string
}): Promise<ContactAttemptResult> {
  const supabase = await createClient()

  const result = await callOutcomeRpc(
    supabase,
    "record_contact_attempt",
    {
      p_contact_method: params.contactMethod,
      p_seller_id: params.sellerId,
      p_listing_id: params.listingId ?? null,
    },
    "recordContactAttempt"
  )
  return { ok: result.ok === true, error: result.error ?? null }
}