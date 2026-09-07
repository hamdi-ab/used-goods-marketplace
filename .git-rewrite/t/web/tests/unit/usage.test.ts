import { describe, it, expect } from "vitest"
import {
  LISTING_LIMIT_MESSAGE,
  isAtCap,
  activeListingLimit,
} from "@/lib/plans/constants"

describe("listing quota seam (T26, shared plans/constants)", () => {
  it("exposes the §26 friendly listing-limit message", () => {
    expect(LISTING_LIMIT_MESSAGE).toMatch(/5 active listing limit/)
    expect(LISTING_LIMIT_MESSAGE).toMatch(/upgrade to Pro/)
  })

  it("resolves the active-listing cap per tier", () => {
    expect(activeListingLimit("free")).toBe(5)
    expect(activeListingLimit("pro")).toBe(25)
    expect(activeListingLimit("business")).toBe(100)
  })

  it("isAtCap is true at and above the cap, false below", () => {
    expect(isAtCap(0, 5)).toBe(false)
    expect(isAtCap(4, 5)).toBe(false)
    expect(isAtCap(5, 5)).toBe(true)
    expect(isAtCap(6, 5)).toBe(true)
  })

  it("isAtCap never caps an uncapped (null) limit", () => {
    expect(isAtCap(0, null)).toBe(false)
    expect(isAtCap(999, null)).toBe(false)
  })
})