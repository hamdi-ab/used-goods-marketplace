import "server-only"

import { createClient } from "@/lib/supabase/server"
import { callOutcomeRpc } from "@/lib/supabase/rpc"
import { OPEN_REPORT_STATUSES } from "./reports/constants"
import type { ReportReason, ReportStatus } from "./reports/constants"

// Re-export the pure value objects so imports from "@/lib/reports" keep
// resolving. Definitions live in ./reports/constants (server-free).
export * from "./reports/constants"

// ---- Row shapes ----

// Context for a listing-targeted report: the listing + its cover image + seller.
export interface ReportListingContext {
  id: string
  title: string
  price: number
  image_url: string | null
  seller: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

// Context for a seller-targeted report: the reported seller profile.
export interface ReportSellerContext {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  trust_score: number | null
}

// A report enriched with the context needed by the admin queue and the
// reporter's acknowledgement view. The listing/seller joins are nullable
// (a report targets exactly one), mirroring the DB constraint.
export interface ReportWithRelations {
  id: string
  reporter_id: string
  reported_listing_id: string | null
  reported_seller_id: string | null
  reason: ReportReason
  note: string | null
  status: ReportStatus
  created_at: string
  updated_at: string
  listing: ReportListingContext | null
  seller: ReportSellerContext | null
  reporter: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

// The subset of a report's columns that the reporter sees (no other users'
// identities leak — only their own reports are selectable under RLS).
export interface MyReportRow {
  id: string
  reason: ReportReason
  note: string | null
  status: ReportStatus
  target_type: "listing" | "seller"
  target_id: string
  target_title: string | null
  created_at: string
}

// ---- Reads ----

/** Columns selected for every report query (keeps the two read paths in sync). */
const REPORT_COLUMNS =
  "id, reporter_id, reported_listing_id, reported_seller_id, reason, note, status, created_at, updated_at"

// Join spec for the reported item context. Reports has two FKs to profiles
// (reporter_id and reported_seller_id), so the seller join needs an explicit
// FK hint to disambiguate from the reporter join.
const REPORT_JOINS = `${REPORT_COLUMNS},
 listing:listings(id, title, price,
   seller:profiles!listings_seller_id_fkey(id, full_name, avatar_url),
   images:listing_images(image_url, display_order)),
 seller:profiles!reports_reported_seller_id_fkey(id, full_name, avatar_url, role, trust_score),
 reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_url)`

/**
 * The reporter's own reports, newest first. Each row carries a denormalised
 * target label so the client can render a compact "you reported X" line
 * without a second round-trip.
 */
export async function fetchMyReports(
  userId: string
): Promise<MyReportRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_JOINS)
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchMyReports:", error.message)
    return []
  }

  return (
    (data ?? []) as unknown as RawReportRow[]
  ).map(normalizeMyReport)
}

/**
 * The admin moderation queue: all open reports with the reported item's
 * context (listing + seller profile, or just the seller profile).
 */
export async function fetchAdminReports(): Promise<ReportWithRelations[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_JOINS)
    .in("status", OPEN_REPORT_STATUSES)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchAdminReports:", error.message)
    return []
  }

  return (
    (data ?? []) as unknown as RawReportRow[]
  ).map(normalizeAdminReport)
}

// ---- Writes ----

export interface ReportResult {
  ok: boolean
  error: string | null
}

/**
 * Submit a report. Delegates to the submit_report RPC so the rate limit and
 * duplicate-open checks run in a single SECURITY DEFINER round-trip.
 * The reporter is resolved from the session (auth.uid) inside the RPC, so
 * the caller's own user id is not trusted.
 */
export async function createReport(params: {
  listingId?: string | null
  sellerId?: string | null
  reason: ReportReason
  note?: string | null
}): Promise<ReportResult> {
  const supabase = await createClient()

  const result = await callOutcomeRpc(
    supabase,
    "submit_report",
    {
      p_listing_id: params.listingId ?? null,
      p_seller_id: params.sellerId ?? null,
      p_reason: params.reason,
      p_note: params.note?.trim() || null,
    },
    "createReport"
  )

  return { ok: result.ok === true, error: result.error ?? null }
}

/**
 * Admin-only: resolve a report with a moderation action. Returns the same
 * jsonb shape the RPC emits ({ ok, error }) so the action layer can translate
 * it uniformly.
 */
export async function resolveReport(
  reportId: string,
  action: "remove_listing" | "block_seller" | "reject",
  adminNote?: string | null
): Promise<ReportResult> {
  const supabase = await createClient()

  const result = await callOutcomeRpc(
    supabase,
    "resolve_report",
    {
      p_report_id: reportId,
      p_action: action,
      p_admin_note: adminNote?.trim() || null,
    },
    "resolveReport"
  )

  return { ok: result.ok === true, error: result.error ?? null }
}

// ---- Normalisation helpers (convert raw join rows to typed shapes) ----

interface RawReportRow {
  id: string
  reporter_id: string
  reported_listing_id: string | null
  reported_seller_id: string | null
  reason: string
  note: string | null
  status: string
  created_at: string
  updated_at: string
  listing: {
    id: string
    title: string
    price: number | string
    seller?: { id: string; full_name: string | null; avatar_url: string | null } | null
    images?: { image_url: string; display_order: number }[] | null
  } | null
  seller: {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    trust_score: number | null
  } | null
  reporter: { id: string; full_name: string | null; avatar_url: string | null } | null
}

function pickCoverImage(
  images: { image_url: string; display_order: number }[] | null | undefined
): string | null {
  return (
    [...(images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]
      ?.image_url ?? null
  )
}

function normalizeAdminReport(row: RawReportRow): ReportWithRelations {
  const listing = row.listing
  const seller = row.seller
  const reporter = row.reporter

  return {
    id: row.id,
    reporter_id: row.reporter_id,
    reported_listing_id: row.reported_listing_id,
    reported_seller_id: row.reported_seller_id,
    reason: (row.reason ?? "other") as ReportReason,
    note: row.note,
    status: (row.status ?? "open") as ReportStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          price: Number(listing.price),
          image_url: pickCoverImage(listing.images),
          seller: listing.seller
            ? {
                id: listing.seller.id,
                full_name: listing.seller.full_name,
                avatar_url: listing.seller.avatar_url,
              }
            : null,
        }
      : null,
    seller: seller
      ? {
          id: seller.id,
          full_name: seller.full_name,
          avatar_url: seller.avatar_url,
          role: seller.role,
          trust_score: seller.trust_score,
        }
      : null,
    reporter: reporter
      ? {
          id: reporter.id,
          full_name: reporter.full_name,
          avatar_url: reporter.avatar_url,
        }
      : null,
  }
}

function normalizeMyReport(row: RawReportRow): MyReportRow {
  const listing = row.listing
  const seller = row.seller

  const isListing = row.reported_listing_id !== null
  return {
    id: row.id,
    reason: (row.reason ?? "other") as ReportReason,
    note: row.note,
    status: (row.status ?? "open") as ReportStatus,
    target_type: isListing ? "listing" : "seller",
    target_id: isListing
      ? row.reported_listing_id!
      : row.reported_seller_id!,
    target_title: isListing ? listing?.title ?? null : seller?.full_name ?? null,
    created_at: row.created_at,
  }
}
