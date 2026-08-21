import { describe, it, expect } from "vitest"
import {
  TIERS,
  DEFAULT_TIER,
  TIER_LABELS,
  TIER_LIMITS,
  isTier,
  resolveTier,
  resolveLimits,
  AI_LIMIT_MESSAGE,
  isAtCap,
  aiLimit,
} from "@/lib/plans/constants"

describe("plan tiers (T24)", () => {
  it("defines exactly the three tiers with a free default", () => {
    expect(TIERS).toEqual(["free", "pro", "business"])
    expect(DEFAULT_TIER).toBe("free")
    expect(TIER_LABELS).toMatchObject({
      free: "Free",
      pro: "Pro",
      business: "Business",
    })
  })

  it("free = 5 listings / 10 images / 3 AI per month", () => {
    expect(TIER_LIMITS.free).toEqual({
      activeListings: 5,
      imagesPerListing: 10,
      aiGenerationsPerMonth: 3,
    })
  })

  it("pro = 25 listings / 10 images / 30 AI per month", () => {
    expect(TIER_LIMITS.pro).toEqual({
      activeListings: 25,
      imagesPerListing: 10,
      aiGenerationsPerMonth: 30,
    })
  })

  it("business = 100+ listings / 10+ images / uncapped AI", () => {
    const business = TIER_LIMITS.business
    expect(business.activeListings).toBeGreaterThanOrEqual(100)
    expect(business.imagesPerListing).toBeGreaterThanOrEqual(10)
    expect(business.aiGenerationsPerMonth).toBeNull()
  })

  it("isTier narrows known values and rejects garbage", () => {
    expect(isTier("free")).toBe(true)
    expect(isTier("pro")).toBe(true)
    expect(isTier("business")).toBe(true)
    expect(isTier("enterprise")).toBe(false)
    expect(isTier(undefined)).toBe(false)
    expect(isTier(null)).toBe(false)
  })

  it("resolveTier defaults unknown/null values to free", () => {
    expect(resolveTier("pro")).toBe("pro")
    expect(resolveTier("business")).toBe("business")
    expect(resolveTier("free")).toBe("free")
    expect(resolveTier(null)).toBe("free")
    expect(resolveTier(undefined)).toBe("free")
    expect(resolveTier("hacker")).toBe("free")
  })

  it("resolveLimits returns the matching tier's limits", () => {
    expect(resolveLimits("free")).toBe(TIER_LIMITS.free)
    expect(resolveLimits("pro").activeListings).toBe(25)
  })

  it("exposes the §26 friendly AI-limit message", () => {
    expect(AI_LIMIT_MESSAGE).toMatch(/free AI listing credits/)
    expect(AI_LIMIT_MESSAGE).toMatch(/create your listing manually/)
  })

  it("aiLimit resolves the monthly cap per tier, null = uncapped", () => {
    expect(aiLimit("free")).toBe(3)
    expect(aiLimit("pro")).toBe(30)
    expect(aiLimit("business")).toBeNull()
  })

  it("isAtCap is true at and above the cap, never for null limits", () => {
    expect(isAtCap(0, 3)).toBe(false)
    expect(isAtCap(2, 3)).toBe(false)
    expect(isAtCap(3, 3)).toBe(true)
    expect(isAtCap(4, 3)).toBe(true)
    expect(isAtCap(999, null)).toBe(false)
  })
})