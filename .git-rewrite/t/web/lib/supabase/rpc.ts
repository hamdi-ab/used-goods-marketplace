import type { Supabase } from "@/lib/supabase/types"

/** Every SECURITY DEFINER function the app calls, in one place, so a renamed
 * or dropped RPC fails to compile instead of failing at runtime with a
 * magic-string typo. */
export type RpcName =
  | "search_listings"
  | "listings_similar"
  | "submit_review"
  | "submit_report"
  | "resolve_report"
  | "record_verification"
  | "request_verification"
  | "record_listing_view"
  | "record_fayda_verification"
  | "submit_offer"
  | "accept_offer"
  | "decline_offer"
  | "counter_offer"
  | "record_contact_attempt"
  | "current_ai_generation_count"
  | "record_ai_generation"
  | "boost_listing"
  | "begin_payment"
  | "complete_payment"
  | "fail_payment"
  | "confirm_payment_receipt"
  | "abandon_sale"
  | "apply_upgrade"
  | "decline_counter"
  | "submit_business_lead"
  | "offer_events"

export type RpcArgs = Record<string, string | number | boolean | null | string[]>

export interface RpcResult<T> {
  data: T | null
  error: string | null
}

/** The jsonb envelope every SECURITY DEFINER write-RPC returns. */
export interface RpcOutcome {
  ok?: boolean
  error?: string | null
}

/** One typed seam for every RPC call. The name is a typed union and
 * PostgREST's error object is reduced to its message in a single place. The
 * client is injected so the seam stays testable without the server graph (and
 * so callers can pass a fake in unit tests). */
export async function callRpc<T>(
  supabase: Supabase,
  name: RpcName,
  args: RpcArgs
): Promise<RpcResult<T>> {
  const { data, error } = await supabase.rpc(name, args)
  return { data: (data ?? null) as T | null, error: error?.message ?? null }
}

/** Normalise a write-RPC's `{ ok, error }` envelope, collapsing the jsonb
 * payload and the transport error into one `{ ok, error }` result. Generic over
 * the extra fields a particular RPC returns (e.g. submit_review → seller_id),
 * so every write-RPC caller lands on this one interface. On a transport error
 * the extra fields are absent; callers default them with `??`. */
export async function callOutcomeRpc<T extends RpcOutcome = RpcOutcome>(
  supabase: Supabase,
  name: RpcName,
  args: RpcArgs,
  logLabel: string
): Promise<T> {
  const { data, error } = await callRpc<T>(supabase, name, args)
  if (error) {
    console.error(`${logLabel}:`, error)
    return { ok: false, error } as unknown as T
  }
  return (data ?? {}) as T
}
