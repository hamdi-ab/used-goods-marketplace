import "server-only"

import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export interface RateBudgetResult {
  ok: boolean
  message?: string
}

// Global token bucket (fix #85). Enforced at the action layer on the write
// actions that had no limiter (listing create/update/delete, favorites,
// reviews, profile updates, avatar uploads). The window count lives in
// Postgres (rate_usage + consume_rate_budget RPC), keyed by the caller's
// auth.uid() (1000/hr) or an anon fingerprint (100/hr) per the API spec §22.
// getCurrentUser is React-cached, so when the action already ran requireSeller/
// requireTrader this is a cache hit — the only extra cost is the RPC round trip.
export async function consumeRateBudget(opts?: {
  limit?: number
  fingerprint?: string
}): Promise<RateBudgetResult> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  // An authenticated caller always gets the auth bucket; the fingerprint is
  // only meaningful for anon callers.
  const fingerprint = user ? undefined : opts?.fingerprint
  const { data, error } = await supabase.rpc("consume_rate_budget", {
    p_limit: opts?.limit ?? null,
    p_fingerprint: fingerprint ?? null,
  })
  if (error || data?.allowed !== true) {
    return {
      ok: false,
      message: "Too many requests — please slow down and try again later",
    }
  }
  return { ok: true }
}
