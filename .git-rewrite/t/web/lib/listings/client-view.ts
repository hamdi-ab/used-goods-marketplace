import { createClient } from "@/lib/supabase/client"
import { callRpc } from "@/lib/supabase/rpc"

/** Fire-and-forget view increment (fix #74). The record_listing_view RPC is
 * idempotent per (viewer, listing) within its 5-minute dedupe window, so a
 * retry or a React double-mount never inflates the count. Errors are logged,
 * never thrown: the listing page must not depend on the counter. */
export async function recordListingView(listingId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await callRpc<{ ok?: boolean; count?: number }>(
    supabase,
    "record_listing_view",
    { p_listing_ids: [listingId] }
  )
  if (error) console.error("recordListingView:", error)
}
