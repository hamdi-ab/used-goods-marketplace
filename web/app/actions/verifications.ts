"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin, requireTrader } from "@/lib/auth"
import { consumeRateBudget } from "@/lib/rate-limit"
import {
  recordVerification,
  requestVerificationRow,
} from "@/lib/verifications"
import {
  requestVerificationSchema,
  recordVerificationSchema,
  parseRequestVerificationForm,
  parseRecordVerificationForm,
} from "@/lib/schemas"

export type RequestVerificationState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

/**
 * Request a phone/fayda verification for the signed-in user. Gate on a trader
 * session (admins are moderation-only, ADR-020) and on the shared token bucket
 * (security spec §16 rate-limits the request path), then delegate to the
 * request_verification RPC which resolves the caller from auth.uid().
 */
export async function requestVerification(
  _prevState: RequestVerificationState,
  formData: FormData
): Promise<RequestVerificationState> {
  const parsed = requestVerificationSchema.safeParse(
    parseRequestVerificationForm(formData)
  )
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await requireTrader()
  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await requestVerificationRow({ type: parsed.data.type })
  if (!result.ok) {
    return { message: result.error ?? "Could not request verification" }
  }

  revalidatePath("/profile")
  return { ok: true }
}

export type AdminRecordVerificationState = {
  message?: string
  ok?: boolean
}

/**
 * Approve or reject a pending verification request. Admin-only; delegates to
 * the record_verification SECURITY DEFINER RPC so the audit row, the profile
 * flag flip, and the Trust Score bump happen in one round-trip (INV-009).
 */
export async function adminRecordVerification(
  _prevState: AdminRecordVerificationState,
  formData: FormData
): Promise<AdminRecordVerificationState> {
  const parsed = recordVerificationSchema.safeParse(
    parseRecordVerificationForm(formData)
  )
  if (!parsed.success) {
    return { message: "Invalid verification decision" }
  }

  await requireAdmin()

  const result = await recordVerification({
    userId: parsed.data.userId,
    type: parsed.data.type,
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
  })
  if (!result.ok) {
    return { message: result.error ?? "Could not record the decision" }
  }

  revalidatePath("/admin/verifications")
  revalidatePath("/admin/users")
  return { ok: true }
}
