import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
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
 * Fetch the contact surface for a seller. Phone is fetched separately and only
 * when the owner has opted in (Security spec §19: phone is private by default),
 * matching fetchPublicProfile. The row policy is row-level only, so phone is
 * never selected in a public query unless phone_public is set.
 */
export async function fetchSellerContactInfo(
  sellerId: string,
  client?: Supabase
): Promise<SellerContactInfo | null> {
  const supabase = client ?? (await createClient())

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("telegram_username, phone_public")
    .eq("id", sellerId)
    .maybeSingle()

  if (error || !profile) return null

  let phone: string | null = null
  if (profile.phone_public) {
    const { data: withPhone } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", sellerId)
      .maybeSingle()
    phone = withPhone?.phone ?? null
  }

  return {
    telegram_username: profile.telegram_username ?? null,
    phone,
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