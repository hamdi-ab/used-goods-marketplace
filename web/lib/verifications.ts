import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import type {
  VerificationStatus,
  VerificationType,
} from "./verifications/constants"

// Re-export the pure value objects so imports from "@/lib/verifications" keep
// resolving, mirroring the @/lib/reports seam convention. Definitions live in
// ./verifications/constants (server-free).
export * from "./verifications/constants"

export interface RecordVerificationResult {
  ok: boolean
  error: string | null
  user_id?: string
  type?: VerificationType
}

export interface MyVerificationRow {
  id: string
  type: VerificationType
  status: VerificationStatus
  updated_at: string
}

export interface AdminVerificationRow {
  id: string
  user_id: string
  type: VerificationType
  status: VerificationStatus
  notes: string | null
  created_at: string
  user: {
    full_name?: string | null
    city?: string | null
    role?: string | null
    phone_verified?: boolean | null
    fayda_verified?: boolean | null
  } | null
}

/**
 * Admin-only: record a verification event for a user (email/phone/telegram/fayda).
 * Delegates to the record_verification RPC so the verified_at timestamp, the
 * soft-delete of any prior live row for (user, type), the profile-flag flip, and
 * the Trust Score bump all happen in one SECURITY DEFINER round-trip (INV-009:
 * an approved record is immutable in place; re-verifying issues a fresh row).
 * The acting admin is resolved from the session (auth.uid) inside the RPC.
 */
export async function recordVerification(params: {
  userId: string
  type: VerificationType
  status: VerificationStatus
  notes?: string | null
}): Promise<RecordVerificationResult> {
  const supabase = await createClient()

  const result = await callOutcomeRpc<{
    ok: boolean
    error: string | null
    user_id: string
    type: VerificationType
  }>(
    supabase,
    "record_verification",
    {
      p_user_id: params.userId,
      p_type: params.type,
      p_status: params.status,
      p_notes: params.notes?.trim() || null,
    },
    "recordVerification"
  )

  return {
    ok: result.ok === true,
    error: result.error ?? null,
    user_id: result.user_id ?? params.userId,
    type: result.type ?? params.type,
  }
}

// ---- Reads ----

const MY_VERIFICATION_COLUMNS = "id, type, status, updated_at"

/** The signed-in user's own verification records, newest first. The RPC keeps
 * at most one live (non-deleted) row per (user, type), so this is effectively
 * the current status of each type. */
export async function fetchMyVerifications(
  userId: string,
  client?: SupabaseClient
): Promise<MyVerificationRow[]> {
  const supabase = client ?? (await createClient())

  const { data, error } = await supabase
    .from("verifications")
    .select(MY_VERIFICATION_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("fetchMyVerifications:", error.message)
    return []
  }

  return (data ?? []) as unknown as MyVerificationRow[]
}

const ADMIN_VERIFICATION_JOINS = `id, user_id, type, status, notes, created_at,
  user:profiles!verifications_user_id_fkey(id, full_name, city, role, phone_verified, fayda_verified)`

/** The admin review queue: every pending verification request with the
 * applicant's profile context (name, city, role, current badges). The admin RLS
 * policy exposes all non-deleted rows. */
export async function fetchAdminVerifications(
  client?: SupabaseClient
): Promise<AdminVerificationRow[]> {
  const supabase = client ?? (await createClient())

  const { data, error } = await supabase
    .from("verifications")
    .select(ADMIN_VERIFICATION_JOINS)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchAdminVerifications:", error.message)
    return []
  }

  return (data ?? []) as unknown as AdminVerificationRow[]
}

/**
 * Self-serve (fix #73): open a verification request row for the caller. The
 * acting user is resolved from auth.uid() inside the request_verification RPC
 * (caller id is NOT a parameter), per INV-009.
 * TODO(T21/FS-014): drop once the real RPC return-shape is fixed here.
 */
export async function requestVerificationRow(
  params: { type: VerificationType }
): Promise<RecordVerificationResult> {
  const supabase = await createClient()

  const result = await callOutcomeRpc<{
    ok: boolean
    error: string | null
  }>(
    supabase,
    "request_verification",
    { p_type: params.type },
    "requestVerificationRow"
  )

  return {
    ok: result.ok === true,
    error: result.error ?? null,
  }
}