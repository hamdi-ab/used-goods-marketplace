/**
 * Pure reports domain value objects.
 *
 * Framework-agnostic constants, types and helpers shared by Server and Client
 * modules. This module intentionally has NO `server-only` import and imports no
 * Supabase client, so Client Components can consume it directly without pulling
 * the server seam into the client graph. `@/lib/reports` re-exports everything
 * here (`export *`).
 */

import { z } from "zod"

export const REPORT_REASONS = [
  "spam",
  "fraud",
  "duplicate",
  "wrong_category",
  "offensive_content",
  "other",
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  fraud: "Fraud",
  duplicate: "Duplicate",
  wrong_category: "Wrong Category",
  offensive_content: "Offensive Content",
  other: "Other",
}

export const REPORT_STATUSES = ["open", "resolved", "rejected"] as const

export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  rejected: "Rejected",
}

// Open is the only actionable state in the admin queue.
export const OPEN_REPORT_STATUSES: ReportStatus[] = ["open"]

// Palette mirrors the offer-badge convention: neutral for open, green for
// resolved, red for rejected.
export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

// Note length mirrors the DB constraint (1-1000).
export const REPORT_NOTE_MAX = 1000

// Rate limit: max 5 reports per reporter per target within a 1-hour window.
// Enforced in the submit_report RPC (DB) and surfaced here for the client to
// show a friendly message before the request lands.
export const REPORT_RATE_LIMIT_COUNT = 5
export const REPORT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

// Server-action input schema (shared with the action + unit tests, so the XOR
// target rule is exercised without importing a "use server" module).
export const submitReportSchema = z
  .object({
    listingId: z.string().uuid().optional(),
    sellerId: z.string().uuid().optional(),
    reason: z.enum(REPORT_REASONS),
    note: z
      .string()
      .max(
        REPORT_NOTE_MAX,
        `Keep the note under ${REPORT_NOTE_MAX} characters`
      )
      .optional(),
  })
  .refine(
    (data) => {
      const hasListing = Boolean(data.listingId)
      const hasSeller = Boolean(data.sellerId)
      // Exactly one target — the DB reports_target_one constraint requires XOR,
      // so a dual (or empty) target is rejected here with a field-level error
      // instead of a generic SQL violation (audit P1.17, #84).
      return hasListing !== hasSeller
    },
    { message: "A report must target a listing or a seller, but not both" }
  )

// The login redirect target for the Report button, shared across signed-out
// CTAs (see lib/nav.ts for the single definition).
export { buildLoginUrl } from "@/lib/nav"
