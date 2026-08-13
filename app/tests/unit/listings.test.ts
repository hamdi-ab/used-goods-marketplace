import { describe, it, expect } from "vitest"

import {
  isValidUuid,
  formatPrice,
  formatCondition,
  CONDITION_COLORS,
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
  STATUSES,
  type ListingStatus,
} from "@/lib/listings"

describe("listings.isValidUuid", () => {
  it("accepts a canonical v4 UUID", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
  })

  it("rejects a short id", () => {
    expect(isValidUuid("550e8400")).toBe(false)
  })

  it("rejects a UUID with trailing extra characters", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000 extra")).toBe(false)
  })
})

describe("listings.formatPrice", () => {
  it("falls back to the placeholder when the value is NaN", () => {
    expect(formatPrice(NaN)).toBe("ETB \u2014")
  })

  it("falls back to the placeholder when a non-numeric string is given", () => {
    expect(formatPrice("not-a-number")).toBe("ETB \u2014")
  })

  it("formats a finite number as a non-empty string (locale-stable contract)", () => {
    const out = formatPrice(5)
    expect(out).not.toBe("ETB \u2014")
    expect(out).toContain("5")
  })
})

describe("listings.formatCondition", () => {
  it("title-cases the brand-new label", () => {
    expect(formatCondition("Brand New")).toBe("Brand new")
  })

  it("passes unknown conditions through unchanged", () => {
    expect(formatCondition("Fair")).toBe("Fair")
  })
})

describe("listings.CONDITION_COLORS", () => {
  it("exposes a palette entry for every condition", () => {
    expect(Object.keys(CONDITION_COLORS).sort()).toEqual(
      ["Brand New", "Lightly Used", "Fair"].sort()
    )
  })
})

describe("listings status presentation", () => {
  it("labels and colors cover the writable statuses plus archived", () => {
    const statuses: ListingStatus[] = ["draft", "published", "sold", "archived"]
    for (const status of statuses) {
      expect(LISTING_STATUS_LABELS[status]).toBeTruthy()
      expect(LISTING_STATUS_COLORS[status]).toMatch(/^bg-.*text-/)
    }
  })

  it("labels every declared STATUSES value", () => {
    for (const status of STATUSES) {
      expect(LISTING_STATUS_LABELS[status]).toBeTruthy()
    }
  })
})
