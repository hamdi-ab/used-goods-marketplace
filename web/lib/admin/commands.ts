import "server-only"

import { createClient } from "@/lib/supabase/server"

export interface AdminWriteResult {
  ok: boolean
  error: string | null
}

/**
 * Suspend a user: demote to buyer, mark suspended_at, and soft-delete their
 * live listings. Mirrors the resolve_report `block_seller` action so a
 * suspended seller disappears from all reads and is blocked by the requireSeller
 * gate. RLS grants admins full update access on profiles and listings.
 */
export async function suspendUserRow(
  userId: string
): Promise<AdminWriteResult> {
  const supabase = await createClient()

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "buyer", suspended_at: new Date().toISOString() })
    .eq("id", userId)
  if (profileError) return { ok: false, error: profileError.message }

  const { error: listingError } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("seller_id", userId)
    .is("deleted_at", null)
  if (listingError) return { ok: false, error: listingError.message }

  return { ok: true, error: null }
}

/**
 * Restore a suspended user (fix #86): re-instate the seller role and clear the
 * suspension marker — the inverse of suspendUserRow's demotion, so a suspended
 * seller can list again. Restoring a non-suspended row is a no-op (the admin UI
 * only offers Restore on suspended users). The audit frames this as the admin
 * counterpart to the self-service promote path (#71).
 */
export async function restoreUserRow(
  userId: string
): Promise<AdminWriteResult> {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from("profiles")
    .select("suspended_at")
    .eq("id", userId)
  const suspended = (rows ?? [])[0]?.suspended_at != null
  if (!suspended) return { ok: true, error: null }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "seller", suspended_at: null })
    .eq("id", userId)
  if (error) return { ok: false, error: error.message }

  return { ok: true, error: null }
}

/**
 * Remove a listing: soft-delete it (status archived + deleted_at), mirroring
 * the resolve_report `remove_listing` action. RLS grants admins full update
 * access on listings.
 */
export async function removeListingRow(
  listingId: string
): Promise<AdminWriteResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", listingId)
  if (error) return { ok: false, error: error.message }

  return { ok: true, error: null }
}
