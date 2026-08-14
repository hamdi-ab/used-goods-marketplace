import { describe, it, expect } from "vitest"

import {
  sellerVerificationBadges,
  hasVerification,
  VERIFICATION_BADGE_LABELS,
  VERIFICATION_BADGE_NOTE,
  type VerificationBadge,
} from "@/lib/verifications/constants"

describe("verifications.badge rules", () => {
  it("labels every badge variant", () => {
    const labels: Record<VerificationBadge, string> = VERIFICATION_BADGE_LABELS
    expect(labels["verified-seller"]).toBe("Verified Seller")
    expect(labels.phone).toBe("Phone Verified")
    expect(labels.fayda).toBe("Fayda Verified")
  })

  it("orders verified-seller first, then phone, then fayda", () => {
    const badges = sellerVerificationBadges({
      role: "seller",
      phone_verified: true,
      fayda_verified: true,
    })
    expect(badges).toEqual(["verified-seller", "phone", "fayda"])
  })

  it("surfaces phone when only the phone flag is set", () => {
    expect(
      sellerVerificationBadges({ role: "seller", phone_verified: true, fayda_verified: false })
    ).toEqual(["verified-seller", "phone"])
  })

  it("surfaces fayda when only the fayda flag is set", () => {
    expect(
      sellerVerificationBadges({ role: "seller", phone_verified: false, fayda_verified: true })
    ).toEqual(["verified-seller", "fayda"])
  })

  it("renders only the Verified Seller badge for an unverified seller", () => {
    expect(
      sellerVerificationBadges({ role: "seller", phone_verified: false, fayda_verified: false })
    ).toEqual(["verified-seller"])
  })

  it("shows no badges for a buyer", () => {
    expect(
      sellerVerificationBadges({ role: "buyer", phone_verified: false, fayda_verified: false })
    ).toEqual([])
  })

  it("treats null seller as the not-verified empty state", () => {
    expect(sellerVerificationBadges(null)).toEqual([])
    expect(hasVerification(null)).toBe(false)
  })

  it("treats missing flags as not verified", () => {
    expect(sellerVerificationBadges({ role: "seller" })).toEqual(["verified-seller"])
    expect(sellerVerificationBadges({ role: "buyer" })).toEqual([])
  })
})

describe("verifications.hasVerification", () => {
  it("is false for the empty state", () => {
    expect(
      hasVerification({ role: "buyer", phone_verified: false, fayda_verified: false })
    ).toBe(false)
  })

  it("is true when any badge is active", () => {
    expect(
      hasVerification({ role: "seller", phone_verified: false, fayda_verified: false })
    ).toBe(true)
    expect(
      hasVerification({ role: "buyer", phone_verified: true, fayda_verified: false })
    ).toBe(true)
  })
})

describe("verifications empty-state label", () => {
  it("exposes a stable not-verified message", () => {
    expect(VERIFICATION_BADGE_NOTE).toBe("Not verified yet")
  })
})
