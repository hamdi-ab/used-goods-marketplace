import type { SupabaseClient } from "@supabase/supabase-js"

/** The client type used across the data seam. Uses the untyped client defaults
 * (Database = any) so any instance returned by createServerClient /
 * createBrowserClient satisfies it, and so the seam modules stay server-free
 * and unit-testable. */
export type Supabase = SupabaseClient
