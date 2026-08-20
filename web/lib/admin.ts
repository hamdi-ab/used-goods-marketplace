import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
import {
  pagedHasMore,
  resolveWindow,
  type PagingArgs,
} from "@/lib/pagination"

// ---- Admin module (T11 surface): users, listings, marketplace stats ----
// All reads run as the signed-in admin; RLS grants admins full read access on
// profiles, listings, and reports (DB spec §20), so no SECURITY DEFINER RPC is
// needed for reads. Writes (suspend user, remove listing) mirror the
// resolve_report actions: demote role / soft-delete, both allowed by the
// admin-manageable RLS policies.

// ---- Row shapes ----

export interface AdminUserRow {
  id: string
  full_name: string | null
  role: "buyer" | "seller" | "admin"
  city: string | null
  phone: string | null
  telegram_username: string | null
  trust_score: number | null
  profile_completion: number | null
  phone_verified: boolean | null
  fayda_verified: boolean | null
  suspended_at: string | null
  created_at: string
}

const ADMIN_USER_COLUMNS =
  "id, full_name, role, city, phone, telegram_username, trust_score, profile_completion, phone_verified, fayda_verified, suspended_at, created_at"

export interface AdminListingRow {
  id: string
  title: string
  price: number
  condition: string | null
  status: string
  city: string | null
  view_count: number | null
  favorite_count: number | null
  sold_to_buyer_id: string | null
  created_at: string
  published_at: string | null
  seller: {
    id: string
    full_name: string | null
  } | null
}

export interface MarketplaceStats {
  totalUsers: number
  totalListings: number
  activeListings: number
  verifiedSellers: number
  productsSold: number
  openReports: number
}

export interface StatsBreakdown {
  byStatus: Record<string, number>
  byRole: Record<string, number>
  byReportStatus: Record<string, number>
}

// ---- Reads ----

export interface AdminUsersPage {
  users: AdminUserRow[]
  count: number | null
  hasMore: boolean
  error: string | null
}

export async function fetchAdminUsers(
  args: PagingArgs = {},
  client?: Supabase
): Promise<AdminUsersPage> {
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)
  const { data, error, count } = await supabase
    .from("profiles")
    .select(ADMIN_USER_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchAdminUsers:", error.message)
    return { users: [], count, hasMore: false, error: error.message }
  }

  const users = (data ?? []) as unknown as AdminUserRow[]
  return {
    users,
    count,
    hasMore: pagedHasMore(offset, users.length, count),
    error: null,
  }
}

export interface AdminListingsPage {
  listings: AdminListingRow[]
  count: number | null
  hasMore: boolean
  error: string | null
}

export async function fetchAdminListings(
  args: PagingArgs = {},
  client?: Supabase
): Promise<AdminListingsPage> {
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)
  const { data, error, count } = await supabase
    .from("listings")
    .select(
      `id, title, price, condition, status, city, view_count, favorite_count,
       sold_to_buyer_id, created_at, published_at,
       seller:profiles!listings_seller_id_fkey(id, full_name)`,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchAdminListings:", error.message)
    return { listings: [], count, hasMore: false, error: error.message }
  }

  // PostgREST returns every embedded relation as an array, even a to-one join,
  // so `seller:profiles!listings_seller_id_fkey` arrives as `{...}[] | null`;
  // flatten to a single row like the review buyer join does.
  type RawAdminListingRow = Omit<AdminListingRow, "price" | "seller"> & {
    price: string
    seller: { id: string; full_name: string | null }[] | null
  }
  const listings = ((data ?? []) as unknown as RawAdminListingRow[]).map(
    (row) => ({
      ...row,
      price: Number(row.price),
      seller: row.seller?.[0] ?? null,
    })
  )
  return {
    listings,
    count,
    hasMore: pagedHasMore(offset, listings.length, count),
    error: null,
  }
}

