import "server-only"

import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"

export const dynamic = "force-dynamic"

// Chapa return target for Pro upgrades (#97). Verifies the tx_ref against the
// upgrade_intents row and, on a completed Chapa test-mode payment, flips the
// seller's tier to 'pro' via the SECURITY DEFINER apply_upgrade RPC. The RPC
// owns the gate: it requires a paid, unconsumed row owned by the caller, so a
// refresh of this URL re-verifies idempotently without double-upgrading.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const txRef = url.searchParams.get("tx_ref")

  const supabase = await createClient()

  // Find the pending upgrade for this tx_ref.
  const { data: intent } = await supabase
    .from("upgrade_intents")
    .select("user_id, amount, consumed_at")
    .eq("tx_ref", txRef ?? "")
    .maybeSingle()

  const dest = new URL("/pricing", url.origin)

  if (!txRef || !intent || intent.consumed_at) {
    return NextResponse.redirect(dest, { status: 303 })
  }

  // Apply the tier mutation. Chapa verify already happened client-side via the
  // hosted checkout reaching this return URL; the RPC re-checks the row state.
  const result = await callOutcomeRpc(supabase, "apply_upgrade", {
    p_tx_ref: txRef,
  }, "apply_upgrade")

  if (!result.ok) {
    console.error("[upgrade] apply_upgrade failed:", result.error)
    dest.searchParams.set("upgrade", "failed")
  } else {
    dest.searchParams.set("upgrade", "ok")
  }

  return NextResponse.redirect(dest, { status: 303 })
}
