import { describe, it, expect } from "vitest"

import {
  RATING_MAX,
  RATING_MIN,
  REVIEW_COMMENT_MAX,
  REVIEWABLE_OFFER_STATUS,
  ratingAverageToTrustScore,
} from "@/lib/reviews/constants"

describe("reviews rating bounds", () => {
  it("exposes a 1-5 rating range", () => {
    expect(RATING_MIN).toBe(1)
    expect(RATING_MAX).toBe(5)
  })

  it("only allows a review on an accepted offer", () => {
    expect(REVIEWABLE_OFFER_STATUS).toBe("accepted")
  })
})

describe("reviews comment cap", () => {
  it("caps the review comment length", () => {
    expect(REVIEW_COMMENT_MAX).toBe(1000)
  })
})

describe("reviews.ratingAverageToTrustScore", () => {
  it("maps a perfect average to 100", () => {
    expect(ratingAverageToTrustScore(5)).toBe(100)
  })

  it("maps the minimum average to 20", () => {
    expect(ratingAverageToTrustScore(1)).toBe(20)
  })

  it("scales linearly: a 4.0 average is 80", () => {
    expect(ratingAverageToTrustScore(4)).toBe(80)
  })

  it("rounds a 2.5 average to 50", () => {
    expect(ratingAverageToTrustScore(2.5)).toBe(50)
  })

  it("treats a null average as the neutral 50 default", () => {
    expect(ratingAverageToTrustScore(null)).toBe(50)
  })

  it("clamps values above 5 to the 100 ceiling", () => {
    expect(ratingAverageToTrustScore(5.5)).toBe(100)
  })

  it("clamps values below 1 to the 20 floor", () => {
    expect(ratingAverageToTrustScore(-3)).toBe(20)
  })
})
