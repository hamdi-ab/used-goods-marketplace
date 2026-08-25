import type { FullConfig } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Playwright does not auto-load .env.local into globalSetup, but the app and
// webServer rely on it. Load it explicitly so cleanup has the credentials.
// (dotenv-style parser: does not override already-set vars.)
const envPath = join(process.cwd(), ".env.local")
try {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
  }
} catch {
  console.log("warmup -> could not read .env.local")
}

// Turbopack compiles routes on first hit; a cold compile can take tens of
// seconds and blow the 60s per-test timeout when several spec files share the
// dev server. Warm every route the suite visits (with dummy ids for the
// dynamic segments — a 404/redirect still compiles the route module) before
// the first test runs.
const BASE = "http://localhost:3000"

const ROUTES = [
  "/",
  "/login",
  "/register",
  "/search",
  "/dashboard",
  "/sell",
  "/offers",
  "/offers/seller",
  "/favorites",
  "/notifications",
  "/profile",
  "/reports",
  "/users/00000000-0000-0000-0000-000000000000",
  "/listings/00000000-0000-0000-0000-000000000000",
  "/listings/00000000-0000-0000-0000-000000000000/edit",
  "/admin",
  "/admin/users",
  "/admin/listings",
  "/admin/reports",
  "/admin/statistics",
  "/admin/verifications",
  "/admin/account",
  "/about",
  "/help",
  "/terms",
  "/privacy",
  "/safety",
  "/contact",
]

// The suite writes state through the UI (a favorite, an offer, a report, a
// created listing). Against the persistent remote DB those rows survive a run
// and break the next one — submit_report rejects a duplicate open report, and
// a favorite left behind changes the home-page heart. Reset the demo users'
// mutable rows before each run so the suite is idempotent. Their ids come from
// web/supabase/seed.sql (deterministic UUIDs, end in 0001..0005).
async function resetDemoState() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.log("cleanup -> skipped (missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)")
    return
  }
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  }
  const demoIds = [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
    "00000000-0000-0000-0000-000000000003",
    "00000000-0000-0000-0000-000000000004",
    "00000000-0000-0000-0000-000000000005",
  ]
  const targets = encodeURIComponent(demoIds.join(","))
  const tables: Array<[string, string]> = [
    ["favorites", "user_id"],
    ["reports", "reporter_id"],
    ["offers", "buyer_id"],
  ]
  for (const [table, col] of tables) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/${table}?${col}=in.(${targets})`,
      { method: "DELETE", headers }
    )
    console.log(`cleanup -> ${table}: ${res.status}`)
  }
}

export default async function globalSetup(_config: FullConfig) {
  void _config
  for (const route of ROUTES) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 60_000)
      const res = await fetch(`${BASE}${route}`, { signal: controller.signal })
      clearTimeout(timer)
      console.log(`warm ${route} -> ${res.status}`)
    } catch (err) {
      // "destination stream closed early" is benign during Turbopack warmup —
      // the dev server was busy compiling when the fetch connected. Tests use
      // page.goto() which waits properly, so this doesn't affect results.
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("destination stream")) {
        console.log(`warm ${route} -> ok (stream closed during compile)`)
      } else {
        console.log(`warm ${route} -> FAILED ${msg}`)
      }
    }
  }
  await resetDemoState()
}