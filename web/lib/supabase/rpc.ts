import type { Supabase } from "@/lib/supabase/types"

/** Every SECURITY DEFINER function the app calls, in one place, so a renamed
 * or dropped RPC fails to compile instead of failing at runtime with a
 * magic-string typo. */
export type RpcName =
  | "search_listings"
  | "submit_review"
  | "submit_report"
  | "resolve_report"
  | "record_verification"

export type RpcArgs = Record<string, string | number | null>

export interface RpcResult<T> {
  data: T | null
  error: string | null
}

/** One typed seam for every RPC call. Mirrors offers.ts::runOfferRpc: the name
 * is a typed union and PostgREST's error object is reduced to its message in a
 * single place. The client is injected so the seam stays testable without the
 * server graph (and so callers can pass a fake in unit tests). */
export async function callRpc<T>(
  supabase: Supabase,
  name: RpcName,
  args: RpcArgs
): Promise<RpcResult<T>> {
  const { data, error } = await supabase.rpc(name, args)
  return { data: (data ?? null) as T | null, error: error?.message ?? null }
}
