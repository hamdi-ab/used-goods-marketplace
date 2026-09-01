import { describe, it, expect } from "vitest"

import {
  buildLoginUrl,
  toggleFavoriteState,
} from "@/lib/favorites/constants"
import { fetchFavoriteListings } from "@/lib/favorites"

describe("favorites.toggleFavoriteState", () => {
  it("flips a false favorite to true", () => {
    expect(toggleFavoriteState(false)).toBe(true)
  })

  it("flips a true favorite to false", () => {
    expect(toggleFavoriteState(true)).toBe(false)
  })
})

describe("favorites.buildLoginUrl", () => {
  it("builds the login URL with the current path as next", () => {
    expect(buildLoginUrl("/listings/abc-123")).toBe(
      "/login?next=%2Flistings%2Fabc-123"
    )
  })

  it("encodes a query string inside the next param", () => {
    expect(buildLoginUrl("/?category=books&offset=12")).toContain(
      "next=%2F%3Fcategory%3Dbooks%26offset%3D12"
    )
  })
})

describe("favorites.fetchFavoriteListings (P1.14 #81)", () => {
  // The read fetchers accept an optional client as their last argument, so the
  // real join/normalisation logic runs against a lightweight fake (the same
  // injection the listings-reads tests use).
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

  const favoriteRow = (id: string) => ({
    created_at: "2026-01-01",
    listing: {
      id,
      title: "Chair",
      price: 100,
      condition: "Fair",
      city: "Bole",
      published_at: "2026-01-01",
      seller: [
        {
          id: "seller-1",
          full_name: "Alem",
          avatar_url: null,
          role: "seller",
          trust_score: 50,
          phone_verified: true,
          fayda_verified: false,
        },
      ],
      images: [{ id: "img-1", image_url: "cover.jpg", display_order: 0 }],
    },
  })

  it("maps joined listings and derives hasMore from the count", async () => {
    const client = db(() =>
      builder({ data: [favoriteRow("l1")], error: null, count: 5 })
    )
    const result = await fetchFavoriteListings("user-1", {}, client)
    expect(result.error).toBeNull()
    expect(result.listings[0].title).toBe("Chair")
    expect(result.listings[0].image_url).toBe("cover.jpg")
    expect(result.hasMore).toBe(true)
  })

  it("drops favorites whose listing is no longer readable, keeping the raw count", async () => {
    const client = db(() =>
      builder({
        data: [favoriteRow("l1"), { created_at: "2026-01-02", listing: null }],
        error: null,
        count: 2,
      })
    )
    const result = await fetchFavoriteListings("user-1", {}, client)
    expect(result.listings.length).toBe(1)
    // The count counts favorites rows (2), so the window reports more rows —
    // the next page terminates because it returns zero visible listings.
    expect(result.hasMore).toBe(true)
  })

  it("returns an empty page when the query fails", async () => {
    const client = db(() =>
      builder({ data: null, error: { message: "db down" }, count: null })
    )
    const result = await fetchFavoriteListings("user-1", {}, client)
    expect(result).toMatchObject({
      listings: [],
      count: null,
      hasMore: false,
      error: "db down",
    })
  })
})
