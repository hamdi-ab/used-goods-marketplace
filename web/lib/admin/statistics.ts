import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

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

export async function fetchMarketplaceStats(
  client?: SupabaseClient
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
  client?: SupabaseClient
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
