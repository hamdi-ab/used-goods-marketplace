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
