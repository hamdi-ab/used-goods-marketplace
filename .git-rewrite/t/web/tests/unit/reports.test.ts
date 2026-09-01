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
  it("declares the six AC reasons", () => {
    expect(REPORT_REASONS).toEqual([
      "spam",
      "fraud",
      "duplicate",
      "wrong_category",
      "offensive_content",
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

describe("submitReportSchema target xor", () => {
  const VALID = { reason: "spam" as const }

  it("accepts exactly one target", () => {
    expect(submitReportSchema.safeParse({ ...VALID, listingId: "00000000-0000-0000-0000-000000000000" }).success).toBe(true)
    expect(submitReportSchema.safeParse({ ...VALID, sellerId: "00000000-0000-0000-0000-000000000000" }).success).toBe(true)
  })

  it("rejects both targets", () => {
    const r = submitReportSchema.safeParse({ ...VALID, listingId: "00000000-0000-0000-0000-000000000000", sellerId: "11111111-1111-1111-1111-111111111111" })
    expect(r.success).toBe(false)
    expect(r.error!.issues.some((i) => i.message.includes("but not both"))).toBe(true)
  })

  it("rejects no target", () => {
    expect(submitReportSchema.safeParse(VALID).success).toBe(false)
  })
})
