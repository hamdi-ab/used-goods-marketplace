import { describe, it, expect } from "vitest"

import {
  RATING_MAX,
  RATING_MIN,
  REVIEW_COMMENT_MAX,
  REVIEWABLE_OFFER_STATUS,
  ratingAverageToTrustScore,
} from "@/lib/reviews/constants"
import {
  fetchSellerRatingSummary,
  fetchSellerReviews,
} from "@/lib/reviews"

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

describe("reviews.fetchSellerReviews (P1.14 #81)", () => {
  const builder = (result: unknown): Record<string, unknown> => {
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      order: () => b,
      range: () => b,
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    }
    return b
  }
  const db = (from: (table: string) => unknown) => ({ from } as never)

  const reviewRow = () => ({
    id: "r1",
    rating: 5,
    comment: "Great seller",
    created_at: "2026-01-01",
    buyer: [{ id: "b1", full_name: "Buyer", avatar_url: null }],
  })

  it("maps rows with the reviewer identity and derives hasMore", async () => {
    const client = db(() =>
      builder({ data: [reviewRow()], error: null, count: 20 })
    )
    const result = await fetchSellerReviews(
      "11111111-1111-1111-1111-111111111111",
      {},
      client
    )
    expect(result.error).toBeNull()
    expect(result.reviews[0].rating).toBe(5)
    expect(result.reviews[0].buyer?.full_name).toBe("Buyer")
    expect(result.hasMore).toBe(true)
  })

  it("returns an empty page for an invalid seller id without touching the db", async () => {
    const result = await fetchSellerReviews("nope")
    expect(result).toMatchObject({
      reviews: [],
      count: 0,
      hasMore: false,
      error: null,
    })
  })

  it("returns an empty page when the query fails", async () => {
    const client = db(() =>
      builder({ data: null, error: { message: "db down" }, count: null })
    )
    const result = await fetchSellerReviews(
      "11111111-1111-1111-1111-111111111111",
      {},
      client
    )
    expect(result).toMatchObject({
      reviews: [],
      hasMore: false,
      error: "db down",
    })
  })
})

describe("reviews.fetchSellerRatingSummary (P1.14 #81)", () => {
  const builder = (result: unknown): Record<string, unknown> => {
    const b: Record<string, unknown> = {
      select: () => b,
      eq: () => b,
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    }
    return b
  }
  const db = (from: (table: string) => unknown) => ({ from } as never)

  it("averages every rating, not just the visible page", async () => {
    const client = db(() =>
      builder({ data: [{ rating: 5 }, { rating: 3 }], error: null })
    )
    const result = await fetchSellerRatingSummary(
      "11111111-1111-1111-1111-111111111111",
      client
    )
    expect(result).toEqual({ average: 4, count: 2 })
  })

  it("returns a neutral summary when there are no reviews", async () => {
    const client = db(() => builder({ data: [], error: null }))
    const result = await fetchSellerRatingSummary(
      "11111111-1111-1111-1111-111111111111",
      client
    )
    expect(result).toEqual({ average: null, count: 0 })
  })

  it("returns a neutral summary on a failed query", async () => {
    const client = db(() =>
      builder({ data: null, error: { message: "db down" } })
    )
    const result = await fetchSellerRatingSummary(
      "11111111-1111-1111-1111-111111111111",
      client
    )
    expect(result).toEqual({ average: null, count: 0 })
  })
})
