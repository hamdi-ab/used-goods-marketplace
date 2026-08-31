import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { callRpc } from "@/lib/supabase/rpc"

/** Read the seller's AI-generations used this calendar month (server-side month
 *  boundary, so the cap resets on the 1st with no cron). Injectable client so
 *  fetchAccountUsage and the action share the one RPC seam. */
export async function countAiGenerationsThisMonth(
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? (await createClient())
  const { data } = await callRpc<{ used: number }[]>(
    supabase,
    "current_ai_generation_count",
    {}
  )
  return data?.[0]?.used ?? 0
}

/** Insert one consumed AI credit (on a successful draft). Returns the new
 *  running usage and enforces the cap server-side as defense in depth.
 *  `limit: null` means uncapped (Business) — the RPC records the generation
 *  without enforcing a ceiling. (strat §25: check-before-provider +
 *  consume-on-success.) */
export async function consumeAiGeneration(
  event: "generate" | "regenerate",
  limit: number | null
): Promise<{ ok: boolean; used: number; limit: number | null; error: string | null }> {
  const supabase = await createClient()
  const { data } = await callRpc<{ ok: boolean; error: string | null; used: number; limit: number | null }>(
    supabase,
    "record_ai_generation",
    { p_event: event, p_limit: limit }
  )
  if (!data) return { ok: false, used: 0, limit, error: "RPC failed" }
  return { ok: data.ok ?? false, used: data.used ?? 0, limit: data.limit ?? limit, error: data.error ?? null }
}
