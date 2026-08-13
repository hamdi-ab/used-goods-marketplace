import { describe, it, expect } from "vitest"

import {
  buildLoginUrl,
  OFFER_AMOUNT_MAX,
  OFFER_MESSAGE_MAX,
  OFFER_STATUS_COLORS,
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/lib/offers/constants"

describe("offers status machine", () => {
  it("declares the four AC statuses", () => {
    expect(OFFER_STATUSES).toEqual(["pending", "countered", "accepted", "declined"])
  })

  it("labels and colors cover every declared status", () => {
    for (const status of OFFER_STATUSES) {
      expect(OFFER_STATUS_LABELS[status]).toBeTruthy()
      expect(OFFER_STATUS_COLORS[status]).toMatch(/^bg-.*text-/)
    }
  })

  it("does not add labels for undeclared statuses", () => {
    const declared = new Set<string>(OFFER_STATUSES)
    const labeled = Object.keys(OFFER_STATUS_LABELS) as OfferStatus[]
    expect(labeled.every((s) => declared.has(s))).toBe(true)
  })
})

describe("offers bounds mirror the DB constraints", () => {
  it("allows a positive amount ceiling and the 500-char message cap", () => {
    expect(OFFER_AMOUNT_MAX).toBeGreaterThan(0)
    expect(OFFER_MESSAGE_MAX).toBe(500)
  })
})

describe("offers.buildLoginUrl", () => {
  it("builds the login URL with the current path as next", () => {
    expect(buildLoginUrl("/listings/abc-123")).toBe(
      "/login?next=%2Flistings%2Fabc-123"
    )
  })

  it("encodes a query string inside the next param", () => {
    expect(buildLoginUrl("/?category=books")).toContain(
      "next=%2F%3Fcategory%3Dbooks"
    )
  })
})
