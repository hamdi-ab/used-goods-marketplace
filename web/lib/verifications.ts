import "server-only"

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
  type: VerificationType
  status: VerificationStatus
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

/**
 * TODO(T21/FS-014): fetch a trader's verification rows from the
 * fetch_my_verifications RPC / user_verifications view once the
 * verification-review seam lands. Stubbed so (site)/profile compiles and
 * renders an empty verification state until Phone/Fayda verification is live.
 */
export async function fetchMyVerifications(
  _userId: string
): Promise<MyVerificationRow[]> {
  return []
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
    type: VerificationType
  }>(
    supabase,
    "request_verification",
    { p_type: params.type },
    "requestVerificationRow"
  )

  return {
    ok: result.ok === true,
    error: result.error ?? null,
    type: result.type ?? params.type,
  }
}

/**
 * TODO(T21/FS-014): Admin moderation queue. Return rows from the
 * admin_verification_queue view / fetch_admin_verifications RPC once the
 * verification-review seam lands. Stubbed to an empty list so the admin page
 * compiles; no requests are surfaced until review is live.
 */
export async function fetchAdminVerifications(): Promise<AdminVerificationRow[]> {
  return []
}
