// Client-safe: reads the caller's own profile role (owner RLS) so the header,
// account menu, and login landing can branch per role without a server round-trip.
// Server-side reads use getCurrentUser in ../auth instead.
import type { SupabaseClient } from "@supabase/supabase-js"

import { normalizeRole, type UserRole } from "./types"

export async function fetchClientRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()
  return normalizeRole(data?.role)
}
