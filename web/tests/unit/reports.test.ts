import { describe, it, expect } from "vitest"

import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  REPORT_NOTE_MAX,
  REPORT_RATE_LIMIT_COUNT,
  REPORT_RATE_LIMIT_WINDOW_MS,
  submitReportSchema,
  type ReportReason,
  type ReportStatus,
} from "@/lib/reports/constants"

describe("reports reasons", () => {
  it("declares the seven AC reasons", () => {
    expect(REPORT_REASONS).toEqual([
      "spam",
      "fraud",
      "duplicate",
      "wrong_category",
      "offensive_content",
      "review_violation",
      "other",
    ])
  })

  it("maps a label to every declared reason", () => {
    for (const reason of REPORT_REASONS) {
      expect(REPORT_REASON_LABELS[reason]).toBeTruthy()
    }
  })

  it("does not add labels for undeclared reasons", () => {
    const declared = new Set<string>(REPORT_REASONS)
    const labeled = Object.keys(REPORT_REASON_LABELS) as ReportReason[]
    expect(labeled.every((s) => declared.has(s))).toBe(true)
  })
})

describe("reports statuses", () => {
  it("declares open, resolved, rejected", () => {
    expect(REPORT_STATUSES).toEqual(["open", "resolved", "rejected"])
  })

  it("labels and colors cover every declared status", () => {
    for (const status of REPORT_STATUSES) {
      expect(REPORT_STATUS_LABELS[status]).toBeTruthy()
      expect(REPORT_STATUS_COLORS[status]).toMatch(/^bg-.*text-/)
    }
  })

  it("labels every declared status", () => {
    const declared = new Set<string>(REPORT_STATUSES)
    const labeled = Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]
    expect(labeled.every((s) => declared.has(s))).toBe(true)
  })
})

describe("reports bounds", () => {
  it("exposes a 1000-char note ceiling", () => {
    expect(REPORT_NOTE_MAX).toBe(1000)
  })

  it("exposes a positive rate-limit count within a 1-hour window", () => {
    expect(REPORT_RATE_LIMIT_COUNT).toBeGreaterThan(0)
    expect(REPORT_RATE_LIMIT_WINDOW_MS).toBe(60 * 60 * 1000)
  })
})

describe("submitReportSchema target validation", () => {
  const VALID = { reason: "spam" as const }

  it("accepts exactly one target: listing, seller, or review", () => {
    expect(
      submitReportSchema.safeParse({
        ...VALID,
        listingId: "00000000-0000-0000-0000-000000000000",
      }).success
    ).toBe(true)
    expect(
      submitReportSchema.safeParse({
        ...VALID,
        sellerId: "00000000-0000-0000-0000-000000000000",
      }).success
    ).toBe(true)
    expect(
      submitReportSchema.safeParse({
        ...VALID,
        reviewId: "00000000-0000-0000-0000-000000000000",
      }).success
    ).toBe(true)
  })

  it("rejects multiple targets", () => {
    const r1 = submitReportSchema.safeParse({
      ...VALID,
      listingId: "00000000-0000-0000-0000-000000000000",
      sellerId: "11111111-1111-1111-1111-111111111111",
    })
    expect(r1.success).toBe(false)

    const r2 = submitReportSchema.safeParse({
      ...VALID,
      listingId: "00000000-0000-0000-0000-000000000000",
      reviewId: "22222222-2222-2222-2222-222222222222",
    })
    expect(r2.success).toBe(false)
  })

    it("rejects no target", () => {
    expect(submitReportSchema.safeParse(VALID).success).toBe(false)
  })
})

describe("normalizeMyReport target_title formatting", () => {
  const baseReport = {
    id: "report-1",
    reporter_id: "reporter-1",
    reason: "review_violation" as const,
    note: null,
    status: "open" as const,
    reported_listing_id: null,
    reported_seller_id: null,
    review_id: "review-1",
    created_at: "2026-09-26T12:00:00Z",
    updated_at: "2026-09-26T12:00:00Z",
    listing: null,
    seller: null,
    reporter: null,
  }

  it("formats short review comments without ellipsis", async () => {
    const { normalizeMyReport } = await import("@/lib/reports")
    const res = normalizeMyReport({
      ...baseReport,
      review: {
        id: "review-1",
        rating: 1,
        comment: "Short comment",
      },
    })
    expect(res.target_title).toBe('Review: "Short comment"')
    expect(res.target_type).toBe("review")
  })

  it("truncates long review comments with ellipsis beyond 30 characters", async () => {
    const { normalizeMyReport } = await import("@/lib/reports")
    const res = normalizeMyReport({
      ...baseReport,
      id: "report-2",
      review: {
        id: "review-2",
        rating: 1,
        comment: "This is a very long comment that definitely exceeds thirty characters in total length",
      },
    })
    expect(res.target_title).toBe('Review: "This is a very long comment th..."')
  })

  it("falls back to 'Review' when review comment is null or empty", async () => {
    const { normalizeMyReport } = await import("@/lib/reports")
    const res = normalizeMyReport({
      ...baseReport,
      id: "report-3",
      review: {
        id: "review-3",
        rating: 5,
        comment: null,
      },
    })
    expect(res.target_title).toBe("Review")
  })
})