export async function fetchMarketplaceStats(
  client?: Supabase
): Promise<MarketplaceStats> {
  const supabase = client ?? (await createClient())

  const [users, listings, active, sold, sellers, reports] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .is("deleted_at", null),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .not("sold_to_buyer_id", "is", null)
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "seller")
      .or("phone_verified.eq.true,fayda_verified.eq.true")
      .is("deleted_at", null),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ])

  return {
    totalUsers: users.count ?? 0,
    totalListings: listings.count ?? 0,
    activeListings: active.count ?? 0,
    productsSold: sold.count ?? 0,
    verifiedSellers: sellers.count ?? 0,
    openReports: reports.count ?? 0,
  }
}

/**
 * Dimension splits for the statistics page: listings by status, users by
 * role, reports by status. Cheap grouped counts over the same admin RLS read
 * path as fetchMarketplaceStats.
 */
export async function fetchStatsBreakdown(
  client?: Supabase
): Promise<StatsBreakdown> {
  const supabase = client ?? (await createClient())

  const [listingRows, userRows, reportRows] = await Promise.all([
    supabase.from("listings").select("status").is("deleted_at", null),
    supabase
      .from("profiles")
      .select("role")
      .is("deleted_at", null),
    supabase.from("reports").select("status"),
  ])

  const byStatus: Record<string, number> = {}
  for (const row of listingRows.data ?? []) {
    const key = (row.status as string | null) ?? "unknown"
    byStatus[key] = (byStatus[key] ?? 0) + 1
  }

  const byRole: Record<string, number> = {}
  for (const row of userRows.data ?? []) {
    const key = (row.role as string | null) ?? "unknown"
    byRole[key] = (byRole[key] ?? 0) + 1
  }

  const byReportStatus: Record<string, number> = {}
  for (const row of reportRows.data ?? []) {
    const key = (row.status as string | null) ?? "unknown"
    byReportStatus[key] = (byReportStatus[key] ?? 0) + 1
  }

  if (listingRows.error) console.error("fetchStatsBreakdown listings:", listingRows.error.message)
  if (userRows.error) console.error("fetchStatsBreakdown users:", userRows.error.message)
  if (reportRows.error) console.error("fetchStatsBreakdown reports:", reportRows.error.message)

  return { byStatus, byRole, byReportStatus }
}

// ---- Writes ----

export interface AdminWriteResult {
  ok: boolean
  error: string | null
}

/**
 * Suspend a user: demote to buyer, mark suspended_at, and soft-delete their
 * live listings. Mirrors the resolve_report `block_seller` action so a
 * suspended seller disappears from all reads and is blocked by the requireSeller
 * gate. RLS grants admins full update access on profiles and listings.
 */
export async function suspendUserRow(
  userId: string
): Promise<AdminWriteResult> {
  const supabase = await createClient()

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "buyer", suspended_at: new Date().toISOString() })
    .eq("id", userId)
  if (profileError) return { ok: false, error: profileError.message }

  const { error: listingError } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("seller_id", userId)
    .is("deleted_at", null)
  if (listingError) return { ok: false, error: listingError.message }

  return { ok: true, error: null }
}

/**
 * Restore a suspended user (fix #86): re-instate the seller role and clear the
 * suspension marker — the inverse of suspendUserRow's demotion, so a suspended
 * seller can list again. Restoring a non-suspended row is a no-op (the admin UI
 * only offers Restore on suspended users). The audit frames this as the admin
 * counterpart to the self-service promote path (#71).
 */
export async function restoreUserRow(
  userId: string
): Promise<AdminWriteResult> {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from("profiles")
    .select("suspended_at")
    .eq("id", userId)
  const suspended = (rows ?? [])[0]?.suspended_at != null
  if (!suspended) return { ok: true, error: null }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "seller", suspended_at: null })
    .eq("id", userId)
  if (error) return { ok: false, error: error.message }

  return { ok: true, error: null }
}

/**
 * Remove a listing: soft-delete it (status archived + deleted_at), mirroring
 * the resolve_report `remove_listing` action. RLS grants admins full update
 * access on listings.
 */
export async function removeListingRow(
  listingId: string
): Promise<AdminWriteResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("id", listingId)
  if (error) return { ok: false, error: error.message }

  return { ok: true, error: null }
}
