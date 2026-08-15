import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321"
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

// Seed credentials (web/supabase/seed.sql). Passwords are demo-only.
export const SEED = {
  admin: { email: "admin@vintch.local", password: "admin1234" },
  amira: { email: "amira.sellers@vintch.local", password: "demo1234" },
  fayad: { email: "fayad.verified@vintch.local", password: "demo1234" },
  kebede: { email: "kebede.trader@vintch.local", password: "demo1234" },
  biniam: { email: "biniam.buyer@vintch.local", password: "demo1234" },
} as const

/** Anon-role client (no session): exercises the RLS rules as a visitor. */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Signs in as a seed user and returns the authenticated client + user id. */
export async function signInAs(
  email: string,
  password: string
): Promise<{ client: SupabaseClient; userId: string }> {
  const client = anonClient()
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return { client, userId: data.user.id }
}

// Top-level await probe: describe.skipIf needs a plain boolean at collect time,
// before any beforeAll runs. Module load is the only point we know it early.
export const integrationAvailable = (async () => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`)
    return res.status < 500
  } catch {
    return false
  }
})()